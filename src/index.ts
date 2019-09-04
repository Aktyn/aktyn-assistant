import * as ExpressServer from './express_server';
import * as WsServer from './ws_server';
import {executeCommand} from "./procedures/common/utils";
import {OpenUrl} from "./procedures/open_url";
import {Calculate} from "./procedures/calculate";
export {ProcedureBase} from "./procedures/procedure_base";
import {procedure, useProcedures} from "./result_parser";
import * as ip from 'ip';
import {CONFIG, ConfigSchema, setConfig} from "./config";
export {langCodes} from "./procedures/common/lang_codes";
export {classifyDesktopContent} from './CNN';

/////////////////////////////////////////////////////////////////////////////////

// noinspection JSUnusedGlobalSymbols
export const procedures = [OpenUrl, Calculate];

// noinspection JSUnusedGlobalSymbols
export function getLang() {
	return CONFIG.lang;
}

// noinspection JSUnusedGlobalSymbols
export async function init(use_procedures: procedure[], params: Partial<ConfigSchema> = {}) {
	useProcedures(use_procedures);
	
	const config = setConfig(params);
	
	//-------------------------------------------------------------------//
	
	WsServer.init(config.ws_port);
	
	const chrome_args = `--chrome-frame --app-shell-host-window-size=256x414 --ash-host-window-bounds=256x414` +
		` --content-shell-host-window-size=256x414 --window-size=256,414`;
	const url_args = `wsPort=${config.ws_port}&lang=${config.lang}`;
	
	let app_value: string;
	if( typeof config.express_port !== 'number' ) {
		app_value = `file://${ExpressServer.INDEX_HTML_PATH}?${url_args}`;
		
		if( !config.open_listener )
			console.log(`You can manually open listener in chrome browser with this link: ${app_value}`);
	}
	else {
		ExpressServer.init(config.express_port);
		
		app_value = `http://localhost:${config.express_port}?${url_args}`;
		
		if( !config.open_listener ) {
			console.log(`You can manually open listener in chrome browser with this link: ${app_value}\n` +
				`or if you're connecting from different location: ${
					app_value.replace('localhost', ip.address())}`);
		}
	}
	
	if( config.open_listener ) {
		await executeCommand(`${config.chrome_command} --app="${app_value}" ${chrome_args}`).catch(e => {
			console.error('Cannot open google chrome: ' + e);
		});
	}
	
	return app_value;
}