@echo off
REM =============================================================
REM Bal-Con Builders Full Stack Development Launcher (CMD Edition)
REM Starts backend (port 8082) and frontend (port 3000) concurrently
REM Usage:  start-dev.cmd [--no-browser]
REM =============================================================

SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Move to script directory (project root) regardless of where called from
cd /d "%~dp0"

REM Basic validation
if not exist backend\package.json (
  echo [ERROR] backend\package.json not found. Run from project root containing backend and frontend folders.
  goto :end
)
if not exist frontend\package.json (
  echo [ERROR] frontend\package.json not found. Run from project root containing backend and frontend folders.
  goto :end
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH. Install Node 18+ and retry.
  goto :end
)

echo.
echo === Bal-Con Builders Dev Environment ===
echo Starting backend and frontend in separate Command Prompt windows...
echo.

REM Launch Backend
start "Balcon Backend" cmd /k pushd "%cd%\backend" ^& echo [Backend] Starting... ^& npm run dev:enhanced
if errorlevel 1 echo [WARN] Could not start backend window.

REM Small delay to let backend bind port
ping -n 4 127.0.0.1 >nul

REM Launch Frontend
start "Balcon Frontend" cmd /k pushd "%cd%\frontend" ^& echo [Frontend] Starting... ^& npm start
if errorlevel 1 echo [WARN] Could not start frontend window.

echo.
echo Backend:   http://localhost:8082/api/health
echo Frontend:  http://localhost:3002

echo.
echo Demo Login (all roles password = admin123):
echo   owner@balconbuilders.com

echo.
echo To stop: Close the spawned windows OR use taskkill /f /im node.exe (will kill all node processes)

echo.
if /I "%1"=="--no-browser" (
  echo Skipping automatic browser launch.
) else (
  start "" "http://localhost:3000"
)

echo Done. Windows may still be initializing - allow a few seconds.

:end
ENDLOCAL
