"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seqLogger = void 0;
var cls_rtracer_1 = __importDefault(require("cls-rtracer"));
var logger_config_1 = require("../configs/logger.config");
var morgan_config_1 = require("../configs/morgan.config");
exports.seqLogger = {
    error: function (err) {
        var requestId = cls_rtracer_1.default.id();
        var errorColor = err instanceof TypeError ? morgan_config_1.LOGGER_COLOR.YELLOW : morgan_config_1.LOGGER_COLOR.MAGENTA;
        logger_config_1.mqlogger.error("".concat((0, morgan_config_1.colorize)(errorColor, '[SEQ ERROR STACK]'), ": ").concat(err.stack), { requestId: requestId });
    },
};
