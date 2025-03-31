"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var compression_1 = __importDefault(require("compression"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var cls_rtracer_1 = __importDefault(require("cls-rtracer"));
var morgan_config_1 = __importDefault(require("./morgan.config"));
var passport_1 = __importDefault(require("passport"));
var routes_1 = __importDefault(require("../../service-init/routes"));
var utils_1 = require("../utils");
var middlewares_1 = require("../middlewares");
var app = (0, express_1.default)();
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({ origin: '*', credentials: true, optionsSuccessStatus: 200 }));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', "'localhost:*'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'"],
            scriptSrc: ["'self'"],
        },
    },
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cls_rtracer_1.default.expressMiddleware());
app.use(morgan_config_1.default);
app.use(passport_1.default.initialize());
app.use('/', routes_1.default);
app.use('/resources', express_1.default.static(utils_1.resourcePath));
app.use(function (_req, res) {
    res.status(200).send('<h1>Express + Typescript Server</h1>');
});
app.use(middlewares_1.errorConverter);
app.use(middlewares_1.errorHandler);
exports.default = app;
