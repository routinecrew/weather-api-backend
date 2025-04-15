import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { configDotenv } from '../shared/configs/dotenv.config';
import { connectPostgres, closePostgresConnection } from '../shared/configs/postgres.config';
import { Weather } from '../service-init/models/main/weather';
import { logger } from '../shared/configs/logger.config';
import { WeatherCreationAttributes } from '../service-init/models/main/weather';

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
/**
 * 날짜 문자열을 파싱하는 강화된 함수
 */
export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) {
    logger.warn(`날짜 문자열이 제공되지 않았습니다: ${dateStr}`);
    return null;
  }

  try {
    // 모든 공백 문자를 표준화
    let cleanDateStr = dateStr.replace(/[\s\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]+/g, ' ').trim();
    
    // "2025-01-0411:08:42" 형식 처리 - 날짜와 시간 사이에 공백 추가
    cleanDateStr = cleanDateStr.replace(/(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}:\d{2})/, '$1 $2');
    
    // 표준 Date 객체로 파싱 시도
    const date = new Date(cleanDateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // 대안 포맷 처리 - "YYYY-MM-DD HH:MM:SS" 형식
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

    logger.warn(`지원되지 않는 날짜 형식: ${dateStr}`);
    return null;
  } catch (error) {
    logger.error(`날짜 파싱 중 오류 발생: ${dateStr}`, error);
    return null;
  }
}


/**
 * CSV 파일 내용을 스트림으로 읽고 작은 배치로 처리하는 함수
 */
