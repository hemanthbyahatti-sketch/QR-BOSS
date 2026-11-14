# Stop QR Studio Server on port 8000
$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$stopped = $false
if ($conns) {
    foreach ($c in $conns) {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "[*] Stopping process $($p.ProcessName) (PID: $($p.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
    }
}

if (Test-Path ".server.pid") {
    $pidFromFile = (Get-Content ".server.pid" -ErrorAction SilentlyContinue).Trim()
    if ($pidFromFile) {
        $proc = Get-Process -Id $pidFromFile -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[*] Stopping process PID $pidFromFile..." -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
    }
    Remove-Item ".server.pid" -Force -ErrorAction SilentlyContinue
}

if ($stopped) {
    Write-Host "[OK] QR Studio Backend Server stopped successfully." -ForegroundColor Green
} else {
    Write-Host "[*] No server was running on port 8000." -ForegroundColor Cyan
}
