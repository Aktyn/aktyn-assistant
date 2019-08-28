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

export interface NotificationParams {
	content: string;
}

export abstract class ProcedureBase {
	public static regexp: RegExp | RegExp[] = /.*/;//should be overwritten by child classes
	
	protected results: ResultSchema[];
	protected finished = false;
	public notification: NotificationParams | undefined;
	
	protected constructor(results: ResultSchema[]) {
		this.results = results;
	}
	
	public update(results: ResultSchema[]) {
		console.warn('This method should\'ve be overwritten or procedure should finish right away in parent class constructor');
		this.finished = true;
	}
	
	public isFinished() {
		return this.finished;
	}
}