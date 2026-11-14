@echo off
setlocal
title Stop QR Studio Server

cd /d "%~dp0"

echo ========================================================
echo          Stopping QR Studio Backend Server
echo ========================================================

powershell -NoProfile -Command "
$stopped = $false

# 1. Kill by port 8000
$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host ('[*] Stopping process ' + $p.ProcessName + ' (PID: ' + $p.Id + ')...') -ForegroundColor Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
    }
}

# 2. Kill by .server.pid if exists
if (Test-Path '.server.pid') {
    $pidFromFile = (Get-Content '.server.pid' -ErrorAction SilentlyContinue).Trim()
    if ($pidFromFile) {
        $proc = Get-Process -Id $pidFromFile -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host ('[*] Stopping PID ' + $pidFromFile + '...') -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
    }
    Remove-Item '.server.pid' -Force -ErrorAction SilentlyContinue
}

if ($stopped) {
    Write-Host '========================================================' -ForegroundColor Green
    Write-Host '  [OK] QR Studio Backend Server stopped successfully.' -ForegroundColor Green
    Write-Host '========================================================' -ForegroundColor Green
} else {
    Write-Host '========================================================' -ForegroundColor Cyan
    Write-Host '  [*] No active server was found on port 8000.' -ForegroundColor Cyan
    Write-Host '========================================================' -ForegroundColor Cyan
}
"

echo.
timeout /t 3 >nul
