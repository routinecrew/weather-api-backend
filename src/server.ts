import { logger } from './shared/configs/logger.config';
import { Weather } from './service-init/models/main/weather.model';

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
    await connectPostgres();
    logger.info('✅ 데이터베이스 연결 성공!');
    
    // 데이터베이스 상태 확인 및 필요 시 CSV 가져오기
    const existingDataCount = await Weather.count();
    logger.info(`📊 DB에 ${existingDataCount}개의 날씨 데이터가 있습니다.`);
    
    if (existingDataCount === 0 && process.env.AUTO_IMPORT_CSV === 'true') {
      logger.info('💾 날씨 데이터가 없습니다. CSV 데이터 가져오기를 실행합니다...');
      try {
        const { runImport } = await import('./scripts/importWeatherCsv');
        await runImport();
        logger.info('✅ CSV 데이터 가져오기 완료');
      } catch (err) {
        logger.error('❌ CSV 가져오기 실패:', err);
      }
    }

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