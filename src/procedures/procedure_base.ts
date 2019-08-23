export const enum RESULT_TYPE {
	INTERIM = 1,
	FINAL,
	ALTERNATIVE
}

export interface ResultSchema {
	result: string;
	confidence: number;
	type: RESULT_TYPE;
}

export default abstract class ProcedureBase {
	public static readonly regexp: RegExp | RegExp[] = /.*/;//should be overwritten by child classes
	
	protected results: ResultSchema[];
	protected finished = false;
	
	protected constructor(results: ResultSchema[]) {
		this.results = results;
	}
	
	public update(results: ResultSchema[]) {
		//this.results = results;
		console.warn('This method should\'ve be overwritten or procedure should finish right away in parent class constructor');
		this.finished = true;
	}
	
	public isFinished() {
		return this.finished;
	}
}

/*export abstract class ActiveProcedure extends ProcedureBase {
	public abstract update(result: ResultSchema): void;
}*/