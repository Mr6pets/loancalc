
$ErrorActionPreference = "SilentlyContinue"
$userHome = $env:USERPROFILE

Write-Host "=== Trae logs 详情 ==="
$logsPath = "$userHome\AppData\Roaming\Trae\logs"
Get-ChildItem $logsPath -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "  $([math]::Round($size / 1MB, 2)) MB  $($_.Name)"
}
Write-Host "--- 子目录 ---"
Get-ChildItem $logsPath -Directory | ForEach-Object {
    Get-ChildItem $_.FullName -Directory | ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 5MB) { Write-Host "    $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
    }
}

Write-Host "`n=== Trae User 目录详情 ==="
$userPath = "$userHome\AppData\Roaming\Trae\User"
Get-ChildItem $userPath -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
    if ($size -gt 1MB) { Write-Host "  $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
}

Write-Host "`n=== .cache 目录详情 ==="
$cachePath = "$userHome\.cache"
Get-ChildItem $cachePath -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
    if ($size -gt 10MB) { Write-Host "  $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
}

Write-Host "`n=== .trae/extensions 详情 ==="
$extPath = "$userHome\.trae\extensions"
Get-ChildItem $extPath -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
    if ($size -gt 5MB) { Write-Host "  $([math]::Round($size / 1MB, 2)) MB  $($_.Name)" }
}
