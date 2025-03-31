#!/bin/bash
set -e

echo "🚀 서비스 배포를 시작합니다..."

# 필요한 디렉토리 생성
mkdir -p database/postgres.d
mkdir -p dockerfiles

# init.sql 파일이 없으면 생성
if [ ! -f database/postgres.d/init.sql ]; then
  echo "init.sql 파일을 생성합니다..."
  cat > database/postgres.d/init.sql << EOF
SELECT 'CREATE DATABASE weather_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_db')\gexec
EOF
fi

# Dockerfile.postgres 파일이 없으면 생성
if [ ! -f dockerfiles/Dockerfile.postgres ]; then
  echo "Dockerfile.postgres 파일을 생성합니다..."
  cat > dockerfiles/Dockerfile.postgres << EOF
FROM postgres:15.1-alpine

LABEL version="1.0.0" 
LABEL maintainer="kang san"

WORKDIR /docker-entrypoint-initdb.d/

# 컨텍스트가 상위 디렉토리로 설정되어 있으므로 경로 수정
COPY database/postgres.d/init.sql ./

RUN chmod 755 ./init.sql
EOF
fi

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
EOF
fi

# .env 파일을 dockerfiles 디렉토리에 복사
cp .env dockerfiles/.env

# docker-compose.yml 파일 생성
echo "docker-compose.yml 파일을 생성합니다..."
cat > dockerfiles/docker-compose.yml << EOF
version: '3.8'

services:
  weather-postgres:
    build:
      context: ..
      dockerfile: dockerfiles/Dockerfile.postgres
    container_name: weather-postgres
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DB: \${POSTGRES_DATABASE:-weather_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-postgres}"]
      timeout: 20s
      interval: 5s
      start_period: 5s
      retries: 5
    networks:
      - weather-network
    restart: unless-stopped

  weather-service:
    build:
      context: ../../..
      dockerfile: micro-services/gateway/dockerfiles/Dockerfile
    container_name: weather-service
    environment:
      NODE_ENV: \${NODE_ENV:-production}
      PORT: \${PORT:-3000}
      POSTGRES_HOST: weather-postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DATABASE: \${POSTGRES_DATABASE:-weather_db}
      TZ: \${TZ:-Asia/Seoul}
      APP_NAME: \${APP_NAME:-weather-service}
    depends_on:
      - weather-postgres
    ports:
      - "\${PORT:-3000}:3000"
    networks:
      - weather-network
    restart: unless-stopped

networks:
  weather-network:
    driver: bridge

volumes:
  postgres_data:
EOF

# Dockerfile 생성
echo "Dockerfile 파일을 생성합니다..."
cat > dockerfiles/Dockerfile << EOF
# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# gateway 서비스 관련 파일 복사
COPY micro-services/gateway/ ./micro-services/gateway/

# 의존성 설치 및 빌드
RUN pnpm install
RUN cd micro-services/gateway && pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# bash 및 pnpm 설치
RUN apk add --no-cache bash && npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# gateway 서비스 패키지 파일 복사
COPY micro-services/gateway/package.json ./micro-services/gateway/

# 프로덕션 의존성 설치
RUN pnpm install --prod

# 빌드된 파일 복사
COPY --from=builder /app/micro-services/gateway/dist ./micro-services/gateway/dist
# CSV 파일 복사
COPY --from=builder /app/micro-services/gateway/src/IPB_250104_250305.csv ./micro-services/gateway/dist/

# wait-for-it 스크립트 추가
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 작업 디렉토리 설정
WORKDIR /app/micro-services/gateway

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 앱 실행 (데이터베이스 연결 대기 후)
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]
EOF

# 환경 변수 출력
echo "📋 현재 환경 변수:"
echo "POSTGRES_USER=${POSTGRES_USER:-postgres}"
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres123}"
echo "POSTGRES_DATABASE=${POSTGRES_DATABASE:-weather_db}"

# dockerfiles 디렉토리로 이동
cd dockerfiles

# 기존 컨테이너 중지
echo "🛑 기존 컨테이너를 중지합니다..."
docker-compose down || true

# Docker 이미지 빌드 및 컨테이너 시작
echo "🏗️ Docker 이미지를 빌드하고 컨테이너를 시작합니다..."
docker-compose up -d --build

echo "✅ 서비스 배포가 완료되었습니다!"