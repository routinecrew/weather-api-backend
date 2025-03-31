"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToStream = void 0;
var stream_1 = require("stream");
var bufferToStream = function (buffer) {
    var stream = new stream_1.Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};
exports.bufferToStream = bufferToStream;
