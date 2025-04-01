import Redis from 'ioredis';
import { mqlogger } from './logger.config';
import { getEnvVariable, getEnvNumber } from '../utils';

type CacheKey = string;
type CacheTTL = number;
type ServiceType = 'grpc' | 'rest' | 'internal';

interface CacheConfig {
  readonly host: string;
  readonly port: number;
  readonly password: string;
  readonly db: number;
  readonly servicePrefixes: Record<ServiceType, string>;
  readonly defaultTTL: number;
  readonly maxRetriesPerRequest: number;
  readonly retryDelay: number;
  readonly maxRetryTime: number;
}

const createCacheConfig = (env: NodeJS.ProcessEnv): CacheConfig => ({
  host: getEnvVariable(env, 'REDIS_HOST', 'localhost'),
  port: getEnvNumber(env, 'REDIS_PORT', 6379),
  password: getEnvVariable(env, 'REDIS_PASSWORD', ''),
  db: getEnvNumber(env, 'REDIS_DB', 0),
  servicePrefixes: {
    grpc: 'grpc:',
    rest: 'rest:',
    internal: 'internal:',
  },
  defaultTTL: 300,
  maxRetriesPerRequest: 3,
  retryDelay: 500,
  maxRetryTime: 2000,
});

const createRedisClient = (config: CacheConfig): Redis => {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    retryStrategy: (times: number) => Math.min(times * config.retryDelay, config.maxRetryTime),
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    enableReadyCheck: true,
    reconnectOnError: (err) => err.message.includes('READONLY'),
  });

  client.on('connect', () => mqlogger.info('Successfully connected to Redis Cache'));
  client.on('error', (error) => mqlogger.error('Redis Cache connection error:', error));
  client.on('ready', () => mqlogger.info('Redis Cache is ready to handle requests'));
  client.on('reconnecting', () => mqlogger.warn('Redis Cache is reconnecting...'));

  return client;
};

const getCacheValue = async <T>(client: Redis, key: CacheKey): Promise<T | null> => {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    mqlogger.error(`Cache get error for key ${key}:`, error);
    throw error; // 에러를 상위로 전파
  }
};

const setCacheValue = async (client: Redis, key: CacheKey, value: unknown, ttl: CacheTTL): Promise<void> => {
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    mqlogger.error(`Cache set error for key ${key}:`, error);
    throw error; // 에러를 상위로 전파
  }
};

const deleteCacheValue = async (client: Redis, key: CacheKey): Promise<void> => {
  try {
    await client.del(key);
  } catch (error) {
    mqlogger.error(`Cache delete error for key ${key}:`, error);
    throw error; // 에러를 상위로 전파
  }
};

const deletePattern = async (client: Redis, pattern: string): Promise<void> => {
  try {
    let cursor = '0';
    do {
      const reply = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys.length) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    mqlogger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    throw error; // 에러를 상위로 전파
  }
};

type KeyGenerator = (params: any[]) => CacheKey;

const withCache =
  <T>(client: Redis, keyGenerator: KeyGenerator, ttl: CacheTTL = 300) =>
  (fn: (...args: any[]) => Promise<T>) =>
  async (...args: any[]): Promise<T> => {
    const key = keyGenerator(args);
    const cached = await getCacheValue<T>(client, key);

    if (cached) {
      mqlogger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    mqlogger.debug(`Cache miss for key: ${key}`);
    const result = await fn(...args);
    await setCacheValue(client, key, result, ttl);
    return result;
  };

const createCacheKey = (config: CacheConfig) => (service: ServiceType, key: string) =>
  `${config.servicePrefixes[service]}${key}`;

const config = createCacheConfig(process.env);
const redisClient = createRedisClient(config);
const buildCacheKey = createCacheKey(config);

export const cache = {
  get: <T>(key: CacheKey) => getCacheValue<T>(redisClient, key),
  set: (key: CacheKey, value: unknown, ttl: CacheTTL = config.defaultTTL) =>
    setCacheValue(redisClient, key, value, ttl),
  delete: (key: CacheKey) => deleteCacheValue(redisClient, key),
  deletePattern: (pattern: string) => deletePattern(redisClient, pattern),
  withServiceCache: <T>(service: ServiceType, keyGenerator: KeyGenerator, ttl?: CacheTTL) =>
    withCache<T>(redisClient, (args) => buildCacheKey(service, keyGenerator(args)), ttl),
};
