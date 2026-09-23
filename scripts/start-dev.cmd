@echo off
chcp 65001 >nul
cd /d E:\cxy\instrument-site
echo [start-dev] Starting Next.js dev server (Turbopack)...
start "next-dev" /b cmd /c "npx next dev > E:\cxy\_dev_server.log 2>&1"
node scripts/warmup-routes.js
if errorlevel 1 (
  echo [start-dev] WARNING: route warmup failed, model pages may 404.
) else (
  echo [start-dev] Routes warmed, model pages reachable.
)
echo.
echo Server ready: http://localhost:3000
echo Keep this window open to run the server.
pause
