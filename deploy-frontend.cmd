@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Frontend Railway Deployment Helper
:: Assumes create-react-app build in frontend/build
:: Prereqs:
::  - railway CLI installed
::  - authenticated (railway login OR token)
::  - RAILWAY_FRONTEND_SERVICE_ID optional; defaults to 'frontend'

if "%~1"=="/h" goto :help
if "%~1"=="-h" goto :help

SET SERVICE_NAME=frontend
IF NOT "%RAILWAY_FRONTEND_SERVICE_ID%"=="" SET SERVICE_NAME=%RAILWAY_FRONTEND_SERVICE_ID%

echo === Checking railway CLI ===
where railway >nul 2>&1 || (
  echo Railway CLI not found. Install with: npm install -g @railway/cli
  exit /b 1
)

echo === Installing frontend dependencies ===
cd frontend || (echo frontend folder missing & exit /b 1)
call npm install --no-audit --no-fund || goto :fail

echo === Building frontend ===
call npm run build || goto :fail

echo === Deploying to Railway (service %SERVICE_NAME%) ===
railway up --service %SERVICE_NAME% || goto :fail

echo Frontend deployment complete.
exit /b 0

:fail
echo Frontend deployment failed.
exit /b 1

:help
echo Usage: deploy-frontend.cmd
exit /b 0
