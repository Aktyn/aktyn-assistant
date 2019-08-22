import ProcedureBase, {ResultSchema} from "./procedure_base";

export default class ShowDesktop extends ProcedureBase {
	static readonly regexp = [/show desktop/i, /poka[zż] pulpit/i];
	
	constructor(results: ResultSchema[]) {
		super(results);
		
		console.log('TODO: show desktop');
		
		this.finished = true;
	}
}