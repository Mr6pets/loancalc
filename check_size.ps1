
$ErrorActionPreference = "SilentlyContinue"
$userHome = $env:USERPROFILE

Write-Host "=== .trae 目录 ===" 
$traePath = "$userHome\.trae"
if (Test-Path $traePath) {
    $total = (Get-ChildItem $traePath -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "  .trae 总计: $([math]::Round($total / 1MB, 2)) MB"
    Get-ChildItem $traePath -Directory | ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 1MB) { Write-Host "    $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
    }
}

Write-Host "`n=== AppData\Roaming\Trae ===" 
$appTrae = "$userHome\AppData\Roaming\Trae"
if (Test-Path $appTrae) {
    $total = (Get-ChildItem $appTrae -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "  AppData\Roaming\Trae 总计: $([math]::Round($total / 1MB, 2)) MB"
    Get-ChildItem $appTrae -Directory | ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 1MB) { Write-Host "    $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
    }
}

Write-Host "`n=== 其他开发者工具缓存 (>10MB) ===" 
$dirs = @('.gitlog','.templateengine','.npm','.pnpm','.cache','.cargo','.rustup','.conda','.gradle','.m2','.docker','.dart-tool','.pub-cache','.gem','.sbt','.bun','.Trash')
foreach ($d in $dirs) {
    $path = Join-Path $userHome $d
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 10MB) { Write-Host "  $([math]::Round($size / 1MB, 2)) MB  $d" }
    }
}

Write-Host "`n=== C 盘根目录空间 ===" 
Get-PSDrive C | ForEach-Object { 
    $freeGB = [math]::Round($_.Free / 1GB, 2)
    $usedGB = [math]::Round($_.Used / 1GB, 2)
    Write-Host "  C 盘: 已用 ${usedGB} GB, 剩余 ${freeGB} GB"
}
