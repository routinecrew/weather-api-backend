import { Router } from 'express';

import * as MW from '../../../shared/middlewares';
import apiKeyController from '../../controllers/apikey.controller';
import apiKeyDto from '../../dtos/api.dto';
import { validateApiKey } from '../../../shared/middlewares/apikey.middleware';

export const apiKeyRouter = Router();

// 초기 API 키 생성 엔드포인트 (API 키 검증 제외)
apiKeyRouter
  .route('/api/weather-service/apikeys/init')
  .post(
    MW.validateDto(apiKeyDto.create), // 동일한 DTO 재사용
    MW.tryCatchAsync(apiKeyController.init), // init 컨트롤러 사용
  );

// API 키 관리 엔드포인트 - 관리자만 접근 가능
apiKeyRouter
  .route('/api-keys')
  .get(
    validateApiKey, // 먼저 API 키 유효성 검사
    MW.validateDto(apiKeyDto.readAll),
    MW.tryCatchAsync(apiKeyController.getAll),
  )
  .post(
    validateApiKey, // 먼저 API 키 유효성 검사
    MW.validateDto(apiKeyDto.create),
    MW.tryCatchAsync(apiKeyController.create),
  );

apiKeyRouter
  .route('/api-keys/:id')
  .get(validateApiKey, MW.validateDto(apiKeyDto.getOne), MW.tryCatchAsync(apiKeyController.getOne))
  .put(validateApiKey, MW.validateDto(apiKeyDto.update), MW.tryCatchAsync(apiKeyController.update))
  .delete(validateApiKey, MW.validateDto(apiKeyDto.remove), MW.tryCatchAsync(apiKeyController.remove));

apiKeyRouter
  .route('/api-keys/:id/regenerate')
  .post(validateApiKey, MW.validateDto(apiKeyDto.regenerate), MW.tryCatchAsync(apiKeyController.regenerate));