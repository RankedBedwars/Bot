"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = exports.color = void 0;
function color(text, color = 0) {
    return `\x1b[${color}m${text}\x1b[0m`;
}
exports.color = color;
var Color;
(function (Color) {
    Color[Color["INFO"] = 90] = "INFO";
    Color[Color["WARN"] = 33] = "WARN";
    Color[Color["ERROR"] = 91] = "ERROR";
})(Color = exports.Color || (exports.Color = {}));
class Logger {
    constructor(identifier) {
        this.identifier = identifier;
    }
    info(message) {
        console.log(color(`[${this.identifier}/INFO] ${message}`, Color.INFO));
    }
    warn(message) {
        console.warn(color(`[${this.identifier}/WARN] ${message}`, Color.WARN));
    }
    error(message) {
        console.error(color(`[${this.identifier}/ERROR] ${message}`, Color.ERROR));
    }
}
exports.default = Logger;
