"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXlsxStream = void 0;
var xlsx_1 = __importDefault(require("xlsx"));
var stream_1 = require("./stream");
var getXlsxStream = function (data) {
    var workBook = xlsx_1.default.utils.book_new();
    var workSheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workBook, workSheet);
    return (0, stream_1.bufferToStream)(xlsx_1.default.write(workBook, { bookType: 'xlsx', type: 'buffer' }));
};
exports.getXlsxStream = getXlsxStream;
