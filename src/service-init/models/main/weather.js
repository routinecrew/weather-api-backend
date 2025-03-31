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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weather = void 0;
var SQLZ_TS = __importStar(require("sequelize-typescript"));
var http_status_1 = require("../../../shared/constants/http-status");
var errors_1 = require("../../../shared/errors");
var utils_1 = require("../../../shared/utils");
var Weather = /** @class */ (function (_super) {
    __extends(Weather, _super);
    function Weather() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Weather.write = function (values, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.create(values, __assign({ returning: true }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    Weather.readOne = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findByPk(id, __assign({ nest: true, raw: false }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    Weather.readAll = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, count, _c, sort, _d, dir;
            return __generator(this, function (_e) {
                _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.count, count = _b === void 0 ? 30 : _b, _c = query.sort, sort = _c === void 0 ? 'time' : _c, _d = query.dir, dir = _d === void 0 ? 'DESC' : _d;
                return [2 /*return*/, this.findAll(__assign({ nest: true, raw: false, limit: count, offset: (page - 1) * count, order: [[sort, dir]] }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    Weather.readAllByPoint = function (point, query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, count, _c, sort, _d, dir;
            return __generator(this, function (_e) {
                _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.count, count = _b === void 0 ? 30 : _b, _c = query.sort, sort = _c === void 0 ? 'time' : _c, _d = query.dir, dir = _d === void 0 ? 'DESC' : _d;
                return [2 /*return*/, this.findAll(__assign({ nest: true, raw: false, where: { point: point }, limit: count, offset: (page - 1) * count, order: [[sort, dir]] }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    Weather.readLatestByPoint = function (point, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findOne(__assign({ nest: true, raw: false, where: { point: point }, order: [['time', 'DESC']] }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    Weather.modify = function (id, values, options) {
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
                            throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'Weather data not found, while modifying');
                        }
                        return [2 /*return*/, data[0]];
                }
            });
        });
    };
    Weather.erase = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.destroy(__assign({ where: { id: id } }, options)).catch(function (error) {
                        utils_1.seqLogger.error(error);
                        throw error;
                    })];
            });
        });
    };
    __decorate([
        SQLZ_TS.PrimaryKey,
        SQLZ_TS.AutoIncrement,
        SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER),
        __metadata("design:type", Number)
    ], Weather.prototype, "id", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.DATE),
        __metadata("design:type", Date)
    ], Weather.prototype, "time", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER),
        __metadata("design:type", Number)
    ], Weather.prototype, "point", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "airTemperature", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "airHumidity", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "airPressure", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "soilTemperature", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "soilHumidity", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "soilEC", void 0);
    __decorate([
        SQLZ_TS.AllowNull(false),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "pyranometer", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "pasteTypeTemperature", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "windSpeed", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "windDirection", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "solarRadiation", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "rainfall", void 0);
    __decorate([
        SQLZ_TS.AllowNull(true),
        SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT),
        __metadata("design:type", Number)
    ], Weather.prototype, "co2", void 0);
    __decorate([
        SQLZ_TS.CreatedAt,
        __metadata("design:type", Date)
    ], Weather.prototype, "createdAt", void 0);
    __decorate([
        SQLZ_TS.UpdatedAt,
        __metadata("design:type", Date)
    ], Weather.prototype, "updatedAt", void 0);
    Weather = __decorate([
        SQLZ_TS.Table({ tableName: 'weather', modelName: 'Weather' })
    ], Weather);
    return Weather;
}(SQLZ_TS.Model));
exports.Weather = Weather;
