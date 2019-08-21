"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const procedure_base_1 = require("./procedure_base");
class ShowDesktop extends procedure_base_1.default {
    constructor(result) {
        super(result);
        console.log('TODO: show desktop');
    }
}
ShowDesktop.regexp = /(poka[zż] pulpit|show desktop)/i;
exports.default = ShowDesktop;
