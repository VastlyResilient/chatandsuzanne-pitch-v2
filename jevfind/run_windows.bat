@echo off
REM Double-click this file on Windows to launch JevFind.
REM Creates a local Python environment on first run, installs the optional
REM file readers, and opens the desktop window.
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (set PY=py) else (set PY=python)

%PY% --version >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required. Install it from https://www.python.org/downloads/ and try again.
  pause
  exit /b 1
)

if not exist ".venv" (
  echo First-time setup: creating environment...
  %PY% -m venv .venv
  ".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
  ".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
)

".venv\Scripts\python.exe" -m jevfind gui
pause
