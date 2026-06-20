# Docker 部署说明

## 为什么用 Docker

- 之前：直接在服务器上 `node index.js` 跑代码，换服务器要重装 Node、SQLite 依赖
- 现在：把运行环境打包成镜像，`docker compose up -d` 一键启动，换服务器也一样

## 核心概念

| 概念 | 通俗理解 | 本项目对应 |
|------|---------|-----------|
| 镜像 Image | 安装包 / ISO | `Dockerfile` 定义了怎么打包 |
| 容器 Container | 运行起来的程序 | `loancalc-server` 容器 |
| 数据卷 Volume | 外挂独立存储 | `loancalc_data` 存 SQLite 数据库 |
| docker-compose | 一键启动/停止脚本 | `docker-compose.yml` |

## 文件说明

```
本项目/
├── Dockerfile              # 镜像构建规则（基于 node:20-alpine）
├── docker-compose.yml      # 服务编排（端口、数据卷、环境变量）
├── .dockerignore           # 构建时排除的文件
└── server/                 # 后端源码（被打包进镜像）
    ├── index.js            # 入口
    ├── db.js               # 数据库（SQLite / MySQL 双模式）
    └── package.json
```

## 部署步骤

### 1. 服务器安装 Docker

```bash
# 阿里云 CentOS / Alibaba Cloud Linux
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# 验证
docker --version
```

### 2. 上传文件到服务器

```bash
# 本地 Windows PowerShell 中执行
scp -r release/loancalc/docker root@服务器IP:/www/wwwroot/loancalc/
```

### 3. SSH 到服务器，启动

```bash
ssh root@服务器IP
cd /www/wwwroot/loancalc/docker

# 一键构建镜像 + 启动容器（首次需 1-3 分钟下载基础镜像）
docker compose up -d
```

### 4. 验证

```bash
# 查看容器状态
docker ps
# 应该有 loancalc-server，状态 Up

# 测试 API
curl http://127.0.0.1:3002/api/stats
# 返回 {"success":true,"data":{...}} 即正常
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `docker ps` | 查看运行中的容器 |
| `docker ps -a` | 查看所有容器（含已停止） |
| `docker logs loancalc-server` | 查看日志 |
| `docker logs -f loancalc-server` | 实时查看日志（Ctrl+C 退出） |
| `docker compose restart` | 重启服务（代码未变时） |
| `docker compose up -d --build` | 重新构建镜像并启动（代码变了时） |
| `docker compose stop` | 暂停 |
| `docker compose start` | 恢复 |
| `docker compose down` | 停止并删除容器 |

---

## 更新流程

```
本地修改代码
    ↓
本地执行 .\release.ps1  打包
    ↓
scp -r release/loancalc/docker/server root@服务器:/www/wwwroot/loancalc/docker/
    ↓
SSH 到服务器
    ↓
cd /www/wwwroot/loancalc/docker && docker compose up -d --build
```

---

## 数据库说明

- **默认 SQLite**：无需配置，数据存入 Docker Volume `loancalc_data`
- **切换 MySQL**：在 `docker-compose.yml` 中取消注释环境变量并填入实际值
- **备份**：`docker exec loancalc-server cat /app/data/data.db > backup.db`

---

## 多个项目统一管理

后期其他项目（elevatorcalc、officetools 等）也用相同模式，每个项目：

1. 独立的宝塔站点（子域名）
2. 独立的 `docker-compose.yml` 和容器
3. 互不干扰，统一用 `docker ps` 查看所有状态

```
docker ps
# loancalc-server      ← loancalc.guluwater.com
# elevatorcalc-server  ← elevatorcalc.guluwater.com
# officetools-server   ← officetools.guluwater.com
# ...
```
