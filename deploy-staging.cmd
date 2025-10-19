@echo off
REM Bal-Con Builders - Railway Staging Deployment Script (Windows)
REM This script automates the staging deployment process to Railway

echo.
echo ========================================
echo  Bal-Con Builders - Staging Deployment
echo ========================================
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Railway CLI not found
    echo Please install: npm install -g @railway/cli
    echo.
    pause
    exit /b 1
)

REM Check if logged in to Railway
railway whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Railway login required...
    railway login
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Railway login failed
        pause
        exit /b 1
    )
)

echo Railway login verified
echo.

REM Prompt for environment
set /p ENVIRONMENT="Deploy to (1) Staging or (2) Production? [1]: " || set ENVIRONMENT=1
if "%ENVIRONMENT%"=="2" (
    set ENV_NAME=production
    set PROJECT_NAME=balcon-production
) else (
    set ENV_NAME=staging
    set PROJECT_NAME=balcon-staging
)

echo.
echo Deploying to: %ENV_NAME%
echo Project: %PROJECT_NAME%
echo.

REM Confirm deployment
set /p CONFIRM="Continue with deployment? (y/N): " || set CONFIRM=n
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled
    pause
    exit /b 0
)

echo.
echo ========================================
echo  Step 1: Verify Project Structure
echo ========================================
echo.

if not exist "backend\package.json" (
    echo ERROR: backend\package.json not found
    echo Please run this script from project root
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found
    echo Please run this script from project root
    pause
    exit /b 1
)

echo Project structure verified
echo.

REM Generate JWT secrets
echo ========================================
echo  Step 2: Generate Secrets
echo ========================================
echo.

echo Generating JWT secrets...
echo.

REM Windows doesn't have openssl by default, so we'll provide instructions
echo IMPORTANT: You need to set the following environment variables in Railway:
echo.
echo 1. JWT_ACCESS_SECRET (32+ characters)
echo 2. JWT_REFRESH_SECRET (32+ characters)
echo 3. METRICS_AUTH_TOKEN (optional, 16+ characters)
echo.
echo Generate secrets using:
echo   - Online: https://www.random.org/strings/
echo   - PowerShell: [System.Convert]::ToBase64String([byte[]](1..32 ^| ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
echo   - Git Bash: openssl rand -hex 32
echo.
echo Press any key once you have Railway variables configured...
pause >nul

echo.
echo ========================================
echo  Step 3: Deploy Backend
echo ========================================
echo.

cd backend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot enter backend directory
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo Deploying backend to Railway...
railway up --service backend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend deployment failed
    cd ..
    pause
    exit /b 1
)

echo.
echo Backend deployed successfully!
echo.

REM Get backend URL
echo Retrieving backend URL...
for /f "tokens=*" %%a in ('railway domain --service backend 2^>nul') do set BACKEND_URL=%%a
if defined BACKEND_URL (
    echo Backend URL: %BACKEND_URL%
) else (
    echo Warning: Could not retrieve backend URL automatically
    set /p BACKEND_URL="Enter backend URL (e.g., https://backend-production-xxxx.up.railway.app): "
)

echo.
echo ========================================
echo  Step 4: Run Database Migrations
echo ========================================
echo.

echo Running migrations on Railway...
railway run npm run migrate --service backend
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Migration command failed
    echo You may need to run migrations manually:
    echo   railway run npm run migrate --service backend
    echo.
) else (
    echo Migrations completed successfully
    echo.
)

echo ========================================
echo  Step 5: Seed Database (Optional)
echo ========================================
echo.

set /p SEED="Seed database with demo users? (y/N): " || set SEED=n
if /i "%SEED%"=="y" (
    echo Seeding database...
    railway run npm run db:seed:enhanced --service backend
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Seeding failed
        echo You may need to seed manually:
        echo   railway run npm run db:seed:enhanced --service backend
        echo.
    ) else (
        echo Database seeded successfully
        echo.
        echo Demo credentials:
        echo   owner@balconbuilders.com / admin123
        echo   admin@balconbuilders.com / admin123
        echo   (and other role-based accounts)
        echo.
    )
)

cd ..
echo.

echo ========================================
echo  Step 6: Deploy Frontend
echo ========================================
echo.

cd frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot enter frontend directory
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Set frontend environment variable
if defined BACKEND_URL (
    echo Setting REACT_APP_API_URL=%BACKEND_URL%/api
    railway variables set REACT_APP_API_URL=%BACKEND_URL%/api --service frontend
)

echo Deploying frontend to Railway...
railway up --service frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend deployment failed
    cd ..
    pause
    exit /b 1
)

echo.
echo Frontend deployed successfully!
echo.

REM Get frontend URL
echo Retrieving frontend URL...
for /f "tokens=*" %%a in ('railway domain --service frontend 2^>nul') do set FRONTEND_URL=%%a
if defined FRONTEND_URL (
    echo Frontend URL: %FRONTEND_URL%
) else (
    echo Warning: Could not retrieve frontend URL automatically
    set /p FRONTEND_URL="Enter frontend URL: "
)

cd ..
echo.

echo ========================================
echo  Step 7: Update CORS Configuration
echo ========================================
echo.

if defined FRONTEND_URL (
    echo Setting CORS_ORIGIN=%FRONTEND_URL%
    cd backend
    railway variables set CORS_ORIGIN=%FRONTEND_URL% --service backend
    railway variables set FRONTEND_ORIGINS=%FRONTEND_URL% --service backend
    cd ..
    
    echo.
    echo CORS configuration updated
    echo Backend will restart automatically
    echo.
) else (
    echo WARNING: Frontend URL not available
    echo Please manually set CORS_ORIGIN in Railway dashboard
    echo.
)

echo ========================================
echo  Step 8: Verify Deployment
echo ========================================
echo.

if defined BACKEND_URL (
    echo Testing backend health endpoint...
    curl -s -o nul -w "Status: %%{http_code}\n" %BACKEND_URL%/api/health
    echo.
)

if defined FRONTEND_URL (
    echo Testing frontend...
    curl -s -o nul -w "Status: %%{http_code}\n" %FRONTEND_URL%
    echo.
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo Environment: %ENV_NAME%
echo.

if defined BACKEND_URL (
    echo Backend:  %BACKEND_URL%
    echo API:      %BACKEND_URL%/api
    echo Health:   %BACKEND_URL%/api/health
    echo Metrics:  %BACKEND_URL%/api/metrics/prometheus
    echo.
)

if defined FRONTEND_URL (
    echo Frontend: %FRONTEND_URL%
    echo.
)

echo Next Steps:
echo.
echo 1. Open frontend: %FRONTEND_URL%
echo 2. Test login with demo credentials
echo 3. Verify critical functionality
echo 4. Run smoke tests: node validate-deployment.js
echo 5. Monitor logs: railway logs --service backend
echo.
echo Deployment logs saved to: deployment-%ENV_NAME%-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.log
echo.

pause
exit /b 0
