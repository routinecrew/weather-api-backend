import * as SQLZ_TS from 'sequelize-typescript';
import * as SQLZ from 'sequelize';

import { STATUS_CODES } from '../../../shared/constants/http-status';
import { ListQuery } from '../../../shared/dtos/common.dto';
import { HttpError } from '../../../shared/errors';
import { seqLogger } from '../../../shared/utils';

export interface WeatherAttributes {
  id: number;
  time: Date;
  point: number;
  airTemperature: number;
  airHumidity: number;
  airPressure: number;
  soilTemperature: number;
  soilHumidity: number;
  soilEC: number;
  pyranometer: number;

  // 포인트 1에만 존재하는 데이터
  pasteTypeTemperature?: number;

  // 포인트 5에만 존재하는 데이터
  windSpeed?: number;
  windDirection?: number;
  solarRadiation?: number;
  rainfall?: number;
  co2?: number;

  createdAt: Date;
  updatedAt: Date;
}

export type WeatherOmitAttributes = 'id' | 'createdAt' | 'updatedAt';
export type WeatherCreationAttributes = SQLZ.Optional<WeatherAttributes, WeatherOmitAttributes>;

@SQLZ_TS.Table({ tableName: 'weather', modelName: 'Weather' })
export class Weather extends SQLZ_TS.Model<WeatherAttributes, WeatherCreationAttributes> {
  @SQLZ_TS.PrimaryKey
  @SQLZ_TS.AutoIncrement
  @SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER)
  override readonly id!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.DATE)
  readonly time!: Date;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER)
  readonly point!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly airTemperature!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly airHumidity!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly airPressure!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly soilTemperature!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly soilHumidity!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly soilEC!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly pyranometer!: number;

  // 포인트 1에만 존재하는 데이터
  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly pasteTypeTemperature?: number;

  // 포인트 5에만 존재하는 데이터
  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly windSpeed?: number;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly windDirection?: number;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly solarRadiation?: number;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly rainfall?: number;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.FLOAT)
  readonly co2?: number;

  @SQLZ_TS.CreatedAt
  override readonly createdAt!: Date;

  @SQLZ_TS.UpdatedAt
  override readonly updatedAt!: Date;

  static async write(values: WeatherCreationAttributes, options?: SQLZ.CreateOptions<SQLZ.Attributes<Weather>>) {
    return this.create(values, {
      returning: true,
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  static async readOne(id: number, options?: Omit<SQLZ.FindOptions<WeatherAttributes>, 'where'>) {
    return this.findByPk(id, {
      nest: true,
      raw: false,
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  static async readAll(query: ListQuery, options?: SQLZ.FindOptions<SQLZ.Attributes<Weather>>) {
    const { page = 1, count = 30, sort = 'time', dir = 'DESC' } = query;

    return this.findAll({
      nest: true,
      raw: false,
      limit: count,
      offset: (page - 1) * count,
      order: [[sort, dir]],
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  static async readAllByPoint(
    point: number,
    query: ListQuery,
    options?: Omit<SQLZ.FindOptions<WeatherAttributes>, 'where'>,
  ) {
    const { page = 1, count = 30, sort = 'time', dir = 'DESC' } = query;

    return this.findAll({
      nest: true,
      raw: false,
      where: { point },
      limit: count,
      offset: (page - 1) * count,
      order: [[sort, dir]],
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  static async readLatestByPoint(
    point: number,
    options?: Omit<SQLZ.FindOptions<WeatherAttributes>, 'where' | 'order' | 'limit'>,
  ) {
    return this.findOne({
      nest: true,
      raw: false,
      where: { point },
      order: [['time', 'DESC']],
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  static async modify(
    id: number,
    values: Partial<WeatherAttributes>,
    options?: Omit<SQLZ.UpdateOptions<SQLZ.Attributes<Weather>>, 'returning' | 'where'>,
  ) {
    const [affectedCount, data] = await this.update(values, {
      where: { id },
      returning: true,
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });

    if (affectedCount === 0 || !data[0]) {
      throw new HttpError(STATUS_CODES.BAD_REQUEST, 'Weather data not found, while modifying');
    }

    return data[0];
  }

  static async erase(id: number, options?: SQLZ.DestroyOptions<SQLZ.Attributes<Weather>>) {
    return this.destroy({
      where: { id },
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }
}
