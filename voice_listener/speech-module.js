window.RECOGNITION = window.RECOGNITION || (function() {
	// noinspection JSUnresolvedVariable
	let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if( !SpeechRecognition ) {
		console.warn('SpeechRecognition not supported');
		SpeechRecognition = function() {
			// noinspection JSUnusedGlobalSymbols
			this.start = function(){};
		};
	}
	
	const RESULT_TYPE = {
		INTERIM: 1,
		FINAL: 2,
		ALTERNATIVE: 3
	};
	
	/** @type {SpeechRecognition | null} */
	let recognition = null;
	let recognition_active = false;
	
	/** @param {string} lang_code */
	function init(lang_code) {
		if( recognition )
			recognition.stop();
		
		recognition = new SpeechRecognition();
		// recognition.lang = 'pl-PL';
		// recognition.lang = 'en-US';
		recognition.lang = lang_code;
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.maxAlternatives = 5;
		
		console.log(recognition);
		
		let recognition_start_timestamp = 0;
		let ignore_index = -1;
		
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
					let recognized = await _module.onresult(result[0].transcript,
						result[0].confidence, event.resultIndex, RESULT_TYPE.INTERIM);
					if (recognized)
						ignore_index = event.resultIndex;
				}
				return;
				
			}
			
			// noinspection SpellCheckingInspection
			for (let j = 0; j < result.length; j++) {
				//console.log(`${j>0?'\talternative: ':'final: '}${result[j].transcript} (${result[j].confidence})`);
				if (_module.onresult) {
					_module.onresult(result[j].transcript, result[j].confidence, event.resultIndex,
						j > 0 ? RESULT_TYPE.ALTERNATIVE : RESULT_TYPE.FINAL);
				}
			}
		};
	}
	
	/** This function returns interim or final results of speech recognizing
	    @name OnResult
	    @function
	    @param {string} result
	    @param {number} confidence
	    @param {number} index
	    @param {RESULT_TYPE} type
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
		}
	};
	return _module;
})();