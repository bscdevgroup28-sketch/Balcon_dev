#!/usr/bin/env powershell

# Bal-Con Builders Project Setup Script
# This script cleans up and sets up the project for local development

Write-Host "Bal-Con Builders Project Setup" -ForegroundColor Blue
Write-Host "==============================" -ForegroundColor Blue
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "[ERROR] npm is not installed. Please install npm and try again." -ForegroundColor Red
    exit 1
}

$nodeVersion = (node --version).Substring(1).Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "[ERROR] Node.js version must be 18 or higher. Current version: $(node --version)" -ForegroundColor Red
    exit 1
}

$nodeVer = node --version
$npmVer = npm --version
Write-Host "[OK] Node.js $nodeVer detected" -ForegroundColor Green
Write-Host "[OK] npm $npmVer detected" -ForegroundColor Green
Write-Host ""

# Clean up old files
Write-Host "Cleaning up old files..." -ForegroundColor Yellow

# Remove old database files except the enhanced one
$backendPath = ".\backend"
if (Test-Path "$backendPath\dev-database.sqlite") {
    Remove-Item "$backendPath\dev-database.sqlite" -Force
    Write-Host "[CLEANUP] Removed old dev-database.sqlite" -ForegroundColor Gray
}

# Clean node_modules for fresh install
if (Test-Path "$backendPath\node_modules") {
    Write-Host "[CLEANUP] Removing backend node_modules for fresh install..." -ForegroundColor Gray
    Remove-Item "$backendPath\node_modules" -Recurse -Force
}

if (Test-Path ".\frontend\node_modules") {
    Write-Host "[CLEANUP] Removing frontend node_modules for fresh install..." -ForegroundColor Gray
    Remove-Item ".\frontend\node_modules" -Recurse -Force
}

Write-Host ""

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location $backendPath

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building backend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Setting up enhanced database..." -ForegroundColor Cyan
npm run db:init:enhanced
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Database setup failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "Seeding database with demo data..." -ForegroundColor Cyan
npm run db:seed:enhanced
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Database seeding failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "[OK] Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Frontend setup
Write-Host "Setting up frontend..." -ForegroundColor Yellow
Set-Location ..\frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Frontend setup complete!" -ForegroundColor Green
Write-Host ""

# Return to root directory
Set-Location ..

# Final instructions
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development servers:" -ForegroundColor Blue
Write-Host ""
Write-Host "Backend (Terminal 1):" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Frontend (Terminal 2):" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Blue
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "Demo login credentials:" -ForegroundColor Blue
Write-Host "  Owner: owner@balconbuilders.com / admin123" -ForegroundColor White
Write-Host "  Admin: admin@balconbuilders.com / admin123" -ForegroundColor White
Write-Host "  Customer: customer@example.com / customer123" -ForegroundColor White
Write-Host ""
Write-Host "For more details, see CLEANUP_AND_SETUP_GUIDE.md" -ForegroundColor Gray
