const Assistant = require('./lib');//it would be require('desktop-voice-assistant') in your project
const { ProcedureBase } = require('./lib/procedures/procedure_base');

class MyProcedure extends ProcedureBase {//it is not necessary to extend your class
	/**
	 @param {ResultSchema[]} results
	 */
	constructor(results) {
		super(results);
		
		//PREPARE SOMETHING HERE OR HANDLE IT AND FINISH OR PASS TO UPDATE
		console.log('doing something');
		
		this.update(results);
	}
	
	/**
	 @param {ResultSchema[]} results
	 */
	update(results) {
		//you can wait for final speech recognition results to check alternative results
		results.sort((r1, r2) => r2.confidence - r1.confidence);
		
		for(let {result} of results) {//from most confident
			if( result.match(/do something better/i) )
				console.log('Something better :)');
		}
		
		console.log('something has been done');
		this.finished = true;
	}
}
MyProcedure.regexp = [/do something/i];//you say those words to trigger procedure

/***********************************************************************************/

Assistant.init([...Assistant.procedures, MyProcedure], {
	open_listener: true,
	ws_port: 3456,//ws_port for websocket connection
	express_port: 4567,//required for browser notifications to work or for listening from other location
	chrome_command: 'google-chrome',//or absolute path to google-chrome executable
	use_native_notifications: false//if false - notifications will be handled by browser
}).catch(console.error);