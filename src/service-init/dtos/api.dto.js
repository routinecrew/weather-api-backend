"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("joi"));
var create = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        description: joi_1.default.string().optional(),
        expiresAt: joi_1.default.date().optional().min('now'),
        isActive: joi_1.default.boolean().default(true).optional(),
    }),
};
var update = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
    body: joi_1.default.object().keys({
        name: joi_1.default.string().optional(),
        description: joi_1.default.string().optional().allow(null),
        expiresAt: joi_1.default.date().optional().min('now').allow(null),
        isActive: joi_1.default.boolean().optional(),
    }),
};
var getOne = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
};
var readAll = {};
var remove = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
};
var regenerate = {
    params: joi_1.default.object().keys({
        id: joi_1.default.number().required(),
    }),
};
exports.default = {
    create: create,
    update: update,
    getOne: getOne,
    readAll: readAll,
    remove: remove,
    regenerate: regenerate,
};
