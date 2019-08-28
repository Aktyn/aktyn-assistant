import {ProcedureBase, RESULT_TYPE, ResultSchema} from "./procedure_base";
import * as open from 'open';

const predefined = new Map([
	[/googlr/,      'https://google.com'],
	[/youtube/,     'https://youtube.com'],
	[/facebook/,    'https://facebook.com'],
	[/messenger/,   'https://facebook.com/messages/t']
]);

export class OpenUrl extends ProcedureBase {
	static readonly regexp = [/otw[oó]rz (link|adres|stron[eę])?/i, /open (url|website|page)?/i];
	
	constructor(results: ResultSchema[]) {
		super(results);
		this.update(results);
	}
	
	update(results: ResultSchema[]) {
		if( results.some(res => res.type === RESULT_TYPE.INTERIM) )//process only final or alternative results
			return;
		
		this.finished = true;
		
		//from most to least confident result
		for(let {result} of results.sort((r1, r2) => r2.confidence - r1.confidence)) {
			
			//TODO: handle slashes in urls like: "drive.google.com/drive/folders"
			let url_match = result.trim().match(/([^. /:]+\.[a-z]{2,3})$/i);
			if(!url_match || !url_match[0]) {
				//try predefined website
				for(let [regexp, href] of predefined.entries()) {
					if(result.match(regexp)) {
						open(href).catch(console.error);
						return;
					}
				}
				
				continue;//try with next result
			}
			
			open( 'http://' + url_match[0] ).catch(console.error);
			return;
		}
	}
}