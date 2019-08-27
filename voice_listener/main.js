const session_id = new URL(location.href).searchParams.get('session');

//ping server to check whether current session is still active
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
		['Polski', 'pl-PL'],
		['English', 'en-US']
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
	
	/** @type {{div: HTMLDivElement[], confidence: number, index: number}[]} */
	let buffer = [];
	
	/**
	 * @param {{
	 *     result: string,
	 *     confidence: number,
	 *     type: RESULT_TYPE
	 * }[]} results
	 * @param {number} index
	 * */
	return function(results, index) {
		// console.log(JSON.stringify(results), index);
		let {result, confidence} = results.sort((r1, r2) => r2.confidence - r1.confidence)[0];
		
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

let sendResult = (function() {//send over POST request
	const check_url = new URL(`${location.origin}/check_result`);
	/**
	 * @param {{
	 *     result: string,
	 *     confidence: number,
	 *     type: RESULT_TYPE
	 * }[]} results
	 * @param {number} index
	 * @returns { Promise<{res: string}> }
	 */
	return async function sendResult(results, index) {
		let response = await fetch(check_url, {
			method: 'POST',
			mode: 'cors',
			headers: {"Content-Type": "application/json; charset=utf-8"},
			body: JSON.stringify({results, index})
		}).then(res => res.json());
		
		//console.log(response);
		if(response.notify) {
			if(Notification.permission !== 'granted') {
				let permission_result = await Notification.requestPermission();
				console.log(permission_result);
			}
			new Notification( response.notify.content );
		}
		
		return response;
	}
})();

/* TEXT COMMANDS */
(function() {
	// noinspection JSValidateTypes
	/** @type {HTMLInputElement} */
	let input = document.getElementById('text-input');
	if( !input )
		return;
	
	if( !('RESULT_TYPE' in window) )
		throw new Error('RESULT_TYPE not found. speech-module.js must be loaded before this script');
	
	let text_command_index = -1;//text command indexes are negative
	
	async function sendTextCommand() {
		let command = (input.value || '').trim();
		if(command.length < 1)
			return;
		
		//add to preview and send to server
		//NOTE: text command type is final
		const results = [{result: command, confidence: 1, type: RESULT_TYPE.FINAL}];
		let div = addToPreview(results, text_command_index);
		let send_result = await sendResult(results, text_command_index);
		if( send_result.res === 'executed' )
			div.classList.add('executed');
		
		text_command_index--;
		
		input.value = '';//reset input
	}
	
	let sendBtn = document.getElementById('send-btn');
	if(sendBtn)
		sendBtn.onclick = sendTextCommand;
	input.onkeydown = ({key}) => {
		if(key === 'Enter')
			sendTextCommand().catch(console.error);
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
	
	/**
	 * @param {{
	 *     result: string,
	 *     confidence: number,
	 *     type: RESULT_TYPE
	 * }[]} results
	 * @param {number} index
	 * @returns Promise<boolean>
	 */
	async function onResult(results, index) {
		//console.log(result, confidence, index, type);
		
		try {
			let div = addToPreview(results, index);
			let send_result = await sendResult(results, index);
			//console.log(check_result);
			
			if( send_result.res === 'executed' ) {
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