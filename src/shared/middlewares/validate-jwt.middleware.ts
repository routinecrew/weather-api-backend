import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const validateJwt =
  (strategy: 'validate-access-jwt' | 'validate-refresh-jwt') => (req: Request, res: Response, next: NextFunction) =>
    passport.authenticate(
      strategy,
      { session: false },
      (
        err: any,
        user?: Express.User | false | null,
        info?: object | string | Array<string | undefined>,
        _status?: number | Array<number | undefined>,
      ) => {
        if (err) return next(err);
        if (info && info instanceof Error) return next(info);
        if (user) req.user = user;

        return next();
      },
    )(req, res, next);
