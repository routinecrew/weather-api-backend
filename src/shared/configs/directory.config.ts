import { join } from 'path';

import { TenantSchema } from './schema.config';
import { domains } from '../shared-types';
import { makeDirectory, resourcePath, tempPath, uploadPath } from '../utils';

export const generateDirs = (schema: TenantSchema) => {
  makeDirectory(resourcePath);
  makeDirectory(join(tempPath(schema)));
  makeDirectory(join(uploadPath(schema)));

  for (const domain of domains) {
    makeDirectory(join(uploadPath(schema), domain));
  }
};
