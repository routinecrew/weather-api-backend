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
var path_1 = require("path");
var app_root_path_1 = require("app-root-path");
var fs_1 = __importDefault(require("fs"));
var papaparse_1 = __importDefault(require("papaparse"));
var dotenv_config_1 = require("../shared/configs/dotenv.config");
var postgres_config_1 = require("../shared/configs/postgres.config");
var weather_1 = require("../service-init/models/main/weather");
var logger_config_1 = require("../shared/configs/logger.config");
/**
 * CSV 파일에서 1번 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 스크립트
 */
function importWeatherDataFromCsv(csvFilePath_1) {
    return __awaiter(this, arguments, void 0, function (csvFilePath, batchSize) {
        var fileContent, parseResult, csvData, totalBatches, processedRows, successCount, errorCount, batchIndex, start, end, batch, weatherBatch, _loop_1, _i, batch_1, row, error_1;
        if (batchSize === void 0) { batchSize = 100; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_config_1.logger.info("\uD83D\uDD04 Starting CSV import from: ".concat(csvFilePath));
                    fileContent = fs_1.default.readFileSync(csvFilePath, 'utf8');
                    parseResult = papaparse_1.default.parse(fileContent, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: true, // 자동으로 숫자 타입 변환
                        transformHeader: function (header) { return header.trim(); }, // 헤더 공백 제거
                    });
                    if (parseResult.errors && parseResult.errors.length > 0) {
                        logger_config_1.logger.error('CSV 파싱 중 오류 발생:', parseResult.errors);
                        throw new Error('CSV parsing failed');
                    }
                    csvData = parseResult.data;
                    logger_config_1.logger.info("\uD83D\uDCCA Total rows in CSV: ".concat(csvData.length));
                    totalBatches = Math.ceil(csvData.length / batchSize);
                    processedRows = 0;
                    successCount = 0;
                    errorCount = 0;
                    batchIndex = 0;
                    _a.label = 1;
                case 1:
                    if (!(batchIndex < totalBatches)) return [3 /*break*/, 7];
                    start = batchIndex * batchSize;
                    end = Math.min(start + batchSize, csvData.length);
                    batch = csvData.slice(start, end);
                    weatherBatch = [];
                    _loop_1 = function (row) {
                        try {
                            var timeStr = row.time;
                            // CSV의 time 문자열이 유효한 날짜 형식인지 확인
                            var timeDate = new Date(timeStr);
                            if (isNaN(timeDate.getTime())) {
                                logger_config_1.logger.warn("Invalid date format in row: ".concat(JSON.stringify(row)));
                                errorCount++;
                                return "continue";
                            }
                            // 1번 센서 그룹 데이터만 추출
                            var weatherData_1 = {
                                time: timeDate,
                                point: 1, // 1번 센서 그룹
                                airTemperature: row.Air_Temperature1,
                                airHumidity: row.Air_Humidity1,
                                airPressure: row.Air_Pressure1,
                                soilTemperature: row.Soil_Temperature1,
                                soilHumidity: row.Soil_Humidity1,
                                soilEC: row.Soil_EC1,
                                pyranometer: row.Pyranometer1,
                                pasteTypeTemperature: row.Paste_type_temperature1,
                            };
                            // 필수 필드 검증
                            var requiredFields = [
                                'airTemperature',
                                'airHumidity',
                                'airPressure',
                                'soilTemperature',
                                'soilHumidity',
                                'soilEC',
                                'pyranometer',
                            ];
                            var isValid = requiredFields.every(function (field) {
                                return weatherData_1[field] !== undefined &&
                                    weatherData_1[field] !== null;
                            });
                            if (isValid) {
                                weatherBatch.push(weatherData_1);
                            }
                            else {
                                logger_config_1.logger.warn("Missing required fields in row: ".concat(JSON.stringify(row)));
                                errorCount++;
                            }
                        }
                        catch (error) {
                            logger_config_1.logger.error("Error processing row: ".concat(JSON.stringify(row)), error);
                            errorCount++;
                        }
                    };
                    // 1번 센서 그룹 데이터만 추출하여 변환
                    for (_i = 0, batch_1 = batch; _i < batch_1.length; _i++) {
                        row = batch_1[_i];
                        _loop_1(row);
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    if (!(weatherBatch.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, weather_1.Weather.bulkCreate(weatherBatch)];
                case 3:
                    _a.sent();
                    successCount += weatherBatch.length;
                    _a.label = 4;
                case 4:
                    processedRows += batch.length;
                    logger_config_1.logger.info("\u2705 Processed batch ".concat(batchIndex + 1, "/").concat(totalBatches, " (").concat(processedRows, "/").concat(csvData.length, " rows)"));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    logger_config_1.logger.error("Error saving batch ".concat(batchIndex + 1, "/").concat(totalBatches, ":"), error_1);
                    errorCount += batch.length;
                    return [3 /*break*/, 6];
                case 6:
                    batchIndex++;
                    return [3 /*break*/, 1];
                case 7:
                    logger_config_1.logger.info("\uD83C\uDFC1 CSV import completed. Success: ".concat(successCount, ", Errors: ").concat(errorCount));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var csvFilePath, seq, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    // 환경 변수 로드
                    (0, dotenv_config_1.configDotenv)();
                    csvFilePath = (0, path_1.join)(app_root_path_1.path, 'src', 'IPB_250104_250305.csv');
                    // 데이터베이스 연결
                    logger_config_1.logger.info('🔌 Connecting to database...');
                    return [4 /*yield*/, (0, postgres_config_1.connectPostgres)()];
                case 1:
                    seq = _a.sent();
                    // CSV 파일 가져오기
                    return [4 /*yield*/, importWeatherDataFromCsv(csvFilePath)];
                case 2:
                    // CSV 파일 가져오기
                    _a.sent();
                    // 데이터베이스 연결 종료
                    return [4 /*yield*/, seq.close()];
                case 3:
                    // 데이터베이스 연결 종료
                    _a.sent();
                    logger_config_1.logger.info('🔌 Database connection closed');
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    logger_config_1.logger.error('❌ Script execution failed:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 스크립트 실행
main()
    .then(function () {
    logger_config_1.logger.info('✨ Script completed successfully');
    process.exit(0);
})
    .catch(function (error) {
    logger_config_1.logger.error('❌ Unhandled error:', error);
    process.exit(1);
});
