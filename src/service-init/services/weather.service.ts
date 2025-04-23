import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Op } from 'sequelize';

import { ListQuery } from '../../shared/dtos/common.dto';
import { STATUS_CODES } from '../../shared/constants/http-status';
import { HttpError } from '../../shared/errors';
import { Weather, WeatherAttributes } from '../models/main/weather.model';
import { logger } from '../../shared/configs/logger.config';

// 기존 코드 유지 (readAll, readOne, readByPoint, readLatestByPoint 함수)
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

// 최적화된 날짜 범위 조회 함수
const readFromDateToToday = async (req: Request<ParamsDictionary, unknown, unknown, ListQuery & { point?: number }>) => {
  const { params, query } = req;
  const { date } = params;
  const { point } = query;
  
  // 현재 날짜 구하기 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0];
  
  // 기본 쿼리 설정 - 페이지 크기 제한 확실히 설정
  const { page = 1, count = 30, sort = 'date', dir = 'ASC' } = query;
  const limit = Math.min(Number(count), 100); // 최대 100개로 제한
  
  try {
    logger.debug(`날짜 범위 조회: ${date} ~ ${today}, 페이지: ${page}, 크기: ${limit}`);
    
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
    
    // 데이터 개수 먼저 확인 (실제 데이터 없이 카운트만)
    const totalCount = await Weather.count({
      where: whereClause
    });
    
    logger.debug(`조회 조건에 해당하는 총 데이터 수: ${totalCount}`);
    
    // 데이터 양이 너무 많으면 경고
    if (totalCount > 10000) {
      logger.warn(`대용량 데이터 조회 요청: ${totalCount}개`);
    }
    
    // 효율적인 정렬 방식 선택
    const effectiveSort = sort === 'date' || sort === 'time' ? sort : 'date';
    
    // 데이터 조회 - 페이지네이션 적용
    const data = await Weather.findAll({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      order: [[effectiveSort, dir]],
      nest: true,
      raw: false,
      // 필요한 컬럼만 선택하여 성능 개선
      attributes: [
        'id', 'date', 'time', 'point', 
        'airTemperature', 'airHumidity', 'airPressure',
        'soilTemperature', 'soilHumidity', 'soilEC', 'pyranometer',
        'pasteTypeTemperature', 'windSpeed', 'windDirection', 'solarRadiation', 'rainfall', 'co2',
        'createdAt', 'updatedAt'
      ]
    });
    
    // 결과에 전체 개수 포함
    return {
      data,
      totalCount
    };
  } catch (error) {
    logger.error(`날짜 범위 조회 중 오류: ${error}`);
    throw new HttpError(STATUS_CODES.INTERNAL_SERVER_ERROR, '데이터 조회 중 오류가 발생했습니다');
  }
};

// 기존 코드 유지 (write, modify, erase 함수)
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