import { NextFunction, Request, Response } from 'express';

import { STATUS_CODES } from '../constants/index';
import { BaseResponse } from '../shared-types';

type FnController = (req: Request, res: Response, next: NextFunction) => Promise<BaseResponse>;

export const tryCatchAsync = (fn: FnController) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next))
    .then((result) => res.status(req.statusCode ?? STATUS_CODES.OK).json(result))
    .catch((err) => next(err));
