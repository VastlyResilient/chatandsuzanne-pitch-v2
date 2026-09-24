@echo off
rem Double-click to start the Absolute Advisor on Windows.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the download page: install the LTS version, then double-click this file again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
if not exist node_modules call npm install --no-audit --no-fund
if not exist .env (
  copy .env.example .env >nul
  echo Created .env. Paste your Anthropic API key into it, save, then double-click this file again.
  notepad .env
  exit /b 0
)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
