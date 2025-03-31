import requestTracer from 'cls-rtracer';
import { mqlogger } from '../configs/logger.config';
import { LOGGER_COLOR, colorize } from '../configs/morgan.config';

export const seqLogger = {
  error: (err: Error) => {
    const requestId = requestTracer.id();
    const errorColor = err instanceof TypeError ? LOGGER_COLOR.YELLOW : LOGGER_COLOR.MAGENTA;
    mqlogger.error(`${colorize(errorColor, '[SEQ ERROR STACK]')}: ${err.stack}`, { requestId });
  },
};
