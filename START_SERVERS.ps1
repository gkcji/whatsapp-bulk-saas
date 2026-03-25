# ─────────────────────────────────────────
#  START ALL SERVERS — WhatsApp SaaS
#  Right-click this file and select "Run with PowerShell" to launch everything
# ─────────────────────────────────────────

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WhatsApp SaaS — Starting All Servers  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any stuck node processes
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

# Start Backend in new window
Write-Host "Starting Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; cd 'd:\Whatsapp_Cloud_Bulk\backend'; Write-Host 'BACKEND STARTING...' -ForegroundColor Green; npx ts-node --transpile-only src/index.ts" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "Starting Frontend on port 3000..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; cd 'd:\Whatsapp_Cloud_Bulk\frontend'; Write-Host 'FRONTEND STARTING...' -ForegroundColor Magenta; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Both servers launched!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Start-Process 'http://localhost:3000/dashboard'
