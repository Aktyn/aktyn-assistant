export interface ResultSchema {
	result: string;
	confidence: number;
	index: number;
	type: number;
}

export default abstract class ProcedureBase {
	public static readonly regexp = /.*/;//should be overwritten by child classes
	
	protected result: ResultSchema;
	protected finished = false;
	
	protected constructor(result: ResultSchema) {
		this.result = result;
	}
	
	public update(result: ResultSchema) {
		this.result = result;
	}
	
	public isFinished() {
		return this.finished;
	}
}

export abstract class ActiveProcedure extends ProcedureBase {
	public abstract update(result: ResultSchema): void;
}