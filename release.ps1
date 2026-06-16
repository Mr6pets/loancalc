# ============================================================
# LoanCalc 发布打包脚本
# 将构建产物和服务器文件整理到 release/ 目录
# 服务器目录结构:
#   /home/loadcalc/h5/       ← release/loancalc/h5/
#   /home/loadcalc/server/   ← release/loancalc/server/
#   /home/loadcalc/webadmin/ ← release/loancalc/webadmin/
#   /etc/nginx/conf.d/       ← release/nginx/conf.d/
# ============================================================
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "=== 1/4 构建前端 (H5) ===" -ForegroundColor Cyan
npm run build:h5
if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }

Write-Host "`n=== 2/4 清理旧 release ===" -ForegroundColor Cyan
if (Test-Path release) { Remove-Item -Recurse -Force release }

Write-Host "`n=== 3/4 复制文件 ===" -ForegroundColor Cyan

# --- H5 前端 ---
$h5Dest = "release/loancalc/h5"
New-Item -ItemType Directory -Force -Path $h5Dest | Out-Null
Copy-Item -Recurse -Force "dist/*" $h5Dest

# --- Server (后端) ---
$serverDest = "release/loancalc/server"
New-Item -ItemType Directory -Force -Path $serverDest | Out-Null
Copy-Item -Recurse -Force "server/*" $serverDest -Exclude "node_modules"

# 删除不需要上传的文件
@(
    "$serverDest/.env",
    "$serverDest/data.db",
    "$serverDest/data.db-shm",
    "$serverDest/data.db-wal",
    "$serverDest/admin.html",
    "$serverDest/package-lock.json"
) | ForEach-Object {
    if (Test-Path $_) { Remove-Item -Recurse -Force $_ }
}

# --- WebAdmin (后台管理) ---
$adminDest = "release/loancalc/webadmin"
New-Item -ItemType Directory -Force -Path $adminDest | Out-Null
Copy-Item -Force "server/admin.html" "$adminDest/index.html"

# --- Nginx 配置 ---
$nginxDest = "release/nginx/conf.d"
New-Item -ItemType Directory -Force -Path $nginxDest | Out-Null
Copy-Item -Force "nginx/conf.d/includes/03_loadcalc.conf" $nginxDest
Copy-Item -Force "nginx/conf.d/includes/99_static_subdomains.conf" "$nginxDest/99_static_subdomains.conf"

Write-Host "`n=== 4/4 完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "release/ 目录结构:" -ForegroundColor Yellow
Get-ChildItem -Recurse -File release | ForEach-Object {
    $size = "{0,8:N0} KB" -f ($_.Length / 1KB)
    Write-Host "  $size  $($_.FullName.Substring($Root.Length + 1))"
}

Write-Host ""
Write-Host "上传到服务器:" -ForegroundColor Yellow
Write-Host "  scp -r release/loancalc                  root@服务器:/home/"
Write-Host "  scp release/nginx/conf.d/*.conf          root@服务器:/etc/nginx/conf.d/includes/"
Write-Host ""
Write-Host "服务器端操作:" -ForegroundColor Yellow
Write-Host "  1. cp /home/loancalc/server/.env.example /home/loancalc/server/.env"
Write-Host "  2. cd /home/loancalc/server && npm install"
Write-Host "  3. nginx -t && nginx -s reload"
Write-Host "  4. pm2 start /home/loancalc/server/index.js --name loancalc"
