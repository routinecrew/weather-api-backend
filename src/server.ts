import { logger } from './shared/configs/logger.config';
import { Weather } from './service-init/models/main/weather';

import { configDotenv } from './shared/configs/dotenv.config';
import { connectPostgres } from './shared/configs/postgres.config';
import { Sequelize } from 'sequelize-typescript';
import fs from 'fs';

// Docker 환경 표시 설정
process.env.DOCKER_ENV = fs.existsSync('/.dockerenv') ? 'true' : 'false';

// 스크립트 함수 가져오기
import { findCsvFile, importWeatherDataFromCsv } from './scripts/csvImportHelpers';

// ===== Memory Usage Utility =====
const showMemoryUsage = () => {
  type Unit = keyof typeof convertBytesTo;

  const convertBytesTo = {
    KB: (bytes: number) => bytes / 1024,
    MB: (bytes: number) => convertBytesTo.KB(bytes) / 1024,
    GB: (bytes: number) => convertBytesTo.MB(bytes) / 1024,
    TB: (bytes: number) => convertBytesTo.GB(bytes) / 1024,
    PB: (bytes: number) => convertBytesTo.TB(bytes) / 1024,
    EB: (bytes: number) => convertBytesTo.PB(bytes) / 1024,
    ZB: (bytes: number) => convertBytesTo.EB(bytes) / 1024,
    YB: (bytes: number) => convertBytesTo.ZB(bytes) / 1024,
  };
  const toHuman = (bytes: number, unit: Unit) => `${convertBytesTo[unit](bytes).toFixed(2)}${unit}`;
  const memory = process.memoryUsage();
  const usedHeap = toHuman(memory.heapUsed, 'MB');
  const totalHeap = toHuman(memory.heapTotal, 'MB');
  const rss = toHuman(memory.rss, 'MB');

  return `Used ${usedHeap} of ${totalHeap} - RSS: ${rss}`;
};

