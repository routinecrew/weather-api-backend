import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { Weather, WeatherCreationAttributes } from '../service-init/models/main/weather';
import { logger } from '../shared/configs/logger.config';

/**
 * CSV 파일을 여러 경로에서 찾는 함수
 */
export function findCsvFile(filename: string): string {
  // Docker 환경인지 확인
  const isDocker = process.env.DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
  logger.info(`실행 환경: ${isDocker ? 'Docker' : '호스트'}`);

  // 환경에 따라 탐색 경로 설정
  const possiblePaths = isDocker
    ? [
        `/app/dist/${filename}`,  // Docker 컨테이너 내 dist 디렉토리
        `/app/${filename}`,       // Docker 컨테이너 내 루트 디렉토리
        `/app/src/${filename}`,   // Docker 컨테이너 내 src 디렉토리
      ]
    : [
        join(path, 'dist', filename),         // 호스트 dist 디렉토리
        join(path, filename),                 // 호스트 루트 디렉토리
        join(path, 'src', filename),          // 호스트 src 디렉토리
        '/home/ubuntu/weather-api-backend/src/IPB_250104_250305.csv', // 하드코딩된 호스트 경로
      ];

  // 모든 경로를 로깅하여 디버깅
  logger.info('CSV 파일 탐색 시작...');
  for (const filepath of possiblePaths) {
    logger.info(`경로 확인: ${filepath} (존재: ${fs.existsSync(filepath)})`);
    if (fs.existsSync(filepath)) {
      logger.info(`CSV 파일을 찾았습니다: ${filepath}`);
      return filepath;
    }
  }

  // 파일을 찾지 못한 경우 자세한 오류 로그 출력
  logger.error(`CSV 파일을 찾을 수 없습니다: ${filename}. 탐색된 경로: ${possiblePaths.join(', ')}`);
  throw new Error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
}

/**
 * 날짜 문자열을 파싱하는 강화된 함수
 * 다양한 형식과 특수 공백 문자를 처리
 */
export function parseDate(dateStr: string): Date | null {
  const cleanDateStr = dateStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
  
  const date = new Date(cleanDateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  const regex = /(\d{4}-\d{2}-\d{2})[^\d]+(\d{2}:\d{2}:\d{2})/;
  const match = regex.exec(dateStr);
  if (match) {
    const [, datePart, timePart] = match;
    const formattedStr = `${datePart}T${timePart}`;
    const parsedDate = new Date(formattedStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  return null;
}

/**
 * CSV 파일에서 1번 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 함수
 */
export async function importWeatherDataFromCsv(csvFilePath: string, batchSize = 100): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 Starting CSV import from: ${csvFilePath}`);

  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    logger.info(`CSV 파일 크기: ${fileContent.length} 바이트`);
    logger.info(`CSV 파일 처음 100자: ${fileContent.substring(0, 100)}`);

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
      delimiter: ",",
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

    const totalBatches = Math.ceil(csvData.length / batchSize);
    let processedRows = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, csvData.length);
      const batch = csvData.slice(start, end);

      const weatherBatch: WeatherCreationAttributes[] = [];

      for (const row of batch) {
        try {
          const timeStr = row.time;
          const timeDate = parseDate(timeStr);
          
          if (!timeDate) {
            logger.warn(`Invalid date format in row: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          const weatherData: WeatherCreationAttributes = {
            time: timeDate,
            point: 1,
            airTemperature: row.Air_Temperature1,
            airHumidity: row.Air_Humidity1,
            airPressure: row.Air_Pressure1,
            soilTemperature: row.Soil_Temperature1,
            soilHumidity: row.Soil_Humidity1,
            soilEC: row.Soil_EC1,
            pyranometer: row.Pyranometer1,
            pasteTypeTemperature: row.Paste_type_temperature1,
          };

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
            logger.warn(`Missing required fields in row: ${JSON.stringify(row)}`);
            errorCount++;
          }
        } catch (error) {
          logger.error(`Error processing row: ${JSON.stringify(row)}`, error);
          errorCount++;
        }
      }

      try {
        if (weatherBatch.length > 0) {
          logger.info(`배치 ${batchIndex + 1}/${totalBatches}에 ${weatherBatch.length}개 데이터 저장 시도`);
          await Weather.bulkCreate(weatherBatch);
          successCount += weatherBatch.length;
          logger.info(`배치 ${batchIndex + 1}/${totalBatches} 저장 성공!`);
        } else {
          logger.warn(`배치 ${batchIndex + 1}/${totalBatches}에 저장할 유효한 데이터가 없습니다.`);
        }

        processedRows += batch.length;
        logger.info(`✅ Processed batch ${batchIndex + 1}/${totalBatches} (${processedRows}/${csvData.length} rows)`);
      } catch (error) {
        logger.error(`Error saving batch ${batchIndex + 1}/${totalBatches}:`, error);
        errorCount += batch.length;
      }
    }

    logger.info(`🏁 CSV import completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    logger.error(`CSV 파일 처리 중 예외 발생: ${error}`);
    throw error;
  }
}