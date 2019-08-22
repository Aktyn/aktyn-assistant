import ProcedureBase, {ResultSchema} from "./procedures/procedure_base";
import ShowDesktop from "./procedures/show_desktop";
import Calculate from "./procedures/calculate";

function extendType<T>(procedures: T): T & ProcedureBase[] {
	return procedures as T & ProcedureBase[];
}

const PROCEDURES = extendType([
	ShowDesktop,
	Calculate
]);

class ResultHolder {
	private results: ResultSchema[];
	private readonly index: number;
	private procedure: ProcedureBase | null = null;
	
	constructor(results: ResultSchema[], index: number) {
		this.results = results;
		this.index = index;
	}
	
	public update(updated_results: ResultSchema[], index: number) {
		if( this.index !== index )
			this.procedure = null;//DISCARD PROCEDURE
		this.results = updated_results;
	}
	
	public execute() {
		if( this.procedure )
			this.procedure.update( this.results );
		else {
			let matching_procedures = PROCEDURES.filter(p => {
				if( Array.isArray(p.regexp) ) {
					for(let regexp of p.regexp) {
						//if( this.result.result.match(regexp) )
						if( this.results.some(res => res.result.match(regexp)) )
							return true;
					}
				}
				//return this.result.result.match( <any>p.regexp );
				return this.results.some(res => res.result.match(<any>p.regexp));
			});
			
			if (matching_procedures.length < 1)//no procedure matches result
				return false;
			
			//console.log(matching_procedures);
			
			if (matching_procedures.length > 1) {
				console.warn('More than one procedure has been matched in single result');
				return false;
			}
			
			this.procedure = new matching_procedures[0](this.results);
		}
		
		return this.procedure.isFinished();
	}
}

let holder: ResultHolder | null;

export function parseResult(results: ResultSchema[], index: number) {//returns true if result was executed
	if( holder )
		holder.update(results, index);
	else
		holder = new ResultHolder(results, index);
	
	if( holder.execute() ) {
		holder = null;
		return true;
	}
	return false;
}