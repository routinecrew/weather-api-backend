export const getEnvVariable = (env: NodeJS.ProcessEnv, key: string, defaultValue?: string): string => {
  const value = env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default value provided`);
  }
  return value ?? defaultValue!;
};

export const getEnvNumber = (env: NodeJS.ProcessEnv, key: string, defaultValue?: number): number => {
  const value = getEnvVariable(env, key, defaultValue?.toString());
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return parsed;
};

export const getEnvBoolean = (env: NodeJS.ProcessEnv, key: string, defaultValue: boolean): boolean => {
  const value = getEnvVariable(env, key, defaultValue.toString());
  return value.toLowerCase() === 'true';
};
