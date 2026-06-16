# 贷款利率核算工具

基于 Taro 4.x + React + TypeScript 的跨端小程序，帮助用户计算贷款真实年化利率 (APR)，支持账单分析、历史记录和利率验证。

## 功能

- **利率核算** — 输入本金、期数、月供，一键反推真实月利率和年化 APR，同时支持录入合同年利率进行多收费用对比
- **还款明细** — 自动生成等额本息 / 等额本金还款计划表，逐期明细一目了然
- **账单分析** — 上传信用卡账单 PDF，自动提取分期数据并核算利率（当前内置浦发万用金 2017–2020 真实账单演示数据）
- **历史记录** — 核算结果自动本地存储，支持查看、删除、清空，最多保留 50 条
- **多平台构建** — 支持微信、支付宝、字节跳动、H5 等多端一键编译

## 技术栈

| 类别       | 技术                                      |
| ---------- | ----------------------------------------- |
| 框架       | Taro 4.1.9                                |
| UI 框架    | React 18 + SCSS Modules                   |
| 语言       | TypeScript 5.x                            |
| 状态管理   | Zustand 4.x (Hooks 用法)                   |
| 构建       | Webpack 5                                 |
| 辅助工具   | Python (PDF 账单提取 & 利率验证)           |

## 目录结构

```
calculateinterest/
├── src/
│   ├── pages/                 # 页面
│   │   ├── index/             #   计算器（首页）
│   │   ├── result/            #   还款明细结果
│   │   ├── bills/             #   账单分析
│   │   ├── records/           #   历史记录
│   │   ├── detail/            #   记录详情
│   │   └── mine/              #   我的（使用说明/常见问题）
│   ├── components/            # 通用组件
│   │   ├── CalcCard/          #   参数输入卡片
│   │   ├── ResultCard/        #   结果展示卡片
│   │   └── EmptyState/        #   空状态占位
│   ├── utils/
│   │   └── calc.ts            # 核心计算（等额本息二分法、等额本金、APR、格式化）
│   ├── types/
│   │   └── loan.ts            # 类型定义
│   ├── data/
│   │   └── bills.ts           # 演示账单数据
│   ├── hooks/
│   │   └── useRecords.ts      # 历史记录持久化 Hook
│   ├── styles/                # 全局样式 & 变量
│   ├── app.config.ts          # 应用配置（路由 & TabBar）
│   ├── app.tsx                # 应用入口
│   └── index.html
├── config/                    # Taro 构建配置
│   ├── index.ts
│   ├── dev.ts
│   └── prod.ts
├── types/                     # 全局类型声明
├── pdf/                       # 真实信用卡账单 PDF（浦发万用金 2017–2020）
├── extract_loans.py           # PDF 账单提取脚本
├── verify_rate.py             # 利率验证脚本
├── demo.html                  # 独立演示页面
├── package.json               # 依赖 & 脚本
├── tsconfig.json              # TypeScript 配置
└── project.config.json        # 小程序项目配置
```

## 快速开始

```bash
# 安装依赖
npm install

# 微信小程序开发
npm run dev:weapp

# 微信小程序构建
npm run build:weapp

# H5 开发
npm run dev:h5

# 支付宝小程序
npm run dev:alipay

# 字节跳动小程序
npm run dev:tt
```

编译后使用对应平台的开发者工具导入 `dist/` 目录即可预览。

## PDF 账单提取（可选）

项目附带两个 Python 脚本，用于从真实信用卡账单 PDF 中提取分期数据并验证利率：

```bash
# 提取 PDF 账单数据
python extract_loans.py

# 验证等额本息公式与 IRR
python verify_rate.py
```

## 计算原理

### 等额本息（二分法反推月利率）

已知本金 P、期数 n、每月固定还款额 A，用二分法求解月利率 r：

```
A = P * r * (1+r)^n / ((1+r)^n - 1)
```

### APR 年化利率

```
APR = (1 + r)^12 - 1
```

## 许可证

MIT
