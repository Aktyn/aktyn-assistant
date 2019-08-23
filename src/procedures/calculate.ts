import ProcedureBase, {RESULT_TYPE, ResultSchema} from "./procedure_base";

export class Calculate extends ProcedureBase {
	static readonly regexp = [/oblicz[^\d]+\d+[.,]?\d*/i];
	
	constructor(results: ResultSchema[]) {
		super(results);
		this.update(results);
	}
	
	update(results: ResultSchema[]): void {
		console.log( results );
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