"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProcedureBase {
    constructor(result) {
        this.finished = false;
        this.result = result;
    }
    update(result) {
        this.result = result;
    }
    isFinished() {
        return this.finished;
    }
}
ProcedureBase.regexp = /.*/;
exports.default = ProcedureBase;
class ActiveProcedure extends ProcedureBase {
}
exports.ActiveProcedure = ActiveProcedure;
