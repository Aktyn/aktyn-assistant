import RestApi from './rest_api';
import {executeCommand} from "./procedures/common/utils";

import {OpenUrl} from "./procedures/open_url";
import {Calculate} from "./procedures/calculate";
import {procedure, useProcedures} from "./result_parser";
import * as ip from 'ip';

//console.log('NODE_ENV:', process.env.NODE_ENV);
const SESSION_ID = Buffer.from( Date.now().toString() ).toString('base64');

/////////////////////////////////////////////////////////////////////////////////

interface ConfigSchema {
	port: number;
	open_listener: boolean;
	chrome_command: string;
	use_native_notifications: boolean;
}

// noinspection JSUnusedGlobalSymbols
export const procedures = [OpenUrl, Calculate];

// noinspection JSUnusedGlobalSymbols
export function init(use_procedures: procedure[], config: Partial<ConfigSchema> = {}) {
	useProcedures(use_procedures);
	
	config.port = config.port || 1337;
	config.open_listener = typeof config.open_listener !== 'undefined' ? config.open_listener : true;
	config.use_native_notifications = !!config.use_native_notifications;//default is false
	config.chrome_command = config.chrome_command || 'google-chrome';//TODO: change default chrome command according to OS
	
	//-------------------------------------------------------------------//
	
	RestApi.init(config.port, SESSION_ID, config.use_native_notifications);
	
	let listener_url = `http://localhost:${config.port}`;
	
	if( config.open_listener ) {
		listener_url += `?session=${SESSION_ID}`;
		
		executeCommand(`${config.chrome_command} --app=${listener_url} --chrome-frame --app-shell-host-window-size=256x414 --ash-host-window-bounds=256x414 --content-shell-host-window-size=256x414 --window-size=256,414`)
			.catch(e => console.error(e));
	}
	else {
		//show link to use in browser with public ip
		listener_url += `?keepAlive=true`;
		console.log(`You can manually open listener in chrome browser with this link: ${listener_url}\n` +
			`or if you're connecting from different location: ${
				listener_url.replace('localhost', ip.address())}`);
	}
	
	return listener_url;
}