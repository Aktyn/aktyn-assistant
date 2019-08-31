import {lang_code} from "./common/lang_codes";

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
	loud_message?: string;//overwrites messages if you want something else to be say than printed
}

export interface NotificationParams {
	content: string;
}

export abstract class ProcedureBase {
	//shall be overwritten by child classes
	public static regexp: {[key in lang_code]?: RegExp} = {};
	
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