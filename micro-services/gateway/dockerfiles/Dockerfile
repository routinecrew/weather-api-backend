# Use node:18 as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Install pnpm globally (필요하다면 유지, 필요없으면 npm 사용)
RUN npm install -g pnpm

# Download wait-for-it script (데이터베이스 연결 대기에 유용)
RUN curl -o /wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && chmod +x /wait-for-it.sh

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy tsconfig.json
COPY tsconfig.json ./

# Copy environment files
COPY .env* ./

# Copy source code
COPY src/ ./src/
COPY shared/ ./shared/
COPY service-init/ ./service-init/

# Set NODE_ENV to production unless specified otherwise
ENV NODE_ENV=production

# Set timezone
ENV TZ=Asia/Seoul

# Expose the application port
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]