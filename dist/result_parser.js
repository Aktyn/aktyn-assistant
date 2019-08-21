"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const show_desktop_1 = require("./procedures/show_desktop");
function extendType(procedures) {
    return procedures;
}
const PROCEDURES = extendType([show_desktop_1.default]);
class ResultHolder {
    constructor(result) {
        this.procedure = null;
        this.result = result;
    }
    update(updated_result) {
        if (this.result.index !== updated_result.index)
            this.procedure = null;
        this.result = updated_result;
    }
    execute() {
        if (this.procedure)
            this.procedure.update(this.result);
        else {
            let matching_procedures = PROCEDURES.filter(p => this.result.result.match(p.regexp));
            if (matching_procedures.length < 1)
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
let holder;
function parseResult(result) {
    if (holder)
        holder.update(result);
    else
        holder = new ResultHolder(result);
    if (holder.execute()) {
        holder = null;
        return true;
    }
    return false;
}
exports.parseResult = parseResult;
