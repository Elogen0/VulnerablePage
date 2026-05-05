@echo off
chcp 65001 > nul

echo Stopping nginx...

REM Gracefully stop nginx if nginx.exe is available in PATH
nginx -s stop 2>nul

REM Wait briefly
timeout /t 2 /nobreak > nul

REM Force-kill remaining nginx processes
taskkill /F /IM nginx.exe 2>nul

if %ERRORLEVEL% EQU 0 (
    echo nginx processes have been stopped.
) else (
    echo No running nginx.exe process found, or nginx was already stopped.
)

pause