import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Op } from 'sequelize';

import { ListQuery } from '../../shared/dtos/common.dto';
import { STATUS_CODES } from '../../shared/constants/http-status';
import { HttpError } from '../../shared/errors';
import { Weather, WeatherAttributes } from '../models/main/weather.model';

const readAll = async (req: Request<unknown, unknown, unknown, ListQuery>) => {
  const { query } = req;
  return Weather.readAll(query);
};

const readOne = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  const weather = await Weather.readOne(Number(id));

  if (!weather) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'Weather data not found');
  }

  return weather;
};

const readByPoint = async (req: Request<ParamsDictionary, unknown, unknown, ListQuery>) => {
  const { params, query } = req;
  const { point } = params;

  return Weather.readAllByPoint(Number(point), query);
};

const readLatestByPoint = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { point } = params;

  const weather = await Weather.readLatestByPoint(Number(point));

  if (!weather) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'Weather data not found for this point');
  }

  return weather;
};

const readFromDateToToday = async (req: Request<ParamsDictionary, unknown, unknown, ListQuery & { point?: number }>) => {
  const { params, query } = req;
  const { date } = params;
  const { point } = query;
  
  // 현재 날짜 구하기 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0];
  
  // 기본 쿼리 설정
  const { page = 1, count = 30, sort = 'date', dir = 'DESC' } = query;
  
  // 날짜 범위 필터 설정
  const whereClause: any = {
    date: {
      [Op.between]: [date, today]
    }
  };
  
  // 포인트 필터 추가 (선택적)
  if (point) {
    whereClause.point = Number(point);
  }
  
  // 데이터 조회
  const data = await Weather.findAll({
    where: whereClause,
    limit: count,
    offset: (page - 1) * count,
    order: [[sort, dir], ['date', dir]],
    nest: true,
    raw: false
  });
  
  // 결과 반환
  return data;
};

const write = async (req: Request<unknown, unknown, WeatherAttributes, unknown>) => {
  const { body } = req;

  // 포인트 유효성 검사 추가
  if (body.point < 1 || body.point > 5) {
    throw new HttpError(STATUS_CODES.BAD_REQUEST, 'Invalid point number. Must be between 1 and 5');
  }

  // 포인트 1에만 페이스트 타입 온도가 있음
  if (body.point !== 1 && body.pasteTypeTemperature !== undefined) {
    throw new HttpError(STATUS_CODES.BAD_REQUEST, 'pasteTypeTemperature is only available for point 1');
  }

  // 포인트 5에만 있는 데이터들
  if (body.point !== 5) {
    if (
      body.windSpeed !== undefined ||
      body.windDirection !== undefined ||
      body.solarRadiation !== undefined ||
      body.rainfall !== undefined ||
      body.co2 !== undefined
    ) {
      throw new HttpError(
        STATUS_CODES.BAD_REQUEST,
        'windSpeed, windDirection, solarRadiation, rainfall, and co2 are only available for point 5',
      );
    }
  }

  return Weather.write(body);
};

const modify = async (req: Request<ParamsDictionary, unknown, Partial<WeatherAttributes>, unknown>) => {
  const { params, body } = req;
  const { id } = params;

  const weather = await Weather.readOne(Number(id));

  if (!weather) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'Weather data not found');
  }

  // 포인트 변경 시 유효성 검사
  if (body.point !== undefined && (body.point < 1 || body.point > 5)) {
    throw new HttpError(STATUS_CODES.BAD_REQUEST, 'Invalid point number. Must be between 1 and 5');
  }

  // 포인트 1에만 페이스트 타입 온도가 있음
  if ((weather.point !== 1 && body.point === undefined) || (body.point !== undefined && body.point !== 1)) {
    if (body.pasteTypeTemperature !== undefined) {
      throw new HttpError(STATUS_CODES.BAD_REQUEST, 'pasteTypeTemperature is only available for point 1');
    }
  }

  // 포인트 5에만 있는 데이터들
  if ((weather.point !== 5 && body.point === undefined) || (body.point !== undefined && body.point !== 5)) {
    if (
      body.windSpeed !== undefined ||
      body.windDirection !== undefined ||
      body.solarRadiation !== undefined ||
      body.rainfall !== undefined ||
      body.co2 !== undefined
    ) {
      throw new HttpError(
        STATUS_CODES.BAD_REQUEST,
        'windSpeed, windDirection, solarRadiation, rainfall, and co2 are only available for point 5',
      );
    }
  }

  return Weather.modify(Number(id), body);
};

const erase = async (req: Request<ParamsDictionary, unknown, unknown, unknown>) => {
  const { params } = req;
  const { id } = params;

  const weather = await Weather.readOne(Number(id));

  if (!weather) {
    throw new HttpError(STATUS_CODES.NOT_FOUND, 'Weather data not found');
  }

  return Weather.erase(Number(id));
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
};
