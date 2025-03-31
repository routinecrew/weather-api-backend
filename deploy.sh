#!/bin/bash
set -e

echo "🚀 서비스 배포를 시작합니다..."

# 필요한 디렉토리 생성
mkdir -p postgres.d
mkdir -p build

# init.sql 파일이 없으면 생성
if [ ! -f postgres.d/init.sql ]; then
  echo "init.sql 파일을 생성합니다..."
  cat > postgres.d/init.sql << EOF
SELECT 'CREATE DATABASE weather_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_db')\gexec
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
AES_KEY=abcde12345abcde12345abcde12345ab
SALT=your-salt-here
EOF
fi

# Dockerfile 생성
echo "Dockerfile 파일을 생성합니다..."
cat > Dockerfile << EOF
# 빌드 단계
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src/ ./src/
RUN pnpm install
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache bash && npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
COPY .env /app/.env
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist/
COPY src/IPB_250104_250305.csv ./dist/
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]
EOF

# docker-compose.yml 파일 생성
echo "docker-compose.yml 파일을 생성합니다..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  weather-postgres:
    build:
      context: .
      dockerfile: Dockerfile.postgres
    container_name: weather-postgres
    env_file:
      - .env
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
      context: .
      dockerfile: Dockerfile
    container_name: weather-service
    env_file:
      - .env
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

# 환경 변수 출력
echo "📋 현재 환경 변수:"
echo "POSTGRES_USER=${POSTGRES_USER:-postgres}"
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres123}"
echo "POSTGRES_DATABASE=${POSTGRES_DATABASE:-weather_db}"

# 기존 컨테이너 중지
echo "🛑 기존 컨테이너를 중지합니다..."
docker-compose down || true

# Docker 이미지 빌드 및 컨테이너 시작
echo "🏗️ Docker 이미지를 빌드하고 컨테이너를 시작합니다..."
docker-compose up -d --build --no-cache  # 캐시 무시 옵션 추가

echo "✅ 서비스 배포가 완료되었습니다!"