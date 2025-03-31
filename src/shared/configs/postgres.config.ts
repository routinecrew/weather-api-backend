import { Sequelize } from 'sequelize-typescript';
import { mqlogger } from './logger.config';
import { generateMainModels } from '../../service-init/models/main';
import { getEnvVariable, getEnvNumber } from '../utils/env';

let seq: Sequelize;

export const connectPostgres = async (): Promise<Sequelize> => {
  try {
    mqlogger.info('🔌 Connecting to Postgres...');

    seq = new Sequelize({
      host: getEnvVariable(process.env, 'POSTGRES_HOST', 'localhost'),
      port: getEnvNumber(process.env, 'POSTGRES_PORT', 5432),
      username: getEnvVariable(process.env, 'POSTGRES_USER', 'postgres'),
      password: getEnvVariable(process.env, 'POSTGRES_PASSWORD'),
      database: getEnvVariable(process.env, 'POSTGRES_DATABASE'),
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
    });

    mqlogger.info('🔌 Before Authenticating to Postgres...' + getEnvVariable(process.env, 'POSTGRES_PASSWORD'));

    await seq.authenticate();

    mqlogger.info('🔌 After Authenticating ...');

    await generateMainModels(seq);

    mqlogger.info('✨ Connected to Postgres');

    return seq;
  } catch (err) {
    mqlogger.error(err);
    throw err;
  }
};

export const getSequelizeInstance = (): Sequelize => {
  if (!seq) {
    throw new Error('Sequelize instance not initialized. Call connectPostgres first.');
  }
  return seq;
};
