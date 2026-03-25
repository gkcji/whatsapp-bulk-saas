@echo off
title WhatsApp SaaS Servers
echo ========================================
echo   WhatsApp SaaS - Starting All Servers  
echo ========================================
echo.

echo Kill any stuck node processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo Starting Backend on port 5000...
start cmd /k "TITLE Backend && cd /d %~dp0backend && npx ts-node --transpile-only src/index.ts"

timeout /t 3 /nobreak >nul

echo Starting Frontend on port 3000...
start cmd /k "TITLE Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers launched!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000
echo ========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000/dashboard/settings
