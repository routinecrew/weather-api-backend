import { logger } from './shared/configs/logger.config';
import { Weather } from './service-init/models/main/weather';

import { configDotenv } from './shared/configs/dotenv.config';
import { connectPostgres, closePostgresConnection } from './shared/configs/postgres.config';
import fs from 'fs';

// Docker 환경 표시 설정
process.env.DOCKER_ENV = fs.existsSync('/.dockerenv') ? 'true' : 'false';

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
async function createSampleWeatherData(count = 100): Promise<number> {
  logger.info(`🔄 샘플 데이터 ${count}개를 생성합니다...`);
  
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 24시간 분량의 샘플 데이터 생성 (count개)
  const weatherBatch = [];
  const hoursToGenerate = Math.min(count / 5, 24); // 최대 24시간, 각 시간당 5개 포인트
  
  // 각 시간마다 5개 포인트에 대한 데이터 생성
  for (let i = 0; i < hoursToGenerate; i++) {
    const time = new Date(yesterday);
    time.setHours(i);
    
    // 현실적인 값의 범위에서 약간의 랜덤성 추가
    const baseTemp = 22 + Math.sin(i * Math.PI / 12) * 5; // 온도는 하루 주기로 변화
    
    // 포인트 1~5 데이터 생성
    for (let point = 1; point <= 5; point++) {
      const weatherData: any = {
        time,
        point,
        airTemperature: baseTemp + (Math.random() * 2 - 1), // 기본 온도 ±1도
        airHumidity: 60 + Math.random() * 20, // 습도 60~80%
        airPressure: 1013 + Math.random() * 5, // 기압 1013~1018 hPa
        soilTemperature: baseTemp - 3 + Math.random(), // 지온은 기온보다 약간 낮음
        soilHumidity: 40 + Math.random() * 15, // 지습 40~55%
        soilEC: 0.8 + Math.random() * 0.8, // 전도도 0.8~1.6
        pyranometer: i >= 6 && i <= 18 ? 300 + Math.random() * 600 : Math.random() * 50, // 일조량 (낮에만 높음)
      };
      
      // 포인트 1에만 있는 데이터
      if (point === 1) {
        weatherData.pasteTypeTemperature = baseTemp - 1 + Math.random() * 2; // 페이스트 온도
      }
      
      // 포인트 5에만 있는 데이터
      if (point === 5) {
        weatherData.windSpeed = 1 + Math.random() * 4; // 풍속 1~5 m/s
        weatherData.windDirection = Math.floor(Math.random() * 360); // 풍향 0~359도
        weatherData.solarRadiation = i >= 6 && i <= 18 ? 400 + Math.random() * 300 : Math.random() * 50; // 일사량
        weatherData.rainfall = Math.random() < 0.3 ? Math.random() * 2 : 0; // 30% 확률로 비 (0~2mm)
        weatherData.co2 = 400 + Math.random() * 50; // 이산화탄소 농도 400~450ppm
      }
      
      weatherBatch.push(weatherData);
    }
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

// ===== 데이터 수 확인 함수 =====
async function checkWeatherData(): Promise<void> {
  try {
    // 데이터 개수 확인
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
      
      return;
    }
    
    // 데이터가 없으면 샘플 데이터 생성
    logger.info('💾 날씨 데이터가 없습니다. 샘플 데이터를 생성합니다...');
    await createSampleWeatherData(100); // 적은 수의 샘플 데이터만 생성
    
    logger.info('✅ 기본 데이터 확인 완료. 필요 시 CSV 가져오기 스크립트를 별도로 실행하세요.');
    logger.info('   명령어: npx ts-node src/scripts/importWeatherCsv.ts');
    
  } catch (error) {
    logger.error('❌ 데이터 확인 중 오류 발생:', error);
  }
}

// ===== Application Bootstrap =====
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
    await connectPostgres(); // seq 변수 제거
    logger.info('✅ 데이터베이스 연결 성공!');
    
    // 데이터 확인 (CSV 가져오기는 별도 스크립트로 분리)
    await checkWeatherData();

    // 서버 시작
    const server = app.listen(port, () => {
      logger.info(`🚀 서버가 실행되었습니다: http://localhost:${port}`);
      logger.info(`🚀 서버 메모리 사용량: ${showMemoryUsage()}`);
    });

    // 메모리 사용량 모니터링 (30초마다)
    const memoryMonitorInterval = setInterval(() => {
      const memoryUsage = showMemoryUsage();
      logger.debug(`🔍 메모리 사용량: ${memoryUsage}`);
    }, 30000);

    // Graceful Shutdown
    const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
      logger.info(`👻 서버를 종료합니다... 신호: ${signal}`);
      
      // 주기적인 메모리 모니터링 중지
      clearInterval(memoryMonitorInterval);
      
      // 데이터베이스 연결 종료
      await closePostgresConnection();
      
      // HTTP 서버 종료
      server.close(() => {
        logger.info('HTTP 서버 종료됨');
        process.exit(0);
      });
      
      // 10초 내에 정상 종료되지 않으면 강제 종료
      setTimeout(() => {
        logger.error('서버가 10초 내에 정상적으로 종료되지 않아 강제 종료합니다.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
    process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));
    
    // 예외 처리
    process.on('uncaughtException', (err) => {
      logger.error('처리되지 않은 예외 발생:', err);
      shutdown('SIGTERM');
    });
    
    process.on('unhandledRejection', (reason) => {
      logger.error('처리되지 않은 Promise 거부:', reason);
      shutdown('SIGTERM');
    });
    
  } catch (error) {
    logger.error('❌ 서버 부팅 중 오류 발생:', error);
    process.exit(1);
  }
};

// 애플리케이션 시작
bootstrap();