"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
var SQLZ_TS = __importStar(require("sequelize-typescript"));
var crypto_1 = __importDefault(require("crypto"));
var http_status_1 = require("../../../shared/constants/http-status");
var errors_1 = require("../../../shared/errors");
var utils_1 = require("../../../shared/utils");
var ApiKey = /** @class */ (function (_super) {
    __extends(ApiKey, _super);
    function ApiKey() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // API 키 생성 메소드
    ApiKey.generateKey = function () {
        return crypto_1.default.randomBytes(32).toString('hex');
    };
    // API 키 생성 및 저장
    ApiKey.createApiKey = function (values, options) {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey;
            return __generator(this, function (_a) {
                apiKey = __assign(__assign({}, values), { key: this.generateKey() });
                return [2 /*return*/, this.create(apiKey, __assign({ returning: true }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    // API 키 조회
    ApiKey.findByKey = function (key, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findOne(__assign({ where: { key: key, isActive: true } }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    // API 키 조회 - ID 기반
    ApiKey.findById = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findByPk(id, __assign({}, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    // 모든 API 키 조회
    ApiKey.getAllApiKeys = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findAll(__assign({}, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    // API 키 업데이트
    ApiKey.updateApiKey = function (id, values, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, affectedCount, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.update(values, __assign({ where: { id: id }, returning: true }, options)).catch(function (error) {
                            utils_1.seqLogger.error(error);
                            throw error;
                        })];
                    case 1:
                        _a = _b.sent(), affectedCount = _a[0], data = _a[1];
                        if (affectedCount === 0 || !data[0]) {
                            throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'API key not found');
                        }
                        return [2 /*return*/, data[0]];
                }
            });
        });
    };
    // API 키 비활성화
    ApiKey.deactivateApiKey = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateApiKey(id, { isActive: false }, options)];
            });
        });
    };
    // API 키 삭제
    ApiKey.deleteApiKey = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.destroy(__assign({ where: { id: id } }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    // API 키 사용 기록 업데이트
    ApiKey.updateLastUsed = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateApiKey(id, { lastUsedAt: new Date() })];
            });
        });
    };
    __decorate([
        SQLZ_TS.PrimaryKey,
        SQLZ_TS.AutoIncrement,
        SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER),
        __metadata("design:type", Number)
    ], ApiKey.prototype, "id", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.STRING),
        __metadata("design:type", String)
    ], ApiKey.prototype, "name", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Unique('api_key_unique'),
        SQLZ_TS.Column(SQLZ_TS.DataType.STRING(64)),
        __metadata("design:type", String)
    ], ApiKey.prototype, "key", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.TEXT),
        __metadata("design:type", String)
    ], ApiKey.prototype, "description", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.DATE),
        __metadata("design:type", Date)
    ], ApiKey.prototype, "expiresAt", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.DATE),
        __metadata("design:type", Date)
    ], ApiKey.prototype, "lastUsedAt", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Default(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.BOOLEAN),
        __metadata("design:type", Boolean)
    ], ApiKey.prototype, "isActive", void 0);
    __decorate([
        SQLZ_TS.CreatedAt,
        __metadata("design:type", Date)
    ], ApiKey.prototype, "createdAt", void 0);
    __decorate([
        SQLZ_TS.UpdatedAt,
        __metadata("design:type", Date)
    ], ApiKey.prototype, "updatedAt", void 0);
    __decorate([
        SQLZ_TS.DeletedAt,
        __metadata("design:type", Date)
    ], ApiKey.prototype, "deletedAt", void 0);
    ApiKey = __decorate([
        SQLZ_TS.Table({ tableName: 'api_keys', modelName: 'apiKey' })
    ], ApiKey);
    return ApiKey;
}(SQLZ_TS.Model));
exports.ApiKey = ApiKey;
