// src/shared/utils/env.ts
export const getEnvVariable = (
    env: NodeJS.ProcessEnv,
    key: string,
    defaultValue: string = '',
  ): string => {
    return env[key] || defaultValue;
  };
  
  export const getEnvNumber = (
    env: NodeJS.ProcessEnv,
    key: string,
    defaultValue: number = 0,
  ): number => {
    const value = env[key];
    return value ? Number(value) : defaultValue;
  };
  
  export const getEnvBoolean = (
    env: NodeJS.ProcessEnv, 
    key: string,
    defaultValue: boolean = false,
  ): boolean => {
    const value = env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  };