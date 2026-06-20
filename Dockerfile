# ============================================================
# LoanCalc 后端 Docker 镜像
# 构建: docker build -t loancalc-server .
# 运行: docker run -d -p 3002:3002 -v loancalc_data:/app/server/data --name loancalc-server loancalc-server
# ============================================================

FROM node:20-alpine

# better-sqlite3 需要编译工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 只复制 server 依赖文件，利用 Docker 缓存层
COPY server/package.json server/package-lock.json ./

# 安装生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# 复制 server 源码
COPY server/ ./

# 数据目录（挂载点，用于持久化 SQLite 数据库）
RUN mkdir -p /app/data && chown -R node:node /app
VOLUME ["/app/data"]

# 切换到非 root 用户
USER node

EXPOSE 3002

ENV PORT=3002
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3002/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
