import { Request, Response, NextFunction } from 'express';
import { STATUS_CODES } from '../constants/http-status';
import { HttpError } from '../errors';
import { ApiKey } from '../../service-init/models/main/apikey.model';

/**
 * API 키 인증 미들웨어
 * 요청 헤더에서 API 키를 검증하고 유효한 경우에만 다음 미들웨어로 진행
 */
export const validateApiKey = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // API 키는 x-api-key 헤더에 포함
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      throw new HttpError(STATUS_CODES.UNAUTHORIZED, 'API key is required');
    }

    // 데이터베이스에서 API 키 확인
    const keyRecord = await ApiKey.findByKey(apiKey);

    if (!keyRecord) {
      throw new HttpError(STATUS_CODES.UNAUTHORIZED, 'Invalid API key');
    }

    // API 키 만료 확인
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      throw new HttpError(STATUS_CODES.UNAUTHORIZED, 'API key has expired');
    }

    // 사용 기록 업데이트 (비동기로 처리하고 응답을 기다리지 않음)
    ApiKey.updateLastUsed(keyRecord.id).catch((err: any) => {
      console.error('Failed to update API key usage:', err);
    });

    // API 키 정보를 요청 객체에 저장 (선택사항)
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Request 인터페이스 확장하여 apiKey 속성 추가
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: {
        id: number;
        name: string;
      };
    }
  }
}
