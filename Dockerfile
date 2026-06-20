# ============================================================
# LoanCalc 后端 Docker 镜像
# 基于 node:20-slim（Debian），better-sqlite3 有预编译二进制
# 无需安装 gcc/g++，构建速度从 40 分钟降到几十秒
# ============================================================

FROM node:20-slim

WORKDIR /app

# 只复制依赖文件，利用 Docker 缓存层
COPY server/package.json server/package-lock.json ./

# 安装生产依赖（better-sqlite3 使用预编译二进制，无需编译工具）
RUN npm ci --omit=dev && npm cache clean --force

# 复制 server 源码
COPY server/ ./

# 数据目录
RUN mkdir -p /app/data && chown -R node:node /app
VOLUME ["/app/data"]

USER node

EXPOSE 3002

ENV PORT=3002
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3002/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
