import {ProcedureBase, RESULT_TYPE, ResultSchema} from "./procedure_base";
import * as open from 'open';

const predefined = new Map([//NOTE: regexps should have 'i' flag
	[/google/i,      'https://google.com'],
	[/youtube/i,     'https://youtube.com'],
	[/facebook/i,    'https://facebook.com'],
	[/messenger/i,   'https://facebook.com/messages/t']
]);
console.log();
export class OpenUrl extends ProcedureBase {
	static readonly regexp = {
		'pl-PL': /^otw[oó]rz (link|adres|stron[eę])?/i,
		'en-US': /^open (url|website|page)?/i
	};
	
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
			
			let url_match = result.trim().match(/([^. /:]+[. ][a-z]{2,3})( ?uko[sś]nik ?.+| ?slash ?.+)*$/i);
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
			
			open( 'http://' + url_match[0].trim().replace(/ ?(uko[sś]nik|slash) ?/gi, '/')
				.replace(/\s/g, '.') )
				.catch(console.error);
			return;
		}
	}
}