async function importWeatherDataFromCsvInChunks(csvFilePath: string, batchSize = 50, maxRows = Infinity): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 CSV 가져오기 시작: ${csvFilePath} (배치 크기: ${batchSize}, 최대 행 수: ${maxRows === Infinity ? '무제한' : maxRows})`);

  // 파일 크기 확인
  const fileStats = fs.statSync(csvFilePath);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  logger.info(`CSV 파일 크기: ${fileSizeMB.toFixed(2)} MB`);

  // 파일이 너무 크면 처리 방법 안내
  if (fileSizeMB > 100) {
    logger.warn(`CSV 파일이 매우 큽니다. 처리에 시간이 오래 걸릴 수 있습니다.`);
  }

  try {
    // 헤더 먼저 읽기
    const headerSample = fs.readFileSync(csvFilePath, { encoding: 'utf8', flag: 'r' }).split('\n').slice(0, 1).join('\n');
    const headerResult = Papa.parse(headerSample, { header: true });
    logger.info(`CSV 헤더: ${JSON.stringify(headerResult.meta.fields)}`);

    // 파일 스트림 읽기 준비
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // CSV 파싱 - 전체 파일을 한 번에 파싱하지만 처리는 배치로 진행
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
    logger.info(`📊 CSV 파싱 완료. 총 ${csvData.length}행`);
    
    // 처리할 행 수 결정
    const rowsToProcess = Math.min(csvData.length, maxRows);
    logger.info(`처리할 행 수: ${rowsToProcess}`);
    
    // 배치 처리를 위한 변수
    const totalBatches = Math.ceil(rowsToProcess / batchSize);
    let processedRows = 0;
    let successCount = 0;
    let errorCount = 0;
    let startTime = Date.now();

    // 메모리 사용량 로깅
    const logMemoryUsage = () => {
      const memUsage = process.memoryUsage();
      logger.info(`메모리 사용량: RSS ${Math.round(memUsage.rss / 1024 / 1024)}MB, 힙 ${Math.round(memUsage.heapUsed / 1024 / 1024)}/${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    };

    // 초기 메모리 사용량 로깅
    logMemoryUsage();

    // 배치 단위로 처리
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // 메모리 해제를 위한 가비지 컬렉션 유도 (가끔)
      if (batchIndex % 10 === 0 && batchIndex > 0) {
        global.gc && global.gc();
        logMemoryUsage();
      }

      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, rowsToProcess);
      const batch = csvData.slice(start, end);

      const weatherBatch: WeatherCreationAttributes[] = [];

      for (const row of batch) {
        try {
          const timeStr = row.datetime || row.time; // 두 가지 필드명 모두 시도
          const timeDate = parseDate(timeStr);
          
          if (!timeDate) {
            logger.warn(`날짜 형식 오류: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          // 각 포인트(1~5)별로 데이터 추출 및 저장
          for (let point = 1; point <= 5; point++) {
            // 해당 포인트의 필수 데이터가 모두 있는지 확인
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

            // 유효한 데이터만 배치에 추가
            const isValid = Object.values(weatherData).every(value => 
              value !== undefined && value !== null && !Number.isNaN(value)
            );

            if (isValid) {
              weatherBatch.push(weatherData);
            } else {
              logger.warn(`포인트 ${point}의 유효하지 않은 데이터: ${JSON.stringify(row)}`);
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
        
        // 진행 상황 및 예상 시간 계산
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const rowsPerSecond = processedRows / elapsedSeconds;
        const remainingRows = rowsToProcess - processedRows;
        const remainingTimeSeconds = remainingRows / rowsPerSecond;
        
        logger.info(`✅ 배치 처리 완료 ${batchIndex + 1}/${totalBatches} (${processedRows}/${rowsToProcess} 행)`);
        logger.info(`⏱️ 진행률: ${Math.round((processedRows / rowsToProcess) * 100)}%, 예상 남은 시간: ${Math.round(remainingTimeSeconds / 60)}분 ${Math.round(remainingTimeSeconds % 60)}초`);
        
        // 잠시 휴식 (DB 부하 감소 및 메모리 회수 기회 제공)
        if (batchIndex % 5 === 0 && batchIndex > 0) {
          logger.info('💤 DB 서버 부하 감소를 위해 1초 대기 중...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`배치 ${batchIndex + 1}/${totalBatches} 저장 중 오류:`, error);
        errorCount += batch.length;
        
        // 오류 발생 시 잠시 대기하고 계속 진행
        logger.info('⚠️ 오류 후 3초 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // 최종 메모리 사용량 로깅
    logMemoryUsage();

    const totalTime = (Date.now() - startTime) / 1000;
    logger.info(`🏁 CSV 가져오기 완료. 성공: ${successCount}, 오류: ${errorCount}, 소요 시간: ${Math.floor(totalTime / 60)}분 ${Math.round(totalTime % 60)}초`);
  } catch (error) {
    logger.error(`CSV 파일 처리 중 예외 발생:`, error);
    throw error;
  }
}
async function main() {
  try {
    // 환경 변수 로드
    configDotenv();

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    const batchSizeArg = args.find(arg => arg.startsWith('--batchSize='));
    const maxRowsArg = args.find(arg => arg.startsWith('--maxRows='));
    const filenameArg = args.find(arg => arg.startsWith('--filename='));
    
    const batchSize = batchSizeArg 
      ? parseInt(batchSizeArg.split('=')[1] as string, 10) 
      : 50;
    
    const maxRows = maxRowsArg 
      ? parseInt(maxRowsArg.split('=')[1] as string, 10) 
      : Infinity;
    
    // filenameArg가 undefined일 수 있으므로 타입 가드 적용
    const filenameFromArg = filenameArg?.split('=')[1];
    const filename: string = filenameFromArg ?? 'IPB_250104_250305.csv'; // 기본값으로 undefined 방지

    // 타입 가드: filename이 string인지 확인 (불필요할 수 있지만 명확성을 위해 추가)
    if (typeof filename !== 'string' || !filename) {
      throw new Error('파일 이름이 유효한 문자열이 아닙니다.');
    }

    // 명령행 인수 정보 표시
    logger.info(`스크립트 설정: 배치 크기=${batchSize}, 최대 행 수=${maxRows === Infinity ? '무제한' : maxRows}, 파일명=${filename}`);

    // CSV 파일 경로 찾기
    const csvFilePath = findCsvFile(filename); // filename은 이제 string 타입임

    // 타입 가드: csvFilePath가 string인지 확인
    if (typeof csvFilePath !== 'string' || !csvFilePath) {
      throw new Error('CSV 파일 경로가 유효한 문자열이 아닙니다.');
    }

    // 데이터베이스 연결
    logger.info('🔌 데이터베이스 연결 중...');
    await connectPostgres();
    logger.info('✅ 데이터베이스 연결 성공');

    // 기존 데이터 확인
    const existingCount = await Weather.count();
    logger.info(`현재 DB에 ${existingCount}개의 날씨 데이터가 있습니다.`);

    // CSV 데이터 가져오기
    await importWeatherDataFromCsvInChunks(csvFilePath, batchSize, maxRows); // csvFilePath는 string 타입임

    // 가져오기 후 결과 확인
    const newCount = await Weather.count();
    logger.info(`CSV 가져오기 완료. 이전: ${existingCount}개, 현재: ${newCount}개, 추가됨: ${newCount - existingCount}개`);

    // 데이터베이스 연결 종료
    await closePostgresConnection();
    logger.info('🔌 데이터베이스 연결 종료됨');
  } catch (error) {
    logger.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  } finally {
    // 메모리 정리
    try {
      global.gc && global.gc();
    } catch (e) {
      // gc를 사용할 수 없는 경우 무시
    }
  }
}

// --expose-gc 옵션을 사용하여 스크립트 실행 권장 메시지
if (!global.gc) {
  logger.warn('⚠️ 최적의 메모리 관리를 위해 다음 명령으로 스크립트를 실행하는 것이 좋습니다:');
  logger.warn('node --expose-gc -r ts-node/register src/scripts/importWeatherCsv.ts');
}

// 스크립트 실행
main()
  .then(() => {
    logger.info('✨ 스크립트가 성공적으로 완료되었습니다');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ 처리되지 않은 오류:', error);
    process.exit(1);
  });