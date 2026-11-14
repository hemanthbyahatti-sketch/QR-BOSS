@echo off
setlocal enabledelayedexpansion
title QR Studio Server Manager

cd /d "%~dp0"

echo ========================================================
echo        QR Studio Backend Server - Continuous Runner
echo ========================================================

:: Check if server is already running on port 8000
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue; if ($c) { exit 0 } else { exit 1 }"
if %ERRORLEVEL% equ 0 (
    echo [*] Backend is ALREADY running on http://localhost:8000
    echo [*] Opening browser...
    start http://localhost:8000
    goto :done
)

:: Locate Python executable
set "PY_EXEC="
if exist "%~dp0.venv\Scripts\pythonw.exe" (
    set "PY_EXEC=%~dp0.venv\Scripts\pythonw.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_EXEC=%~dp0.venv\Scripts\python.exe"
) else (
    set "PY_EXEC=pythonw"
)

echo [*] Starting backend server continuously in background...
start "" "!PY_EXEC!" "%~dp0server.py"

:: Wait up to 3 seconds for server to bind
echo [*] Waiting for server initialization...
powershell -NoProfile -Command "for ($i=0; $i -lt 15; $i++) { $c = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue; if ($c) { exit 0 }; Start-Sleep -Milliseconds 200 }; exit 1"

if %ERRORLEVEL% equ 0 (
    echo [OK] Backend server is now running continuously on http://localhost:8000
    echo [OK] It will remain active until you run 'stop_server.bat'.
    echo [*] Opening QR Studio in your browser...
    start http://localhost:8000
) else (
    echo [!] Starting in foreground console window...
    start "QR Studio Server Console" cmd /k ""%~dp0.venv\Scripts\python.exe" "%~dp0server.py""
    timeout /t 2 >nul
    start http://localhost:8000
)

:done
echo.
echo ========================================================
echo   Server is active!
echo   To turn off the server at any time, run: stop_server.bat
echo ========================================================
timeout /t 5 >nul
