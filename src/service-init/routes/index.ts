import { Router } from 'express';
import { apiKeyRouter } from './v1/apikey.route';
import { weatherRouter } from './v1/weather.route';
import { validateApiKey } from '../../shared/middlewares/apikey.middleware';

const { APP_NAME = 'weather-service' } = process.env;
const router = Router();
const API_VERSION = 'v1';

// API 키 검증에서 제외할 경로 (정확한 전체 경로 지정)
const excludedPaths = [
  { 
    method: 'POST', 
    path: `/api/${APP_NAME}/${API_VERSION}/apikeys/init` 
  }
];

// 미들웨어 제외 로직
const conditionalApiKeyCheck = (req: any, res: any, next: any) => {
  const isExcluded = excludedPaths.some(
    e => req.method === e.method && req.originalUrl.split('?')[0] === e.path
  );
  isExcluded ? next() : validateApiKey(req, res, next);
};

// V1 라우트 설정
router.use(
  `/api/${APP_NAME}/${API_VERSION}`,
  conditionalApiKeyCheck, // 조건부 미들웨어 적용
  Router()
    .use('/apikeys', apiKeyRouter)
    .use('/weather', weatherRouter)
);

export default router;