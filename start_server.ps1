# Start QR Studio Server in the background continuously
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$active = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($active) {
    Write-Host "[*] Backend is already running on http://localhost:8000" -ForegroundColor Green
    Start-Process "http://localhost:8000"
    return
}

$pyBin = "$ScriptDir\.venv\Scripts\pythonw.exe"
if (-not (Test-Path $pyBin)) {
    $pyBin = "pythonw.exe"
}

Write-Host "[*] Launching continuous backend server with $pyBin..." -ForegroundColor Cyan
Start-Process -FilePath $pyBin -ArgumentList "server.py" -WorkingDirectory $ScriptDir

Start-Sleep -Seconds 2
$check = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($check) {
    Write-Host "[OK] Backend server is running continuously on http://localhost:8000 (PID: $($check[0].OwningProcess))" -ForegroundColor Green
    Write-Host "[OK] Run .\stop_server.ps1 or stop_server.bat to turn it off." -ForegroundColor Yellow
    Start-Process "http://localhost:8000"
} else {
    Write-Host "[!] Could not verify port 8000. Check server.py logs." -ForegroundColor Red
}
