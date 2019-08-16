window.RECOGNITION = window.RECOGNITION || (function() {
	// noinspection JSUnresolvedVariable
	let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if( !SpeechRecognition ) {
		console.log('SpeechRecognition not supported');
		SpeechRecognition = function() {
			// noinspection JSUnusedGlobalSymbols
			this.start = function(){};
		};
	}
	
	let recognition = new SpeechRecognition();
	recognition.lang = 'en-US';//'pl-PL';
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 5;
	
	console.log(recognition);
	
	let recognition_active = false;
	let recognition_start_timestamp = 0;
	let ignore_index = -1;
	
	const RESULT_TYPE = {
		INTERIM: 1,
		FINAL: 2,
		ALTERNATIVE: 3
	};
	
	recognition.onstart = () => {
		ignore_index = -1;
		recognition_active = true;
		recognition_start_timestamp = Date.now();
		console.log('recognition started');
		if(typeof _module.onstart === 'function')
			_module.onstart();
	};
	recognition.onend = () => {
		if(recognition_active) {
			recognition_active = false;
			if(Date.now() - recognition_start_timestamp > 1000) {//at least 1 second difference
				console.log('recognition restarted');
				recognition_start_timestamp = Date.now();
				recognition.start();//restart recognition
			}
			else
				console.log('todo');
		}
		else {
			recognition_active = false;
			console.log('recognition ended');
		}
		if(typeof _module.onend === 'function')
			_module.onend();
	};
	
	//recognition.onerror = e => console.error(e);
	
	// noinspection SpellCheckingInspection
	/** @param {SpeechRecognitionEvent} event */
	recognition.onresult = async (event) => {
		let result = event.results[event.results.length-1];
		//console.log('result:', result);
	
		if(ignore_index === event.resultIndex) {//recognition already succeeded
			console.log('further results ignored');
			return;
		}
	
		// noinspection SpellCheckingInspection
		if(!result.isFinal) {
			//console.log('\tinterim:', result[0].transcript);
			if( _module.onresult) {
				let recognized = await _module.onresult(result[0].transcript,
					result[0].confidence, RESULT_TYPE.INTERIM);
				if(recognized)
					ignore_index = event.resultIndex;
			}
			return;
	
		}
		
		// noinspection SpellCheckingInspection
		for(let j=0; j<result.length; j++) {
			//console.log(`${j>0?'\talternative: ':'final: '}${result[j].transcript} (${result[j].confidence})`);
			if( _module.onresult) {
				_module.onresult(result[j].transcript, result[j].confidence,
					j > 0 ? RESULT_TYPE.ALTERNATIVE : RESULT_TYPE.FINAL);
			}
		}
	};
	
	/** This function returns interim or final results of speech recognizing
	    @name OnResult
	    @function
	    @param {string} result
	    @param {number} confidence
	    @param {RESULT_TYPE} type
	    @returns Promise<boolean>
	 */
	
	let _module = {
		RESULT_TYPE,
		
		start() {
			recognition.start();
		},
		/** @type {Function | null} */
		onstart: null,
		
		end() {
			recognition_active = false;
			recognition.stop();
		},
		/** @type {Function | null} */
		onend: null,
		
		/** @type {OnResult | null} */
		onresult: null,
		
		isActive() {
			return recognition_active;
		}
	};
	return _module;
})();