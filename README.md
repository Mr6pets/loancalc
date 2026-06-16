# 贷款利率核算工具

基于 Taro 4.x + React + TypeScript 的跨端计算器，支持等额本息 / 等额本金 / 先息后本三种还款方式，覆盖正向计算、反向核算和 XIRR 流水分析。

## 功能

- **反推利率** — 输入本金、期数、月供，IRR 二分法精算真实年化 APR
- **正向计算** — 输入本金、期数、年利率，算出台上每月还款金额
- **流水分析** — 粘贴还款流水，XIRR 分析不规则现金流的实际利率
- **合同对比** — 录入合同年利率，自动判定是否多收费
- **还款明细** — 逐期本金、利息、剩余本金明细表
- **历史记录** — 支持本地存储 + MySQL 云端同步，跨设备查看
- **后台管理** — 独立管理面板，数据表格、统计、搜索筛选、CSV 导出
- **PWA 支持** — 支持添加到手机主屏幕，接近原生 App 体验

## 技术栈

| 类别     | 技术                             |
| -------- | -------------------------------- |
| 前端     | Taro 4.1.9 + React 18 + SCSS     |
| 语言     | TypeScript 5.x                   |
| 后端     | Express + MySQL / SQLite 双模式   |
| 后台     | 纯 HTML 管理面板（暗色主题）      |
| 构建     | Webpack 5                        |
| 辅助     | Python (PDF 账单提取 & 利率验证)  |

## 目录结构

```
calculateinterest/
├── src/                        # 前端源码
│   ├── pages/                  #   页面
│   │   ├── index/              #     计算器（首页）
│   │   ├── result/             #     还款明细结果
│   │   ├── detail/             #     记录详情
│   │   ├── bills/              #     账单分析
│   │   ├── records/            #     历史记录
│   │   └── mine/               #     我的
│   ├── components/
│   │   ├── CalcCard/           #     参数输入卡片
│   │   ├── ResultCard/         #     结果展示卡片（SVG 仪表盘）
│   │   ├── CustomTabBar/       #     自定义底部导航
│   │   ├── EmptyState/         #     空状态占位
│   │   └── BackButton/         #     返回按钮
│   ├── utils/calc.ts           #   核心计算引擎
│   ├── types/loan.ts           #   类型定义
│   ├── hooks/useRecords.ts     #   历史记录 Hook（API + localStorage）
│   ├── data/bills.ts           #   演示账单数据
│   └── styles/                 #   全局样式变量
├── server/                     # 后端服务
│   ├── index.js                #   Express API + /admin 路由
│   ├── db.js                   #   MySQL / SQLite 双模式数据库
│   ├── admin.html              #   后台管理面板
│   ├── schema.sql              #   手动建表 SQL
│   └── .env.example            #   环境变量模板
├── config/                     # Taro 构建配置
├── pdf/                        # 信用卡账单 PDF（浦发万用金 2017-2020）
├── extract_loans.py            # PDF 提取脚本
├── verify_rate.py              # 利率验证脚本
└── nginx.conf.example          # Nginx 部署配置
```

## 快速开始 — 前端

```bash
# 安装依赖
npm install

# H5 本地开发（浏览器预览）
npm run dev:h5
# → http://localhost:10087/

# H5 生产构建
npm run build:h5

# 微信小程序
npm run dev:weapp
npm run build:weapp

# 支付宝小程序
npm run dev:alipay

# 字节跳动小程序
npm run dev:tt
```

## 快速开始 — 后端

后端默认使用 **SQLite（零配置）**，无需安装任何数据库。

```bash
# 安装服务端依赖
cd server
npm install

# 启动 API 服务
node index.js
```

启动后可访问：

| 地址                               | 说明            |
| ---------------------------------- | --------------- |
| `http://localhost:3001/admin`       | 后台管理面板     |
| `http://localhost:3001/api/records` | 数据 API         |
| `http://localhost:3001/api/stats`   | 统计 API         |

### 数据库模式

```
有 .env (DB_HOST=xxx)  → MySQL（生产环境 / 阿里云 RDS）
无 .env                → SQLite（本地开发，数据存 server/data.db）
```

**切换到 MySQL：**

```bash
cd server
cp .env.example .env
# 编辑 .env 填入数据库连接信息
vim .env
```

`.env` 内容：

```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=loan_calc
PORT=3001
```

## 前端连接后端

构建时设置 `TARO_APP_API_BASE` 环境变量指向你的 API 地址：

```bash
# 同域部署（推荐，前端和 API 在同一 Nginx 下）
npm run build:h5

# 跨域部署
set TARO_APP_API_BASE=https://api.your-domain.com
npm run build:h5
```

未设置时前端自动降级为 localStorage 本地存储，功能不受影响。

## 服务器部署

```bash
# 1. 上传文件
scp -r dist/ server/ user@your-server:/var/www/loan-calc/

# 2. 安装依赖
cd /var/www/loan-calc/server && npm install

# 3. 配置环境变量（生产环境用 MySQL）
cp .env.example .env && vim .env

# 4. MySQL 建库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loan_calc CHARACTER SET utf8mb4"

# 5. 启动服务（可使用 pm2 守护）
pm2 start index.js --name loan-api

# 6. Nginx 配置（参考 nginx.conf.example）
# /       → dist/ 前端静态文件
# /api/*  → 127.0.0.1:3001 API
# /admin  → 127.0.0.1:3001 后台管理
nginx -t && nginx -s reload
```

## 计算模式

| 模式     | 说明                                                     |
| -------- | -------------------------------------------------------- |
| 反推利率 | 已知月供 → IRR 二分法反推月利率 → 年化 APR              |
| 正向计算 | 已知年利率 → 计算每月还款金额                            |
| 流水分析 | 粘贴还款记录 → XIRR 分析不规则现金流实际利率（最灵活）   |

### 还款方式

| 方式       | 每月还款         | XIRR 流水分析 |
| ---------- | ---------------- | :-----------: |
| 等额本息   | 固定金额          |      支持      |
| 等额本金   | 逐月递减          |      支持      |
| 先息后本   | 每月付息，末本息  |      支持      |

### 流水粘贴格式

支持直接从银行流水、支付宝、微信账单复制粘贴：

```
2020-01-15 5389.81
2020/02/15, 5389.81
1月15日 ¥5,389.81
5389.81
```

每行包含金额即可，日期非必填。支持逗号、空格、Tab 分隔。

## PDF 账单提取（可选）

```bash
pip install pdfplumber
python extract_loans.py    # 提取账单数据
python verify_rate.py      # 验证等额本息与 IRR 公式
```

## 计算原理

### 等额本息二分法

已知本金 P、期数 n、月供 A，二分法求解月利率 r：

```
A = P × r × (1+r)^n / ((1+r)^n - 1)
```

### 年化 APR

```
APR = (1 + r)^12 - 1
```

### XIRR（不规则现金流）

与期数无关，直接用实际金额和日期间的净现值函数二分求解：

```
NPV(r) = -P + Σ(CFᵢ / (1+r)^(tᵢ/365))
```

## PWA 安装

部署到 HTTPS 后，手机浏览器打开 → 自动弹窗"添加到主屏幕"或手动菜单选择。安装后：

- 全屏运行，无边浏览器地址栏
- 桌面显示渐变图标
- 离线可用（Service Worker 缓存）

## 许可证

MIT
