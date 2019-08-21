const service_worker_support = 'serviceWorker' in navigator &&
	(window.location.protocol === 'https:' || window.location.hostname === 'localhost');

if( service_worker_support && false ) {//TODO: remove "&& false" before publishing
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

///////////////////////////////////////////////////////////////////////

const session_id = new URL(location.href).searchParams.get('session');

//ping server to check session stability
if( !new URL(location.href).searchParams.get('keepAlive') ) {
	setInterval(function () {
		// console.log(session_id);
		fetch(`${location.origin}/ping?session_id=${session_id}`).then(res => res.text()).then((res) => {
			//console.log(res);
			if (res !== 'OK') {
				close();//closes app
			}
		}).catch(e => {
			console.error(e);
			close();//closes app
		});
	}, 1000);
}

/* LANGUAGE SELECTOR */
(function() {
	let selector = document.getElementById('language-selector');
	if(!selector)
		return;
	
	if( !('RECOGNITION' in window) )
		return;
	
	let open = false;
	
	/** @type {Map<string, string>} */
	const languages = new Map([//first one is the default
		['English', 'en-US'],
		['Polski', 'pl-PL'],
	]);
	const item_h = 16;
	selector.style.height = `${item_h}px`;
	
	/** @param {Event} e */
	function switchView(e) {
		open = !open;
		if(open) {
			selector.classList.remove('open');
			selector.style.height = `${item_h}px`;
		}
		else {
			selector.classList.add('open');
			selector.style.height = `${item_h * languages.size}px`;
		}
		e.preventDefault();
	}
	
	let selected = '';
	
	/** @param {string} language_name */
	function select(language_name) {
		if(language_name === selected)
			return;
		selected = language_name;
		
		RECOGNITION.init( languages.get(language_name) );
		
		selector.innerText = '';
		for(let [name] of languages.entries()) {
			//console.log(name, code);
			let item = document.createElement('div');
			item.style.height = `${item_h}px`;
			item.innerText = name;
			
			if(name === language_name)
				selector.insertBefore(item, selector.firstChild);
			else
				selector.appendChild(item);
			
			item.onclick = (e) => {
				if(!open)
					select(name);
				switchView(e);
			}
		}
	}
	
	select( languages.keys().next().value );
})();

const addToPreview = (function() {
	const container = document.getElementById('results-preview');
	if(!container)
		return function() {};
	
	//test messages
	/*let i=0;
	setInterval(() => {
		addToPreview('test message: ' + (++i));
	}, 3000);*/
	
	/** @type {{div: HTMLDivElement[], confidence: number, index: number}[]} */
	let buffer = [];
	
	/**
	 * @param {string} result
	 * @param {number} confidence
	 * @param {number} index
	 * */
	return function(result, confidence, index) {
		let last_result = buffer[buffer.length-1];
		
		if( last_result && last_result.index === index ) {
			if(confidence >= last_result.confidence) {
				last_result.div.innerText = result;
				last_result.confidence = confidence;
			}
			return last_result.div;
		}
		
		let line = document.createElement('div');
		line.innerText = result;
		container.appendChild(line);
		container.scrollTop = container.scrollHeight;
		
		buffer.push({
			div: line,
			confidence,
			index
		});
		if(buffer.length > 24)
			buffer.shift().div.remove();
		return line;
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
	
	let check_url = new URL(`${location.origin}/check_result`);
	
	/**
	 * @param {string} result
	 * @param {number} confidence
	 * @param {number} index
	 * @param {RESULT_TYPE} type
	 * @returns Promise<boolean>
	 */
	async function onResult(result, confidence, index, type) {
		//console.log(result, confidence, index, type);
		
		try {
			let div = addToPreview(result, confidence, index);
			
			//check_url.searchParams.set('result', result);
			//check_url.searchParams.set('confidence', confidence.toString());
			//check_url.searchParams.set('index', index.toString());
			//check_url.searchParams.set('type', type.toString());
			//console.log(check_url);
			
			//send over GET request
			let check_result = await fetch(check_url, {
				method: 'POST',
				mode: 'cors',
				headers: {"Content-Type": "application/json; charset=utf-8"},
				body: JSON.stringify({ result, confidence, index, type })
			}).then(res => res.json());
			console.log(check_result);
			
			if( check_result.res === 'executed' ) {
				div.classList.add('executed');
				return true;
			}
			return false;
		}
		catch (e) {
			console.error(e);
			return false;
		}
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