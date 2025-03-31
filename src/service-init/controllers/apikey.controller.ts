import { Request } from 'express';

import apiKeyServices from '../services/apikey.service';
import { BasicResponse, ListResponse } from '../../shared/shared-types';
import { STATUS_CODES } from '../../shared/constants/http-status';
import { getResponsePhrase } from '../../shared/utils';
import { ApiKey } from '../models/main/apikey.model';

const create = async (req: Request) => {
  const data = await apiKeyServices.create(req);

  return <BasicResponse<ApiKey>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.CREATED),
    data,
  };
};

const getAll = async () => {
  const data = await apiKeyServices.getAll();

  return <ListResponse<ApiKey>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    count: data.length,
    data,
  };
};

const getOne = async (req: Request) => {
  const data = await apiKeyServices.getOne(req);

  return <BasicResponse<ApiKey>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const update = async (req: Request) => {
  const data = await apiKeyServices.update(req);

  return <BasicResponse<ApiKey>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const remove = async (req: Request) => {
  const data = await apiKeyServices.remove(req);

  return <BasicResponse<number>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const regenerate = async (req: Request) => {
  const data = await apiKeyServices.regenerate(req);

  return <BasicResponse<{ id: number; key: string; name: string }>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
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
