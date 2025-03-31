import { NextFunction, Request, Response, Router } from 'express';
import { apiKeyRouter } from './v1/apikey.route';
import { weatherRouter } from './v1/weather.route';
import { validateApiKey } from '../../shared/middlewares/apikey.middleware';

const { APP_NAME = 'weather-service' } = process.env;
const router = Router();
const apikeyExcludedPaths = [
  { method: 'POST', path: `/api/${APP_NAME}/apikeys/init` },
];

const unless =
  (paths: { method: string; path: string }[], middleware: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, _res: Response, next: NextFunction) => { // 'res' → '_res'
    const fullPath = req.originalUrl.split('?')[0];
    for (const e of paths) {
      if (req.method.toUpperCase() === e.method && fullPath === e.path) {
        return next();
      }
    }
    return middleware(req, _res, next);
  };

router.use(`/api/${APP_NAME}/apikeys`, unless(apikeyExcludedPaths, validateApiKey), apiKeyRouter);
router.use(`/api/${APP_NAME}/weather`, weatherRouter);

export default router;