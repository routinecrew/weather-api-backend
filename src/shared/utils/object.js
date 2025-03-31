"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = isEmpty;
exports.isNotEmpty = isNotEmpty;
exports.pick = pick;
function isEmpty(value) {
    if (value == '' ||
        value == null ||
        value == undefined ||
        (value != null && typeof value == 'object' && !Object.keys(value).length)) {
        return true;
    }
    return false;
}
function isNotEmpty(value) {
    return !isEmpty(value);
}
function pick(object, keys) {
    return keys.reduce(function (obj, key) {
        if (isNotEmpty(object[key])) {
            obj[key] = object[key];
        }
        return obj;
    }, {});
}