// ===== 샘플 데이터 생성 함수 =====
async function createSampleWeatherData() {
  logger.info('🔄 CSV 파일을 찾을 수 없어 샘플 데이터를 생성합니다...');
  
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 24시간 분량의 샘플 데이터 생성 (1시간 간격)
  const weatherBatch = [];
  
  // 포인트 1의 샘플 데이터 (24개)
  for (let i = 0; i < 24; i++) {
    const time = new Date(yesterday);
    time.setHours(i);
    
    // 현실적인 값의 범위에서 약간의 랜덤성 추가
    const baseTemp = 22 + Math.sin(i * Math.PI / 12) * 5; // 온도는 하루 주기로 변화
    
    weatherBatch.push({
      time,
      point: 1,
      airTemperature: baseTemp + (Math.random() * 2 - 1), // 기본 온도 ±1도
      airHumidity: 60 + Math.random() * 20, // 습도 60~80%
      airPressure: 1013 + Math.random() * 5, // 기압 1013~1018 hPa
      soilTemperature: baseTemp - 3 + Math.random(), // 지온은 기온보다 약간 낮음
      soilHumidity: 40 + Math.random() * 15, // 지습 40~55%
      soilEC: 0.8 + Math.random() * 0.8, // 전도도 0.8~1.6
      pyranometer: i >= 6 && i <= 18 ? 300 + Math.random() * 600 : Math.random() * 50, // 일조량 (낮에만 높음)
      pasteTypeTemperature: baseTemp - 1 + Math.random() * 2, // 페이스트 온도
    });
  }
  
  // 포인트 2, 3, 4의 샘플 데이터 (각 포인트별 12개씩)
  for (let point = 2; point <= 4; point++) {
    for (let i = 0; i < 12; i++) {
      const time = new Date(yesterday);
      time.setHours(i * 2); // 2시간 간격
      
      const baseTemp = 20 + point + Math.sin(i * Math.PI / 6) * 4; // 포인트에 따라 약간 다른 온도
      
      weatherBatch.push({
        time,
        point,
        airTemperature: baseTemp + (Math.random() * 2 - 1),
        airHumidity: 55 + Math.random() * 30,
        airPressure: 1010 + point + Math.random() * 5,
        soilTemperature: baseTemp - 2 + Math.random(),
        soilHumidity: 35 + point + Math.random() * 15,
        soilEC: 0.6 + (point / 10) + Math.random() * 0.8,
        pyranometer: i >= 3 && i <= 9 ? 250 + (point * 30) + Math.random() * 500 : Math.random() * 70
      });
    }
  }
  
  // 포인트 5의 샘플 데이터 (6개)
  for (let i = 0; i < 6; i++) {
    const time = new Date(yesterday);
    time.setHours(i * 4); // 4시간 간격
    
    const baseTemp = 21 + Math.sin(i * Math.PI / 3) * 4;
    
    weatherBatch.push({
      time,
      point: 5,
      airTemperature: baseTemp + (Math.random() * 2 - 1),
      airHumidity: 55 + Math.random() * 25,
      airPressure: 1012 + Math.random() * 6,
      soilTemperature: baseTemp - 2 + Math.random(),
      soilHumidity: 38 + Math.random() * 18,
      soilEC: 0.7 + Math.random() * 0.9,
      pyranometer: i >= 2 && i <= 4 ? 280 + Math.random() * 550 : Math.random() * 60,
      // 포인트 5에만 있는 데이터
      windSpeed: 1 + Math.random() * 4, // 풍속 1~5 m/s
      windDirection: Math.floor(Math.random() * 360), // 풍향 0~359도
      solarRadiation: i >= 2 && i <= 4 ? 400 + Math.random() * 300 : Math.random() * 50, // 일사량
      rainfall: Math.random() < 0.3 ? Math.random() * 2 : 0, // 30% 확률로 비 (0~2mm)
      co2: 400 + Math.random() * 50, // 이산화탄소 농도 400~450ppm
    });
  }
  
  try {
    // 배치로 저장
    logger.info(`샘플 데이터 ${weatherBatch.length}개 저장 시도...`);
    await Weather.bulkCreate(weatherBatch);
    logger.info(`✅ ${weatherBatch.length}개의 샘플 날씨 데이터가 생성되었습니다.`);
    return weatherBatch.length;
  } catch (error) {
    logger.error('❌ 샘플 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== CSV 데이터 로드 함수 =====
async function loadWeatherData(): Promise<boolean> {
  try {
    // 데이터가 이미 있는지 확인
    const existingDataCount = await Weather.count();
    logger.info(`📊 DB에 ${existingDataCount}개의 날씨 데이터가 있습니다.`);

    // 각 포인트별 데이터 개수 확인 및 로깅
    if (existingDataCount > 0) {
      const stats = await Promise.all([1, 2, 3, 4, 5].map(async (point) => {
        const count = await Weather.count({ where: { point } });
        return { point, count };
      }));
      
      stats.forEach(({ point, count }) => {
        logger.info(`📊 포인트 ${point}의 데이터 개수: ${count}`);
      });
    }

    // 데이터가 없으면 CSV 파일에서 가져오기
    if (existingDataCount === 0) {
      logger.info('💾 날씨 데이터가 없습니다. 데이터를 로드합니다...');
      
      // 먼저 Docker 환경의 고정 경로 시도
      if (process.env.DOCKER_ENV === 'true') {
        const dockerPath = '/app/dist/IPB_250104_250305.csv';
        if (fs.existsSync(dockerPath)) {
          logger.info(`Docker 컨테이너 내 CSV 파일 발견: ${dockerPath}`);
          await importWeatherDataFromCsv(dockerPath);
          logger.info('✅ Docker 환경에서 CSV 데이터 가져오기가 완료되었습니다.');
          
          // CSV 가져오기 후 포인트별 데이터 개수 출력
          const stats = await Promise.all([1, 2, 3, 4, 5].map(async (point) => {
            const count = await Weather.count({ where: { point } });
            return { point, count };
          }));
          
          stats.forEach(({ point, count }) => {
            logger.info(`📊 CSV 가져오기 후 포인트 ${point}의 데이터 개수: ${count}`);
          });
          
          return true;
        }
      }
      
      // 그 다음 findCsvFile 함수로 파일 찾기 시도
      try {
        const csvFilename = 'IPB_250104_250305.csv';
        const csvFilePath = findCsvFile(csvFilename);
        await importWeatherDataFromCsv(csvFilePath);
        logger.info('✅ CSV 데이터 가져오기가 완료되었습니다.');
        
        // CSV 가져오기 후 포인트별 데이터 개수 출력
        const stats = await Promise.all([1, 2, 3, 4, 5].map(async (point) => {
          const count = await Weather.count({ where: { point } });
          return { point, count };
        }));
        
        stats.forEach(({ point, count }) => {
          logger.info(`📊 CSV 가져오기 후 포인트 ${point}의 데이터 개수: ${count}`);
        });
        
        return true;
      } catch (error: any) { // 'any' 타입으로 명시적 지정
        // CSV 파일을 찾지 못한 경우
        logger.warn(`⚠️ CSV 파일을 찾지 못했습니다: ${error.message}`);
        
        // 샘플 데이터 생성
        await createSampleWeatherData();
        
        // 샘플 데이터 생성 후 포인트별 데이터 개수 출력
        const stats = await Promise.all([1, 2, 3, 4, 5].map(async (point) => {
          const count = await Weather.count({ where: { point } });
          return { point, count };
        }));
        
        stats.forEach(({ point, count }) => {
          logger.info(`📊 샘플 데이터 생성 후 포인트 ${point}의 데이터 개수: ${count}`);
        });
        
        return true;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('❌ 데이터 로드 중 오류 발생:', error);
    return false;
  }
}

// ===== Application Bootstrap =====
const bootstrap = async () => {
  // 환경 변수 로드
  configDotenv();
  
  logger.info(`🌍 실행 환경: ${process.env.NODE_ENV}`);
  logger.info(`🐳 Docker 환경: ${process.env.DOCKER_ENV}`);
  
  try {
    // Express 앱 가져오기
    const app = (await import('./shared/configs/express.config')).default;
    const port = Number(process.env.PORT || 9092);

    // 데이터베이스 연결
    logger.info('🔌 데이터베이스에 연결 중...');
    const seq = await connectPostgres();
    logger.info('✅ 데이터베이스 연결 성공!');
    
    // 데이터 로드 (CSV 또는 샘플 데이터)
    await loadWeatherData();

    // 서버 시작
    const server = app.listen(port, () => {
      logger.info(`🚀 서버가 실행되었습니다: http://localhost:${port}`);
      logger.info(`🚀 서버 메모리 사용량: ${showMemoryUsage()}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
      logger.info(`👻 서버를 종료합니다... 신호: ${signal}`);
      await (seq as Sequelize).close();
      logger.info('데이터베이스 연결 종료');
      server.close(() => {
        logger.info('HTTP 서버 종료');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
    process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));
  } catch (error) {
    logger.error('❌ 서버 부팅 중 오류 발생:', error);
    process.exit(1);
  }
};

// 애플리케이션 시작
bootstrap();