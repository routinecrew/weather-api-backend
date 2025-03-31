// src/shared/utils/common.ts
import { STATUS_PHRASE } from '../constants/http-phrase';

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
};

export const getResponsePhrase = (statusCode: number): string => {
  return STATUS_PHRASE[statusCode] || 'Unknown Status';
};

export const parseErrorStack = (stack: string) => {
  const stackLines = stack.split('\n').filter(line => line.includes('at '));
  const firstLine = stackLines[0] || '';
  
  const match = firstLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
                firstLine.match(/at\s+()(.*):(\d+):(\d+)/);

  if (match) {
    const functionName = match[1] || 'anonymous';
    const fileName = match[2] ? match[2].split('/').pop() || '' : '';
    const lineNumber = match[3] ? parseInt(match[3], 10) : 0;
    
    return { fileName, functionName, lineNumber };
  }
  
  return { fileName: '', functionName: '', lineNumber: 0 };
};

export const seqLogger = {
  error: (error: Error | any) => {
    console.error('Sequelize Error:', error);
  },
  warn: (message: string) => {
    console.warn('Sequelize Warning:', message);
  },
  info: (message: string) => {
    console.info('Sequelize Info:', message);
  },
  debug: (message: string) => {
    console.debug('Sequelize Debug:', message);
  },
};