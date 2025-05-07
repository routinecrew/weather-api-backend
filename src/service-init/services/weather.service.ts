import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Op, QueryTypes } from 'sequelize'; 

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
  
  // 클라이언트에서 전달받은 query 파라미터들
  const { 
    point,                   // 포인트 번호 (선택적)
    page = 1,                // 페이지 번호 (기본값: 1)
    count = 30,              // 페이지 크기 (기본값: 30)
    sort = 'date',           // 정렬 기준 (기본값: date)
    dir = 'DESC'             // 정렬 방향 (기본값: DESC)
  } = query;
  
  // 현재 날짜 구하기 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0];
  
  // 페이지 크기를 안전하게 제한 (최대 100개)
  const limit = Math.min(Number(count), 100);
  const offset = (Number(page) - 1) * limit;
  
  try {
    logger.debug(`날짜 범위 조회: ${date} ~ ${today}, 페이지: ${page}, 크기: ${limit}, 정렬: ${sort} ${dir}`);
    
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
    
    // 정렬 필드 유효성 검증
    let effectiveSort = 'date';
    if (['date', 'time', 'point', 'createdAt', 'updatedAt'].includes(sort)) {
      effectiveSort = sort;
    }
    
    // 정렬 방향 유효성 검증
    const orderDirection = ['ASC', 'DESC'].includes(dir as string) ? dir : 'DESC';
    
    // 데이터 조회 - 페이지네이션 적용
    const data = await Weather.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [[effectiveSort, orderDirection]],
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

// weather.service.ts의 readByFiveMinuteInterval 함수 수정
const readByFiveMinuteInterval = async (req: Request<ParamsDictionary, unknown, unknown, ListQuery & { point?: number }>) => {
  const { params, query } = req;
  const { date } = params;
  
  const { 
    point,
    page = 1,
    count = 30,
    sort = 'date',
    dir = 'DESC'
  } = query;
  
  const today = new Date().toISOString().split('T')[0];
  const limit = Math.min(Number(count), 100);
  const offset = (Number(page) - 1) * limit;
  
  try {
    logger.debug(`5분 간격 데이터 조회: ${date} ~ ${today}, 페이지: ${page}, 크기: ${limit}, 정렬: ${sort} ${dir}`);
    
    // 검색 조건 구성
    let whereClause = "date BETWEEN :startDate AND :endDate";
    if (point) {
      whereClause += " AND point = :point";
    }
    whereClause += " AND deleted_at IS NULL";
    
    // 쿼리 파라미터
    const replacementValues: any = {
      startDate: date,
      endDate: today,
      limit: limit,
      offset: offset
    };
    
    if (point) {
      replacementValues.point = Number(point);
    }
    
    // 안전한 정렬 필드 선택
    const orderByField = ['date', 'time', 'point'].includes(sort) ? sort : 'date';
    const orderDirection = ['ASC', 'DESC'].includes(dir as string) ? dir : 'DESC';
    
    // 단순화된 SQL 쿼리: 5분 단위로 그룹화하고 각 그룹의 첫 번째 데이터만 선택
    const query = `
      WITH time_groups AS (
        SELECT 
          date,
          time,
          point,
          air_temperature,
          air_humidity,
          air_pressure,
          soil_temperature,
          soil_humidity,
          soil_e_c,
          pyranometer,
          paste_type_temperature,
          wind_speed,
          wind_direction,
          solar_radiation, 
          rainfall,
          co2,
          EXTRACT(HOUR FROM to_timestamp(time, 'HH24:MI:SS')) * 12 + 
          FLOOR(EXTRACT(MINUTE FROM to_timestamp(time, 'HH24:MI:SS')) / 5) AS time_group,
          ROW_NUMBER() OVER (
            PARTITION BY 
              date, 
              point, 
              EXTRACT(HOUR FROM to_timestamp(time, 'HH24:MI:SS')) * 12 + 
              FLOOR(EXTRACT(MINUTE FROM to_timestamp(time, 'HH24:MI:SS')) / 5)
            ORDER BY 
              time ASC
          ) AS row_num
        FROM 
          weather
        WHERE 
          ${whereClause}
      )
      SELECT 
        date,
        time,
        point,
        air_temperature AS "airTemperature",
        air_humidity AS "airHumidity",
        air_pressure AS "airPressure",
        soil_temperature AS "soilTemperature",
        soil_humidity AS "soilHumidity",
        soil_e_c AS "soilEC",
        pyranometer,
        paste_type_temperature AS "pasteTypeTemperature",
        wind_speed AS "windSpeed",
        wind_direction AS "windDirection",
        solar_radiation AS "solarRadiation",
        rainfall,
        co2
      FROM 
        time_groups
      WHERE 
        row_num = 1
      ORDER BY 
        ${orderByField} ${orderDirection}
      LIMIT :limit OFFSET :offset
    `;
    
    logger.debug(`실행 SQL 쿼리: ${query}`);
    
    // 쿼리 실행
    const result = await Weather.sequelize?.query(query, {
      replacements: replacementValues,
      type: QueryTypes.SELECT,
      nest: true
    });
    
    if (!result || !Array.isArray(result)) {
      logger.warn('쿼리 결과가 없거나 배열이 아닙니다.');
      return {
        data: [],
        totalCount: 0
      };
    }
    
    // 총 개수 계산 - 단순화
    const countQuery = `
      SELECT COUNT(DISTINCT date || '_' || point || '_' || (
        EXTRACT(HOUR FROM to_timestamp(time, 'HH24:MI:SS')) * 12 + 
        FLOOR(EXTRACT(MINUTE FROM to_timestamp(time, 'HH24:MI:SS')) / 5)
      )) as total
      FROM weather
      WHERE ${whereClause}
    `;
    
    const countResult = await Weather.sequelize?.query(countQuery, {
      replacements: replacementValues,
      type: QueryTypes.SELECT,
      plain: true
    });
    
    return {
      data: result, // 이미 올바른 형식으로 반환되므로 추가 변환 불필요
      totalCount: countResult ? Number((countResult as any).total) : result.length
    };
  } catch (error) {
    logger.error(`5분 간격 데이터 조회 중 오류 발생: ${error}`);
    throw new HttpError(
      STATUS_CODES.INTERNAL_SERVER_ERROR, 
      `5분 간격 데이터 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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