@echo off
REM Double-click to build JEV.exe on Windows.
REM Creates a clean build environment, packages the app with your custom icon,
REM and leaves the result in dist\JEV\JEV.exe
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (set PY=py) else (set PY=python)

%PY% --version >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required. Install it from https://www.python.org/downloads/ and re-run.
  pause
  exit /b 1
)

echo Setting up build environment (first time takes a minute)...
%PY% -m venv .buildenv
".buildenv\Scripts\python.exe" -m pip install --quiet --upgrade pip
".buildenv\Scripts\python.exe" -m pip install --quiet pyinstaller -r requirements.txt

echo Building JEV...
".buildenv\Scripts\pyinstaller.exe" --noconfirm JEV.spec

echo.
echo Done!  Your app is at:  dist\JEV\JEV.exe
echo Right-click JEV.exe -^> Send to -^> Desktop to make a shortcut.
explorer "dist\JEV"
pause
