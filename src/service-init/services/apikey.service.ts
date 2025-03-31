import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { STATUS_CODES } from '../../shared/constants/http-status';
import { HttpError } from '../../shared/errors';
import { ApiKey, ApiKeyAttributes, ApiKeyCreationAttributes } from '../models/main/apikey.model';

const create = async (req: Request<unknown, unknown, ApiKeyCreationAttributes, unknown>) => {
  const { body } = req;
  return ApiKey.createApiKey(body);
};

const init = async (req: Request<unknown, unknown, ApiKeyCreationAttributes, unknown>) => {
  const { body } = req;
  const { name } = body;

  // 첫 키 생성 시 중복 체크 (선택 사항)
  const existingKey = await ApiKey.findOne({ where: { name, isActive: true } });
  if (existingKey) {
    throw new HttpError(STATUS_CODES.CONFLICT, 'API key with this name already exists');
  }

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

  const apiKey = await ApiKey.findById(Number(id));
  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  return ApiKey.updateApiKey(Number(id), body);
};

const remove = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  const apiKey = await ApiKey.findById(Number(id));
  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  return ApiKey.deleteApiKey(Number(id));
};

const regenerate = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  const apiKey = await ApiKey.findById(Number(id));
  if (!apiKey) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
  }

  const newKey = ApiKey.generateKey();
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
  init, // 추가
  getAll,
  getOne,
  update,
  remove,
  regenerate,
};