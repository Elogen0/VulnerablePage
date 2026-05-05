@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "ROOT_DIR=%~dp0"
set "NGINX_DIR=%ROOT_DIR%nginx-1.30.0"
set "NGINX_EXE=%NGINX_DIR%\nginx.exe"
set "FRONT_DIR=%ROOT_DIR%front"

if not exist "%NGINX_EXE%" (
    echo nginx.exe not found: %NGINX_EXE%
    pause
    exit /b 1
)

if not exist "%FRONT_DIR%\index.html" (
    echo front index.html not found: %FRONT_DIR%\index.html
    pause
    exit /b 1
)

echo Checking nginx config...
pushd "%NGINX_DIR%" > nul
"%NGINX_EXE%" -t -p "%NGINX_DIR%" -c "conf\nginx.conf"
if errorlevel 1 (
    popd > nul
    echo nginx config test failed.
    pause
    exit /b 1
)

echo Starting nginx for front...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$nginxPath = '%NGINX_EXE%'; $process = Get-Process nginx -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $nginxPath }; if ($process) { exit 0 } exit 1" > nul 2> nul
if not errorlevel 1 (
    popd > nul
    echo nginx is already running.
    echo Front is running at http://localhost:9000
    echo Use nginx_off.bat to stop nginx.
    pause
    exit /b 0
)

start "" /B "%NGINX_EXE%" -p "%NGINX_DIR%" -c "conf\nginx.conf"
if errorlevel 1 (
    popd > nul
    echo nginx start failed.
    pause
    exit /b 1
)

popd > nul
echo Front is running at http://localhost:9000
echo Use nginx_off.bat to stop nginx.
pause
