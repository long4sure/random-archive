@echo off
cd /d "%~dp0"
echo.
echo  BizSuite - starting local server...
echo  Keep this window open while you use the site.
echo.
timeout /t 2 >nul
start "" "http://localhost:3000"

where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes serve . -p 3000
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Using Python server...
  python -m http.server 3000
  goto :end
)

echo.
echo  Could not start server. Install Node.js from https://nodejs.org
echo  Then double-click START.bat again.
pause

:end
