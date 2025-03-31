// src/shared/utils/path.ts
import fs from 'fs';
import { join } from 'path';
import { path as rootPath } from 'app-root-path';
import { TenantSchema } from '../configs/schema.config';

export const makeDirectory = (dirPath: string): void => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Error creating directory: ${dirPath}`, error);
    throw error;
  }
};

export const resourcePath = join(rootPath, 'resources');
export const tempPath = (schema: TenantSchema | string) => join(resourcePath, 'temp', schema);
export const uploadPath = (schema: TenantSchema | string) => join(resourcePath, 'upload', schema);