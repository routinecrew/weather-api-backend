import Joi from 'joi';

import { WeatherCreationAttributes } from '../models/main/weather.model';
import commonDto from '../../shared/dtos/common.dto';

const write = {
  body: Joi.object<WeatherCreationAttributes>().keys({
    time: Joi.date().required(),
    point: Joi.number().required().min(1).max(5),
    airTemperature: Joi.number().required(),
    airHumidity: Joi.number().required(),
    airPressure: Joi.number().required(),
    soilTemperature: Joi.number().required(),
    soilHumidity: Joi.number().required(),
    soilEC: Joi.number().required(),
    pyranometer: Joi.number().required(),

    // 포인트 1에만 존재하는 데이터
    pasteTypeTemperature: Joi.number().optional(),

    // 포인트 5에만 존재하는 데이터
    windSpeed: Joi.number().optional(),
    windDirection: Joi.number().optional(),
    solarRadiation: Joi.number().optional(),
    rainfall: Joi.number().optional(),
    co2: Joi.number().optional(),
  }),
};

const modify = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
  body: Joi.object<Partial<WeatherCreationAttributes>>().keys({
    time: Joi.date().optional(),
    point: Joi.number().optional().min(1).max(5),
    airTemperature: Joi.number().optional(),
    airHumidity: Joi.number().optional(),
    airPressure: Joi.number().optional(),
    soilTemperature: Joi.number().optional(),
    soilHumidity: Joi.number().optional(),
    soilEC: Joi.number().optional(),
    pyranometer: Joi.number().optional(),

    // 포인트 1에만 존재하는 데이터
    pasteTypeTemperature: Joi.number().optional(),

    // 포인트 5에만 존재하는 데이터
    windSpeed: Joi.number().optional(),
    windDirection: Joi.number().optional(),
    solarRadiation: Joi.number().optional(),
    rainfall: Joi.number().optional(),
    co2: Joi.number().optional(),
  }),
};

const readOne = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const readByPoint = {
  params: Joi.object().keys({
    point: Joi.number().required().min(1).max(5),
  }),
  query: commonDto.readAll.query,
};

const readLatestByPoint = {
  params: Joi.object().keys({
    point: Joi.number().required().min(1).max(5),
  }),
};

const readFromDateToToday = {
  params: Joi.object().keys({
    date: Joi.string().required().pattern(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD 형식
  }),
  query: Joi.object().keys({
    point: Joi.number().optional().min(1).max(5), // 포인트별 필터링 옵션
    page: Joi.number().integer().min(1).default(1),
    count: Joi.number().integer().min(1).max(100).default(30),
    sort: Joi.string().valid('date', 'time', 'point', 'createdAt', 'updatedAt').default('date'),
    dir: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

const erase = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const readByFiveMinuteInterval = {
  params: Joi.object().keys({
    date: Joi.string().required().pattern(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD 형식
  }),
  query: Joi.object().keys({
    point: Joi.number().optional().min(1).max(5), // 포인트별 필터링 옵션
    page: Joi.number().integer().min(1).default(1),
    count: Joi.number().integer().min(1).max(100).default(30),
    sort: Joi.string().valid('date', 'time', 'time_group', 'point').default('date'),
    dir: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

export default {
  write,
  modify,
  readOne,
  readByPoint,
  readLatestByPoint,
  readFromDateToToday,
  erase,
  readByFiveMinuteInterval,
};
