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
WORKDIR /app/micro-services/gateway
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# 루트 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# gateway 서비스 패키지 파일 복사
COPY micro-services/gateway/package.json ./micro-services/gateway/

# pnpm 설치
RUN npm install -g pnpm

# 프로덕션 의존성 설치
RUN pnpm install --prod

# 빌드된 파일 복사
COPY --from=builder /app/micro-services/gateway/dist ./micro-services/gateway/dist
COPY --from=builder /app/micro-services/gateway/src/IPB_250104_250305.csv ./micro-services/gateway/dist/

# 작업 디렉토리 설정
WORKDIR /app/micro-services/gateway

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 앱 실행
CMD ["node", "dist/server.js"]