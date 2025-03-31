#!/bin/bash
set -e

echo "🚀 Weather API 서비스 배포를 시작합니다..."

# 필요한 디렉토리 구조 생성
echo "📁 디렉토리 구조를 생성합니다..."
mkdir -p src/shared/utils
mkdir -p postgres.d
mkdir -p logs
mkdir -p resources/temp
mkdir -p resources/upload

# 유틸리티 파일 생성 (빌드 오류 해결)
echo "🔧 유틸리티 파일을 생성합니다..."

# 유틸리티 인덱스 파일 생성
cat > src/shared/utils/index.ts << 'EOF'
export * from './env';
export * from './common';
export * from './path';
export * from './response';
EOF

# 환경 변수 유틸리티 생성
cat > src/shared/utils/env.ts << 'EOF'
/**
 * 환경 변수 유틸리티 함수들
 */
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
EOF

# 공통 유틸리티 생성
cat > src/shared/utils/common.ts << 'EOF'
/**
 * 공통 유틸리티 함수들
 */
import fs from 'fs';
import { STATUS_PHRASE } from '../constants/http-phrase';

// Pick 유틸리티 함수
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
};

// 응답 메시지 유틸리티 함수
export const getResponsePhrase = (statusCode: number): string => {
  return STATUS_PHRASE[statusCode] || 'Unknown Status';
};

// 에러 스택 파싱 유틸리티 함수
export const parseErrorStack = (stack: string) => {
  const stackLines = stack.split('\n').filter(line => line.includes('at '));
  const firstLine = stackLines[0] || '';
  
  // Extract file name, function name, and line number
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

// 시퀄라이즈 로깅 유틸리티
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
EOF

# 경로 유틸리티 생성
cat > src/shared/utils/path.ts << 'EOF'
/**
 * 경로 관련 유틸리티 함수들
 */
import fs from 'fs';
import { join } from 'path';
import { path as rootPath } from 'app-root-path';
import { TenantSchema } from '../configs/schema.config';

// 디렉토리 생성 유틸리티 함수
export const makeDirectory = (dirPath: string): void => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Error creating directory: ${dirPath}`, error);
    throw error;
  }
};

// 공통 경로 상수들
export const resourcePath = join(rootPath, 'resources');
export const tempPath = (schema: TenantSchema | string) => join(resourcePath, 'temp', schema);
export const uploadPath = (schema: TenantSchema | string) => join(resourcePath, 'upload', schema);
EOF

# 응답 유틸리티 생성
cat > src/shared/utils/response.ts << 'EOF'
/**
 * 응답 관련 유틸리티 함수들
 */
import { Response } from 'express';
import { STATUS_CODES } from '../constants/http-status';
import { BaseResponse } from '../shared-types';

// 성공 응답 유틸리티 함수
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

// 에러 응답 유틸리티 함수
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
EOF

# init.sql 파일이 없으면 생성
echo "SQL 초기화 스크립트를 생성합니다..."
cat > postgres.d/init.sql << EOF
SELECT 'CREATE DATABASE weather_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_db')\gexec
EOF

# .env 파일이 없으면 생성
if [ ! -f .env ]; then
  echo "📝 .env 파일을 생성합니다..."
  cat > .env << EOF
NODE_ENV=production
PORT=3000
POSTGRES_HOST=weather-postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DATABASE=weather_db
TZ=Asia/Seoul
APP_NAME=weather-service
ALTER_TABLE=true
EOF
fi

# Dockerfile.postgres 파일 생성
echo "Dockerfile.postgres 파일을 생성합니다..."
cat > Dockerfile.postgres << EOF
FROM postgres:15.1-alpine

LABEL version="1.0.0" 
LABEL maintainer="kang san"

WORKDIR /docker-entrypoint-initdb.d/

COPY postgres.d/init.sql ./

RUN chmod 755 ./init.sql
EOF

# Dockerfile 생성 - 제공해주신 개선된 내용 반영
echo "Dockerfile 파일을 생성합니다..."
cat > Dockerfile << EOF
# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# 빌드 도구 설치 (더 포괄적인 도구 세트)
RUN apk add --no-cache python3 make g++ gcc libc-dev linux-headers

# pnpm 설치
RUN npm install -g pnpm

# 필요한 파일 복사
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src/ ./src/

# 의존성 설치 및 빌드
RUN pnpm install
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# 빌드 도구 및 bash 설치 (더 포괄적인 도구 세트)
RUN apk add --no-cache bash python3 make g++ gcc lib