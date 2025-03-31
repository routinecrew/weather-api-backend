import { Router } from 'express';
import * as MW from '../../../shared/middlewares';
import apiKeyController from '../../controllers/apikey.controller';
import apiKeyDto from '../../dtos/api.dto';
import { validateApiKey } from '../../../shared/middlewares/apikey.middleware';

export const apiKeyRouter = Router();

apiKeyRouter
  .route('/init') // 상위 경로 제거
  .post(
    MW.validateDto(apiKeyDto.create),
    MW.tryCatchAsync(apiKeyController.init),
  );

apiKeyRouter
  .route('/') // '/api-keys' → '/'
  .get(
    validateApiKey,
    MW.validateDto(apiKeyDto.readAll),
    MW.tryCatchAsync(apiKeyController.getAll),
  )
  .post(
    validateApiKey,
    MW.validateDto(apiKeyDto.create),
    MW.tryCatchAsync(apiKeyController.create),
  );

apiKeyRouter
  .route('/:id')
  .get(validateApiKey, MW.validateDto(apiKeyDto.getOne), MW.tryCatchAsync(apiKeyController.getOne))
  .put(validateApiKey, MW.validateDto(apiKeyDto.update), MW.tryCatchAsync(apiKeyController.update))
  .delete(validateApiKey, MW.validateDto(apiKeyDto.remove), MW.tryCatchAsync(apiKeyController.remove));

apiKeyRouter
  .route('/:id/regenerate')
  .post(validateApiKey, MW.validateDto(apiKeyDto.regenerate), MW.tryCatchAsync(apiKeyController.regenerate));

export default apiKeyRouter;