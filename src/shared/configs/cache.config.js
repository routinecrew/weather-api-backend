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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
var ioredis_1 = __importDefault(require("ioredis"));
var logger_config_1 = require("./logger.config");
var env_1 = require("../utils/env");
var createCacheConfig = function (env) { return ({
    host: (0, env_1.getEnvVariable)(env, 'REDIS_HOST', 'localhost'),
    port: (0, env_1.getEnvNumber)(env, 'REDIS_PORT', 6379),
    password: (0, env_1.getEnvVariable)(env, 'REDIS_PASSWORD', ''),
    db: (0, env_1.getEnvNumber)(env, 'REDIS_DB', 0),
    servicePrefixes: {
        grpc: 'grpc:',
        rest: 'rest:',
        internal: 'internal:',
    },
    defaultTTL: 300,
    maxRetriesPerRequest: 3,
    retryDelay: 500,
    maxRetryTime: 2000,
}); };
var createRedisClient = function (config) {
    var client = new ioredis_1.default({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        retryStrategy: function (times) { return Math.min(times * config.retryDelay, config.maxRetryTime); },
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        enableReadyCheck: true,
        reconnectOnError: function (err) { return err.message.includes('READONLY'); },
    });
    client.on('connect', function () { return logger_config_1.mqlogger.info('Successfully connected to Redis Cache'); });
    client.on('error', function (error) { return logger_config_1.mqlogger.error('Redis Cache connection error:', error); });
    client.on('ready', function () { return logger_config_1.mqlogger.info('Redis Cache is ready to handle requests'); });
    client.on('reconnecting', function () { return logger_config_1.mqlogger.warn('Redis Cache is reconnecting...'); });
    return client;
};
var getCacheValue = function (client, key) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client.get(key)];
            case 1:
                data = _a.sent();
                return [2 /*return*/, data ? JSON.parse(data) : null];
            case 2:
                error_1 = _a.sent();
                logger_config_1.mqlogger.error("Cache get error for key ".concat(key, ":"), error_1);
                throw error_1; // 에러를 상위로 전파
            case 3: return [2 /*return*/];
        }
    });
}); };
var setCacheValue = function (client, key, value, ttl) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client.set(key, JSON.stringify(value), 'EX', ttl)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_config_1.mqlogger.error("Cache set error for key ".concat(key, ":"), error_2);
                throw error_2; // 에러를 상위로 전파
            case 3: return [2 /*return*/];
        }
    });
}); };
var deleteCacheValue = function (client, key) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client.del(key)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_config_1.mqlogger.error("Cache delete error for key ".concat(key, ":"), error_3);
                throw error_3; // 에러를 상위로 전파
            case 3: return [2 /*return*/];
        }
    });
}); };
var deletePattern = function (client, pattern) { return __awaiter(void 0, void 0, void 0, function () {
    var cursor, reply, keys, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                cursor = '0';
                _a.label = 1;
            case 1: return [4 /*yield*/, client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)];
            case 2:
                reply = _a.sent();
                cursor = reply[0];
                keys = reply[1];
                if (!keys.length) return [3 /*break*/, 4];
                return [4 /*yield*/, client.del.apply(client, keys)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                if (cursor !== '0') return [3 /*break*/, 1];
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_4 = _a.sent();
                logger_config_1.mqlogger.error("Cache delete pattern error for pattern ".concat(pattern, ":"), error_4);
                throw error_4; // 에러를 상위로 전파
            case 7: return [2 /*return*/];
        }
    });
}); };
var withCache = function (client, keyGenerator, ttl) {
    if (ttl === void 0) { ttl = 300; }
    return function (fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(void 0, void 0, void 0, function () {
                var key, cached, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = keyGenerator(args);
                            return [4 /*yield*/, getCacheValue(client, key)];
                        case 1:
                            cached = _a.sent();
                            if (cached) {
                                logger_config_1.mqlogger.debug("Cache hit for key: ".concat(key));
                                return [2 /*return*/, cached];
                            }
                            logger_config_1.mqlogger.debug("Cache miss for key: ".concat(key));
                            return [4 /*yield*/, fn.apply(void 0, args)];
                        case 2:
                            result = _a.sent();
                            return [4 /*yield*/, setCacheValue(client, key, result, ttl)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
    };
};
var createCacheKey = function (config) { return function (service, key) {
    return "".concat(config.servicePrefixes[service]).concat(key);
}; };
var config = createCacheConfig(process.env);
var redisClient = createRedisClient(config);
var buildCacheKey = createCacheKey(config);
exports.cache = {
    get: function (key) { return getCacheValue(redisClient, key); },
    set: function (key, value, ttl) {
        if (ttl === void 0) { ttl = config.defaultTTL; }
        return setCacheValue(redisClient, key, value, ttl);
    },
    delete: function (key) { return deleteCacheValue(redisClient, key); },
    deletePattern: function (pattern) { return deletePattern(redisClient, pattern); },
    withServiceCache: function (service, keyGenerator, ttl) {
        return withCache(redisClient, function (args) { return buildCacheKey(service, keyGenerator(args)); }, ttl);
    },
};
