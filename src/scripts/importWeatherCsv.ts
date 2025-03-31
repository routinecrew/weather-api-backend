import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { configDotenv } from '../shared/configs/dotenv.config';
import { connectPostgres } from '../shared/configs/postgres.config';
import { Weather } from '../service-init/models/main/weather';
import { logger } from '../shared/configs/logger.config';
import { WeatherCreationAttributes } from '../service-init/models/main/weather';
import { Sequelize } from 'sequelize-typescript';

/**
 * CSV 파일을 여러 경로에서 찾는 함수
 */
function findCsvFile(filename: string): string {
  // 가능한 경로들을 순서대로 확인
  const possiblePaths = [
    join(path, 'dist', filename),
    join(path, filename),         // root 디렉토리
    join(path, 'src', filename),  // src 디렉토리
    join('/', 'app', 'dist', filename),  // 도커 컨테이너 내 dist 디렉토리
    join('/', 'app', filename),   // 도커 컨테이너 내 root 디렉토리
  ];

  for (const filepath of possiblePaths) {
    if (fs.existsSync(filepath)) {
      logger.info(`CSV 파일을 찾았습니다: ${filepath}`);
      return filepath;
    }
  }
  
  // 파일을 찾지 못한 경우 빈 문자열 반환
  logger.warn(`CSV 파일을 찾지 못했습니다.`);
  throw new Error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
}

/**
 * CSV 파일에서 1번 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 스크립트
 */
async function importWeatherDataFromCsv(csvFilePath: string, batchSize = 100): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 Starting CSV import from: ${csvFilePath}`);

  // CSV 파일 읽기
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');

  // CSV 파싱
  const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // 자동으로 숫자 타입 변환
    transformHeader: (header: string) => header.trim(), // 헤더 공백 제거
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    logger.error('CSV 파싱 중 오류 발생:', parseResult.errors);
    throw new Error('CSV parsing failed');
  }

  const csvData = parseResult.data as any[];
  logger.info(`📊 Total rows in CSV: ${csvData.length}`);

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
        // CSV의 time 문자열이 유효한 날짜 형식인지 확인
        const timeDate = new Date(timeStr);

        if (isNaN(timeDate.getTime())) {
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
        await Weather.bulkCreate(weatherBatch);
        successCount += weatherBatch.length;
      }

      processedRows += batch.length;
      logger.info(`✅ Processed batch ${batchIndex + 1}/${totalBatches} (${processedRows}/${csvData.length} rows)`);
    } catch (error) {
      logger.error(`Error saving batch ${batchIndex + 1}/${totalBatches}:`, error);
      errorCount += batch.length;
    }
  }

  logger.info(`🏁 CSV import completed. Success: ${successCount}, Errors: ${errorCount}`);
}

async function main() {
  try {
    // 환경 변수 로드
    configDotenv();

    // CSV 파일 경로 찾기
    const csvFilename = 'IPB_250104_250305.csv';
    const csvFilePath = findCsvFile(csvFilename);

    // 데이터베이스 연결
    logger.info('🔌 Connecting to database...');
    const seq = await connectPostgres();

    // CSV 파일 가져오기
    await importWeatherDataFromCsv(csvFilePath);

    // 데이터베이스 연결 종료
    await (seq as Sequelize).close();
    logger.info('🔌 Database connection closed');
  } catch (error) {
    logger.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main()
  .then(() => {
    logger.info('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Unhandled error:', error);
    process.exit(1);
  });