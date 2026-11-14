@echo off
setlocal
title QR Studio Backend Status

cd /d "%~dp0"

powershell -NoProfile -Command "
$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    $p = Get-Process -Id $conns[0].OwningProcess -ErrorAction SilentlyContinue
    Write-Host '========================================================' -ForegroundColor Green
    Write-Host '  STATUS: ONLINE (Running Continuously)' -ForegroundColor Green
    Write-Host ('  Port: 8000 | Process: ' + $p.ProcessName + ' (PID: ' + $p.Id + ')') -ForegroundColor Green
    Write-Host '  URL: http://localhost:8000' -ForegroundColor Green
    Write-Host '========================================================' -ForegroundColor Green
    try {
        $res = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($res) {
            Write-Host ('  Uptime: ' + $res.uptime_seconds + 's') -ForegroundColor Cyan
        }
    } catch {}
} else {
    Write-Host '========================================================' -ForegroundColor Red
    Write-Host '  STATUS: OFFLINE' -ForegroundColor Red
    Write-Host '  To start the server, double click start_server.bat' -ForegroundColor Yellow
    Write-Host '========================================================' -ForegroundColor Red
}
"

echo.
pause
