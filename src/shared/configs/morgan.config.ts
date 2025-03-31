import morgan from 'morgan';
import requestTracer from 'cls-rtracer';
import { utcToZonedTime, format } from 'date-fns-tz';
import { mqlogger } from './logger.config';

morgan.token('date-ko', (_req, _res, _tz) => {
  const timeZone = process.env['TZ'] ?? 'Asia/Seoul';
  const date = new Date();
  const zonedDate = utcToZonedTime(date, timeZone);
  const formatStr = 'yyyy-MM-dd HH:mm:ss:SSS';

  return format(zonedDate, formatStr, { timeZone });
});

export const LOGGER_COLOR = {
  BLACK: 0,
  RED: 31,
  GREEN: 32,
  YELLOW: 33,
  BLUE: 34,
  MAGENTA: 35,
  CYAN: 36,
};

export const colorize = (color: number, target: string | undefined | number) => {
  return `\x1b[${color}m${target ?? ''}\x1b[0m`;
};

export const colorizeStatus = (status: number) => {
  let color;

  if (status >= 500) {
    color = LOGGER_COLOR.RED; // server error
  } else if (status >= 400) {
    color = LOGGER_COLOR.YELLOW; // client error
  } else if (status >= 300) {
    color = LOGGER_COLOR.CYAN; // redirection
  } else if (status >= 200) {
    color = LOGGER_COLOR.GREEN; // success
  } else {
    color = LOGGER_COLOR.BLACK; // no color
  }

  return colorize(color, status);
};

const morganLogger = morgan(
  (tokens, req, res) => {
    const remoteAddr = tokens['remote-addr']?.(req, res) ?? '';
    const method = tokens['method']?.(req, res) ?? '';
    const url = tokens['url']?.(req, res) ?? '';
    const httpVersion = `HTTP/${tokens['http-version']?.(req, res) ?? ''}`;
    const status = tokens['status']?.(req, res) ?? '';
    const userAgent = tokens['user-agent']?.(req, res) ?? '';
    const responseTime = `${tokens['response-time']?.(req, res) ?? ''} ms`;
    const dateKo = tokens['date-ko']?.(req, res) ?? '';

    return [
      colorize(LOGGER_COLOR.BLUE, remoteAddr),
      '-',
      colorize(LOGGER_COLOR.YELLOW, method),
      colorize(LOGGER_COLOR.CYAN, url),
      colorize(LOGGER_COLOR.YELLOW, httpVersion),
      colorize(LOGGER_COLOR.GREEN, status),
      colorize(LOGGER_COLOR.BLACK, `"${userAgent}"`),
      '-',
      colorize(LOGGER_COLOR.BLACK, `${responseTime}, ${dateKo}`),
    ].join(' ');
  },
  {
    stream: {
      write: (message) => {
        const requestId = requestTracer.id() || 'no-request-id';
        const statusCode = Number(message.split(' ')[5]?.slice(5, 8)) || 200;

        if (statusCode >= 400) {
          mqlogger.error(message, { requestId });
        } else if (statusCode >= 300) {
          mqlogger.warn(message, { requestId });
        } else if (statusCode >= 200) {
          mqlogger.info(message, { requestId });
        } else if (statusCode >= 100) {
          mqlogger.info(message, { requestId });
        } else {
          mqlogger.debug(message, { requestId });
        }
      },
    },
  },
);

export default morganLogger;
