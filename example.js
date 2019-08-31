const Assistant = require('./lib');//it would be require('desktop-voice-assistant') in your project

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