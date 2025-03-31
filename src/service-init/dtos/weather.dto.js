"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("joi"));
var common_dto_1 = __importDefault(require("../../shared/dtos/common.dto"));
var write = {
    body: joi_1.default.object().keys({
        time: joi_1.default.date().required(),
        point: joi_1.default.number().required().min(1).max(5),
        airTemperature: joi_1.default.number().required(),
        airHumidity: joi_1.default.number().required(),
        airPressure: joi_1.default.number().required(),
        soilTemperature: joi_1.default.number().required(),
        soilHumidity: joi_1.default.number().required(),
        soilEC: joi_1.default.number().required(),
        pyranometer: joi_1.default.number().required(),
        // 포인트 1에만 존재하는 데이터
        pasteTypeTemperature: joi_1.default.number().optional(),
        // 포인트 5에만 존재하는 데이터
        windSpeed: joi_1.default.number().optional(),
        windDirection: joi_1.default.number().optional(),
        solarRadiation: joi_1.default.number().optional(),
        rainfall: joi_1.default.number().optional(),
        co2: joi_1.default.number().optional(),
    }),
};
var modify = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
    body: joi_1.default.object().keys({
        time: joi_1.default.date().optional(),
        point: joi_1.default.number().optional().min(1).max(5),
        airTemperature: joi_1.default.number().optional(),
        airHumidity: joi_1.default.number().optional(),
        airPressure: joi_1.default.number().optional(),
        soilTemperature: joi_1.default.number().optional(),
        soilHumidity: joi_1.default.number().optional(),
        soilEC: joi_1.default.number().optional(),
        pyranometer: joi_1.default.number().optional(),
        // 포인트 1에만 존재하는 데이터
        pasteTypeTemperature: joi_1.default.number().optional(),
        // 포인트 5에만 존재하는 데이터
        windSpeed: joi_1.default.number().optional(),
        windDirection: joi_1.default.number().optional(),
        solarRadiation: joi_1.default.number().optional(),
        rainfall: joi_1.default.number().optional(),
        co2: joi_1.default.number().optional(),
    }),
};
var readOne = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
};
var readByPoint = {
    params: joi_1.default.object().keys({
        point: joi_1.default.number().required().min(1).max(5),
    }),
    query: common_dto_1.default.readAll.query,
};
var readLatestByPoint = {
    params: joi_1.default.object().keys({
        point: joi_1.default.number().required().min(1).max(5),
    }),
};
var erase = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
};
exports.default = {
    write: write,
    modify: modify,
    readOne: readOne,
    readByPoint: readByPoint,
    readLatestByPoint: readLatestByPoint,
    erase: erase,
};
