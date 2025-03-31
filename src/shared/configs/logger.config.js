"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqlogger = exports.logger = void 0;
var path_1 = require("path");
var app_root_path_1 = require("app-root-path");
var winston_1 = __importDefault(require("winston"));
var utils_1 = require("../utils");
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
var level = function () {
    var NODE_ENV = process.env.NODE_ENV;
    var isDev = NODE_ENV === 'local';
    return isDev ? 'debug' : 'http';
};
var colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
var logDir = (0, path_1.join)(app_root_path_1.path, 'logs');
var isTest = process.env['NODE_ENV'] === 'test';
var appName = (_a = process.env['APP_NAME']) !== null && _a !== void 0 ? _a : 'mpp & sams';
var getFormat = function (publishToCenter) {
    if (process.env.NODE_ENV === 'production') {
        return jsonFormat(publishToCenter);
    }
    return process.env.NODE_ENV === 'local' ? consoleFormat : fileFormat;
};
var consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(function (info) { return "".concat(info['timestamp'], " [").concat(appName, "] ").concat(info.level, ": ").concat(info.message); }));
var fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf(function (info) { return "".concat(info['timestamp'], " [").concat(appName, "] ").concat(info.level, ": ").concat(info.message); }));
var jsonFormat = function (publishToCenter) {
    return winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf(function (info) {
        var custom = info;
        var logData = {
            '@timestamp': info.timestamp, // Winston이 제공하는 timestamp 사용
            message: custom.message,
            level: custom.level,
            service: appName,
            meta: custom.meta || {},
            userId: custom.userId,
            sessionId: custom.sessionId,
        };
        if (custom.error) {
            var _a = (0, utils_1.parseErrorStack)(custom.error.stack || ''), fileName = _a.fileName, functionName = _a.functionName, lineNumber = _a.lineNumber;
            logData.error = {
                message: custom.error.message,
                stack: custom.error.stack,
                fileName: fileName,
                functionName: functionName,
                lineNumber: lineNumber,
            };
        }
        // 중앙 로깅일 경우에만 이벤트 발행
        if (publishToCenter && custom.level !== 'debug') {
            /* empty */
        }
        return JSON.stringify(logData, null, 2);
    }));
};
var createTransports = function (publishToCenter) { return [
    new winston_1.default.transports.Console({
        level: 'debug', // 콘솔에는 모든 레벨의 로그 출력
        format: getFormat(publishToCenter),
    }),
    new winston_1.default.transports.File({
        filename: (0, path_1.join)(logDir, 'error.log'),
        level: 'error', // 'error' 로그만 error.log 파일에 기록
        format: getFormat(publishToCenter),
    }),
    new winston_1.default.transports.File({
        filename: (0, path_1.join)(logDir, 'warn.log'),
        level: 'warn', // 'warn' 로그만 warn.log 파일에 기록
        format: getFormat(publishToCenter),
    }),
]; };
var createLogger = function (publishToCenter) {
    return winston_1.default.createLogger({
        level: level(),
        defaultMeta: {
            service: appName,
        },
        levels: levels,
        silent: isTest,
        transports: createTransports(publishToCenter),
    });
};
exports.logger = createLogger(false);
exports.mqlogger = createLogger(true);
