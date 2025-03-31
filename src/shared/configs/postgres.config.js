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
exports.getSequelizeInstance = exports.connectPostgres = void 0;
var sequelize_typescript_1 = require("sequelize-typescript");
var logger_config_1 = require("./logger.config");
var main_1 = require("../../service-init/models/main");
var env_1 = require("../utils/env");
var seq;
var connectPostgres = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                logger_config_1.mqlogger.info('🔌 Connecting to Postgres...');
                seq = new sequelize_typescript_1.Sequelize({
                    host: (0, env_1.getEnvVariable)(process.env, 'POSTGRES_HOST', 'localhost'),
                    port: (0, env_1.getEnvNumber)(process.env, 'POSTGRES_PORT', 5432),
                    username: (0, env_1.getEnvVariable)(process.env, 'POSTGRES_USER', 'postgres'),
                    password: (0, env_1.getEnvVariable)(process.env, 'POSTGRES_PASSWORD'),
                    database: (0, env_1.getEnvVariable)(process.env, 'POSTGRES_DATABASE'),
                    dialect: 'postgres',
                    timezone: (0, env_1.getEnvVariable)(process.env, 'TZ', 'UTC'),
                    logging: function (msg) { return logger_config_1.mqlogger.debug(msg); },
                    define: {
                        charset: 'utf8mb4_unicode_ci',
                        paranoid: true,
                        timestamps: true,
                        freezeTableName: true,
                        underscored: true,
                    },
                    pool: {
                        max: (0, env_1.getEnvNumber)(process.env, 'DB_POOL_MAX', 3),
                        min: (0, env_1.getEnvNumber)(process.env, 'DB_POOL_MIN', 0),
                        acquire: (0, env_1.getEnvNumber)(process.env, 'DB_POOL_ACQUIRE', 30000),
                        idle: (0, env_1.getEnvNumber)(process.env, 'DB_POOL_IDLE', 10000),
                    },
                });
                logger_config_1.mqlogger.info('🔌 Before Authenticating to Postgres...' + (0, env_1.getEnvVariable)(process.env, 'POSTGRES_PASSWORD'));
                return [4 /*yield*/, seq.authenticate()];
            case 1:
                _a.sent();
                logger_config_1.mqlogger.info('🔌 After Authenticating ...');
                return [4 /*yield*/, (0, main_1.generateMainModels)(seq)];
            case 2:
                _a.sent();
                logger_config_1.mqlogger.info('✨ Connected to Postgres');
                return [2 /*return*/, seq];
            case 3:
                err_1 = _a.sent();
                logger_config_1.mqlogger.error(err_1);
                throw err_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.connectPostgres = connectPostgres;
var getSequelizeInstance = function () {
    if (!seq) {
        throw new Error('Sequelize instance not initialized. Call connectPostgres first.');
    }
    return seq;
};
exports.getSequelizeInstance = getSequelizeInstance;
