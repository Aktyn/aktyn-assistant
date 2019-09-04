<h2>Desktop Voice Assistant</h2>

[![Current Version](https://img.shields.io/github/package-json/v/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant)
[![GitHub license](https://img.shields.io/github/license/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Aktyn/DesktopVoiceAssistant.svg)](https://GitHub.com/Aktyn/DesktopVoiceAssistant/issues/)
[![GitHub Stars](https://img.shields.io/github/stars/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/stargazers)

<div>Voice controlled assistant for desktop environment.
Easily extensible by installing external procedures like any node package.</div>

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
		//you can wait for final recognition results to check alternative results
		if( results.some(res => res.type === Assistant.RESULT_TYPE.INTERIM) )
			return;
		
		results.sort((r1, r2) => r2.confidence - r1.confidence);
		
		for (let {result} of results) {//from most confident
			let match = result.match(/search (.*)/i);
				
			if (match) {//found most confident final result
				
				Assistant.classifyDesktopContent().then(desktop_content => {
				    // YOU CAN DECIDE WHAT TO DO DEPENDING ON YOUR CURRENT DESKTOP CONTENT
					 
					if( desktop_content.WEBSITE > 0.5 || desktop_content.TEXT > 0.5 )//if you are in text environment
						this.searchForText( match[1] );
					else
						this.searchInGoogle( match[1] );
				 }).catch(console.error);
				
				break;
			}
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
	
	/** @param {string} text */
	searchForText(text) {
		//press ctrl + f remotely
		Assistant.Robot.tapKey('f', 'control');
		
		setTimeout(() => Assistant.Robot.typeString(text));
	}
	
	/** @param {string} text */
	searchInGoogle(text) {
		open('https://google.com/search?q=' + encodeURI(text.trim())).catch(console.error);
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
	//lang: 'pl-PL'   //for multilingual procedures you can specify which language to recognize
					// check Assistant.langCodes for list of available webkit speech recognition codes
}).catch(console.error);

```

<h3>Usage information</h3>
<ul>
    <li>Browser notifications works only in secure web context so if you are not mean to use this package locally - make sure to connect through https.</li>
    <li>Function "classifyDesktopContent" takes desktop screenshot and uses tensorflow.js to classify it's content into several categories like Website, Game, App. You can use it to differently interpret commands as shown in example above.<br>
    NOTE: convolutional neural network is not trained well yet. I am still extending dataset of screenshots for further training. Any help will be appreciated ;)</li>
</ul>
