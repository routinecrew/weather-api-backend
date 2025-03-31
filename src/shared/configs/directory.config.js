"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDirs = void 0;
var path_1 = require("path");
var shared_types_1 = require("../shared-types");
var utils_1 = require("../utils");
var generateDirs = function (schema) {
    (0, utils_1.makeDirectory)(utils_1.resourcePath);
    (0, utils_1.makeDirectory)((0, path_1.join)((0, utils_1.tempPath)(schema)));
    (0, utils_1.makeDirectory)((0, path_1.join)((0, utils_1.uploadPath)(schema)));
    for (var _i = 0, domains_1 = shared_types_1.domains; _i < domains_1.length; _i++) {
        var domain = domains_1[_i];
        (0, utils_1.makeDirectory)((0, path_1.join)((0, utils_1.uploadPath)(schema), domain));
    }
};
exports.generateDirs = generateDirs;
