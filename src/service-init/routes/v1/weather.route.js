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
exports.weatherRouter = void 0;
var express_1 = require("express");
var MW = __importStar(require("../../../shared/middlewares"));
var weather_controller_1 = __importDefault(require("../../controllers/weather.controller"));
var weather_dto_1 = __importDefault(require("../../dtos/weather.dto"));
var common_dto_1 = __importDefault(require("../../../shared/dtos/common.dto"));
var apikey_middleware_1 = require("../../../shared/middlewares/apikey.middleware");
exports.weatherRouter = (0, express_1.Router)();
exports.weatherRouter
    .route('/weather')
    .get(apikey_middleware_1.validateApiKey, MW.validateDto(common_dto_1.default.readAll), MW.tryCatchAsync(weather_controller_1.default.readAll))
    .post(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.write), MW.tryCatchAsync(weather_controller_1.default.write));
exports.weatherRouter
    .route('/weather/:id')
    .get(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.readOne), MW.tryCatchAsync(weather_controller_1.default.readOne))
    .put(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.modify), MW.tryCatchAsync(weather_controller_1.default.modify))
    .delete(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.erase), MW.tryCatchAsync(weather_controller_1.default.erase));
exports.weatherRouter
    .route('/weather/point/:point')
    .get(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.readByPoint), MW.tryCatchAsync(weather_controller_1.default.readByPoint));
exports.weatherRouter
    .route('/weather/point/:point/latest')
    .get(apikey_middleware_1.validateApiKey, MW.validateDto(weather_dto_1.default.readLatestByPoint), MW.tryCatchAsync(weather_controller_1.default.readLatestByPoint));
