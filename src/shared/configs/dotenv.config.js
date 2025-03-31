"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configDotenv = void 0;
var dotenv_1 = __importDefault(require("dotenv"));
var app_root_path_1 = require("app-root-path");
var path_1 = require("path");
var logger_config_1 = require("./logger.config");
var configDotenv = function () {
    var NODE_ENV = process.env.NODE_ENV;
    var envPath = '';
    if (!NODE_ENV) {
        logger_config_1.logger.error('NODE_ENV is not defined');
        throw new Error('NODE_ENV is not defined');
    }
    switch (NODE_ENV) {
        case 'production':
            envPath = (0, path_1.join)(app_root_path_1.path, '.env');
            break;
        case 'local':
            envPath = (0, path_1.join)(app_root_path_1.path, '.env.local');
            break;
        case 'test':
            envPath = (0, path_1.join)(app_root_path_1.path, '.env.test');
            break;
        default:
            logger_config_1.logger.error('Invalid NODE_ENV value');
            throw new Error('Invalid NODE_ENV value');
    }
    var result = dotenv_1.default.config({ path: envPath });
    if (result.error) {
        logger_config_1.logger.error("Error loading .env file: ".concat(result.error.message));
        throw result.error;
    }
    logger_config_1.logger.info("Loaded environment variables from: ".concat(envPath));
};
exports.configDotenv = configDotenv;
