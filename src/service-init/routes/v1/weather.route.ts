import { Router } from 'express';
import * as MW from '../../../shared/middlewares';
import weatherController from '../../controllers/weather.controller';
import weatherDto from '../../dtos/weather.dto';
import commonDto from '../../../shared/dtos/common.dto';
import { validateApiKey } from '../../../shared/middlewares/apikey.middleware';

export const weatherRouter = Router();

weatherRouter
  .route('/') // '/weather' → '/'
  .get(validateApiKey, MW.validateDto(commonDto.readAll), MW.tryCatchAsync(weatherController.readAll))
  .post(validateApiKey, MW.validateDto(weatherDto.write), MW.tryCatchAsync(weatherController.write));

weatherRouter
  .route('/:id')
  .get(validateApiKey, MW.validateDto(weatherDto.readOne), MW.tryCatchAsync(weatherController.readOne))
  .put(validateApiKey, MW.validateDto(weatherDto.modify), MW.tryCatchAsync(weatherController.modify))
  .delete(validateApiKey, MW.validateDto(weatherDto.erase), MW.tryCatchAsync(weatherController.erase));

weatherRouter
  .route('/point/:point')
  .get(validateApiKey, MW.validateDto(weatherDto.readByPoint), MW.tryCatchAsync(weatherController.readByPoint));

weatherRouter
  .route('/point/:point/latest')
  .get(validateApiKey, MW.validateDto(weatherDto.readLatestByPoint), MW.tryCatchAsync(weatherController.readLatestByPoint));

weatherRouter
.route('/from-date/:date')
.get(
  validateApiKey,
  MW.validateDto(weatherDto.readFromDateToToday),
  MW.tryCatchAsync(weatherController.readFromDateToToday)
);