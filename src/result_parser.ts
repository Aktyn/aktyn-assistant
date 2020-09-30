import { ProcedureBase, ResultSchema } from './procedures/procedure_base';
import { CONFIG } from './config';

export type procedure = Function & typeof ProcedureBase;
const PROCEDURES: procedure[] = [];

export function useProcedures(procedures: procedure[]) {
  for (const procedure of procedures) {
    if (typeof procedure.regexp !== 'object')
      console.error(
        `Given procedure must be a class that contains static parameter "regexp" which is an object with key representing language code and value as RegExp (${procedure.name})`
      );
    else {
      if (typeof procedure.prototype.isFinished !== 'function') {
        console.warn(
          `Procedure class should contain method "isFinished" to ignore further results after procedure finishes (${procedure.name})`
        );
      }

      PROCEDURES.push(procedure);
    }
  }
  //console.log( PROCEDURES );
}

class ResultHolder {
  private results: ResultSchema[];
  private readonly index: number;
  private procedure: ProcedureBase | null = null;

  constructor(results: ResultSchema[], index: number) {
    this.results = results || [];
    this.index = index;
  }

  public update(updated_results: ResultSchema[], index: number) {
    if (this.index !== index) this.procedure = null; //DISCARD PROCEDURE
    this.results = updated_results || [];
  }

  public execute() {
    if (this.procedure) {
      if (typeof this.procedure.update === 'function') this.procedure.update(this.results);
    } else {
      const matching_procedures = PROCEDURES.filter(p => {
        const regexp = p.regexp[CONFIG.lang];
        if (regexp) return this.results.some(res => res.result.match(<RegExp>regexp));
        return false;
      });

      if (matching_procedures.length < 1)
        //no procedure matches result
        return false;

      //console.log(matching_procedures);

      if (matching_procedures.length > 1) {
        console.warn('More than one procedure has been matched in single result');
        return false;
      }

      //this.procedure = new matching_procedures[0](this.results);
      this.procedure = <ProcedureBase>Reflect.construct(matching_procedures[0], [this.results]);
    }

    return typeof this.procedure.isFinished === 'function' && this.procedure.isFinished();
  }

  public getProcedure() {
    return this.procedure;
  }
}

let holder: ResultHolder | null;

export function parseResult(results: ResultSchema[], index: number) {
  if (holder) holder.update(results, index);
  else holder = new ResultHolder(results, index);

  if (holder.execute()) {
    const procedure = holder.getProcedure();
    if (procedure) return { res: 'executed', notify: procedure.notification, answer: procedure.answer };
    holder = null;
    return { res: 'executed' };
  }
  return { res: 'ignored' };
}
