import * as ExpressServer from './express_server';
import * as WsServer from './ws_server';
import {executeCommand} from "./procedures/common/utils";

import {OpenUrl} from "./procedures/open_url";
import {Calculate} from "./procedures/calculate";
import {procedure, useProcedures} from "./result_parser";
import * as ip from 'ip';
import {ConfigSchema, setConfig} from "./config";

//console.log('NODE_ENV:', process.env.NODE_ENV);
//const SESSION_ID = Buffer.from( Date.now().toString() ).toString('base64');

/////////////////////////////////////////////////////////////////////////////////

// noinspection JSUnusedGlobalSymbols
export const procedures = [OpenUrl, Calculate];

// noinspection JSUnusedGlobalSymbols
export async function init(use_procedures: procedure[], params: Partial<ConfigSchema> = {}) {
	useProcedures(use_procedures);
	
	const config = setConfig(params);
	
	//-------------------------------------------------------------------//
	
	//RestApi.init(config.ws_port, SESSION_ID, config.use_native_notifications);
	WsServer.init(config.ws_port);
	
	const chrome_args = `--chrome-frame --app-shell-host-window-size=256x414 --ash-host-window-bounds=256x414` +
		` --content-shell-host-window-size=256x414 --window-size=256,414`;
	
	let app_value: string;
	if( typeof config.express_port !== 'number' ) {
		app_value = `file://${ExpressServer.INDEX_HTML_PATH}?wsPort=${config.ws_port}`;
		
		if( !config.open_listener )
			console.log(`You can manually open listener in chrome browser with this link: ${app_value}`);
	}
	else {
		ExpressServer.init(config.express_port);
		
		app_value = `http://localhost:${config.express_port}?wsPort=${config.ws_port}`;
		
		if( !config.open_listener ) {
			console.log(`You can manually open listener in chrome browser with this link: ${app_value}\n` +
				`or if you're connecting from different location: ${
					app_value.replace('localhost', ip.address())}`);
		}
	}
	
	if( config.open_listener )
		await executeCommand(`${config.chrome_command} --app=${app_value} ${chrome_args}`).catch(console.error);
	
	return app_value;
}