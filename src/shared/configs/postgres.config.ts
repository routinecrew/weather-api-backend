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
      password: getEnvVariable(process.env, 'POSTGRES_PASSWORD', 'postgres123'),
      database: getEnvVariable(process.env, 'POSTGRES_DATABASE', 'weather_db'),
      dialect: 'postgres',
      timezone: getEnvVariable(process.env, 'TZ', 'UTC'),
      logging: (msg) => mqlogger.debug(msg),
      // 스키마 설정
      schema: 'public',
      define: {
        charset: 'utf8mb4_unicode_ci',
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        underscored: true,
        schema: 'public', // 스키마 명시적 지정
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

    // 모델 초기화
    await generateMainModels(seq);
    
    // 모델 동기화 전에 스키마 설정
    try {
      // PostgreSQL에서는 public 스키마가 기본적으로 존재하지만, 명시적으로 설정
      await seq.query('CREATE SCHEMA IF NOT EXISTS public');
      mqlogger.info('✓ Schema check completed');
    } catch (schemaErr) {
      mqlogger.warn('Schema setup warning (may already exist):', schemaErr);
    }
    
    // 모델 동기화 (테이블 생성)
    mqlogger.info('🔄 Synchronizing models with database...');
    await seq.sync({ alter: true });
    mqlogger.info('💡 Synced main models');

    mqlogger.info('✨ Connected to Postgres');

    return seq;
  } catch (err) {
    mqlogger.error('❌ PostgreSQL 연결 오류:');
    mqlogger.error(err);
    
    // 최대 재시도 횟수 관리를 위한 간단한 방법
    const retryCount = Number(process.env.DB_RETRY_COUNT || '0');
    
    if (retryCount < 3) {
      // 재시도 횟수 증가
      process.env.DB_RETRY_COUNT = String(retryCount + 1);
      
      mqlogger.info(`🔄 ${10}초 후 다시 시도합니다... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      return connectPostgres(); // 재귀적으로 다시 시도
    } else {
      // 재시도 횟수 초과
      mqlogger.error('❌ 최대 재시도 횟수를 초과했습니다. 데이터베이스 연결을 중단합니다.');
      process.env.DB_RETRY_COUNT = '0'; // 재시도 카운터 초기화
      throw err;
    }
  }
};

export const getSequelizeInstance = (): Sequelize => {
  if (!seq) {
    throw new Error('Sequelize instance not initialized. Call connectPostgres first.');
  }
  return seq;
};