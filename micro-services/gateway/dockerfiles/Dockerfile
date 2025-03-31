# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Alpine 이미지인 경우 bash 설치 추가
RUN apk add --no-cache bash

# 모노레포 루트 컨텍스트에 맞게 수정
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ../../
COPY micro-services/gateway/package.json ./
COPY tsconfig.base.json ../../
COPY micro-services/gateway/tsconfig.json ./
COPY . ./

# 소스 코드 복사
COPY micro-services/gateway/ ./micro-services/gateway/

# Build application
RUN pnpm --filter @micro-services/gateway build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# 모노레포 루트 컨텍스트에 맞게 수정
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY micro-services/gateway/package.json ./micro-services/gateway/

# Install production dependencies only
RUN pnpm install --prod

# Copy built files from builder stage
COPY --from=builder /app/micro-services/gateway/dist ./micro-services/gateway/dist

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Add wait-for-it script
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Set working directory to gateway service
WORKDIR /app/micro-services/gateway

# Start the application
CMD ["/bin/sh", "-c", "node dist/server.js"]