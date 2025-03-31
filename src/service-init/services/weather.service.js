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
var weather_1 = require("../models/main/weather");
var readAll = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var query;
    return __generator(this, function (_a) {
        query = req.query;
        return [2 /*return*/, weather_1.Weather.readAll(query)];
    });
}); };
var readOne = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, id, weather;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                id = params.id;
                return [4 /*yield*/, weather_1.Weather.readOne(Number(id))];
            case 1:
                weather = _a.sent();
                if (!weather) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'Weather data not found');
                }
                return [2 /*return*/, weather];
        }
    });
}); };
var readByPoint = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, query, point;
    return __generator(this, function (_a) {
        params = req.params, query = req.query;
        point = params.point;
        return [2 /*return*/, weather_1.Weather.readAllByPoint(Number(point), query)];
    });
}); };
var readLatestByPoint = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, point, weather;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                point = params.point;
                return [4 /*yield*/, weather_1.Weather.readLatestByPoint(Number(point))];
            case 1:
                weather = _a.sent();
                if (!weather) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'Weather data not found for this point');
                }
                return [2 /*return*/, weather];
        }
    });
}); };
var write = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var body;
    return __generator(this, function (_a) {
        body = req.body;
        // 포인트 유효성 검사 추가
        if (body.point < 1 || body.point > 5) {
            throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'Invalid point number. Must be between 1 and 5');
        }
        // 포인트 1에만 페이스트 타입 온도가 있음
        if (body.point !== 1 && body.pasteTypeTemperature !== undefined) {
            throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'pasteTypeTemperature is only available for point 1');
        }
        // 포인트 5에만 있는 데이터들
        if (body.point !== 5) {
            if (body.windSpeed !== undefined ||
                body.windDirection !== undefined ||
                body.solarRadiation !== undefined ||
                body.rainfall !== undefined ||
                body.co2 !== undefined) {
                throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'windSpeed, windDirection, solarRadiation, rainfall, and co2 are only available for point 5');
            }
        }
        return [2 /*return*/, weather_1.Weather.write(body)];
    });
}); };
var modify = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, body, id, weather;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params, body = req.body;
                id = params.id;
                return [4 /*yield*/, weather_1.Weather.readOne(Number(id))];
            case 1:
                weather = _a.sent();
                if (!weather) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'Weather data not found');
                }
                // 포인트 변경 시 유효성 검사
                if (body.point !== undefined && (body.point < 1 || body.point > 5)) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'Invalid point number. Must be between 1 and 5');
                }
                // 포인트 1에만 페이스트 타입 온도가 있음
                if ((weather.point !== 1 && body.point === undefined) || (body.point !== undefined && body.point !== 1)) {
                    if (body.pasteTypeTemperature !== undefined) {
                        throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'pasteTypeTemperature is only available for point 1');
                    }
                }
                // 포인트 5에만 있는 데이터들
                if ((weather.point !== 5 && body.point === undefined) || (body.point !== undefined && body.point !== 5)) {
                    if (body.windSpeed !== undefined ||
                        body.windDirection !== undefined ||
                        body.solarRadiation !== undefined ||
                        body.rainfall !== undefined ||
                        body.co2 !== undefined) {
                        throw new errors_1.HttpError(http_status_1.STATUS_CODES.BAD_REQUEST, 'windSpeed, windDirection, solarRadiation, rainfall, and co2 are only available for point 5');
                    }
                }
                return [2 /*return*/, weather_1.Weather.modify(Number(id), body)];
        }
    });
}); };
var erase = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var params, id, weather;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = req.params;
                id = params.id;
                return [4 /*yield*/, weather_1.Weather.readOne(Number(id))];
            case 1:
                weather = _a.sent();
                if (!weather) {
                    throw new errors_1.HttpError(http_status_1.STATUS_CODES.NOT_FOUND, 'Weather data not found');
                }
                return [2 /*return*/, weather_1.Weather.erase(Number(id))];
        }
    });
}); };
exports.default = {
    readAll: readAll,
    readOne: readOne,
    readByPoint: readByPoint,
    readLatestByPoint: readLatestByPoint,
    write: write,
    modify: modify,
    erase: erase,
};
