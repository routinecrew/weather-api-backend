import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { Op } from 'sequelize';
import { Weather, WeatherCreationAttributes } from '../service-init/models/main/weather.model';
import { logger } from '../shared/configs/logger.config';

/**
 * CSV 파일을 여러 경로에서 찾는 함수
 */
function findCsvFile(filename: string): string {
  const isDocker = process.env.DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
  logger.info(`실행 환경: ${isDocker ? 'Docker' : '호스트'}`);

  const possiblePaths = isDocker
    ? [
        `/app/dist/${filename}`,
        `/app/${filename}`,
        `/app/src/${filename}`,
      ]
    : [
        join(path, 'dist', filename),
        join(path, filename),
        join(path, 'src', filename),
        '/home/ubuntu/weather-api-backend/src/IPB_250104_250305.csv',
      ];

  logger.info('CSV 파일 탐색 시작...');
  for (const filepath of possiblePaths) {
    logger.info(`경로 확인: ${filepath} (존재: ${fs.existsSync(filepath)})`);
    if (fs.existsSync(filepath)) {
      logger.info(`CSV 파일을 찾았습니다: ${filepath}`);
      return filepath;
    }
  }

  logger.error(`CSV 파일을 찾을 수 없습니다: ${filename}. 탐색된 경로: ${possiblePaths.join(', ')}`);
  throw new Error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
}

/**
 * 날짜/시간 문자열을 파싱하여 날짜와 시간 부분으로 분리
 * @param timeStr 'YYYY-MM-DD HH:MM:SS' 또는 'YYYY-MM-DDHH:MM:SS' 형식의 날짜/시간 문자열
 * @returns 분리된 날짜와 시간 객체 또는 null
 */
function parseDateAndTime(timeStr: string | undefined | null): { date: string, time: string } | null {
  if (!timeStr) {
    logger.warn(`날짜/시간 문자열이 제공되지 않았습니다: ${timeStr}`);
    return null;
  }

  try {
    const cleanTimeStr = timeStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
    
    const dateTimeRegex = /^(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2}:\d{2})$/;
    const match = dateTimeRegex.exec(cleanTimeStr);
    
    if (match) {
      const [, datePart, timePart] = match;
      if (typeof datePart === 'string' && typeof timePart === 'string') {
        return {
          date: datePart, // YYYY-MM-DD
          time: timePart  // HH:MM:SS
        };
      }
    }

    logger.warn(`지원되지 않는 날짜/시간 형식: ${cleanTimeStr}`);
    return null;
  } catch (error) {
    logger.error(`날짜/시간 파싱 중 오류 발생:`, error);
    return null;
  }
}

/**
 * CSV 파일에서 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 함수
 */
