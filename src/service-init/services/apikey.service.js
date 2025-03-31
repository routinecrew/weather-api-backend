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
var http_status_1 = require("../../shared/constants/http-status");
var errors_1 = require("../../shared/errors");
var apikey_model_1 = require("../models/main/apikey.model");
var create = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var body;
    return __generator(this, function (_a) {
        body = req.body;
        return [2 /*return*/, apikey_model_1.ApiKey.createApiKey(body)];
    });
}); };
var getAll = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, apikey_model_1.ApiKey.getAllApiKeys()];
    });
}); };
var getOne = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, id, apiKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                id = params.id;
                return [4 /*yield*/, apikey_model_1.ApiKey.findById(Number(id))];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'API key not found');
                }
                return [2 /*return*/, apiKey];
        }
    });
}); };
var update = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, body, id, apiKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params, body = req.body;
                id = params.id;
                return [4 /*yield*/, apikey_model_1.ApiKey.findById(Number(id))];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'API key not found');
                }
                return [2 /*return*/, apikey_model_1.ApiKey.updateApiKey(Number(id), body)];
        }
    });
}); };
var remove = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, id, apiKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                id = params.id;
                return [4 /*yield*/, apikey_model_1.ApiKey.findById(Number(id))];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'API key not found');
                }
                return [2 /*return*/, apikey_model_1.ApiKey.deleteApiKey(Number(id))];
        }
    });
}); };
var regenerate = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, id, apiKey, newKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                id = params.id;
                return [4 /*yield*/, apikey_model_1.ApiKey.findById(Number(id))];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'API key not found');
                }
                newKey = apikey_model_1.ApiKey.generateKey();
                // 키 업데이트
                return [4 /*yield*/, apikey_model_1.ApiKey.updateApiKey(Number(id), {
                        key: newKey,
                        lastUsedAt: undefined,
                    })];
            case 2:
                // 키 업데이트
                _a.sent();
                return [2 /*return*/, {
                        id: Number(id),
                        key: newKey,
                        name: apiKey.name,
                    }];
        }
    });
}); };
exports.default = {
    create: create,
    getAll: getAll,
    getOne: getOne,
    update: update,
    remove: remove,
    regenerate: regenerate,
};
