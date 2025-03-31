"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignUpToken = exports.generateSignUpToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var CONST = __importStar(require("../constants"));
var generateAccessToken = function (payload) {
    return jsonwebtoken_1.default.sign(__assign(__assign({}, payload), { expiredIn: CONST.ACCESS_TOKEN_EXPIRED_IN_MILL_SEC }), CONST.ACCESS_TOKEN_SECRET, {
        expiresIn: CONST.ACCESS_TOKEN_EXPIRED_IN_SEC,
    });
};
exports.generateAccessToken = generateAccessToken;
var generateRefreshToken = function (payload) {
    return jsonwebtoken_1.default.sign(__assign(__assign({}, payload), { expiredIn: CONST.REFRESH_TOKEN_EXPIRED_IN_MILL_SEC }), CONST.REFRESH_TOKEN_SECRET, {
        expiresIn: CONST.REFRESH_TOKEN_EXPIRED_IN_SEC,
    });
};
exports.generateRefreshToken = generateRefreshToken;
var generateSignUpToken = function (payload) {
    return jsonwebtoken_1.default.sign(__assign(__assign({}, payload), { expiredIn: CONST.SIGN_UP_TOKEN_EXPIRED_IN_MILL_SEC }), CONST.SIGN_UP_TOKEN_SECRET, {
        expiresIn: CONST.SIGN_UP_TOKEN_EXPIRED_IN_SEC,
    });
};
exports.generateSignUpToken = generateSignUpToken;
var verifySignUpToken = function (token) {
    return jsonwebtoken_1.default.verify(token, CONST.SIGN_UP_TOKEN_SECRET, { ignoreExpiration: true });
};
exports.verifySignUpToken = verifySignUpToken;
