import ProcedureBase, {ResultSchema} from "./procedures/procedure_base";
import ShowDesktop from "./procedures/show_desktop";

function extendType<T>(procedures: T): T & ProcedureBase[] {
	return procedures as T & ProcedureBase[];
}

const PROCEDURES = extendType([ShowDesktop]);

class ResultHolder {
	private result: ResultSchema;
	private procedure: ProcedureBase | null = null;
	
	constructor(result: ResultSchema) {
		this.result = result;
	}
	
	public update(updated_result: ResultSchema) {
		if( this.result.index !== updated_result.index )
			this.procedure = null;//RESET PROCEDURE
		this.result = updated_result;
	}
	
	public execute() {
		if( this.procedure )
			this.procedure.update( this.result );
		else {
			let matching_procedures = PROCEDURES.filter(p => this.result.result.match(p.regexp));
			
			if (matching_procedures.length < 1)//no procedure matches result
				return false;
			
			console.log(matching_procedures);
			
			if (matching_procedures.length > 1) {
				console.warn('More than one procedure has been matched in single result');
				return false;
			}
			
			this.procedure = new matching_procedures[0](this.result);
		}
		
		return this.procedure.isFinished();
	}
}

let holder: ResultHolder | null;

export function parseResult(result: ResultSchema) {//returns true if result was executed
	if( holder )
		holder.update(result);
	else
		holder = new ResultHolder(result);
	
	if( holder.execute() ) {
		holder = null;
		return true;
	}
	return false;
}