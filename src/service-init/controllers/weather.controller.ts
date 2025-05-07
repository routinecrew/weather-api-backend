import { Request } from 'express';

import weatherServices from '../services/weather.service';
import { BasicResponse, ListResponse } from '../../shared/shared-types';
import { STATUS_CODES } from '../../shared/constants/http-status';
import { getResponsePhrase } from '../../shared/utils';
import { Weather } from '../models/main/weather.model';

const readAll = async (req: Request) => {
  const data = await weatherServices.readAll(req);

  return <ListResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    count: data.length,
    data,
  };
};

const readOne = async (req: Request) => {
  const data = await weatherServices.readOne(req);

  return <BasicResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const readByPoint = async (req: Request) => {
  const data = await weatherServices.readByPoint(req);

  return <ListResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    count: data.length,
    data,
  };
};

const readLatestByPoint = async (req: Request) => {
  const data = await weatherServices.readLatestByPoint(req);

  return <BasicResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const readFromDateToToday = async (req: Request) => {
  const { data, totalCount } = await weatherServices.readFromDateToToday(req);

  return <ListResponse<Weather>><unknown>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    count: data.length,
    total: totalCount,
    data,
  };
};

const write = async (req: Request) => {
  const data = await weatherServices.write(req);

  return <BasicResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.CREATED),
    data,
  };
};

const modify = async (req: Request) => {
  const data = await weatherServices.modify(req);

  return <BasicResponse<Weather>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const erase = async (req: Request) => {
  const data = await weatherServices.erase(req);

  return <BasicResponse<number>>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    data,
  };
};

const readByFiveMinuteInterval = async (req: Request) => {
  const { data, totalCount } = await weatherServices.readByFiveMinuteInterval(req);

  return <ListResponse<Weather>><unknown>{
    result: true,
    message: getResponsePhrase(STATUS_CODES.OK),
    count: data.length,
    total: totalCount,
    data,
  };
};

export default {
  readAll,
  readOne,
  readByPoint,
  readLatestByPoint,
  readFromDateToToday,
  write,
  modify,
  erase,
  readByFiveMinuteInterval
};
