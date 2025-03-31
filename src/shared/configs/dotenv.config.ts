import dotenv from 'dotenv';
import { path } from 'app-root-path';
import { join } from 'path';
import { logger } from './logger.config';
import fs from 'fs';

type Env = 'production' | 'local' | 'test';

export const configDotenv = () => {
  const NODE_ENV = process.env.NODE_ENV as Env;
  
  if (!NODE_ENV) {
    logger.error('NODE_ENV is not defined');
    throw new Error('NODE_ENV is not defined');
  }

  let envPath = '';
  switch (NODE_ENV) {
    case 'production':
      envPath = join(path, '.env');
      break;
    case 'local':
      envPath = join(path, '.env.local');
      break;
    case 'test':
      envPath = join(path, '.env.test');
      break;
    default:
      logger.error('Invalid NODE_ENV value');
      throw new Error('Invalid NODE_ENV value');
  }

  // .env 파일이 없는 경우 처리
  try {
    if (!fs.existsSync(envPath)) {
      logger.info(`환경 변수 파일 ${envPath}이(가) 없습니다. 환경 변수를 직접 사용합니다.`);
      return;
    }
    
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      logger.error(`Error loading .env file: ${result.error.message}`);
      // 치명적인 오류가 아니라면 프로세스를 종료하지 않음
      return;
    }
    logger.info(`Loaded environment variables from: ${envPath}`);
  } catch (error) {
    logger.error(`환경 변수 로드 중 오류 발생: ${error}`);
    // 치명적인 오류가 아니라면 프로세스를 종료하지 않음
  }
};