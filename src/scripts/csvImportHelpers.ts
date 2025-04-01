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
 */
export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) {
    logger.warn(`날짜 문자열이 제공되지 않았습니다: ${dateStr}`);
    return null;
  }

  // "2025-01-0816:10:43" 형식 처리
  const customFormatRegex = /^(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}:\d{2})$/;
  const match = customFormatRegex.exec(dateStr);
  if (match) {
    const [, datePart, timePart] = match;
    const formattedStr = `${datePart}T${timePart}`; // "2025-01-08T16:10:43"
    const parsedDate = new Date(formattedStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // 기존 표준 형식 처리 (공백 포함)
  const cleanDateStr = dateStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
  const date = new Date(cleanDateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // "YYYY-MM-DD HH:MM:SS" 형식 처리
  const regex = /(\d{4}-\d{2}-\d{2})[^\d]+(\d{2}:\d{2}:\d{2})/;
  const fallbackMatch = regex.exec(dateStr);
  if (fallbackMatch) {
    const [, datePart, timePart] = fallbackMatch;
    const formattedStr = `${datePart}T${timePart}`;
    const parsedDate = new Date(formattedStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  logger.warn(`지원되지 않는 날짜 형식: ${dateStr}`);
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
          const timeStr = row.datetime;
          const timeDate = parseDate(timeStr);
          
          if (!timeDate) {
            logger.warn(`날짜 형식 오류: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          // 각 포인트(1~5)별로 데이터 추출 및 저장
          for (let point = 1; point <= 5; point++) {
            // 해당 포인트의 필수 데이터가 있는지 확인
            if (
              row[`Air_Temperature${point}`] === undefined ||
              row[`Air_Humidity${point}`] === undefined ||
              row[`Air_Pressure${point}`] === undefined ||
              row[`Soil_Temperature${point}`] === undefined ||
              row[`Soil_Humidity${point}`] === undefined ||
              row[`Soil_EC${point}`] === undefined ||
              row[`Pyranometer${point}`] === undefined
            ) {
              // 해당 포인트 데이터가 없으면 건너뜀
              continue;
            }

            const weatherData: WeatherCreationAttributes = {
              time: timeDate,
              point: point,
              airTemperature: row[`Air_Temperature${point}`],
              airHumidity: row[`Air_Humidity${point}`],
              airPressure: row[`Air_Pressure${point}`],
              soilTemperature: row[`Soil_Temperature${point}`],
              soilHumidity: row[`Soil_Humidity${point}`],
              soilEC: row[`Soil_EC${point}`],
              pyranometer: row[`Pyranometer${point}`],
            };

            // 포인트 1에만 있는 데이터
            if (point === 1 && row[`Paste_type_temperature${point}`] !== undefined) {
              weatherData.pasteTypeTemperature = row[`Paste_type_temperature${point}`];
            }

            // 포인트 5에만 있는 데이터
            if (point === 5) {
              if (row[`Wind_Speed${point}`] !== undefined) weatherData.windSpeed = row[`Wind_Speed${point}`];
              if (row[`Wind_Direction${point}`] !== undefined) weatherData.windDirection = row[`Wind_Direction${point}`];
              if (row[`Solar_Radiation${point}`] !== undefined) weatherData.solarRadiation = row[`Solar_Radiation${point}`];
              if (row[`Rainfall${point}`] !== undefined) weatherData.rainfall = row[`Rainfall${point}`];
              if (row[`CO2${point}`] !== undefined) weatherData.co2 = row[`CO2${point}`];
            }

            // 필수 필드 검증
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
          await Weather.bulkCreate(weatherBatch);
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

    logger.info(`🏁 CSV 가져오기 완료. 성공: ${successCount}, 오류: ${errorCount}`);
  } catch (error) {
    logger.error(`CSV 파일 처리 중 예외 발생: ${error}`);
    throw error;
  }
}