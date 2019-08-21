import ProcedureBase, {ResultSchema} from "./procedure_base";

export default class ShowDesktop extends ProcedureBase {
	static readonly regexp = /(poka[zż] pulpit|show desktop)/i;
	
	constructor(result: ResultSchema) {
		super(result);
		
		console.log('TODO: show desktop');
	}
}