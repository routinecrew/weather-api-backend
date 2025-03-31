"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponsePhrase = void 0;
var constants_1 = require("../constants");
var getResponsePhrase = function (code) {
    return constants_1.STATUS_PHRASE[code];
};
exports.getResponsePhrase = getResponsePhrase;
