import { ModelCtor, Sequelize } from 'sequelize-typescript';

import { DEFAULT_MAIN_SCHEMA, createSchema } from '../../../shared/configs/schema.config';
import { ApiKey } from './apikey.model';
import { Weather } from './weather.model';
import { logger } from '../../../shared/configs/logger.config';

export const generateMainModels = async (seq: Sequelize) => {
  await createSchema(seq, DEFAULT_MAIN_SCHEMA);

  const models: ModelCtor[] = [ApiKey, Weather];

  seq.addModels(models);

  Object.entries(seq.models).forEach(([_, model]) => (model.options.schema ??= DEFAULT_MAIN_SCHEMA));

  logger.info('💡 Synced main models');
  await seq.sync({ logging: false });

  logger.info('🏗️ Generating default tenant models');

  const isAlterTables = process.env['ALTER_TABLE'] === 'true';
  if (isAlterTables) {
    for (const [, model] of Object.entries(seq.models)) {
      await model.schema(model.options.schema as string).sync({ alter: true, logging: false });
    }
  }
};
