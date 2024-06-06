"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatStream = void 0;
class Stream {
    iterator;
    controller;
    constructor(iterator, controller) {
        this.iterator = iterator;
        this.controller = controller;
    }
    [Symbol.asyncIterator]() {
        return this.iterator();
    }
}
exports.ChatStream = (Stream);
