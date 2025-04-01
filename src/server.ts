import { logger } from './shared/configs/logger.config';
import { Weather } from './service-init/models/main/weather';

import { configDotenv } from './shared/configs/dotenv.config';
import { connectPostgres } from './shared/configs/postgres.config';
import { Sequelize } from 'sequelize-typescript';

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
  
  // 5번 센서 데이터 추가 (몇 개만 샘플로)
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
    await Weather.bulkCreate(weatherBatch);
    logger.info(`✅ ${weatherBatch.length}개의 샘플 날씨 데이터가 생성되었습니다.`);
    return weatherBatch.length;
  } catch (error) {
    logger.error('❌ 샘플 데이터 생성 실패:', error);
    throw error;
  }
}

// ===== Application Bootstrap =====
const bootstrap = async () => {
  const app = (await import('./shared/configs/express.config')).default;
  const port = Number(process.env.PORT || 9092);

  const seq = await connectPostgres();

  // 데이터 확인
  try {
    // 데이터가 이미 있는지 확인
    const existingDataCount = await Weather.count();
    logger.info(`📊 DB에 ${existingDataCount}개의 날씨 데이터가 있습니다.`);

    // 데이터가 없으면 CSV 파일에서 가져오기
    if (existingDataCount === 0) {
      logger.info('💾 날씨 데이터가 없습니다. CSV 파일에서 데이터를 가져옵니다...');
      
      try {
        // CSV 파일 가져오기 시도
        const csvFilename = 'IPB_250104_250305.csv';
        
        try {
          // CSV 파일 경로 찾기
          const csvFilePath = findCsvFile(csvFilename);
          
          // CSV 파일 가져오기
          await importWeatherDataFromCsv(csvFilePath);
          logger.info('✅ CSV 데이터 가져오기가 완료되었습니다.');
        } catch (fileError) {
          // CSV 파일을 찾을 수 없는 경우
          logger.warn('⚠️ CSV 파일을 찾을 수 없습니다. 샘플 데이터를 생성합니다.');
          await createSampleWeatherData();
        }
      } catch (dataError) {
        logger.error('❌ 데이터 가져오기 실패:', dataError);
      }
    }
  } catch (error) {
    logger.error('❌ 데이터 확인 실패:', error);
  }

  // 서버 시작
  const server = app.listen(port, () => {
    logger.info(`🚀 Server is running at http://localhost:${port}`);
    logger.info(`🚀 Starting server... ${showMemoryUsage()}`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
    logger.info(`👻 Server is shutting down... ${signal}`);
    await (seq as Sequelize).close();
    logger.info('Database connection closed');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  };

  process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
  process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));
};

configDotenv();
bootstrap();