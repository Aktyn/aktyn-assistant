const url = new URL(location.href);
const ws_port = url.searchParams.get('wsPort');

const noop = function(){};

/* WEBSOCKET CONNECTION */
const sendMessage = (function() {
	if( !('RECOGNITION' in window) )
		return noop;
	
	const ws_address = `ws://${location.hostname || 'localhost'}:${ws_port}`;
	
	let socket = new WebSocket(ws_address);
	
	/** @param {Object} data */
	async function handleJSON(data) {
		console.log( 'data', data );
		
		if( data.res === 'executed' ) {
			markExecuted(data.index);
			RECOGNITION.ignoreIndex(data.index);
		}
		
		if(data.answer) {
			printAnswer(data.answer.message);
			
			if(data.answer.loud) {
				//TODO: speech synthesis
			}
		}
		
		if(data.notify) {
			if(Notification.permission !== 'granted') {
				let permission_result = await Notification.requestPermission();
				console.log(permission_result);
			}
			new Notification( data.notify.content );
		}
	}
	
	socket.onopen = async function () {
		console.log('OPEN!!');
	};
	
	socket.onmessage = function (message) {
		console.log('message from server:', message);
		if (message.isTrusted !== true)
			return;
		
		try {
			if (typeof message.data === 'string')//JSON object
				handleJSON( JSON.parse(message.data) ).catch(console.error);
			else
				console.error('Incorrect message type');
		} catch (e) {
			console.error(e, message && message.data);
		}
	};
	
	socket.onclose = function () {
		close();//closes app
	};
	socket.onerror = function (error) {
		console.error('Socket error:', error);
		close();//closes app
	};
	
	/**
	 * @param {Object} data
	 */
	return function(data) {
		try {
			socket.send(JSON.stringify(data));
		}
		catch(e) {
			console.error(e);
		}
	};
})();

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

const [addToPreview, printAnswer, markExecuted] = (function() {
	const container = document.getElementById('results-preview');
	if(!container)
		return [noop, noop];
	
	/** @type {{div: HTMLDivElement, confidence: number, index: number}[]} */
	let buffer = [];
	
	/** @type {HTMLDivElement[]} */
	let answers = [];
	
	return [
		/**
		 * @param {{
		 *     result: string,
		 *     confidence: number,
		 *     type: RESULT_TYPE
		 * }[]} results
		 * @param {number} index
		 * */
		function addToPreview(results, index) {
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
		},
		
		/**
		 * @param {string} message
		 */
		function printAnswer(message) {
			let div = document.createElement('div');
			div.innerText = 'Assistant: ' + message;
			container.appendChild(div);
			container.scrollTop = container.scrollHeight;
			
			answers.push(div);
			if(answers.length > 24)
				answers.shift().remove();
		},
		
		/**
		 * @param {number} index
		 * */
		function markExecuted(index) {
			let last = buffer[buffer.length-1];
			if(last.index === index)
				last.div.classList.add('executed');
		}
	];
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
		addToPreview(results, text_command_index);
		await sendMessage({results, index: text_command_index});
		
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
	 */
	function onResult(results, index) {
		//console.log(result, confidence, index, type);
		
		addToPreview(results, index);
		sendMessage({results, index});
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