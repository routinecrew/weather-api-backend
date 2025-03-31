"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("joi"));
var readAll = {
    query: joi_1.default.object().keys({
        page: joi_1.default.number().integer().min(1).default(1),
        count: joi_1.default.number().integer().min(1).max(100).default(30),
        sort: joi_1.default.string().valid('id', 'name').default('createdAt'),
        dir: joi_1.default.string().valid('ASC', 'DESC').default('DESC'),
        q: joi_1.default.string().allow(null, '').default(''),
        type: joi_1.default.string().valid('general', 'specific').optional(),
    }),
};
var readOne = {
    params: joi_1.default.object().required().keys({
        id: joi_1.default.number().required(),
    }),
};
var erase = {
    params: joi_1.default.object().required().keys({
        id: joi_1.default.number().required(),
    }),
};
exports.default = {
    readAll: readAll,
    readOne: readOne,
    erase: erase,
};
