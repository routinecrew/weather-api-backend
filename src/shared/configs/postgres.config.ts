import { Sequelize } from 'sequelize-typescript';
import { mqlogger } from './logger.config';
import { generateMainModels } from '../../service-init/models/main';
import { getEnvVariable, getEnvNumber } from '../utils/env';

let seq: Sequelize;

export const connectPostgres = async (): Promise<Sequelize> => {
  try {
    mqlogger.info('🔌 Connecting to Postgres...');

    // 환경 변수 로깅 추가 (디버깅 용도)
    mqlogger.info(`POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
    mqlogger.info(`POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
    mqlogger.info(`POSTGRES_USER: ${process.env.POSTGRES_USER}`);
    mqlogger.info(`POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE}`);

    seq = new Sequelize({
      host: getEnvVariable(process.env, 'POSTGRES_HOST', 'localhost'),
      port: getEnvNumber(process.env, 'POSTGRES_PORT', 5432),
      username: getEnvVariable(process.env, 'POSTGRES_USER', 'postgres'),
      password: getEnvVariable(process.env, 'POSTGRES_PASSWORD', 'postgres123'), // 기본값 추가
      database: getEnvVariable(process.env, 'POSTGRES_DATABASE', 'weather_db'), // 기본값 추가
      dialect: 'postgres',
      timezone: getEnvVariable(process.env, 'TZ', 'UTC'),
      logging: (msg) => mqlogger.debug(msg),
      define: {
        charset: 'utf8mb4_unicode_ci',
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        underscored: true,
      },
      pool: {
        max: getEnvNumber(process.env, 'DB_POOL_MAX', 3),
        min: getEnvNumber(process.env, 'DB_POOL_MIN', 0),
        acquire: getEnvNumber(process.env, 'DB_POOL_ACQUIRE', 30000),
        idle: getEnvNumber(process.env, 'DB_POOL_IDLE', 10000),
      },
      // 추가 연결 옵션
      retry: {
        max: 3, // 최대 재시도 횟수
      },
      dialectOptions: {
        // PostgreSQL 연결 옵션
        connectTimeout: 30000, // 연결 타임아웃 30초
      },
    });

    // 비밀번호 로그는 보안상 마스킹 처리
    mqlogger.info('🔌 Before Authenticating to Postgres...[masked]');

    await seq.authenticate();

    mqlogger.info('🔌 After Authenticating ...');

    await generateMainModels(seq);

    mqlogger.info('✨ Connected to Postgres');

    return seq;
  } catch (err) {
    mqlogger.error('❌ PostgreSQL 연결 오류:');
    mqlogger.error(err);
    
    // 10초 후 재시도 (선택 사항)
    mqlogger.info('🔄 10초 후 다시 시도합니다...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    return connectPostgres(); // 재귀적으로 다시 시도
    
    // 또는 그냥 오류를 던지고 싶다면:
    // throw err;
  }
};

export const getSequelizeInstance = (): Sequelize => {
  if (!seq) {
    throw new Error('Sequelize instance not initialized. Call connectPostgres first.');
  }
  return seq;
};