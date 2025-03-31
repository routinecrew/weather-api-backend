/**
 * 환경 변수 값을 가져오는 함수
 * @param env 환경 변수 객체 (process.env)
 * @param key 환경 변수 키
 * @param defaultValue 기본값 (선택사항)
 * @returns 환경 변수 값 또는 기본값
 */
export const getEnvVariable = (env: NodeJS.ProcessEnv, key: string, defaultValue?: string): string => {
  const value = env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

/**
 * 숫자 타입의 환경 변수 값을 가져오는 함수
 * @param env 환경 변수 객체 (process.env)
 * @param key 환경 변수 키
 * @param defaultValue 기본값 (선택사항)
 * @returns 환경 변수의 숫자 값 또는 기본값
 */
export const getEnvNumber = (env: NodeJS.ProcessEnv, key: string, defaultValue?: number): number => {
  const value = env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} is not a number`);
  }
  
  return numValue;
};

/**
 * 불리언 타입의 환경 변수 값을 가져오는 함수
 * @param env 환경 변수 객체 (process.env)
 * @param key 환경 변수 키
 * @param defaultValue 기본값 (선택사항)
 * @returns 환경 변수의 불리언 값 또는 기본값
 */
export const getEnvBoolean = (env: NodeJS.ProcessEnv, key: string, defaultValue?: boolean): boolean => {
  const value = env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value.toLowerCase() === 'true';
};