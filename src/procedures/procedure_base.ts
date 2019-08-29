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

export interface AnswerSchema {
	message: string;
	loud: boolean;//use speech synthesis in chrome browser to speak message
}

export interface NotificationParams {
	content: string;
}

export abstract class ProcedureBase {
	public static regexp: RegExp | RegExp[] = /.*/;//should be overwritten by child classes
	
	protected results: ResultSchema[];
	protected finished = false;
	public answer: AnswerSchema | undefined;//prints answer in listener window
	public notification: NotificationParams | undefined;//shows notification after procedure finished
	
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