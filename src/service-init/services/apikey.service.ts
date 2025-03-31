import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { STATUS_CODES } from '../../shared/constants/http-status';
import { HttpError } from '../../shared/errors';
import { ApiKey, ApiKeyAttributes, ApiKeyCreationAttributes } from '../models/main/apikey.model';

const create = async (req: Request<unknown, unknown, ApiKeyCreationAttributes, unknown>) => {
  const { body } = req;
  return ApiKey.createApiKey(body);
};

const getAll = async () => {
  return ApiKey.getAllApiKeys();
};

const getOne = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  const apiKey = await ApiKey.findById(Number(id));

  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  return apiKey;
};

const update = async (req: Request<ParamsDictionary, unknown, Partial<ApiKeyAttributes>, unknown>) => {
  const { params, body } = req;
  const { id } = params;

  // 키 존재 여부 확인
  const apiKey = await ApiKey.findById(Number(id));

  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  return ApiKey.updateApiKey(Number(id), body);
};

const remove = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  // 키 존재 여부 확인
  const apiKey = await ApiKey.findById(Number(id));

  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  return ApiKey.deleteApiKey(Number(id));
};

const regenerate = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  // 키 존재 여부 확인
  const apiKey = await ApiKey.findById(Number(id));

  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  // 새 키 생성
  const newKey = ApiKey.generateKey();

  // 키 업데이트
  await ApiKey.updateApiKey(Number(id), {
    key: newKey,
    lastUsedAt: undefined,
  });

  return {
    id: Number(id),
    key: newKey,
    name: apiKey.name,
  };
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove,
  regenerate,
};
