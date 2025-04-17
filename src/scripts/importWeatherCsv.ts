import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { Op } from 'sequelize';
import { configDotenv } from '../shared/configs/dotenv.config';
import { connectPostgres } from '../shared/configs/postgres.config';
import { Weather, WeatherCreationAttributes } from '../service-init/models/main/weather.model';
import { logger } from '../shared/configs/logger.config';
import { Sequelize } from 'sequelize-typescript';

/**
 * CSV 파일을 여러 경로에서 찾는 함수
 */
function findCsvFile(filename: string): string {
  const isDocker = process.env.DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
  logger.info(`실행 환경: ${isDocker ? 'Docker' : '호스트'}`);

  // 기본 경로 설정
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

  // 현재 디렉토리에서 CSV 파일 찾기
  try {
    const files = fs.readdirSync(process.cwd());
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      const filePath = join(process.cwd(), csvFiles[0]as string);
      logger.info(`CSV 파일을 찾았습니다: ${filePath}`);
      return filePath;
    }
  } catch (err) {
    logger.error(`디렉토리 검색 중 오류: ${err}`);
  }

  logger.error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
  throw new Error(`CSV 파일을 찾을 수 없습니다: ${filename}`);
}

/**
 * 날짜/시간 문자열을 파싱하여 날짜와 시간 부분으로 분리
 * @param timeStr 'YYYY-MM-DD HH:MM:SS' 형식의 날짜/시간 문자열
 * @returns 분리된 날짜와 시간 객체 또는 null
 */
function parseDateAndTime(timeStr: string | undefined | null): { date: string, time: string } | null {
  if (!timeStr) {
    return null;
  }

  try {
    // 한글 자모음 문자(ㅤ, 코드: 3164)를 일반 공백으로 변환
    const cleanTimeStr = timeStr.replace(/\u3164/g, ' ');
    
    // 간단한 정규식으로 날짜와 시간 추출
    const dateTimeRegex = /(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2}:\d{2})/;
    const match = dateTimeRegex.exec(cleanTimeStr);
    
    if (match) {
      return {
        date: match[1] as string,
        time: match[2] as string
      };
    }
    
    return null;
  } catch (error) {
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

    // 파싱 설정
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
      // 쉼표(,)를 기본 구분자로 설정
      delimiter: ",",
      quoteChar: '"',  // 따옴표 처리 명시
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

    // 중복 방지를 위한 기존 데이터 확인
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

    // 데이터 배치 처리
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

          // 각 포인트별 데이터 처리
          for (let point = 1; point <= 5; point++) {
            // 필수 필드 확인
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

            // 중복 체크
            const timePointKey = `${date}_${time}_${point}`;
            if (processedTimePointPairs.has(timePointKey)) {
              skippedCount++;
              continue;
            }
            
            processedTimePointPairs.add(timePointKey);

            // 날씨 데이터 객체 생성
            const weatherData: WeatherCreationAttributes = {
              date: date,
              time: time,
              point: point,
              airTemperature: row[`Air_Temperature${point}`],
              airHumidity: row[`Air_Humidity${point}`],
              airPressure: row[`Air_Pressure${point}`],
              soilTemperature: row[`Soil_Temperature${point}`],
              soilHumidity: row[`Soil_Humidity${point}`],
              soilEC: row[`Soil_EC${point}`],
              pyranometer: row[`Pyranometer${point}`],
            };

            // 포인트별 특수 필드
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
                weatherData[field as keyof WeatherCreationAttributes] !== null
            );

            if (isValid) {
              weatherBatch.push(weatherData);
            } else {
              logger.warn(`포인트 ${point}의 필수 필드 검증 실패`);
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

// 스크립트 실행 함수
async function runImport() {
  try {
    // 환경 변수 로드
    configDotenv();

    // CSV 파일 경로 찾기
    const csvFilename = 'IPB_250104_250305.csv';
    try {
      const csvFilePath = findCsvFile(csvFilename);
      logger.info(`CSV 파일을 찾았습니다: ${csvFilePath}`);

      // 데이터베이스 연결
      logger.info('🔌 데이터베이스 연결 중...');
      const seq = await connectPostgres();

      // CSV 파일 가져오기
      await importWeatherDataFromCsv(csvFilePath);

      // 데이터베이스 연결 종료
      await (seq as Sequelize).close();
      logger.info('🔌 데이터베이스 연결 종료');
      
      logger.info('✨ 스크립트 실행 완료');
      process.exit(0);
    } catch (fileError) {
      logger.error('CSV 파일을 찾을 수 없습니다:', fileError);
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  runImport().catch((error) => {
    logger.error('❌ 처리되지 않은 오류:', error);
    process.exit(1);
  });
}

// export 추가 - 다른 모듈에서 가져다 쓸 수 있도록
export { runImport, importWeatherDataFromCsv, parseDateAndTime, findCsvFile };