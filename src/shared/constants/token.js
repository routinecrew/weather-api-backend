"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGN_UP_TOKEN_EXPIRED_IN_MILL_SEC = exports.SIGN_UP_TOKEN_EXPIRED_IN_SEC = exports.SIGN_UP_TOKEN_SECRET = exports.REFRESH_TOKEN_EXPIRED_IN_MILL_SEC = exports.REFRESH_TOKEN_EXPIRED_IN_SEC = exports.REFRESH_TOKEN_SECRET = exports.ACCESS_TOKEN_EXPIRED_IN_MILL_SEC = exports.ACCESS_TOKEN_EXPIRED_IN_SEC = exports.ACCESS_TOKEN_SECRET = void 0;
exports.ACCESS_TOKEN_SECRET = (_a = process.env['ACCESS_JWT_SECRET']) !== null && _a !== void 0 ? _a : 'jwt-access-secret';
exports.ACCESS_TOKEN_EXPIRED_IN_SEC = Number(process.env['ACCESS_JWT_EXPIRED_SEC']) || 30 * 60; // 30 minutes
exports.ACCESS_TOKEN_EXPIRED_IN_MILL_SEC = exports.ACCESS_TOKEN_EXPIRED_IN_SEC * 1000;
exports.REFRESH_TOKEN_SECRET = (_b = process.env['REFRESH_JWT_SECRET']) !== null && _b !== void 0 ? _b : 'jwt-refresh-secret';
exports.REFRESH_TOKEN_EXPIRED_IN_SEC = Number(process.env['REFRESH_JWT_EXPIRED_SEC']) || 3 * 24 * 60 * 60; // 3 days
exports.REFRESH_TOKEN_EXPIRED_IN_MILL_SEC = exports.REFRESH_TOKEN_EXPIRED_IN_SEC * 1000;
exports.SIGN_UP_TOKEN_SECRET = (_c = process.env['SIGN_UP_JWT_SECRET']) !== null && _c !== void 0 ? _c : 'jwt-sign-up-secret';
exports.SIGN_UP_TOKEN_EXPIRED_IN_SEC = Number(process.env['SIGN_UP_JWT_EXPIRED_SEC']) || 30 * 60; // 30 minutes
exports.SIGN_UP_TOKEN_EXPIRED_IN_MILL_SEC = exports.SIGN_UP_TOKEN_EXPIRED_IN_SEC * 1000;
