@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Backend Railway Deployment Helper
:: Prerequisites:
::  - railway CLI installed (npm install -g @railway/cli)
::  - authenticated (railway login OR set RAILWAY_TOKEN and run railway login --token %RAILWAY_TOKEN%)
::  - environment variable RAILWAY_BACKEND_SERVICE_ID set (optional if service name is 'backend')

if "%~1"=="/h" goto :help
if "%~1"=="-h" goto :help

SET SERVICE_NAME=backend
IF NOT "%RAILWAY_BACKEND_SERVICE_ID%"=="" SET SERVICE_NAME=%RAILWAY_BACKEND_SERVICE_ID%

echo === Checking railway CLI ===
where railway >nul 2>&1 || (
  echo Railway CLI not found. Install with: npm install -g @railway/cli
  exit /b 1
)

echo === Installing deps (production-ish) ===
cd backend || (echo backend folder missing & exit /b 1)
call npm install --no-audit --no-fund || goto :fail

echo === Building backend ===
call npm run build || goto :fail

echo === Deploying to Railway (service %SERVICE_NAME%) ===
railway up --service %SERVICE_NAME% || goto :fail

echo Deployment complete.
exit /b 0

:fail
echo Deployment failed. See errors above.
exit /b 1

:help
echo Usage: deploy-backend.cmd
exit /b 0
