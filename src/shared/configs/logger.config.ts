import { join } from 'path';
import { path } from 'app-root-path';
import winston from 'winston';
import { CustomLogData } from '../shared-types/log.types';
import { parseErrorStack } from '../utils';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = (): LogLevel => {
  const { NODE_ENV } = process.env;
  const isDev = NODE_ENV === 'local';
  return isDev ? 'debug' : 'http';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const logDir = join(path, 'logs');
const isTest = process.env['NODE_ENV'] === 'test';
const appName = process.env['APP_NAME'] ?? 'mpp & sams';

const getFormat = (publishToCenter: boolean) => {
  if (process.env.NODE_ENV === 'production') {
    return jsonFormat(publishToCenter);
  }
  return process.env.NODE_ENV === 'local' ? consoleFormat : fileFormat;
};

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo) => `${info['timestamp']} [${appName}] ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo) => `${info['timestamp']} [${appName}] ${info.level}: ${info.message}`,
  ),
);

const jsonFormat = (publishToCenter: boolean) =>
  winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const custom = info as unknown as CustomLogData;
      const logData: any = {
        '@timestamp': info.timestamp, // Winston이 제공하는 timestamp 사용
        message: custom.message,
        level: custom.level,
        service: appName,
        meta: custom.meta || {},
        userId: custom.userId,
        sessionId: custom.sessionId,
      };

      if (custom.error) {
        const { fileName, functionName, lineNumber } = parseErrorStack(custom.error.stack || '');
        logData.error = {
          message: custom.error.message,
          stack: custom.error.stack,
          fileName,
          functionName,
          lineNumber,
        };
      }

      // 중앙 로깅일 경우에만 이벤트 발행
      if (publishToCenter && custom.level !== 'debug') {
        /* empty */
      }

      return JSON.stringify(logData, null, 2);
    }),
  );

const createTransports = (publishToCenter: boolean) => [
  new winston.transports.Console({
    level: 'debug', // 콘솔에는 모든 레벨의 로그 출력
    format: getFormat(publishToCenter),
  }),
  new winston.transports.File({
    filename: join(logDir, 'error.log'),
    level: 'error', // 'error' 로그만 error.log 파일에 기록
    format: getFormat(publishToCenter),
  }),
  new winston.transports.File({
    filename: join(logDir, 'warn.log'),
    level: 'warn', // 'warn' 로그만 warn.log 파일에 기록
    format: getFormat(publishToCenter),
  }),
];

const createLogger = (publishToCenter: boolean) =>
  winston.createLogger({
    level: level(),
    defaultMeta: {
      service: appName,
    },
    levels,
    silent: isTest,
    transports: createTransports(publishToCenter),
  });

export const logger = createLogger(false);
export const mqlogger = createLogger(true);
