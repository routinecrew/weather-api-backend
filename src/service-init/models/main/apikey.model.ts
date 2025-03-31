import * as SQLZ_TS from 'sequelize-typescript';
import * as SQLZ from 'sequelize';
import crypto from 'crypto';


import { STATUS_CODES } from '../../../shared/constants/http-status';
import { HttpError } from '../../../shared/errors';
import { seqLogger } from '../../../shared/utils';

export interface ApiKeyAttributes {
  id: number;
  name: string;
  key: string;
  description?: string;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ApiKeyOmitAttributes = 'id' | 'key' | 'createdAt' | 'updatedAt' | 'deletedAt';
export type ApiKeyCreationAttributes = SQLZ.Optional<ApiKeyAttributes, ApiKeyOmitAttributes>;

@SQLZ_TS.Table({ tableName: 'api_keys', modelName: 'apiKey' })
export class ApiKey extends SQLZ_TS.Model<ApiKeyAttributes, ApiKeyCreationAttributes> {
  @SQLZ_TS.PrimaryKey
  @SQLZ_TS.AutoIncrement
  @SQLZ_TS.Column(SQLZ_TS.DataType.INTEGER)
  override readonly id!: number;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Column(SQLZ_TS.DataType.STRING)
  readonly name!: string;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Unique('api_key_unique')
  @SQLZ_TS.Column(SQLZ_TS.DataType.STRING(64))
  readonly key!: string;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.TEXT)
  readonly description?: string;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.DATE)
  readonly expiresAt?: Date;

  @SQLZ_TS.AllowNull(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.DATE)
  readonly lastUsedAt?: Date;

  @SQLZ_TS.AllowNull(false)
  @SQLZ_TS.Default(true)
  @SQLZ_TS.Column(SQLZ_TS.DataType.BOOLEAN)
  readonly isActive!: boolean;

  @SQLZ_TS.CreatedAt
  override readonly createdAt!: Date;

  @SQLZ_TS.UpdatedAt
  override readonly updatedAt!: Date;

  @SQLZ_TS.DeletedAt
  override readonly deletedAt?: Date;

  // API 키 생성 메소드
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // API 키 생성 및 저장
  static async createApiKey(values: ApiKeyCreationAttributes, options?: SQLZ.CreateOptions<SQLZ.Attributes<ApiKey>>) {
    const apiKey = {
      ...values,
      key: this.generateKey(),
    };

    return this.create(apiKey, {
      returning: true,
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  // API 키 조회
  static async findByKey(key: string, options?: Omit<SQLZ.FindOptions<ApiKeyAttributes>, 'where'>) {
    return this.findOne({
      where: { key, isActive: true },
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  // API 키 조회 - ID 기반
  static async findById(id: number, options?: Omit<SQLZ.FindOptions<ApiKeyAttributes>, 'where'>) {
    return this.findByPk(id, {
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  // 모든 API 키 조회
  static async getAllApiKeys(options?: SQLZ.FindOptions<SQLZ.Attributes<ApiKey>>): Promise<ApiKey[]> {
    return this.findAll({
      ...options,
    }).catch((error: Error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  // API 키 업데이트
  static async updateApiKey(
    id: number,
    values: Partial<ApiKeyAttributes>,
    options?: Omit<SQLZ.UpdateOptions<SQLZ.Attributes<ApiKey>>, 'returning' | 'where'>,
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
      throw new HttpError(STATUS_CODES.NOT_FOUND, 'API key not found');
    }

    return data[0];
  }

  // API 키 비활성화
  static async deactivateApiKey(
    id: number,
    options?: Omit<SQLZ.UpdateOptions<SQLZ.Attributes<ApiKey>>, 'returning' | 'where'>,
  ) {
    return this.updateApiKey(id, { isActive: false }, options);
  }

  // API 키 삭제
  static async deleteApiKey(id: number, options?: SQLZ.DestroyOptions<SQLZ.Attributes<ApiKey>>) {
    return this.destroy({
      where: { id },
      ...options,
    }).catch((error) => {
      seqLogger.error(error);
      throw error;
    });
  }

  // API 키 사용 기록 업데이트
  static async updateLastUsed(id: number) {
    return this.updateApiKey(id, { lastUsedAt: new Date() });
  }
}
