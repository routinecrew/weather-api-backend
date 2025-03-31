"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.removeFiles = exports.moveFiles = exports.uploadsTemp = exports.filename = exports.makeDirectory = exports.getStaticUploadPath = exports.getStaticTempPath = exports.getUploadPath = exports.getTempPath = exports.DEFAULT_MAX_FILE_SIZE = exports.DEFAULT_MAX_FILE = exports.uploadPath = exports.tempPath = exports.resourcePath = void 0;
var app_root_path_1 = require("app-root-path");
var path_1 = require("path");
var fs_1 = __importDefault(require("fs"));
var crypto_1 = require("crypto");
var formidable_1 = __importDefault(require("formidable"));
var logger_config_1 = require("../configs/logger.config");
// 파일을 저장할 경로를 정의
exports.resourcePath = (0, path_1.join)(app_root_path_1.path, 'resource');
var tempPath = function (schema) { return (0, path_1.join)(exports.resourcePath, schema, 'temps'); };
exports.tempPath = tempPath;
var uploadPath = function (schema) { return (0, path_1.join)(exports.resourcePath, schema, 'uploads'); };
exports.uploadPath = uploadPath;
exports.DEFAULT_MAX_FILE = 10;
exports.DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
// this for server, it may private, no need to open to client.
var getTempPath = function (schema) { return (0, path_1.join)((0, exports.tempPath)(schema)); };
exports.getTempPath = getTempPath;
var getUploadPath = function (schema, domain) { return (0, path_1.join)((0, exports.uploadPath)(schema), domain); };
exports.getUploadPath = getUploadPath;
// this for client, client may request file by this path.
var getStaticTempPath = function (schema) { return (0, path_1.join)('resource', schema, 'temps'); };
exports.getStaticTempPath = getStaticTempPath;
var getStaticUploadPath = function (schema, domain) {
    return (0, path_1.join)('resource', schema, 'uploads', domain);
};
exports.getStaticUploadPath = getStaticUploadPath;
var makeDirectory = function (path) {
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.mkdirSync(path, { recursive: true });
    }
};
exports.makeDirectory = makeDirectory;
var filename = function (_name, extention) {
    var today = new Date();
    var random = (0, crypto_1.randomBytes)(16).toString('hex');
    return "".concat(today, "+").concat(random).concat(extention);
};
exports.filename = filename;
var uploadsTemp = function (req, schema, options) {
    return new Promise(function (resolve, reject) {
        var form = (0, formidable_1.default)(__assign({ multiples: true, keepExtensions: true, allowEmptyFiles: false, encoding: 'utf-8', maxFiles: exports.DEFAULT_MAX_FILE, maxFileSize: exports.DEFAULT_MAX_FILE_SIZE, uploadDir: (0, exports.getTempPath)(schema) }, options));
        form.parse(req, function (err, fields, files) {
            if (err) {
                return reject(err);
            }
            // Normalize files['files'] to always be an array
            var fileList = Array.isArray(files['files'])
                ? files['files']
                : [files['files']].filter(Boolean);
            return resolve({
                fields: fields,
                files: { files: fileList }
            });
        });
    });
};
exports.uploadsTemp = uploadsTemp;
var moveFiles = function (schema, domain, from, to) { return __awaiter(void 0, void 0, void 0, function () {
    var directoryPath, _i, from_1, oldPath, filename_1, newPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                directoryPath = (0, path_1.join)((0, exports.getUploadPath)(schema, domain), to);
                (0, exports.makeDirectory)(directoryPath);
                _i = 0, from_1 = from;
                _a.label = 1;
            case 1:
                if (!(_i < from_1.length)) return [3 /*break*/, 4];
                oldPath = from_1[_i];
                filename_1 = oldPath.split('/temp/')[1];
                if (!filename_1) {
                    logger_config_1.mqlogger.error('filename not found');
                    throw new Error();
                }
                newPath = (0, path_1.join)(directoryPath, filename_1);
                return [4 /*yield*/, fs_1.default.promises.rename((0, path_1.join)(app_root_path_1.path, oldPath), newPath)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.moveFiles = moveFiles;
var removeFiles = function (removePath) { return __awaiter(void 0, void 0, void 0, function () {
    var targetPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                targetPath = (0, path_1.join)(app_root_path_1.path, removePath);
                if (!fs_1.default.existsSync(targetPath)) return [3 /*break*/, 2];
                return [4 /*yield*/, fs_1.default.promises.unlink(targetPath)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
exports.removeFiles = removeFiles;
