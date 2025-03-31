// src/shared/utils/response.ts
import { Response } from 'express';
import { STATUS_CODES } from '../constants/http-status';
import { BaseResponse } from '../shared-types';

export const successResponse = <T>(
  res: Response, 
  data: T, 
  message: string = 'Success', 
  statusCode: number = STATUS_CODES.OK
) => {
  const response: BaseResponse<T> = {
    result: true,
    message,
    data,
  };
  
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response, 
  message: string = 'Error', 
  statusCode: number = STATUS_CODES.INTERNAL_SERVER_ERROR
) => {
  const response: BaseResponse = {
    result: false,
    message,
  };
  
  return res.status(statusCode).json(response);
};