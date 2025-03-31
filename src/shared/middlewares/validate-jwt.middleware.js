"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJwt = void 0;
var passport_1 = __importDefault(require("passport"));
var validateJwt = function (strategy) { return function (req, res, next) {
    return passport_1.default.authenticate(strategy, { session: false }, function (err, user, info, _status) {
        if (err)
            return next(err);
        if (info && info instanceof Error)
            return next(info);
        if (user)
            req.user = user;
        return next();
    })(req, res, next);
}; };
exports.validateJwt = validateJwt;
