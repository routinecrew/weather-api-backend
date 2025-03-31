"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenError = void 0;
var http_error_1 = require("./http-error");
var TokenError = /** @class */ (function (_super) {
    __extends(TokenError, _super);
    function TokenError(statusCode, isAccessTokenExpired, isRefreshTokenExpired) {
        var _this = _super.call(this, statusCode) || this;
        _this.isAccessTokenExpired = isAccessTokenExpired;
        _this.isRefreshTokenExpired = isRefreshTokenExpired;
        _this.name = TokenError.name;
        return _this;
    }
    return TokenError;
}(http_error_1.HttpError));
exports.TokenError = TokenError;
