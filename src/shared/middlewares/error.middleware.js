"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.errorConverter = void 0;
var cls_rtracer_1 = __importDefault(require("cls-rtracer"));
var logger_config_1 = require("../configs/logger.config");
var morgan_config_1 = require("../configs/morgan.config");
var constants_1 = require("../constants");
var http_error_1 = require("../errors/http-error");
var token_error_1 = require("../errors/token-error");
var utils_1 = require("../utils");
var errorConverter = function (err, _req, _res, next) {
    if (!(err instanceof http_error_1.HttpError)) {
        var message = err.message || (0, utils_1.getResponsePhrase)(constants_1.STATUS_CODES.INTERNAL_SERVER_ERROR);
        err = new http_error_1.HttpError(constants_1.STATUS_CODES.INTERNAL_SERVER_ERROR, message);
    }
    next(err);
};
exports.errorConverter = errorConverter;
var errorHandler = function (err, req, res, _next) {
    var _a;
    var _b = req.headers, headers = _b === void 0 ? {} : _b, _c = req.query, query = _c === void 0 ? {} : _c, _d = req.params, params = _d === void 0 ? {} : _d, _e = req.body, body = _e === void 0 ? {} : _e, _f = req.path, path = _f === void 0 ? '' : _f, _g = req.method, method = _g === void 0 ? '' : _g;
    var status = err.statusCode || 500;
    var message = err.message || 'Unknown error occurred';
    var isAccessTokenExpired = err instanceof token_error_1.TokenError && err.isAccessTokenExpired;
    var isRefreshTokenExpired = err instanceof token_error_1.TokenError && err.isRefreshTokenExpired;
    var requestId = cls_rtracer_1.default.id();
    var result = {
        result: false,
        message: message,
        data: {
            status: status,
            path: path,
            method: method,
            isAccessTokenExpired: isAccessTokenExpired,
            isRefreshTokenExpired: isRefreshTokenExpired,
            request: {
                headers: headers,
                query: query,
                params: params,
                body: body,
            },
        },
    };
    logger_config_1.mqlogger.error("".concat((0, morgan_config_1.colorize)(morgan_config_1.LOGGER_COLOR.MAGENTA, '[REQUEST ERROR USER]'), ": ").concat((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), { requestId: requestId });
    logger_config_1.mqlogger.error("".concat((0, morgan_config_1.colorize)(morgan_config_1.LOGGER_COLOR.MAGENTA, '[REQUEST ERROR DATA]'), ": ").concat(JSON.stringify(result)), { requestId: requestId });
    logger_config_1.mqlogger.error("".concat((0, morgan_config_1.colorize)(morgan_config_1.LOGGER_COLOR.MAGENTA, '[REQUEST ERROR STACK]'), ": ").concat(err.stack), { requestId: requestId });
    res.setHeader('x-request-id', "".concat(requestId));
    res.status(status).json(result);
};
exports.errorHandler = errorHandler;
