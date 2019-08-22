import ProcedureBase, {RESULT_TYPE, ResultSchema} from "./procedure_base";

export default class Calculate extends ProcedureBase {
	static readonly regexp = [/oblicz[^\d]+\d+[.,]?\d*/i];
	
	constructor(results: ResultSchema[]) {
		super(results);
		
		//TODO: voice calculator showing results as system notifications
		console.log(results, 'waiting for final result and calculate using most confident speech result');
	}
	
	update(results: ResultSchema[]): void {
		if( results.every(res => res.type === RESULT_TYPE.FINAL || res.type === RESULT_TYPE.ALTERNATIVE) ) {
			this.finished = true;
			console.log('final', results);
		}
		/*if(result.type === RESULT_TYPE.FINAL) {
			this.finished = true;
			console.log('final', result);
		}*/
	}
}