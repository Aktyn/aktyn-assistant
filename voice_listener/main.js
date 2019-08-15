const electron = new URL(location.href).searchParams.get('electron');
const service_worker_support = 'serviceWorker' in navigator &&
	(window.location.protocol === 'https:' || window.location.hostname === 'localhost');

if( electron ) {

}

if( service_worker_support ) {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		
		//ready_to_install_event = <BeforeInstallPromptEvent>e;
		
		//on ready to install
		console.log(e);
		
		let install_btn = document.getElementById('install-btn');
		if(install_btn)
			install_btn.style.display = 'initial';
			install_btn.onclick = () => {
				e.prompt();
				e.userChoice.then(choice => {
					console.log(choice);
					if(choice.outcome !== 'accepted')
						closeApp();
				});
			};
		});
	
	navigator.serviceWorker.register('sw.js').catch(console.error);
}

function closeApp() {
	let okay = document.getElementById('okay');
	if(okay)
		okay.style.display = 'block';
}

///////////////////////////////////////////////////////////////////////

/**
 * @param  {string} result
 * @return {boolean}
 */
/*function checkResult(result) {
	for(let command_name in COMMANDS) {
		if(command_name in listeners === false)//no listener assigned for this command
			continue;
		for(let keyword of COMMANDS[command_name]) {
			//look for keyword inside result string
			if( result.toLowerCase().indexOf( keyword.toLowerCase() ) !== -1 ) {
				listeners[command_name]();//callback
				return true;
			}
		}
	}
	return false;
}*/

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
recognition.lang = 'pl-PL';
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 5;

console.log(recognition);

let recognition_active = false;
let recognition_start_timestamp = 0;
let ignore_index = -1;

recognition.onstart = () => {
	ignore_index = -1;
	recognition_active = true;
	recognition_start_timestamp = Date.now();
	console.log('recognition started');
};
recognition.onend = () => {
	if(recognition_active) {
		if(Date.now() - recognition_start_timestamp > 1000) {//at least 1 second difference
			console.log('recognition restarted');
			recognition_active = false;
			recognition_start_timestamp = Date.now();
			recognition.start();//restart recognition
		}
	}
	else
		console.log('recognition ended');
};

//recognition.onerror = e => console.error(e);

// noinspection SpellCheckingInspection
/** @param {SpeechRecognitionEvent} event */
recognition.onresult = (event) => {
	let result = event.results[event.results.length-1];
	//console.log('result:', result);

	if(ignore_index === event.resultIndex) {//recognition already succeeded
		console.log('further results ignored');
		return;
	}

	if(!result.isFinal) {
		console.log('\tinterim:', result[0].transcript);
		//if( checkResult(result[0].transcript) )
		//	ignore_index = event.resultIndex;
		return;

	}
	
	for(let j=0; j<result.length; j++) {
		console.log(`${j>0?'\talternative: ':'final: '}${result[j].transcript} (${result[j].confidence})`);
		//if( checkResult(result[j].transcript) )
		//	return;
	}
};

recognition.start();