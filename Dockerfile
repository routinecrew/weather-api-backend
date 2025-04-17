# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 필요한 파일 복사
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src/ ./src/
COPY .env /app/.env

# 의존성 설치 및 빌드
RUN pnpm install
RUN pnpm add pg@8.11.3
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# bash 설치 및 pnpm 설치
RUN apk add --no-cache bash && npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml ./
COPY .env /app/.env

# 프로덕션 의존성 설치
RUN pnpm install --prod
RUN pnpm add pg@8.11.3

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist/
# CSV 파일 복사
COPY src/IPB_250104_250305.csv ./dist/

# wait-for-it 스크립트 추가
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=9092
ENV POSTGRES_HOST=weather-postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres123
ENV POSTGRES_DATABASE=weather_db

# 포트 노출
EXPOSE 9092

# 앱 실행 (데이터베이스 연결 대기 후)
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]
