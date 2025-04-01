import { Sequelize } from 'sequelize-typescript';
import { mqlogger } from './logger.config';
import { generateMainModels } from '../../service-init/models/main';
import { getEnvVariable, getEnvNumber } from '../utils/env';

let seq: Sequelize;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export const connectPostgres = async (): Promise<Sequelize> => {
  try {
    mqlogger.info('🔌 Connecting to Postgres...');

    // 환경 변수 로깅 추가 (디버깅 용도)
    mqlogger.info(`POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
    mqlogger.info(`POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
    mqlogger.info(`POSTGRES_USER: ${process.env.POSTGRES_USER}`);
    mqlogger.info(`POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE}`);

    // 이미 연결된 인스턴스가 있다면 반환
    if (seq && seq.authenticate) {
      try {
        await seq.authenticate();
        mqlogger.info('✅ Reusing existing Postgres connection');
        return seq;
      } catch (err) {
        mqlogger.warn('기존 연결이 유효하지 않아 새 연결을 시도합니다.');
        // 연결이 끊겼으면 새로 연결 시도
      }
    }

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
      dialectOptions: {
        // PostgreSQL 연결 옵션
        connectTimeout: 30000, // 연결 타임아웃 30초
      },
      // 재시도 설정 개선
      retry: {
        max: 1, // Sequelize 내부 자동 재시도 횟수 (우리가 직접 관리할 것이므로 1로 설정)
      },
    });

    // 비밀번호 로그는 보안상 마스킹 처리
    mqlogger.info('🔌 데이터베이스 인증 중...');

    // 연결 시간 제한 설정 (30초)
    const connectTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('데이터베이스 연결 시간 초과 (30초)')), 30000);
    });

    // Promise.race로 연결 또는 타임아웃 중 먼저 발생하는 것 처리
    await Promise.race([
      seq.authenticate(),
      connectTimeoutPromise
    ]);

    mqlogger.info('🔌 데이터베이스 인증 성공!');

    // 모델 초기화
    await generateMainModels(seq);
    
    // 모델 동기화 전에 스키마 설정
    try {
      // PostgreSQL에서는 public 스키마가 기본적으로 존재하지만, 명시적으로 설정
      await seq.query('CREATE SCHEMA IF NOT EXISTS public');
      mqlogger.info('✓ 스키마 확인 완료');
    } catch (schemaErr) {
      mqlogger.warn('스키마 설정 경고 (이미 존재할 수 있음):', schemaErr);
    }
    
    // 모델 동기화 (테이블 생성)
    mqlogger.info('🔄 데이터베이스와 모델 동기화 중...');
    await seq.sync({ alter: true });
    mqlogger.info('💡 메인 모델 동기화 완료');

    // 연결 시도 카운터 초기화
    connectionAttempts = 0;
    mqlogger.info('✨ PostgreSQL 연결 완료');

    return seq;
  } catch (err) {
    mqlogger.error('❌ PostgreSQL 연결 오류:');
    mqlogger.error(err);
    
    // 연결 시도 횟수 증가 및 확인 (멤버 변수 사용)
    connectionAttempts++;
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const waitTime = 10000; // 10초 대기
      mqlogger.info(`🔄 ${waitTime/1000}초 후 다시 시도합니다... (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return connectPostgres(); // 재귀적으로 다시 시도
    } else {
      // 최대 재시도 횟수 초과
      mqlogger.error(`❌ 최대 재시도 횟수(${MAX_CONNECTION_ATTEMPTS}회)를 초과했습니다. 데이터베이스 연결을 중단합니다.`);
      // 카운터 초기화
      connectionAttempts = 0;
      throw new Error(`PostgreSQL 연결 실패: 최대 재시도 횟수(${MAX_CONNECTION_ATTEMPTS}회) 초과`);
    }
  }
};

export const getSequelizeInstance = (): Sequelize => {
  if (!seq) {
    throw new Error('Sequelize 인스턴스가 초기화되지 않았습니다. connectPostgres를 먼저 호출하세요.');
  }
  return seq;
};

// 데이터베이스 연결 종료 함수 추가
export const closePostgresConnection = async (): Promise<void> => {
  if (seq) {
    try {
      await seq.close();
      mqlogger.info('데이터베이스 연결이 정상적으로 종료되었습니다.');
    } catch (error) {
      mqlogger.error('데이터베이스 연결 종료 중 오류 발생:', error);
    } finally {
      seq = undefined as any;
      connectionAttempts = 0;
    }
  }
};