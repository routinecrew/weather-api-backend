"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorizeStatus = exports.colorize = exports.LOGGER_COLOR = void 0;
var morgan_1 = __importDefault(require("morgan"));
var cls_rtracer_1 = __importDefault(require("cls-rtracer"));
var date_fns_tz_1 = require("date-fns-tz");
var logger_config_1 = require("./logger.config");
morgan_1.default.token('date-ko', function (_req, _res, _tz) {
    var _a;
    var timeZone = (_a = process.env['TZ']) !== null && _a !== void 0 ? _a : 'Asia/Seoul';
    var date = new Date();
    var zonedDate = (0, date_fns_tz_1.utcToZonedTime)(date, timeZone);
    var formatStr = 'yyyy-MM-dd HH:mm:ss:SSS';
    return (0, date_fns_tz_1.format)(zonedDate, formatStr, { timeZone: timeZone });
});
exports.LOGGER_COLOR = {
    BLACK: 0,
    RED: 31,
    GREEN: 32,
    YELLOW: 33,
    BLUE: 34,
    MAGENTA: 35,
    CYAN: 36,
};
var colorize = function (color, target) {
    return "\u001B[".concat(color, "m").concat(target !== null && target !== void 0 ? target : '', "\u001B[0m");
};
exports.colorize = colorize;
var colorizeStatus = function (status) {
    var color;
    if (status >= 500) {
        color = exports.LOGGER_COLOR.RED; // server error
    }
    else if (status >= 400) {
        color = exports.LOGGER_COLOR.YELLOW; // client error
    }
    else if (status >= 300) {
        color = exports.LOGGER_COLOR.CYAN; // redirection
    }
    else if (status >= 200) {
        color = exports.LOGGER_COLOR.GREEN; // success
    }
    else {
        color = exports.LOGGER_COLOR.BLACK; // no color
    }
    return (0, exports.colorize)(color, status);
};
exports.colorizeStatus = colorizeStatus;
var morganLogger = (0, morgan_1.default)(function (tokens, req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    var remoteAddr = (_b = (_a = tokens['remote-addr']) === null || _a === void 0 ? void 0 : _a.call(tokens, req, res)) !== null && _b !== void 0 ? _b : '';
    var method = (_d = (_c = tokens['method']) === null || _c === void 0 ? void 0 : _c.call(tokens, req, res)) !== null && _d !== void 0 ? _d : '';
    var url = (_f = (_e = tokens['url']) === null || _e === void 0 ? void 0 : _e.call(tokens, req, res)) !== null && _f !== void 0 ? _f : '';
    var httpVersion = "HTTP/".concat((_h = (_g = tokens['http-version']) === null || _g === void 0 ? void 0 : _g.call(tokens, req, res)) !== null && _h !== void 0 ? _h : '');
    var status = (_k = (_j = tokens['status']) === null || _j === void 0 ? void 0 : _j.call(tokens, req, res)) !== null && _k !== void 0 ? _k : '';
    var userAgent = (_m = (_l = tokens['user-agent']) === null || _l === void 0 ? void 0 : _l.call(tokens, req, res)) !== null && _m !== void 0 ? _m : '';
    var responseTime = "".concat((_p = (_o = tokens['response-time']) === null || _o === void 0 ? void 0 : _o.call(tokens, req, res)) !== null && _p !== void 0 ? _p : '', " ms");
    var dateKo = (_r = (_q = tokens['date-ko']) === null || _q === void 0 ? void 0 : _q.call(tokens, req, res)) !== null && _r !== void 0 ? _r : '';
    return [
        (0, exports.colorize)(exports.LOGGER_COLOR.BLUE, remoteAddr),
        '-',
        (0, exports.colorize)(exports.LOGGER_COLOR.YELLOW, method),
        (0, exports.colorize)(exports.LOGGER_COLOR.CYAN, url),
        (0, exports.colorize)(exports.LOGGER_COLOR.YELLOW, httpVersion),
        (0, exports.colorize)(exports.LOGGER_COLOR.GREEN, status),
        (0, exports.colorize)(exports.LOGGER_COLOR.BLACK, "\"".concat(userAgent, "\"")),
        '-',
        (0, exports.colorize)(exports.LOGGER_COLOR.BLACK, "".concat(responseTime, ", ").concat(dateKo)),
    ].join(' ');
}, {
    stream: {
        write: function (message) {
            var _a;
            var requestId = cls_rtracer_1.default.id() || 'no-request-id';
            var statusCode = Number((_a = message.split(' ')[5]) === null || _a === void 0 ? void 0 : _a.slice(5, 8)) || 200;
            if (statusCode >= 400) {
                logger_config_1.mqlogger.error(message, { requestId: requestId });
            }
            else if (statusCode >= 300) {
                logger_config_1.mqlogger.warn(message, { requestId: requestId });
            }
            else if (statusCode >= 200) {
                logger_config_1.mqlogger.info(message, { requestId: requestId });
            }
            else if (statusCode >= 100) {
                logger_config_1.mqlogger.info(message, { requestId: requestId });
            }
            else {
                logger_config_1.mqlogger.debug(message, { requestId: requestId });
            }
        },
    },
});
exports.default = morganLogger;
