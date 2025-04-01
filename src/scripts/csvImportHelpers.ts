// scripts/csvImportHelpers.ts
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
  // Docker 환경인지 확인 - process.env.DOCKER_ENV가 설정되어 있으면 Docker 환경으로 간주
  const isDocker = process.env.DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
  
  // Docker 환경일 때 더 정확한 경로를 먼저 시도
  if (isDocker) {
    logger.info('Docker 환경에서 실행 중입니다.');
    // Docker 컨테이너 내 경로들
    const dockerPaths = [
      '/app/dist/' + filename,  // Docker 컨테이너 내 dist 디렉토리
      '/app/' + filename,       // Docker 컨테이너 내 루트 디렉토리
      '/app/src/' + filename    // Docker 컨테이너 내 src 디렉토리
    ];
    
    for (const dockerPath of dockerPaths) {
      logger.info(`Docker 환경에서 경로 확인: ${dockerPath}`);
      if (fs.existsSync(dockerPath)) {
        logger.info(`CSV 파일을 찾았습니다: ${dockerPath}`);
        return dockerPath;
      }
    }
  }
  
  // 일반 환경 또는 Docker 환경에서 추가로 시도할 경로들
  const possiblePaths = [
    join(path, 'dist', filename),
    join(path, filename),         // root 디렉토리
    join(path, 'src', filename),  // src 디렉토리
    join(__dirname, '..', '..', 'dist', filename),
    join(__dirname, '..', '..', filename),
    join(__dirname, '..', filename),
  ];

  // 모든 경로를 로깅하여 디버깅
  possiblePaths.forEach(p => {
    logger.info(`경로 확인: ${p} (존재: ${fs.existsSync(p)})`);
  });

  for (const filepath of possiblePaths) {
    if (fs.existsSync(filepath)) {
      logger.info(`CSV 파일을 찾았습니다: ${filepath}`);
      return filepath;
    }
  }
  
  // 마지막으로 절대 경로 하드코딩 시도 (긴급 폴백)
  const hardcodedPaths = [
    '/app/dist/IPB_250104_250305.csv',
    '/home/ubuntu/weather-api-backend/src/IPB_250104_250305.csv'
  ];
  
  for (const hardPath of hardcodedPaths) {
    logger.info(`하드코딩 경로 확인: ${hardPath}`);
    if (fs.existsSync(hardPath)) {
      logger.info(`CSV 파일을 하드코딩 경로에서 찾았습니다: ${hardPath}`);
      return hardPath;
    }
  }
  
  // 파일을 찾지 못한 경우 에러 발생
  logger.warn(`CSV 파일을 찾지 못했습니다.`);
  throw new Error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
}

/**
 * 날짜 문자열을 파싱하는 강화된 함수
 * 다양한 형식과 특수 공백 문자를 처리
 */
export function parseDate(dateStr: string): Date | null {
  // 특수 공백 문자를 포함한 모든 종류의 공백 제거 및 표준 공백으로 변환
  const cleanDateStr = dateStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
  
  // 기본 Date 파싱 시도
  const date = new Date(cleanDateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // 사용자 정의 형식 시도 (예: YYYY-MM-DDㅤHH:MM:SS 형식)
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
    // CSV 파일 읽기
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    logger.info(`CSV 파일 크기: ${fileContent.length} 바이트`);
    logger.info(`CSV 파일 처음 100자: ${fileContent.substring(0, 100)}`);

    // CSV 파싱
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // 자동으로 숫자 타입 변환
      transformHeader: (header: string) => header.trim(), // 헤더 공백 제거
      // 큰 파일을 고려한 추가 옵션
      delimiter: ",", // 명시적으로 구분자 지정
      delimitersToGuess: [',', '\t', '|', ';'], // 다양한 구분자 추측
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

    // CSV 헤더 정보 로깅
    logger.info(`CSV 헤더: ${JSON.stringify(parseResult.meta.fields)}`);
    // 첫 번째 행 데이터 로깅
    logger.info(`첫 번째 행 데이터: ${JSON.stringify(csvData[0])}`);

    // 배치 처리를 위한 변수
    const totalBatches = Math.ceil(csvData.length / batchSize);
    let processedRows = 0;
    let successCount = 0;
    let errorCount = 0;

    // 배치 처리
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, csvData.length);
      const batch = csvData.slice(start, end);

      const weatherBatch: WeatherCreationAttributes[] = [];

      // 1번 센서 그룹 데이터만 추출하여 변환
      for (const row of batch) {
        try {
          const timeStr = row.time;
          // 강화된 날짜 파싱 함수 사용
          const timeDate = parseDate(timeStr);
          
          if (!timeDate) {
            logger.warn(`Invalid date format in row: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          // 1번 센서 그룹 데이터만 추출
          const weatherData: WeatherCreationAttributes = {
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

      // 배치 저장
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