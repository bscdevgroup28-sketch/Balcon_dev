@echo off
echo Bal-Con Builders Project Setup
echo ==============================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Cleaning up old files...
if exist "backend\dev-database.sqlite" del "backend\dev-database.sqlite"
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"

echo.
echo Setting up backend...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)

echo Setting up database...
call npm run db:init:enhanced
call npm run db:seed:enhanced

echo Backend setup complete!

echo.
echo Setting up frontend...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    pause
    exit /b 1
)

echo Frontend setup complete!
cd ..

echo.
echo Setup Complete!
echo ===============
echo.
echo To start the servers:
echo.
echo Backend (Terminal 1):
echo   cd backend
echo   npm run dev
echo.
echo Frontend (Terminal 2):
echo   cd frontend
echo   npm start
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8082
echo.
echo Demo login credentials:
echo   Owner: owner@balconbuilders.com / admin123
echo   Admin: admin@balconbuilders.com / admin123
echo   Customer: customer@example.com / customer123
echo.
pause
