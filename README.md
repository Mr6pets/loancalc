# LoanCalc 贷款利率核算

基于 Taro 的多端贷款计算器，支持等额本息、流水法 XIRR 等还款方式的正向/逆向计算。

- 前端：Taro v4 + React + TypeScript + SCSS
- 后端：Express + MySQL（兼容 SQLite）
- 部署：nginx 反向代理，挂载在 `guluwater.com/loancalc/`

## 线上地址

| 页面 | URL |
|------|-----|
| 首页 | <https://guluwater.com/loancalc/> |
| 后台管理 | <https://guluwater.com/loancalc/admin> |
| API | <https://guluwater.com/loancalc/api/records> |

---

## 本地开发

### 环境要求

- Node.js >= 18
- （可选）MySQL 8.0，不装则自动切换 SQLite

### 启动前端

```bash
# 安装根目录依赖
npm install

# 启动 H5 开发服务器
npm run dev:h5
```

浏览器访问 <http://localhost:10086/>

### 启动后端

```bash
cd server
npm install

# 复制环境变量
cp .env.example .env

# 修改 .env 配置
# - 有 MySQL：填入真实连接信息
# - 无 MySQL：注释 DB_HOST，自动使用 SQLite
# - ADMIN_PASSWORD: 后台管理密码（默认 admin123）

# 启动
npm run dev
```

后端运行在 <http://localhost:3002>

### 本地开发注意

- 开发模式 `API_BASE` 为空字符串，保存到 localStorage，不调用后端
- 若需测试后端，需注释 `src/hooks/useRecords.ts` 中 `apiAvailable` 的判断

---

## 发布打包

```bash
# Windows PowerShell
.\release.ps1
```

脚本自动执行：
1. `npm run build:h5` 构建前端
2. 按服务器目录结构整理到 `release/`

输出结构：
```
release/
├── loancalc/
│   ├── h5/          → 前端 dist → /home/loadcalc/h5/
│   ├── server/      → 后端 → /home/loadcalc/server/
│   └── webadmin/    → 后台页面 → /home/loadcalc/webadmin/
└── nginx/conf.d/
    ├── 03_loadcalc.conf
    └── 99_static_subdomains.conf
```

---

## 服务器部署

### 1. 上传文件

```bash
scp -r release/loancalc/                 root@服务器:/home/
scp release/nginx/conf.d/*.conf          root@服务器:/etc/nginx/conf.d/includes/
```

### 2. 服务器端操作

```bash
# 创建并修改 .env
cp /home/loadcalc/server/.env.example /home/loadcalc/server/.env
# 编辑 .env：填入 MySQL 真实密码、修改 ADMIN_PASSWORD

# 建库（仅首次）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loancalc_db DEFAULT CHARSET utf8mb4;"

# 初始化表（服务启动自动建表，也可手动执行）
# mysql -u root -p loancalc_db < /home/loadcalc/server/schema.sql

# 如果表已存在需要新增 device_name 列：
# mysql -u root -p loancalc_db -e "ALTER TABLE calc_records ADD COLUMN device_name VARCHAR(60) DEFAULT '' AFTER result_json;"

# 安装依赖
cd /home/loadcalc/server && npm install

# 重载 nginx
nginx -t && nginx -s reload

# 启动后端（pm2 守护）
pm2 start /home/loadcalc/server/index.js --name loancalc
pm2 save
```

### 3. 后续更新

```bash
# 前端更新
scp -r release/loancalc/h5/* root@服务器:/home/loadcalc/h5/

# 后端更新
scp release/loancalc/server/index.js root@服务器:/home/loadcalc/server/
scp release/loancalc/webadmin/index.html root@服务器:/home/loadcalc/webadmin/
pm2 restart loancalc
```

---

## 目录结构

```
loancalc/
├── src/                 # 前端源码
│   ├── pages/           # 页面（index/records/bills/result/detail/mine）
│   ├── components/      # 组件（CalcCard/ResultCard/ScheduleTable/…）
│   ├── hooks/           # useRecords（本地 + API 双写）
│   ├── utils/           # calc.ts（核心计算引擎）
│   ├── data/            # bills.ts（账单模板）
│   └── types/           # TypeScript 类型定义
├── config/              # Taro 构建配置（dev/prod）
├── server/              # 后端
│   ├── index.js         # Express 入口 + 路由
│   ├── db.js            # MySQL/SQLite 连接池 + 建表
│   ├── schema.sql       # MySQL 建表语句
│   ├── admin.html       # 后台管理页面
│   ├── .env.example     # 环境变量模板
│   └── .env             # 线上环境变量（不入库）
├── nginx/               # nginx 配置（不入库，参考 conf.d/includes/）
├── release.ps1          # 发布打包脚本
└── dist/                # 构建产物（不入库）
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | MySQL 地址，注释则用 SQLite | `127.0.0.1` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USER` | MySQL 用户 | `root` |
| `DB_PASSWORD` | MySQL 密码 | — |
| `DB_NAME` | 数据库名 | `loancalc_db` |
| `PORT` | 后端端口 | `3002` |
| `ADMIN_PASSWORD` | 后台管理密码 | `admin123` |
