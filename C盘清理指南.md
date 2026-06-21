# C 盘清理指南 — AI 开发工具缓存

> 当前 C 盘状态：已用 91.56 GB，剩余 28.44 GB  
> AI 工具相关占用约 4.3 GB

---

## 安全清理（可直接删除，工具会自动重建）

以下目录删除后不影响任何功能，下次使用对应功能时会自动重建。

### 1. Trae 旧日志文件（~434 MB）
**路径：** `C:\Users\alvis\AppData\Roaming\Trae\logs`
- 只保留最近 1-2 天的文件夹，其余可删
- 特别大的：`20260619T220849`（219 MB）、`aha_log`（215 MB）

### 2. Codex 运行时缓存（~1.2 GB）
**路径：** `C:\Users\alvis\.cache\codex-runtimes`
- AI 代码补全/生成的运行时，删除后下次使用时自动重新下载

### 3. Puppeteer 浏览器缓存（~583 MB）
**路径：** `C:\Users\alvis\.cache\puppeteer`
- 无头浏览器 Chromium 缓存，用于自动化测试/MCP

### 4. Chrome DevTools MCP 缓存（~305 MB）
**路径：** `C:\Users\alvis\.cache\chrome-devtools-mcp`
- MCP DevTools 的浏览器数据缓存

### 5. Trae 扩展 VSIX 缓存（~119 MB）
**路径：** `C:\Users\alvis\AppData\Roaming\Trae\CachedExtensionVSIXs`
- 插件安装包缓存，已安装的插件不需要这些文件

### 6. Trae 崩溃日志（~79 MB）
**路径：** `C:\Users\alvis\AppData\Roaming\Trae\Crashpad`
- 崩溃转储文件，正常使用不需要

**以上小计可释放：约 2.7 GB**

---

## 需谨慎清理（会丢失部分数据，但不影响核心功能）

### 7. 工作区状态数据（~478 MB）
**路径：** `C:\Users\alvis\AppData\Roaming\Trae\User\workspaceStorage`
- 各项目的窗口布局、最近打开文件列表等
- 删除后每个项目首次打开需重新调整布局

### 8. 本地历史记录（~131 MB）
**路径：** `C:\Users\alvis\AppData\Roaming\Trae\User\History`
- 文件本地修改历史，与 Git 历史独立
- 删除后丢失未提交的本地编辑历史

**以上小计可释放：约 609 MB**

---

## 不建议删除

这些目录要么占空间不大，要么删了会很麻烦：

| 目录 | 大小 | 原因 |
|------|------|------|
| `Trae\User\globalStorage` | 800 MB | 插件登录态、配置，删除需全部重新登录 |
| `Trae\Partitions` | 293 MB | 核心分区数据 |
| `Trae\ModularData` | 191 MB | AI 模块数据 |
| `.trae\extensions` | 630 MB | 插件本体（删了会自动重装但慢） |

---

## 一键清理命令（确认后运行）

以下是安全清理的全部命令，复制到 PowerShell 粘贴执行：

```powershell
# 1. 清理旧日志（保留最近5天的）
$logsPath = "$env:USERPROFILE\AppData\Roaming\Trae\logs"
Get-ChildItem $logsPath -Directory | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-5) } | Remove-Item -Recurse -Force

# 2. 清理 codex 运行时
$codexPath = "$env:USERPROFILE\.cache\codex-runtimes"
if (Test-Path $codexPath) { Remove-Item $codexPath -Recurse -Force }

# 3. 清理 puppeteer
$puppeteerPath = "$env:USERPROFILE\.cache\puppeteer"
if (Test-Path $puppeteerPath) { Remove-Item $puppeteerPath -Recurse -Force }

# 4. 清理 chrome-devtools-mcp
$devtoolsPath = "$env:USERPROFILE\.cache\chrome-devtools-mcp"
if (Test-Path $devtoolsPath) { Remove-Item $devtoolsPath -Recurse -Force }

# 5. 清理扩展 VSIX 缓存
$vsixPath = "$env:USERPROFILE\AppData\Roaming\Trae\CachedExtensionVSIXs"
if (Test-Path $vsixPath) { Remove-Item $vsixPath -Recurse -Force }

# 6. 清理崩溃日志
$crashPath = "$env:USERPROFILE\AppData\Roaming\Trae\Crashpad"
if (Test-Path $crashPath) { Remove-Item $crashPath -Recurse -Force }

Write-Host "清理完成！" -ForegroundColor Green
```

---

## 长期建议

1. **定期清理日志：** Trae 日志膨胀较快，建议每月清理一次
2. **C 盘扩容：** 120G C 盘对开发环境偏小，建议扩容到 200G+
3. **符号链接迁移：** 可将 `C:\Users\alvis\.cache` 整体迁移到其他盘（D 盘等），用 `mklink /J` 创建目录链接
