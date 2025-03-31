"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatchAsync = void 0;
var index_1 = require("../constants/index");
var tryCatchAsync = function (fn) { return function (req, res, next) {
    return Promise.resolve(fn(req, res, next))
        .then(function (result) { var _a; return res.status((_a = req.statusCode) !== null && _a !== void 0 ? _a : index_1.STATUS_CODES.OK).json(result); })
        .catch(function (err) { return next(err); });
}; };
exports.tryCatchAsync = tryCatchAsync;
