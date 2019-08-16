const service_worker_support = 'serviceWorker' in navigator &&
	(window.location.protocol === 'https:' || window.location.hostname === 'localhost');

if( service_worker_support ) {
	console.log('service worker supported');
	/*window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		
		//ready_to_install_event = <BeforeInstallPromptEvent>e;
		
		//on ready to install
		console.log(e);
		
		let install_btn = document.getElementById('install-btn');
		if (install_btn)
			install_btn.style.display = 'initial';
		install_btn.onclick = () => {
			e.prompt();
			e.userChoice.then(choice => {
				console.log(choice);
				if (choice.outcome !== 'accepted')
					closeApp();
			});
		};
	});*/
	
	navigator.serviceWorker.register('sw.js').then(() => {
		console.log('Service worker is registered');
	}).catch(console.error);
}

function closeApp() {
	let okay = document.getElementById('okay');
	if(okay)
		okay.style.display = 'block';
	// close();
}

///////////////////////////////////////////////////////////////////////

const addToPreview = (function() {
	const container = document.getElementById('results-preview');
	if(!container)
		return function() {};
	
	//test messages
	/*let i=0;
	setInterval(() => {
		addToPreview('test message: ' + (++i));
	}, 1000);*/
	
	/** @type {HTMLDivElement[]} */
	let buffer = [];
	
	/** @param {string} result */
	return function(result) {
		let line = document.createElement('div');
		line.innerText = result;
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
		
		buffer.push(line);
		if(buffer.length > 128)//TODO: let there be less elements and fade away each of them after few seconds
			buffer.shift().remove();
	};
})();

(function() {
	if( !('RECOGNITION' in window) )
		return;
	
	let microphone = document.getElementById('microphone');
	if(!microphone)
		return;
	
	RECOGNITION.onstart = () => {
		microphone.classList.add('active');
	};
	RECOGNITION.onend = () => {
		microphone.classList.remove('active');
	};
	
	const THRESHOLD = 0.25;
	
	/**
	 * @param {string} result
	 * @param {number} confidence
	 * @param {RESULT_TYPE} type
	 * @returns Promise<boolean>
	 */
	async function onResult(result, confidence, type) {
		console.log(result, confidence, type);
		
		if(confidence < THRESHOLD)
			return false;
		
		addToPreview(result);
		
		return false;
	}
	RECOGNITION.onresult = onResult;
	
	microphone.onclick = () => {
		if( RECOGNITION.isActive() )
			RECOGNITION.end();
		else
			RECOGNITION.start();
	};
	
	RECOGNITION.start();//auto-start
})();