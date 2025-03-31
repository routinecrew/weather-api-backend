"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = void 0;
var joi_1 = __importDefault(require("joi"));
var constants_1 = require("../constants");
var utils_1 = require("../utils");
var http_error_1 = require("../errors/http-error");
var validateDto = function (schema) {
    return function (req, _res, next) {
        var validationSchema = (0, utils_1.pick)(schema, ['params', 'query', 'body']);
        var target = (0, utils_1.pick)(req, Object.keys(validationSchema));
        var _a = joi_1.default.compile(validationSchema)
            .prefs({ errors: { label: 'key' }, abortEarly: false })
            .validate(target), value = _a.value, error = _a.error;
        if (error) {
            var errorMessage = error.details.map(function (details) { return details.message; }).join(', ');
            return next(new http_error_1.HttpError(constants_1.STATUS_CODES.BAD_REQUEST, errorMessage));
        }
        Object.assign(req, value);
        return next();
    };
};
exports.validateDto = validateDto;
