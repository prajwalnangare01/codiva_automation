@echo off
echo ========================================================
echo   CODIVA INSTAGRAM AUTOMATION LAUNCHER
echo ========================================================

REM 1. Check if Renderer Service is running on port 3210
netstat -ano | findstr :3210 >nul
if %errorlevel% equ 0 (
    echo [OK] Renderer Engine is already running on port 3210.
) else (
    echo [STARTING] Launching Renderer Engine on port 3210...
    start "Codiva Renderer Daemon" /b node "c:\build automation\scripts\renderer_service.js"
    timeout /t 3 /nobreak >nul
    echo [OK] Renderer Engine started!
)

REM 2. Check if n8n is running on port 5678
netstat -ano | findstr :5678 >nul
if %errorlevel% equ 0 (
    echo [OK] n8n is already running on port 5678.
) else (
    echo [STARTING] Launching n8n Server...
    start "n8n Server" n8n
    echo [OK] n8n Server launched!
)

echo.
echo ========================================================
echo   ALL SYSTEMS ONLINE AND DEPLOYED!
echo   Schedule: 7:00 PM IST (Learn) and 10:00 PM IST (Apply)
echo ========================================================
pause
