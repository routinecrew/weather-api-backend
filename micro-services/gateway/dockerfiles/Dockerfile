# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Alpine 이미지인 경우 bash 설치 추가
RUN apk add --no-cache bash

# Copy package files - 컨텍스트가 gateway 디렉토리로 변경됨
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install

# Copy source code - 컨텍스트가 gateway 디렉토리로 변경됨
COPY src/ ./src/
COPY service-init/ ./service-init/
COPY shared/ ./shared/

# Build application
RUN pnpm build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for production
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Add wait-for-it script
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Start the application
CMD ["/bin/sh", "-c", "node dist/server.js"]