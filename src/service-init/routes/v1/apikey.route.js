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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRouter = void 0;
var express_1 = require("express");
var MW = __importStar(require("../../../shared/middlewares"));
var apikey_controller_1 = __importDefault(require("../../controllers/apikey.controller"));
var api_dto_1 = __importDefault(require("../../dtos/api.dto"));
var apikey_middleware_1 = require("../../../shared/middlewares/apikey.middleware");
exports.apiKeyRouter = (0, express_1.Router)();
// API 키 관리 엔드포인트 - 관리자만 접근 가능
exports.apiKeyRouter
    .route('/api-keys')
    .get(apikey_middleware_1.validateApiKey, // 먼저 API 키 유효성 검사
MW.validateDto(api_dto_1.default.readAll), MW.tryCatchAsync(apikey_controller_1.default.getAll))
    .post(apikey_middleware_1.validateApiKey, // 먼저 API 키 유효성 검사
MW.validateDto(api_dto_1.default.create), MW.tryCatchAsync(apikey_controller_1.default.create));
exports.apiKeyRouter
    .route('/api-keys/:id')
    .get(apikey_middleware_1.validateApiKey, MW.validateDto(api_dto_1.default.getOne), MW.tryCatchAsync(apikey_controller_1.default.getOne))
    .put(apikey_middleware_1.validateApiKey, MW.validateDto(api_dto_1.default.update), MW.tryCatchAsync(apikey_controller_1.default.update))
    .delete(apikey_middleware_1.validateApiKey, MW.validateDto(api_dto_1.default.remove), MW.tryCatchAsync(apikey_controller_1.default.remove));
exports.apiKeyRouter
    .route('/api-keys/:id/regenerate')
    .post(apikey_middleware_1.validateApiKey, MW.validateDto(api_dto_1.default.regenerate), MW.tryCatchAsync(apikey_controller_1.default.regenerate));
