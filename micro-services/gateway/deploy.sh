#!/bin/bash
set -e

echo "🚀 서비스 배포를 시작합니다..."

# 필요한 디렉토리가 없으면 생성
mkdir -p data/postgres
mkdir -p database/postgres.d

# init.sql 파일이 없으면 생성
if [ ! -f database/postgres.d/init.sql ]; then
  echo "init.sql 파일을 생성합니다..."
  cat > database/postgres.d/init.sql << EOF
SELECT 'CREATE DATABASE weather_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_db')\gexec
EOF
fi

# .env 파일이 없으면 생성
if [ ! -f .env ]; then
  echo "📝 .env 파일을 생성합니다..."
  cp .env.production .env 2>/dev/null || cp .env.example .env 2>/dev/null || {
    cat > .env << EOF
NODE_ENV=production
PORT=3000
POSTGRES_HOST=weather-postgres
POSTGRES_PORT=5432
POSTGRES_USER=weather_user
POSTGRES_PASSWORD=secure_password_2025$
POSTGRES_DATABASE=weather_db
TZ=Asia/Seoul
APP_NAME=weather-service
EOF
  }
fi

# Move to dockerfiles directory
cd dockerfiles

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

echo "✅ Gateway service deployment completed successfully!"