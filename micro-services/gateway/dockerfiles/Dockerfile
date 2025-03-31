# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# pnpm 설치 (프로젝트가 pnpm을 사용하는 경우)
RUN npm install -g pnpm

# 모노레포 루트 컨텍스트에 맞게 설정
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY micro-services/gateway/package.json ./micro-services/gateway/
COPY micro-services/gateway/tsconfig.json ./micro-services/gateway/

# 의존성 설치
RUN pnpm install

# 소스 코드 복사
COPY micro-services/gateway/ ./micro-services/gateway/

# 빌드
WORKDIR /app/micro-services/gateway
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 모노레포 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY micro-services/gateway/package.json ./micro-services/gateway/

# 프로덕션 의존성만 설치
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