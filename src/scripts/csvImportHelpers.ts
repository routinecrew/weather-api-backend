import { join } from 'path';
import { path } from 'app-root-path';
import fs from 'fs';
import Papa from 'papaparse';
import { Op } from 'sequelize';
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
 * CSV 파일에서 센서 그룹 데이터를 읽어서 데이터베이스에 저장하는 함수
 */
export async function importWeatherDataFromCsv(csvFilePath: string, batchSize = 100): Promise<void> {
  const csvFileExists = fs.existsSync(csvFilePath);
  if (!csvFileExists) {
    throw new Error(`CSV 파일이 존재하지 않습니다: ${csvFilePath}`);
  }

  logger.info(`🔄 CSV 가져오기 시작: ${csvFilePath}`);

  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    logger.info(`CSV 파일 크기: ${fileContent.length} 바이트`);
    logger.info(`CSV 파일 처음 100자: ${fileContent.substring(0, 100)}`);

    // 기존의 데이터 수 확인
    const existingCount = await Weather.count();
    logger.info(`현재 DB에 ${existingCount}개의 날씨 데이터가 있습니다.`);

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

    // 데이터 중복 방지를 위한 Set 생성
    const processedTimePointPairs = new Set<string>();

    // 기존 데이터 확인 (첫 번째 및 마지막 데이터 시간 범위)
    if (csvData.length > 0 && csvData[0].datetime && csvData[csvData.length - 1].datetime) {
      try {
        const firstDate = parseDate(csvData[0].datetime);
        const lastDate = parseDate(csvData[csvData.length - 1].datetime);
        
        if (firstDate && lastDate) {
          logger.info(`CSV 데이터 날짜 범위: ${firstDate.toISOString()} ~ ${lastDate.toISOString()}`);
          
          // 이미 DB에 있는 날짜-포인트 조합 조회
          const existingData = await Weather.findAll({
            where: {
              time: {
                [Op.between]: [firstDate, lastDate]
              }
            },
            attributes: ['time', 'point']
          });
          
          logger.info(`날짜 범위 내 기존 DB 데이터: ${existingData.length}개`);
          
          // 중복 확인용 Set에 추가
          existingData.forEach(record => {
            processedTimePointPairs.add(`${record.time.toISOString()}_${record.point}`);
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
          const timeStr = row.datetime || row.time; // datetime 또는 time 필드 확인
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

            // 중복 체크
            const timePointKey = `${timeDate.toISOString()}_${point}`;
            if (processedTimePointPairs.has(timePointKey)) {
              skippedCount++;
              continue; // 이미 처리된 시간-포인트 조합은 건너뜀
            }
            
            // 중복 방지를 위해 Set에 추가
            processedTimePointPairs.add(timePointKey);

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
              // CSV 컬럼명 매칭을 다양하게 시도
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
            // 동일한 time과 point 조합이 있으면 무시
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

    // 데이터 처리 결과 요약
    const afterCount = await Weather.count();
    logger.info(`🏁 CSV 가져오기 완료.`);
    logger.info(`총 처리: ${processedRows}행, 성공: ${successCount}, 오류: ${errorCount}, 중복 건너뜀: ${skippedCount}`);
    logger.info(`DB 데이터 수: ${existingCount} → ${afterCount} (${afterCount - existingCount} 증가)`);
  } catch (error) {
    logger.error(`CSV 파일 처리 중 예외 발생: ${error}`);
    throw error;
  }
}