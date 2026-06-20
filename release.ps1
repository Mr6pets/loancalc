# ============================================================
# LoanCalc 发布打包脚本（子域名 + Docker 部署）
# 域名: loancalc.guluwater.com
# 服务器目录结构（宝塔）:
#   /www/wwwroot/loancalc/h5/       ← release/loancalc/h5/
#   /www/wwwroot/loancalc/webadmin/ ← release/loancalc/webadmin/
#   后端使用 Docker 部署，无需拷贝 server/ 目录
# ============================================================
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "=== 1/5 构建前端 (H5) ===" -ForegroundColor Cyan
npm run build:h5
if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }

Write-Host "`n=== 2/5 清理旧 release ===" -ForegroundColor Cyan
if (Test-Path release) { Remove-Item -Recurse -Force release }

Write-Host "`n=== 3/5 复制文件 ===" -ForegroundColor Cyan

# --- H5 前端（上传到宝塔站点根目录）---
$h5Dest = "release/loancalc/h5"
New-Item -ItemType Directory -Force -Path $h5Dest | Out-Null
Copy-Item -Recurse -Force "dist/*" $h5Dest

# --- WebAdmin（后台管理页面）---
$adminDest = "release/loancalc/webadmin"
New-Item -ItemType Directory -Force -Path $adminDest | Out-Null
Copy-Item -Force "server/admin.html" "$adminDest/index.html"

# --- Docker 部署文件 ---
$dockerDest = "release/loancalc/docker"
New-Item -ItemType Directory -Force -Path $dockerDest | Out-Null
Copy-Item -Force "Dockerfile" "$dockerDest/"
Copy-Item -Force "docker-compose.yml" "$dockerDest/"
Copy-Item -Force ".dockerignore" "$dockerDest/"
New-Item -ItemType Directory -Force -Path "$dockerDest/server" | Out-Null
Copy-Item -Recurse -Force "server/*" "$dockerDest/server/" -Exclude "node_modules", ".env", "data.db*", "admin.html"

# --- Nginx 配置 ---
$nginxDest = "release/nginx"
New-Item -ItemType Directory -Force -Path $nginxDest | Out-Null
Copy-Item -Force "nginx/loancalc_baota.conf" "$nginxDest/"

Write-Host "`n=== 4/5 构建 Docker 镜像 ===" -ForegroundColor Cyan
Set-Location $Root
docker build -t loancalc-server .

Write-Host "`n=== 5/5 完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "release/ 目录结构:" -ForegroundColor Yellow
Get-ChildItem -Recurse -File release | ForEach-Object {
    $size = "{0,8:N0} KB" -f ($_.Length / 1KB)
    Write-Host "  $size  $($_.FullName.Substring($Root.Length + 1))"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署步骤 (服务器端 - 宝塔面板)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ★ 前置步骤 - 宝塔面板操作:" -ForegroundColor Yellow
Write-Host "    a. 新建站点 - 域名: loancalc.guluwater.com" -ForegroundColor DarkYellow
Write-Host "    b. 根目录设为: /www/wwwroot/loancalc/h5" -ForegroundColor DarkYellow
Write-Host "    c. SSL: 勾选 Let's Encrypt 自动申请证书" -ForegroundColor DarkYellow
Write-Host "    d. DNS: 添加 A 记录 loancalc - 服务器 IP" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "1. 上传前端文件到宝塔站点目录:" -ForegroundColor Yellow
Write-Host '   scp -r release/loancalc/h5/*     root@服务器:/www/wwwroot/loancalc/h5/'
Write-Host '   scp -r release/loancalc/webadmin root@服务器:/www/wwwroot/loancalc/'
Write-Host ""
Write-Host "2. 更新 Nginx (参考 release/nginx/loancalc_baota.conf):" -ForegroundColor Yellow
Write-Host "   A. 宝塔图形界面: 站点设置/配置文件/粘贴内容并保存" -ForegroundColor DarkYellow
Write-Host "   B. 命令行:" -ForegroundColor DarkYellow
Write-Host '     scp release/nginx/loancalc_baota.conf root@服务器:/www/server/panel/vhost/nginx/loancalc.conf'
Write-Host '     然后执行: nginx -t ; nginx -s reload'
Write-Host ""
Write-Host "3. Docker 部署后端 (服务器上):" -ForegroundColor Yellow
Write-Host '   scp -r release/loancalc/docker root@服务器:/www/wwwroot/loancalc/'
Write-Host '   cd /www/wwwroot/loancalc/docker ; docker compose up -d'
Write-Host ""
Write-Host "4. 验证:" -ForegroundColor Yellow
Write-Host '   curl http://127.0.0.1:3002/api/stats'
Write-Host "   浏览器访问: https://loancalc.guluwater.com" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "5. 常用 Docker 命令:" -ForegroundColor Yellow
Write-Host "   docker ps                                # 查看运行中的容器" -ForegroundColor DarkYellow
Write-Host "   docker logs -f loancalc-server           # 实时日志" -ForegroundColor DarkYellow
Write-Host "   docker compose restart                   # 修改配置后重启" -ForegroundColor DarkYellow
Write-Host "   docker compose down ; docker compose up -d  # 完全重建" -ForegroundColor DarkYellow
