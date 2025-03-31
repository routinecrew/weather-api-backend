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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = void 0;
var http_status_1 = require("../constants/http-status");
var errors_1 = require("../errors");
var apikey_model_1 = require("../../service-init/models/main/apikey.model");
/**
 * API 키 인증 미들웨어
 * 요청 헤더에서 API 키를 검증하고 유효한 경우에만 다음 미들웨어로 진행
 */
var validateApiKey = function (req, _res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var apiKey, keyRecord, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                apiKey = req.header('x-api-key');
                if (!apiKey) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.UNAUTHORIZED, 'API key is required');
                }
                return [4 /*yield*/, apikey_model_1.ApiKey.findByKey(apiKey)];
            case 1:
                keyRecord = _a.sent();
                if (!keyRecord) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.UNAUTHORIZED, 'Invalid API key');
                }
                // API 키 만료 확인
                if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.UNAUTHORIZED, 'API key has expired');
                }
                // 사용 기록 업데이트 (비동기로 처리하고 응답을 기다리지 않음)
                apikey_model_1.ApiKey.updateLastUsed(keyRecord.id).catch(function (err) {
                    console.error('Failed to update API key usage:', err);
                });
                // API 키 정보를 요청 객체에 저장 (선택사항)
                req.apiKey = {
                    id: keyRecord.id,
                    name: keyRecord.name,
                };
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.validateApiKey = validateApiKey;
