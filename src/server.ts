import { logger } from './shared/configs/logger.config';
import { Weather } from './service-init/models/main/weather';

import { configDotenv } from './shared/configs/dotenv.config';
import { connectPostgres } from './shared/configs/postgres.config';
import { Sequelize } from 'sequelize-typescript';

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
  const app = (await import('./shared/configs/express.config')).default;
  const port = Number(process.env.PORT || 3000);

  const seq = await connectPostgres();

  // 데이터 확인 (가져오기 로직은 제거)
  try {
    // 데이터가 이미 있는지 확인
    const existingDataCount = await Weather.count();
    logger.info(`📊 DB에 ${existingDataCount}개의 날씨 데이터가 있습니다.`);
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