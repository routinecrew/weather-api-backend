"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptAES = exports.encryptAES = exports.compareHash = exports.generateHash = void 0;
var bcrypt_1 = __importDefault(require("bcrypt"));
var crypto_1 = __importDefault(require("crypto"));
var AES_KEY = (_a = process.env['AES_KEY']) !== null && _a !== void 0 ? _a : 'abcde12345abcde12345abcde12345ab';
var IV = AES_KEY.substring(0, 16);
var generateHash = function (data) {
    var salt = bcrypt_1.default.genSaltSync(Number(process.env['SALT_ROUNDS']));
    return bcrypt_1.default.hashSync(data, salt);
};
exports.generateHash = generateHash;
var compareHash = function (target, hash) { return bcrypt_1.default.compareSync(target, hash); };
exports.compareHash = compareHash;
var encryptAES = function (text) {
    var cipher = crypto_1.default.createCipheriv('AES-256-GCM', Buffer.from(AES_KEY), IV);
    var encrypted = cipher.update(text);
    return Buffer.concat([encrypted, cipher.final()]).toString('hex');
};
exports.encryptAES = encryptAES;
var decryptAES = function (text) {
    var encrypted = Buffer.from(text, 'hex');
    var decipher = crypto_1.default.createDecipheriv('AES-256-GCM', Buffer.from(AES_KEY), IV);
    var decrypted = decipher.update(encrypted);
    return Buffer.concat([decrypted, decipher.final()]).toString();
};
exports.decryptAES = decryptAES;
