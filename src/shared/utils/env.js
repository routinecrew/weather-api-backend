"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvBoolean = exports.getEnvNumber = exports.getEnvVariable = void 0;
var getEnvVariable = function (env, key, defaultValue) {
    var value = env[key];
    if (value === undefined && defaultValue === undefined) {
        throw new Error("Environment variable ".concat(key, " is not set and no default value provided"));
    }
    return value !== null && value !== void 0 ? value : defaultValue;
};
exports.getEnvVariable = getEnvVariable;
var getEnvNumber = function (env, key, defaultValue) {
    var value = (0, exports.getEnvVariable)(env, key, defaultValue === null || defaultValue === void 0 ? void 0 : defaultValue.toString());
    var parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error("Environment variable ".concat(key, " is not a valid number"));
    }
    return parsed;
};
exports.getEnvNumber = getEnvNumber;
var getEnvBoolean = function (env, key, defaultValue) {
    var value = (0, exports.getEnvVariable)(env, key, defaultValue.toString());
    return value.toLowerCase() === 'true';
};
exports.getEnvBoolean = getEnvBoolean;
