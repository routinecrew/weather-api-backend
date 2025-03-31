"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = isString;
exports.isNumber = isNumber;
exports.isBoolean = isBoolean;
exports.isObject = isObject;
exports.isFunction = isFunction;
exports.isUndefined = isUndefined;
exports.isNull = isNull;
exports.isExists = isExists;
function isString(value) {
    return typeof value === 'string';
}
function isNumber(value) {
    return typeof value === 'number';
}
function isBoolean(value) {
    return typeof value === 'boolean';
}
function isObject(value) {
    return typeof value === 'object';
}
function isFunction(value) {
    return typeof value === 'function';
}
function isUndefined(value) {
    return typeof value === 'undefined';
}
function isNull(value) {
    return value === null;
}
function isExists(value) {
    return !isNull(value) && !isUndefined(value);
}
