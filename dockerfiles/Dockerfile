# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml ./

# src 디렉토리 복사
COPY src/ ./src/

# 의존성 설치 및 빌드
RUN pnpm install
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# bash 설치 및 pnpm 설치
RUN apk add --no-cache bash && npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성 설치
RUN pnpm install --prod

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist/
# CSV 파일 복사
COPY --from=builder /app/src/IPB_250104_250305.csv ./dist/

# wait-for-it 스크립트 추가
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 앱 실행 (데이터베이스 연결 대기 후)
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]