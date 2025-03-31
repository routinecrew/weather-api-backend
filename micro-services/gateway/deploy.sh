#!/bin/bash
set -e

echo "🚀 Starting gateway service deployment..."

# 현재 디렉토리는 micro-services/gateway 입니다

# .env 파일이 없으면 생성
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.production .env || cp .env.example .env || {
    cat > .env << EOF
NODE_ENV=production
PORT=3000
POSTGRES_HOST=43.202.164.46
POSTGRES_PORT=5432
POSTGRES_USER=weather_user
POSTGRES_PASSWORD=secure_password_2025\$ 
POSTGRES_DATABASE=weather_db
TZ=Asia/Seoul
APP_NAME=weather-service
EOF
  }
fi

# 환경 변수 로드
export $(grep -v '^#' .env | xargs)

# 모노레포 루트 디렉토리로 이동
cd ../../

# 컨테이너 중지 및 시작
echo "🛑 Stopping existing containers..."
docker-compose -f micro-services/gateway/dockerfiles/docker-compose.yml down || true

echo "🏗️ Building and starting containers..."
docker-compose -f micro-services/gateway/dockerfiles/docker-compose.yml up -d --build

echo "✅ Gateway service deployment completed successfully!"