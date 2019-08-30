window.RESULT_TYPE = window.RESULT_TYPE || {
	INTERIM: 1,
	FINAL: 2,
	ALTERNATIVE: 3
};

window.RECOGNITION = window.RECOGNITION || (function() {
	const noop = function() {};
	
	let speechSynthesis = window.speechSynthesis || {
		speak: noop
	};
	let volume = parseFloat(localStorage.getItem('volume') || '0.5');
	
	// noinspection JSUnresolvedVariable
	let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if( !SpeechRecognition ) {
		console.warn('SpeechRecognition not supported');
		SpeechRecognition = function() {
			// noinspection JSUnusedGlobalSymbols
			this.start = noop;
		};
	}
	
	/** @type {SpeechSynthesisUtterance | null} */
	let synthesis = null;
	
	/** @type {Function} */
	let setVolume = noop;
	
	/** @type {SpeechRecognition | null} */
	let recognition = null;
	let recognition_active = false;
	
	let ignore_index = -1;
	
	/** @param {string} lang_code */
	function init(lang_code) {
		setVolume = (function() {
			let volume_bar = document.getElementById('volume-bar');
			if(!volume_bar) {
				console.error('No element with volume-bar id found');
				return noop;
			}
			
			let volume_settings = document.getElementById('volume-settings');
			
			let mute_btn = document.getElementById('mute-btn');
			if(mute_btn)
				mute_btn.onclick = () => setVolume(0);
			let volume_max_btn = document.getElementById('volume-max-btn');
			if(volume_max_btn)
				volume_max_btn.onclick = () => setVolume(1);
			
			const VOLUME_STEP = 0.2;
			
			let volume_down = document.getElementById('volume-down');
			if(volume_down)
				volume_down.onclick = () => setVolume( Math.max(0, volume-VOLUME_STEP) );
			let volume_up = document.getElementById('volume-up');
			if(volume_up)
				volume_up.onclick = () => setVolume( Math.min(1, volume+VOLUME_STEP) );
			
			/**
			 @param {number} vol
			 */
			return function(vol) {
				volume = vol;
				localStorage.setItem('volume', volume.toString());
				volume_bar.style.width = `${(volume*100)|0}%`;
				synthesis.volume = volume;
				
				if(volume_settings) {
					if (volume > 0.001)
						volume_settings.classList.remove('muted');
					else
						volume_settings.classList.add('muted');
				}
			};
		})();
		synthesis = new SpeechSynthesisUtterance();
		setVolume(volume);
		
		if( recognition )
			recognition.stop();
		
		recognition = new SpeechRecognition();
		// recognition.lang = 'en-US';
		recognition.lang = lang_code;
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.maxAlternatives = 5;
		
		console.log(recognition);
		
		let recognition_start_timestamp = 0;
		
		recognition.onstart = () => {
			ignore_index = -1;
			recognition_active = true;
			recognition_start_timestamp = Date.now();
			console.log('recognition started');
			if (typeof _module.onstart === 'function')
				_module.onstart();
		};
		recognition.onend = () => {
			if (recognition_active) {
				recognition_active = false;
				if (Date.now() - recognition_start_timestamp > 1000) {//at least 1 second difference
					console.log('recognition restarted');
					recognition_start_timestamp = Date.now();
					recognition.start();//restart recognition
				} else
					console.log('todo');
			} else {
				recognition_active = false;
				console.log('recognition ended');
			}
			if (typeof _module.onend === 'function')
				_module.onend();
		};
		
		//recognition.onerror = e => console.error(e);
		
		// noinspection SpellCheckingInspection
		/** @param {SpeechRecognitionEvent} event */
		recognition.onresult = async (event) => {
			let result = event.results[event.results.length - 1];
			//console.log('result:', event);
			
			if (ignore_index === event.resultIndex) {//recognition already succeeded
				console.log('further results ignored');
				return;
			}
			
			// noinspection SpellCheckingInspection
			if (!result.isFinal) {
				//console.log('\tinterim:', result[0].transcript);
				if (_module.onresult) {
					//let recognized = await _module.onresult(result[0].transcript,
					//	result[0].confidence, event.resultIndex, RESULT_TYPE.INTERIM);
					/*let recognized = */await _module.onresult([{
						result: result[0].transcript,
						confidence: result[0].confidence,
						type: RESULT_TYPE.INTERIM
					}], event.resultIndex);
					//if (recognized)
					//	ignore_index = event.resultIndex;
				}
				return;
			}
			
			/*for (let j = 0; j < result.length; j++) {
				//console.log(result.length, result);
				if (_module.onresult) {
					_module.onresult(result[j].transcript, result[j].confidence, event.resultIndex,
						j > 0 ? RESULT_TYPE.ALTERNATIVE : RESULT_TYPE.FINAL);
				}
			}*/
			if (_module.onresult) {
				let out_res = [];
				
				for (let j = 0; j < result.length; j++) {
					out_res.push({
						result: result[j].transcript,
						confidence: result[j].confidence,
						type: j > 0 ? RESULT_TYPE.ALTERNATIVE : RESULT_TYPE.FINAL
					});
				}
				
				_module.onresult(out_res, event.resultIndex);
			}
		};
	}
	
	/** This function returns interim or final results of speech recognizing
	    @name OnResult
	    @function
	    * @param {{
	    *     result: string,
	    *     confidence: number,
	    *     type: RESULT_TYPE
	    * }[]} results
	    * @param {number} index
	    @returns Promise<boolean>
	 */
	
	let _module = {
		RESULT_TYPE,
		
		init,
		
		start() {
			if(!recognition) {
				console.info('Recognition must be initialized before starting it');
				return;
			}
			recognition.start();
		},
		/** @type {Function | null} */
		onstart: null,
		
		end() {
			if(!recognition)//nothing to end
				return;
			recognition_active = false;
			recognition.stop();
		},
		/** @type {Function | null} */
		onend: null,
		
		/** @type {OnResult | null | Function} */
		onresult: null,
		
		isActive() {
			return recognition_active;
		},
		
		/** @param {number} index */
		ignoreIndex(index) {
			ignore_index = index;
		},
		
		setVolume,
		
		/**
		 @param {string} text
		 */
		speak(text) {
			if(volume <= 0.001)
				return;
			synthesis.text = text;
			speechSynthesis.speak(synthesis);
		}
	};
	return _module;
})();