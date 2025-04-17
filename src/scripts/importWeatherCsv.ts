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
 * 날짜 문자열을 파싱하는 강화된 함수
 * 다양한 형식과 특수 공백 문자를 처리
 */
function parseDate(dateStr: string): Date | null {
  try {
    // 원본 날짜 문자열 로깅
    logger.debug(`파싱 시도할 원본 날짜 문자열: "${dateStr}"`);
    
    // 특수 공백 문자를 포함한 모든 종류의 공백 제거 및 표준 공백으로 변환
    const cleanDateStr = dateStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
    logger.debug(`정제된 날짜 문자열: "${cleanDateStr}"`);
    
    // CSV 파일명이 IPB_250104_250305.csv 형식이면 날짜가 YY/MM/DD 형식일 가능성이 높음
    // 날짜 형식 확인 (YYYY-MM-DD HH:MM:SS 또는 YY/MM/DD HH:MM:SS 등)
    let date: Date | null = null;
    
    // 형식 1: YYYY-MM-DD HH:MM:SS
    const isoRegex = /(\d{4})-(\d{2})-(\d{2})[^\d]+(\d{2}):(\d{2}):(\d{2})/;
    const isoMatch = isoRegex.exec(cleanDateStr);
    if (isoMatch) {
      const [, year, month, day, hour, minute, second] = isoMatch;
      const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      date = new Date(dateString);
      logger.debug(`ISO 형식으로 파싱: ${dateString} => ${date.toISOString()}`);
    }
    
    // 형식 2: YY/MM/DD HH:MM:SS (한국 날짜 형식 가능성)
    if (!date || isNaN(date.getTime())) {
      const korRegex = /(\d{2})\/(\d{2})\/(\d{2})[^\d]+(\d{2}):(\d{2}):(\d{2})/;
      const korMatch = korRegex.exec(cleanDateStr);
      if (korMatch) {
        const [, year, month, day, hour, minute, second] = korMatch;
        // YY 형식을 YYYY로 변환 (20xx년 or 19xx년 추정)
        const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        const dateString = `${fullYear}-${month}-${day}T${hour}:${minute}:${second}`;
        date = new Date(dateString);
        logger.debug(`한국 형식으로 파싱: ${dateString} => ${date?.toISOString()}`);
      }
    }
    
    // 형식 3: CSV 파일명에서 날짜 추출 시도 (IPB_250104_250305.csv 형식인 경우)
    if (!date || isNaN(date.getTime())) {
      // 원본 Date 생성자로 시도
      date = new Date(cleanDateStr);
      logger.debug(`기본 Date 생성자로 파싱: ${cleanDateStr} => ${date.toISOString()}`);
    }
    
    // 유효한 날짜인지 확인
    if (date && !isNaN(date.getTime())) {
      // 현재 시간과 크게 차이나는지 확인 (2020년 이전이거나 2030년 이후라면 의심)
      const currentDate = new Date();
      if (date.getFullYear() < 2020 || date.getFullYear() > 2030) {
        logger.warn(`의심스러운 연도: ${date.getFullYear()}, 원본 문자열: "${dateStr}"`);
      }
      
      return date;
    }
    
    logger.warn(`날짜 파싱 실패: "${dateStr}"`);
    return null;
  } catch (error) {
    logger.error(`날짜 파싱 중 오류 발생: "${dateStr}"`, error);
    return null;
  }
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

  // CSV 첫 몇 줄 확인 (디버깅 용도)
  const firstFewLines = fileContent.split('\n').slice(0, 5).join('\n');
  logger.debug(`CSV 파일 첫 몇 줄:\n${firstFewLines}`);

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
  logger.info(`📊 Total rows in CSV: ${csvData.length}`);
  
  // 헤더 확인
  const headers = Object.keys(csvData[0] || {});
  logger.debug(`CSV 헤더: ${headers.join(', ')}`);
  
  // 시간 열 이름 찾기 (time, datetime, date 등 다양할 수 있음)
  const timeColumnName = headers.find(h => 
    h.toLowerCase().includes('time') || 
    h.toLowerCase().includes('date') || 
    h === 'datetime'
  ) || 'time';
  
  logger.info(`시간 열 이름: ${timeColumnName}`);

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
        // 시간 필드가 존재하는지 확인하고 문자열로 변환
        const timeStr = row[timeColumnName] ? String(row[timeColumnName]) : '';
        if (!timeStr) {
          logger.warn(`시간 열(${timeColumnName})이 비어 있습니다: ${JSON.stringify(row)}`);
          errorCount++;
          continue;
        }
        
        // 강화된 날짜 파싱 함수 사용
        const timeDate = parseDate(timeStr);
        
        if (!timeDate) {
          logger.warn(`유효하지 않은 날짜 형식: ${JSON.stringify(row)}`);
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
          logger.warn(`필수 필드 누락: ${JSON.stringify(row)}`);
          errorCount++;
        }
      } catch (error) {
        logger.error(`행 처리 중 오류: ${JSON.stringify(row)}`, error);
        errorCount++;
      }
    }

    // 배치 저장
    try {
      if (weatherBatch.length > 0) {
        // 저장하기 전 첫 번째와 마지막 데이터의 시간 로깅
        if (weatherBatch.length > 0) {
          logger.debug(`배치 첫 번째 데이터 시간: ${weatherBatch[0]!.time.toISOString()}`);
          logger.debug(`배치 마지막 데이터 시간: ${weatherBatch[weatherBatch.length - 1]!.time.toISOString()}`);
        }
        
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

// 스크립트 실행 함수
async function runImport() {
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
    
    logger.info('✨ Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  runImport().catch((error) => {
    logger.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

// export 추가 - 다른 모듈에서 가져다 쓸 수 있도록
export { runImport, importWeatherDataFromCsv, parseDate, findCsvFile };