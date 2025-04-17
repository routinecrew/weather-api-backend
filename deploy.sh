#!/bin/bash
set -e

echo "🚀 배포 시작..."

# Git에서 최신 코드 가져오기
git pull

# Docker 컨테이너 빌드 및 시작
docker-compose down
docker-compose build
docker-compose up -d

# 컨테이너가 완전히 시작될 때까지 대기
echo "⏳ 서비스가 시작될 때까지 대기 중..."
sleep 10

# 데이터베이스 상태 확인
echo "🔍 데이터베이스 상태 확인 중..."
if docker exec weather-postgres psql -U postgres -d weather_db -c "SELECT COUNT(*) FROM weather;" > /dev/null 2>&1; then
  echo "✅ 데이터베이스 테이블이 존재합니다."
else
  echo "⚠️ 데이터베이스 테이블이 아직 없습니다. 잠시 후 다시 확인하세요."
fi

# CSV 데이터 가져오기 실행
echo "📊 CSV 데이터 가져오기 실행..."
docker exec weather-service sh -c "cd /app/dist && node scripts/importWeatherCsv.js"

echo "✅ 배포 완료!"