"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var sharedV1Router = __importStar(require("./v1"));
var apikey_middleware_1 = require("../../shared/middlewares/apikey.middleware");
var APP_NAME = process.env.APP_NAME;
var router = (0, express_1.Router)();
var apikeyExcludedPaths = [
    // API 키 초기 생성을 위한 경로
    { method: 'POST', path: '/apikeys/init' },
];
var unless = function (paths, middleware) {
    return function (req, res, next) {
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var e = paths_1[_i];
            if (req.method.toUpperCase() === e.method && req.path.includes(e.path))
                return next();
        }
        return middleware(req, res, next);
    };
};
// 기본 API 라우터 - API 키 인증 필요
router.use("/api/".concat(APP_NAME), unless(apikeyExcludedPaths, apikey_middleware_1.validateApiKey), __spreadArray([], Object.entries(sharedV1Router).map(function (_a) {
    var _ = _a[0], value = _a[1];
    return value;
}), true));
exports.default = router;
