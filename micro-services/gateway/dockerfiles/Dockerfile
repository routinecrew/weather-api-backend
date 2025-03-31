FROM node:18-alpine AS builder

WORKDIR /app

# 소스 코드 복사
COPY . .

# 의존성 설치 
RUN npm install

# 빌드
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/IPB_250104_250305.csv ./dist/

# 프로덕션 의존성만 설치
RUN npm install --only=production

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 앱 실행
CMD ["node", "dist/server.js"]