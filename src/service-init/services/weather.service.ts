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

const readByFiveMinuteInterval = async (req: Request<ParamsDictionary, unknown, unknown, ListQuery & { point?: number }>) => {
  const { params, query } = req;
  const { date } = params; // 시작 날짜 파라미터
  
  // 클라이언트에서 전달받은 query 파라미터들
  const { 
    point,                   // 포인트 번호 (선택적)
    page = 1,                // 페이지 번호 (기본값: 1)
    count = 30,              // 페이지 크기 (기본값: 30)
    sort = 'date',           // 정렬 기준 (기본값: date)
    dir = 'DESC'             // 정렬 방향 (기본값: DESC)
  } = query;
  
  // 현재 날짜 구하기 (YYYY-MM-DD 형식) - 끝 날짜로 사용
  const today = new Date().toISOString().split('T')[0];
  
  // 페이지 크기를 안전하게 제한 (최대 100개)
  const limit = Math.min(Number(count), 100);
  const offset = (Number(page) - 1) * limit;
  
  try {
    logger.debug(`5분 간격 데이터 조회: ${date} ~ ${today}, 페이지: ${page}, 크기: ${limit}, 정렬: ${sort} ${dir}`);
    
    // 날짜 범위 필터 설정
    const dateRangeCondition = 'date BETWEEN :startDate AND :endDate AND ';
    
    // 포인트 필터 조건
    const pointCondition = point ? 'point = :point AND ' : '';
    
    // 정렬 기준 필드 설정 (client에서 전달된 sort를 검증)
    // time_group은 SQL에서 생성되는 별칭이므로 별도 처리
    let orderByField = 'date';
    if (sort === 'time' || sort === 'time_group') {
      orderByField = 'time_group';
    } else if (['date', 'point'].includes(sort)) {
      orderByField = sort;
    }
    
    // 정렬 방향 설정 (client에서 전달된 dir을 검증)
    const orderDirection = ['ASC', 'DESC'].includes(dir as string) ? dir : 'DESC';
    
    // 쿼리 파라미터 설정
    const replacementValues = {
      startDate: date,
      endDate: today,
      point: point ? Number(point) : undefined,
      limit: limit,
      offset: offset
    };
    
    // 시간을 5분 단위로 그룹화하는 Sequelize 쿼리
    const result = await Weather.sequelize?.query(`
      SELECT 
        date,
        -- 시간을 5분 간격으로 그룹화
        to_char(
          date_trunc('hour', to_timestamp(time, 'HH24:MI:SS')) + 
          INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM to_timestamp(time, 'HH24:MI:SS')) / 5), 
          'HH24:MI:SS'
        ) as time_group,
        point,
        AVG(air_temperature) as air_temperature,
        AVG(air_humidity) as air_humidity,
        AVG(air_pressure) as air_pressure,
        AVG(soil_temperature) as soil_temperature,
        AVG(soil_humidity) as soil_humidity,
        AVG(soil_ec) as soil_ec,
        AVG(pyranometer) as pyranometer,
        AVG(paste_type_temperature) as paste_type_temperature,
        AVG(wind_speed) as wind_speed,
        AVG(wind_direction) as wind_direction,
        AVG(solar_radiation) as solar_radiation,
        AVG(rainfall) as rainfall,
        AVG(co2) as co2
      FROM 
        weather
      WHERE 
        ${dateRangeCondition}
        ${pointCondition}
        deleted_at IS NULL
      GROUP BY 
        date, time_group, point
      ORDER BY 
        ${orderByField} ${orderDirection}, time_group ${orderDirection}
      LIMIT :limit OFFSET :offset
    `, {
      replacements: replacementValues,
      type: QueryTypes.SELECT,
      nest: true
    });
    
    // 결과가 없을 경우 빈 배열 리턴
    if (!result) {
      return {
        data: [],
        totalCount: 0
      };
    }
    
    // 데이터 구조를 조정하여 클라이언트에 반환
    const formattedData = (result as any[]).map((item: any) => ({
      date: item.date,
      time: item.time_group,
      point: item.point,
      airTemperature: item.air_temperature,
      airHumidity: item.air_humidity,
      airPressure: item.air_pressure,
      soilTemperature: item.soil_temperature,
      soilHumidity: item.soil_humidity,
      soilEC: item.soil_ec,
      pyranometer: item.pyranometer,
      pasteTypeTemperature: item.paste_type_temperature,
      windSpeed: item.wind_speed,
      windDirection: item.wind_direction,
      solarRadiation: item.solar_radiation,
      rainfall: item.rainfall,
      co2: item.co2
    }));
    
    // 전체 결과 개수도 가져옴
    const totalCountResult = await Weather.sequelize?.query(`
      SELECT COUNT(*) as count FROM (
        SELECT 
          date,
          to_char(
            date_trunc('hour', to_timestamp(time, 'HH24:MI:SS')) + 
            INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM to_timestamp(time, 'HH24:MI:SS')) / 5), 
            'HH24:MI:SS'
          ) as time_group,
          point
        FROM 
          weather
        WHERE 
          ${dateRangeCondition}
          ${pointCondition}
          deleted_at IS NULL
        GROUP BY 
          date, time_group, point
      ) AS grouped_data
    `, {
      replacements: { 
        startDate: date,
        endDate: today,
        point: point ? Number(point) : undefined
      },
      type: QueryTypes.SELECT,
      plain: true
    });
    
    return {
      data: formattedData,
      totalCount: totalCountResult ? Number((totalCountResult as any).count) : 0
    };
  } catch (error) {
    logger.error(`5분 간격 데이터 조회 중 오류: ${error}`);
    throw new HttpError(STATUS_CODES.INTERNAL_SERVER_ERROR, '데이터 조회 중 오류가 발생했습니다');
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