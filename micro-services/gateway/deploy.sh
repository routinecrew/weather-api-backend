#!/bin/bash
set -e

echo "🚀 Starting gateway service deployment..."

# 현재 디렉토리는 micro-services/gateway 입니다

# .env 파일이 없으면 생성 (각 환경에 맞게 수정)
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.production .env || cp .env.example .env || {
    cat > .env << EOF
NODE_ENV=production
PORT=3000
POSTGRES_HOST=43.202.164.46
POSTGRES_PORT=5432
POSTGRES_USER=weather_user
POSTGRES_PASSWORD=secure_password_2025$ 
POSTGRES_DATABASE=weather_db
TZ=Asia/Seoul
APP_NAME=weather-service
EOF
  }
fi

# 환경 변수 로드
export $(grep -v '^#' .env | xargs)

# dockerfiles 디렉토리로 이동 (docker-compose.yml이 있는 위치)
cd dockerfiles

# 이미 실행 중인 컨테이너가 있으면 중지
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Docker 이미지 빌드 및 컨테이너 시작
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

echo "✅ Gateway service deployment completed successfully!"