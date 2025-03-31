# 빌드 단계
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src/ ./src/
RUN pnpm install
RUN pnpm build

# 프로덕션 단계에서:
FROM node:18-alpine

WORKDIR /app

# bash 설치 및 pnpm 설치
RUN apk add --no-cache bash && npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml ./
COPY .env /app/.env

# 프로덕션 의존성 설치 + pg 패키지 추가
RUN pnpm install --prod && pnpm add pg@8.11.3


# .env 파일 생성
RUN echo "NODE_ENV=production\n\
PORT=3000\n\
POSTGRES_HOST=weather-postgres\n\
POSTGRES_PORT=5432\n\
POSTGRES_USER=postgres\n\
POSTGRES_PASSWORD=postgres123\n\
POSTGRES_DATABASE=weather_db\n\
TZ=Asia/Seoul\n\
APP_NAME=weather-service" > /app/.env

RUN pnpm install --prod
COPY --from=builder /app/dist ./dist/
COPY src/IPB_250104_250305.csv ./dist/
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]