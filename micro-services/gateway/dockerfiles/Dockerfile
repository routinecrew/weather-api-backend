# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY micro-services/gateway/package.json ./micro-services/gateway/

# Install dependencies
RUN pnpm install

# Copy tsconfig files
COPY tsconfig.base.json ./
COPY micro-services/gateway/tsconfig.json ./micro-services/gateway/

# Copy source code for gateway service only
COPY micro-services/gateway/ ./micro-services/gateway/

# Build application
RUN pnpm --filter @micro-services/gateway build

# 프로덕션 단계
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for production
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
CMD ["/wait-for-it.sh", "weather-postgres:5432", "--", "node", "dist/server.js"]