import jwt from 'jsonwebtoken';

import * as CONST from '../constants';

export const generateAccessToken = (payload: object) =>
  jwt.sign({ ...payload, expiredIn: CONST.ACCESS_TOKEN_EXPIRED_IN_MILL_SEC }, CONST.ACCESS_TOKEN_SECRET, {
    expiresIn: CONST.ACCESS_TOKEN_EXPIRED_IN_SEC,
  });

export const generateRefreshToken = (payload: object) =>
  jwt.sign({ ...payload, expiredIn: CONST.REFRESH_TOKEN_EXPIRED_IN_MILL_SEC }, CONST.REFRESH_TOKEN_SECRET, {
    expiresIn: CONST.REFRESH_TOKEN_EXPIRED_IN_SEC,
  });

export const generateSignUpToken = (payload: object) =>
  jwt.sign({ ...payload, expiredIn: CONST.SIGN_UP_TOKEN_EXPIRED_IN_MILL_SEC }, CONST.SIGN_UP_TOKEN_SECRET, {
    expiresIn: CONST.SIGN_UP_TOKEN_EXPIRED_IN_SEC,
  });

export const verifySignUpToken = (token: string) =>
  jwt.verify(token, CONST.SIGN_UP_TOKEN_SECRET, { ignoreExpiration: true });
