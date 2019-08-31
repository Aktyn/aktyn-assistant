<h3>Desktop Voice Assistant</h3>

[![Current Version](https://img.shields.io/github/package-json/v/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant)
[![GitHub license](https://img.shields.io/github/license/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Aktyn/DesktopVoiceAssistant.svg)](https://GitHub.com/Aktyn/DesktopVoiceAssistant/issues/)
[![GitHub Stars](https://img.shields.io/github/stars/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/stargazers)

<div>Voice controlled assistant for desktop environment.
Easily extensible by installing external procedures like regular NodeJS module.</div>

<h3>Install</h3>
<pre>npm i desktop-voice-assistant</pre>

<h3>Example usage</h3>

```javascript
const Assistant = require('desktop-voice-assistant');

const open = require('open');//only for matter of this example

//Example procedure which opens google.com page with search results
class MyProcedureSearch extends Assistant.ProcedureBase {//it's not necessary but recommended to extend your class
	/**
	 @param {ResultSchema[]} results
	 */
	constructor(results) {
		super(results);
		
		//PREPARE SOMETHING HERE OR HANDLE IT AND FINISH OR PASS TO UPDATE
		console.log('prepare something');
		
		this.update(results);
	}
	
	/**
	 @param {ResultSchema[]} results
	 */
	update(results) {
		//you can wait for final speech recognition results to check alternative results
		results.sort((r1, r2) => r2.confidence - r1.confidence);
		
		for(let {result} of results) {//from most confident
			let match = result.match(/search (.*)/i);
			
			if( match )
				open('https://google.com/search?q=' + encodeURI(match[1].trim())).catch(console.error);
		}
		
		this.finished = true;
		
		// IF YOU WANT TO SHOW NOTIFICATION OR PRINT ANSWER IN LISTENER WINDOW - YOU CAN DO IT LIKE THAT
		/*******************************
			this.notification = {
				content: equation
			};
			this.answer = {
				message: equation,
				loud: true
			};
		*******************************/
		
		// FOR MULTILINGUAL SUPPORT YOU CAN CHECK CHOSEN LANGUAGE WITH THIS FUNCTION
		//Assistant.getLang();
	}
}
//you say anything that matches regexp of chosen language to trigger this procedure
MyProcedureSearch.regexp = {
	'en-US': /^search .+/i
};
/***********************************************************************************/

//procedures can be installed like any node package
Assistant.init([...Assistant.procedures, MyProcedureSearch], {
	open_listener: true,
	ws_port: 3456,//ws_port for websocket connection
	express_port: 4567,//required for browser notifications to work or for listening from other location
	//chrome_command: 'start chrome',//or absolute path to google chrome executable
	use_native_notifications: false,//if false - notifications will be handled by browser
	lang: 'pl-PL'   //for multilingual procedures you can specify which language to recognize
					// check Assistant.langCodes for list of available webkit speech recognition codes
}).catch(console.error);

```

<h3>Usage information</h3>
<ul>
    <li>Browser notifications works only in secure web context so if you are not mean to use this package locally - make sure to connect through https.</li>
</ul>
