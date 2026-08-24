@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing Electron...
  call npm install --no-fund --no-audit
)
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"