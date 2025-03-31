import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { CustomLogData } from '../shared-types/log.types';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const logDir = join(__dirname, 'logs');
const logFilePath = join(logDir, 'fallback.log');

export const storeLogInFile = async (logData: CustomLogData) => {
  const logString = JSON.stringify(logData) + '\n';
  await writeFile(logFilePath, logString, { flag: 'a' });
};

export const retrieveLogsFromFile = async (): Promise<CustomLogData[]> => {
  try {
    const data = await readFile(logFilePath, 'utf8');
    return data
      .split('\n')
      .filter((line) => line)
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.error('Error reading log file:', error);
    return [];
  }
};

export const clearLogFile = async () => {
  try {
    await unlink(logFilePath);
  } catch (error) {
    console.error('Error clearing log file:', error);
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type RetryableFunction = () => Promise<any>;

export const exponentialBackoff = async (fn: RetryableFunction, maxRetries: number, delayMs: number) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw error;
      }
      const backoffDelay = delayMs * Math.pow(2, retries);
      console.warn(`Retrying in ${backoffDelay}ms... (${retries}/${maxRetries})`);
      await delay(backoffDelay);
    }
  }
};

export const parseErrorStack = (stack: string): { fileName: string; functionName: string; lineNumber: string } => {
  const stackLines = stack.split('\n');
  if (stackLines.length < 2) return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: 'Unknown' };

  const errorLine = stackLines[1]; // 첫 번째 줄은 에러 메시지이므로 두 번째 줄을 사용
  const match = errorLine!.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/);

  if (!match) return { fileName: 'Unknown', functionName: 'Unknown', lineNumber: 'Unknown' };

  const [, functionName = 'Anonymous', fileName = 'Unknown', lineNumber = 'Unknown'] = match;
  return { fileName, functionName, lineNumber };
};
