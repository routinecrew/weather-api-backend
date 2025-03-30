import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

import { STATUS_CODES } from '../constants';
import { pick } from '../utils';
import { HttpError } from './../errors/http-error';

interface Schema<B, P, Q> {
  body?: Joi.Schema<B>;
  params?: Joi.Schema<P>;
  query?: Joi.Schema<Q>;
}

export const validateDto = <B = any, P = any, Q = any>(schema: Schema<B, P, Q>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validationSchema = pick(schema, ['params', 'query', 'body']);
    const target = pick(req, Object.keys(validationSchema));
    const { value, error } = Joi.compile(validationSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(target);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      return next(new HttpError(STATUS_CODES.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);

    return next();
  };
};
