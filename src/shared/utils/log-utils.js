"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseErrorStack = exports.exponentialBackoff = exports.clearLogFile = exports.retrieveLogsFromFile = exports.storeLogInFile = void 0;
var path_1 = require("path");
var fs_1 = __importDefault(require("fs"));
var util_1 = require("util");
var writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
var readFile = (0, util_1.promisify)(fs_1.default.readFile);
var unlink = (0, util_1.promisify)(fs_1.default.unlink);
var logDir = (0, path_1.join)(__dirname, 'logs');
var logFilePath = (0, path_1.join)(logDir, 'fallback.log');
var storeLogInFile = function (logData) { return __awaiter(void 0, void 0, void 0, function () {
    var logString;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logString = JSON.stringify(logData) + '\n';
                return [4 /*yield*/, writeFile(logFilePath, logString, { flag: 'a' })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.storeLogInFile = storeLogInFile;
var retrieveLogsFromFile = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, readFile(logFilePath, 'utf8')];
            case 1:
                data = _a.sent();
                return [2 /*return*/, data
                        .split('\n')
                        .filter(function (line) { return line; })
                        .map(function (line) { return JSON.parse(line); })];
            case 2:
                error_1 = _a.sent();
                console.error('Error reading log file:', error_1);
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.retrieveLogsFromFile = retrieveLogsFromFile;
var clearLogFile = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, unlink(logFilePath)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error clearing log file:', error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.clearLogFile = clearLogFile;
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var exponentialBackoff = function (fn, maxRetries, delayMs) { return __awaiter(void 0, void 0, void 0, function () {
    var retries, error_3, backoffDelay;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                retries = 0;
                _a.label = 1;
            case 1:
                if (!(retries < maxRetries)) return [3 /*break*/, 7];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 6]);
                return [4 /*yield*/, fn()];
            case 3: return [2 /*return*/, _a.sent()];
            case 4:
                error_3 = _a.sent();
                retries++;
                if (retries === maxRetries) {
                    throw error_3;
                }
                backoffDelay = delayMs * Math.pow(2, retries);
                console.warn("Retrying in ".concat(backoffDelay, "ms... (").concat(retries, "/").concat(maxRetries, ")"));
                return [4 /*yield*/, delay(backoffDelay)];
            case 5:
                _a.sent();
                return [3 /*break*/, 6];
            case 6: return [3 /*break*/, 1];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.exponentialBackoff = exponentialBackoff;
var parseErrorStack = function (stack) {
    var stackLines = stack.split('\n');
    if (stackLines.length < 2)
        return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: 'Unknown' };
    var errorLine = stackLines[1]; // 첫 번째 줄은 에러 메시지이므로 두 번째 줄을 사용
    var match = errorLine.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/);
    if (!match)
        return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: 'Unknown' };
    var _a = match[1], functionName = _a === void 0 ? 'Anonymous' : _a, _b = match[2], fileName = _b === void 0 ? 'Unknown' : _b, _c = match[3], lineNumber = _c === void 0 ? 'Unknown' : _c;
    return { fileName: fileName, functionName: functionName, lineNumber: lineNumber };
};
exports.parseErrorStack = parseErrorStack;