async function importWeatherDataFromCsv(csvFilePath: string, batchSize = 100): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 CSV 가져오기 시작: ${csvFilePath}`);

  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    logger.info(`CSV 파일 크기: ${fileContent.length} 바이트`);
    logger.info(`CSV 파일 처음 100자: ${fileContent.substring(0, 100)}`);

    const existingCount = await Weather.count();
    logger.info(`현재 DB에 ${existingCount}개의 날씨 데이터가 있습니다.`);

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
      delimiter: "\t",
      delimitersToGuess: [',', '\t', '|', ';'],
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      logger.error('CSV 파싱 중 오류 발생:', parseResult.errors);
      throw new Error('CSV parsing failed');
    }

    const csvData = parseResult.data as any[];
    logger.info(`📊 CSV 데이터 파싱 완료: ${csvData.length}행`);
    
    if (csvData.length === 0) {
      logger.warn('CSV 파일에 데이터가 없습니다.');
      return;
    }

    logger.info(`CSV 헤더: ${JSON.stringify(parseResult.meta.fields)}`);
    logger.info(`첫 번째 행 데이터: ${JSON.stringify(csvData[0])}`);

    const processedTimePointPairs = new Set<string>();

    if (csvData.length > 0 && csvData[0].time) {
      try {
        const firstDateParsed = parseDateAndTime(csvData[0].time);
        const lastDateParsed = parseDateAndTime(csvData[csvData.length - 1].time);
        
        if (firstDateParsed && lastDateParsed) {
          logger.info(`CSV 데이터 날짜 범위: ${firstDateParsed.date} ~ ${lastDateParsed.date}`);
          
          const existingData = await Weather.findAll({
            where: {
              date: {
                [Op.between]: [firstDateParsed.date, lastDateParsed.date]
              }
            },
            attributes: ['date', 'time', 'point']
          });
          
          logger.info(`날짜 범위 내 기존 DB 데이터: ${existingData.length}개`);
          
          existingData.forEach(record => {
            if (record.date && record.time) {
              processedTimePointPairs.add(`${record.date}_${record.time}_${record.point}`);
            }
          });
          
          logger.info(`중복 방지를 위해 ${processedTimePointPairs.size}개의 기존 시간-포인트 조합 캐싱 완료`);
        }
      } catch (error) {
        logger.warn('기존 데이터 조회 중 오류 발생, 중복 방지 기능이 제한될 수 있습니다:', error);
      }
    }

    const totalBatches = Math.ceil(csvData.length / batchSize);
    let processedRows = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, csvData.length);
      const batch = csvData.slice(start, end);

      const weatherBatch: WeatherCreationAttributes[] = [];

      for (const row of batch) {
        try {
          const timeStr = String(row.time || '');
          if (!timeStr) {
            logger.warn(`시간 데이터가 없습니다: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }
          
          const dateTimeParts = parseDateAndTime(timeStr);
          if (!dateTimeParts) {
            logger.warn(`날짜/시간 형식 오류: ${timeStr}`);
            errorCount++;
            continue;
          }

          const { date, time } = dateTimeParts;

          for (let point = 1; point <= 5; point++) {
            if (
              row[`Air_Temperature${point}`] === undefined ||
              row[`Air_Humidity${point}`] === undefined ||
              row[`Air_Pressure${point}`] === undefined ||
              row[`Soil_Temperature${point}`] === undefined ||
              row[`Soil_Humidity${point}`] === undefined ||
              row[`Soil_EC${point}`] === undefined ||
              row[`Pyranometer${point}`] === undefined
            ) {
              continue;
            }

            const timePointKey = `${date}_${time}_${point}`;
            if (processedTimePointPairs.has(timePointKey)) {
              skippedCount++;
              continue;
            }
            
            processedTimePointPairs.add(timePointKey);

            const weatherData: WeatherCreationAttributes = {
              date: date,
              time: time, // string 타입 (HH:MM:SS)
              point: point,
              airTemperature: row[`Air_Temperature${point}`],
              airHumidity: row[`Air_Humidity${point}`],
              airPressure: row[`Air_Pressure${point}`],
              soilTemperature: row[`Soil_Temperature${point}`],
              soilHumidity: row[`Soil_Humidity${point}`],
              soilEC: row[`Soil_EC${point}`],
              pyranometer: row[`Pyranometer${point}`],
            };

            if (point === 1 && row[`Paste_type_temperature${point}`] !== undefined) {
              weatherData.pasteTypeTemperature = row[`Paste_type_temperature${point}`];
            }

            if (point === 5) {
              weatherData.windSpeed = row[`Wind_speed${point}`] || row[`Wind_Speed${point}`];
              weatherData.windDirection = row[`Wind_direction${point}`] || row[`Wind_Direction${point}`];
              weatherData.solarRadiation = row[`Solar_radiation${point}`] || row[`Solar_Radiation${point}`];
              weatherData.rainfall = row[`Rainfall${point}`];
              weatherData.co2 = row[`CO2${point}`] || row[`${point}_CO2`];
            }

            const requiredFields = [
              'airTemperature',
              'airHumidity',
              'airPressure',
              'soilTemperature',
              'soilHumidity',
              'soilEC',
              'pyranometer',
            ];

            const isValid = requiredFields.every(
              (field) =>
                weatherData[field as keyof WeatherCreationAttributes] !== undefined &&
                weatherData[field as keyof WeatherCreationAttributes] !== null,
            );

            if (isValid) {
              weatherBatch.push(weatherData);
            } else {
              logger.warn(`포인트 ${point}의 필수 필드 누락: ${JSON.stringify(row)}`);
              errorCount++;
            }
          }
        } catch (error) {
          logger.error(`행 처리 중 오류 발생: ${JSON.stringify(row)}`, error);
          errorCount++;
        }
      }

      try {
        if (weatherBatch.length > 0) {
          logger.info(`배치 ${batchIndex + 1}/${totalBatches}에 ${weatherBatch.length}개 데이터 저장 시도`);
          await Weather.bulkCreate(weatherBatch, {
            ignoreDuplicates: true
          });
          successCount += weatherBatch.length;
          logger.info(`배치 ${batchIndex + 1}/${totalBatches} 저장 성공!`);
        } else {
          logger.warn(`배치 ${batchIndex + 1}/${totalBatches}에 저장할 유효한 데이터가 없습니다.`);
        }

        processedRows += batch.length;
        logger.info(`✅ 배치 처리 완료 ${batchIndex + 1}/${totalBatches} (${processedRows}/${csvData.length} 행)`);
      } catch (error) {
        logger.error(`배치 ${batchIndex + 1}/${totalBatches} 저장 중 오류:`, error);
        errorCount += batch.length;
      }
    }

    const afterCount = await Weather.count();
    logger.info(`🏁 CSV 가져오기 완료.`);
    logger.info(`총 처리: ${processedRows}행, 성공: ${successCount}, 오류: ${errorCount}, 중복 건너뜀: ${skippedCount}`);
    logger.info(`DB 데이터 수: ${existingCount} → ${afterCount} (${afterCount - existingCount} 증가)`);
  } catch (error) {
    logger.error(`CSV 파일 처리 중 예외 발생: ${error}`);
    throw error;
  }
}

export { importWeatherDataFromCsv, parseDateAndTime, findCsvFile };