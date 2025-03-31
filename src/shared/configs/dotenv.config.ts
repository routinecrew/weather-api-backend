import dotenv from 'dotenv';
import { path } from 'app-root-path';
import { join } from 'path';
import { logger } from './logger.config';

type Env = 'production' | 'local' | 'test';

export const configDotenv = () => {
  const NODE_ENV = process.env.NODE_ENV as Env;
  let envPath = '';

  if (!NODE_ENV) {
    logger.error('NODE_ENV is not defined');
    throw new Error('NODE_ENV is not defined');
  }

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

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    logger.error(`Error loading .env file: ${result.error.message}`);
    throw result.error;
  }

  logger.info(`Loaded environment variables from: ${envPath}`);
};
