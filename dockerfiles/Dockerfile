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
RUN apk add --no-cache bash python3 make g++ gcc libc-dev linux-headers && npm install -g pnpm

# 루트 파일 복사
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성 설치 (bcrypt를 새로 컴파일)
RUN pnpm install --prod
# bcrypt 명시적으로 재빌드 추가 
RUN cd node_modules/bcrypt && npm rebuild bcrypt --build-from-source

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist/
# CSV 파일 복사
COPY src/IPB_250104_250305.csv ./dist/

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