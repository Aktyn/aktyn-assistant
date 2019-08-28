import {parseResult} from './result_parser';
import * as notifier from 'node-notifier';
import {NotificationParams} from "./procedures/procedure_base";
import {CONFIG} from './config';

let id_counter = 0;
let active_connections = new Map<number, ListenerConnection>();

export default class ListenerConnection {
	public readonly id = id_counter++;
	private readonly socket: any;
	
	constructor(socket: any) {
		active_connections.set(this.id, this);
		this.socket = socket;
	}
	
	public destroy() {
		active_connections.delete(this.id);
	}
	
	public onMessage(message: any) {
		if(typeof message === 'string')//JSON object as string
			this.handleMessage( JSON.parse(message) );
		//else if(typeof message === 'object')//object - probably array buffer
		//	handleByteBuffer(connection, message);
		else console.error('Message must by type of string');
	}
	
	private send(data: {[index: string]: any}) {
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send( JSON.stringify(data) );
	}
	
	private handleMessage(msg: {[index: string]: any}) {//[{result, confidence, type}], index
		try {
			if (!Array.isArray(msg.results) || typeof msg.index !== 'number')
				return this.send({res: 'incorrect input'});
			let response: {res: string, notify?: NotificationParams} = parseResult(msg.results, msg.index);
			if(response.notify && CONFIG.use_native_notifications) {
				notifier.notify({
					//title: 'xyz',
					message: response.notify.content,
					sound: false,
					wait: true
				});
				delete response.notify;//prevent from sending notification data to browser window
			}
			return this.send({...response, index: msg.index});
		}
		catch(e) {
			console.error(e);
			return this.send({res: 'error'});
		}
	}
}