import { NextFunction, Request, Response, Router } from 'express';

import * as sharedV1Router from './v1';
import { validateApiKey } from '../../shared/middlewares/apikey.middleware';

const { APP_NAME } = process.env;
const router = Router();
const apikeyExcludedPaths = [
  // API 키 초기 생성을 위한 경로
  { method: 'POST', path: '/apikeys/init' },
];

const unless =
  (paths: { method: string; path: string }[], middleware: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) => {
    for (const e of paths) if (req.method.toUpperCase() === e.method && req.path.includes(e.path)) return next();
    return middleware(req, res, next);
  };

// 기본 API 라우터 - API 키 인증 필요
router.use(`/api/${APP_NAME}`, unless(apikeyExcludedPaths, validateApiKey), [
  ...Object.entries(sharedV1Router).map(([_, value]) => value),
]);

export default router;
