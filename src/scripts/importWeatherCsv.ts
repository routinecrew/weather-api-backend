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
 * 날짜 문자열을 파싱하는 강화된 함수
 */
function parseDate(dateStr: string): Date | null {
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
 * CSV 파일에서 1번 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 스크립트
 */
async function importWeatherDataFromCsv(csvFilePath: string, batchSize = 100): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 Starting CSV import from: ${csvFilePath}`);

  const fileContent = fs.readFileSync(csvFilePath, 'utf8');

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
  logger.info(`📊 Total rows in CSV: ${csvData.length}`);

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
    configDotenv();

    const csvFilename = 'IPB_250104_250305.csv';
    const csvFilePath = findCsvFile(csvFilename);

    logger.info('🔌 Connecting to database...');
    const seq = await connectPostgres();

    await importWeatherDataFromCsv(csvFilePath);

    await (seq as Sequelize).close();
    logger.info('🔌 Database connection closed');
  } catch (error) {
    logger.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    logger.info('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Unhandled error:', error);
    process.exit(1);
  });