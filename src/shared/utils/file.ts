import { Request } from 'express';
import { path } from 'app-root-path';
import { join } from 'path';
import { TenantSchema } from '../configs/schema.config';
import { Domain } from '../shared-types';
import fs from 'fs';
import { randomBytes } from 'crypto';
import formidable from 'formidable';
import { mqlogger } from '../configs/logger.config';

// 파일을 저장할 경로를 정의
export const resourcePath = join(path, 'resource');
export const tempPath = (schema: TenantSchema) => join(resourcePath, schema, 'temps');
export const uploadPath = (schema: TenantSchema) => join(resourcePath, schema, 'uploads');

export const DEFAULT_MAX_FILE = 10;
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// this for server, it may private, no need to open to client.
export const getTempPath = (schema: TenantSchema) => join(tempPath(schema));
export const getUploadPath = (schema: TenantSchema, domain: Domain) => join(uploadPath(schema), domain);

// this for client, client may request file by this path.
export const getStaticTempPath = (schema: TenantSchema) => join('resource', schema, 'temps');
export const getStaticUploadPath = (schema: TenantSchema, domain: Domain) =>
  join('resource', schema, 'uploads', domain);

export const makeDirectory = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

export const filename = (_name: string, extention: string) => {
  const today = new Date();
  const random = randomBytes(16).toString('hex');

  return `${today}+${random}${extention}`;
};

export const uploadsTemp = (
  req: Request,
  schema: TenantSchema,
  options?: formidable.Options,
): Promise<{
  fields: formidable.Fields;
  files: { files: formidable.File[] };
}> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      allowEmptyFiles: false,
      encoding: 'utf-8',
      maxFiles: DEFAULT_MAX_FILE,
      maxFileSize: DEFAULT_MAX_FILE_SIZE,
      uploadDir: getTempPath(schema),
      ...options,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      // files['files']가 단일 File 객체인지 배열인지 확인
      const fileList = files['files'];
      const normalizedFiles: formidable.File[] = Array.isArray(fileList)
        ? fileList
        : fileList
        ? [fileList]
        : [];

      return resolve({
        fields,
        files: { files: normalizedFiles },
      });
    });
  });
};

export const moveFiles = async (schema: TenantSchema, domain: Domain, from: string[], to: string) => {
  const directoryPath = join(getUploadPath(schema, domain), to);

  makeDirectory(directoryPath);

  for (const oldPath of from) {
    const filename = oldPath.split('/temp/')[1];

    if (!filename) {
      mqlogger.error('filename not found');
      throw new Error();
    }

    const newPath = join(directoryPath, filename);
    await fs.promises.rename(join(path, oldPath), newPath);
  }
};

export const removeFiles = async (removePath: string) => {
  const targetPath = join(path, removePath);
  if (fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }
};