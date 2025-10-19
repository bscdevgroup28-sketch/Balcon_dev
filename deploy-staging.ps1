# Bal-Con Builders - Railway Staging Deployment Script (PowerShell)
# This script automates the staging deployment process to Railway

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging'
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Bal-Con Builders - $Environment Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Railway CLI not found" -ForegroundColor Red
    Write-Host "Please install: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if logged in to Railway
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Railway login required..." -ForegroundColor Yellow
    railway login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Railway login failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Railway login verified" -ForegroundColor Green
Write-Host ""

# Set project name
$projectName = if ($Environment -eq 'production') { 'balcon-production' } else { 'balcon-staging' }

Write-Host "Deploying to: $Environment" -ForegroundColor Cyan
Write-Host "Project: $projectName" -ForegroundColor Cyan
Write-Host ""

# Confirm deployment
$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 1: Verify Project Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend\package.json")) {
    Write-Host "ERROR: backend\package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from project root" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "ERROR: frontend\package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Project structure verified" -ForegroundColor Green
Write-Host ""

# Generate JWT secrets
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 2: Generate Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function New-SecureToken {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    return [System.Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', ''
}

$jwtAccessSecret = New-SecureToken -Length 32
$jwtRefreshSecret = New-SecureToken -Length 32
$metricsToken = New-SecureToken -Length 16

Write-Host "Generated secrets:" -ForegroundColor Green
Write-Host "  JWT_ACCESS_SECRET:  $jwtAccessSecret" -ForegroundColor Gray
Write-Host "  JWT_REFRESH_SECRET: $jwtRefreshSecret" -ForegroundColor Gray
Write-Host "  METRICS_AUTH_TOKEN: $metricsToken" -ForegroundColor Gray
Write-Host ""

$setSecrets = Read-Host "Set these secrets in Railway automatically? (Y/n)"
if ($setSecrets -ne 'n') {
    Write-Host "Setting backend environment variables..." -ForegroundColor Cyan
    
    Push-Location backend
    
    railway variables set JWT_ACCESS_SECRET=$jwtAccessSecret --service backend | Out-Null
    railway variables set JWT_REFRESH_SECRET=$jwtRefreshSecret --service backend | Out-Null
    railway variables set METRICS_AUTH_TOKEN=$metricsToken --service backend | Out-Null
    railway variables set NODE_ENV=$Environment --service backend | Out-Null
    railway variables set ENFORCE_HTTPS=true --service backend | Out-Null
    railway variables set LOG_LEVEL=info --service backend | Out-Null
    railway variables set ADV_METRICS_ENABLED=true --service backend | Out-Null
    railway variables set ENABLE_TEST_ROUTES=false --service backend | Out-Null
    
    Pop-Location
    
    Write-Host "✓ Backend variables configured" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Skipping automatic secret configuration" -ForegroundColor Yellow
    Write-Host "Please set these manually in Railway dashboard" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 3: Deploy Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location backend

Write-Host "Current directory: $PWD" -ForegroundColor Gray
Write-Host ""

Write-Host "Deploying backend to Railway..." -ForegroundColor Cyan
railway up --service backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "✓ Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Get backend URL
Write-Host "Retrieving backend URL..." -ForegroundColor Cyan
$backendUrl = railway domain --service backend 2>$null
if ($backendUrl) {
    Write-Host "Backend URL: $backendUrl" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not retrieve backend URL automatically" -ForegroundColor Yellow
    $backendUrl = Read-Host "Enter backend URL (e.g., https://backend-production-xxxx.up.railway.app)"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 4: Run Database Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running migrations on Railway..." -ForegroundColor Cyan
railway run npm run migrate --service backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Migration command failed" -ForegroundColor Yellow
    Write-Host "You may need to run migrations manually:" -ForegroundColor Yellow
    Write-Host "  railway run npm run migrate --service backend" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 5: Seed Database (Optional)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$seed = Read-Host "Seed database with demo users? (y/N)"
if ($seed -eq 'y') {
    Write-Host "Seeding database..." -ForegroundColor Cyan
    railway run npm run db:seed:enhanced --service backend
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Seeding failed" -ForegroundColor Yellow
        Write-Host "You may need to seed manually:" -ForegroundColor Yellow
        Write-Host "  railway run npm run db:seed:enhanced --service backend" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✓ Database seeded successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Demo credentials:" -ForegroundColor Cyan
        Write-Host "  owner@balconbuilders.com / admin123" -ForegroundColor Gray
        Write-Host "  admin@balconbuilders.com / admin123" -ForegroundColor Gray
        Write-Host "  (and other role-based accounts)" -ForegroundColor Gray
        Write-Host ""
    }
}

Pop-Location

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 6: Deploy Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location frontend

Write-Host "Current directory: $PWD" -ForegroundColor Gray
Write-Host ""

# Set frontend environment variable
if ($backendUrl) {
    Write-Host "Setting REACT_APP_API_URL=$backendUrl/api" -ForegroundColor Cyan
    railway variables set "REACT_APP_API_URL=$backendUrl/api" --service frontend | Out-Null
    railway variables set CI=false --service frontend | Out-Null
}

Write-Host "Deploying frontend to Railway..." -ForegroundColor Cyan
railway up --service frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "✓ Frontend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Get frontend URL
Write-Host "Retrieving frontend URL..." -ForegroundColor Cyan
$frontendUrl = railway domain --service frontend 2>$null
if ($frontendUrl) {
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not retrieve frontend URL automatically" -ForegroundColor Yellow
    $frontendUrl = Read-Host "Enter frontend URL"
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 7: Update CORS Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($frontendUrl) {
    Write-Host "Setting CORS_ORIGIN=$frontendUrl" -ForegroundColor Cyan
    
    Push-Location backend
    railway variables set CORS_ORIGIN=$frontendUrl --service backend | Out-Null
    railway variables set FRONTEND_ORIGINS=$frontendUrl --service backend | Out-Null
    Pop-Location
    
    Write-Host ""
    Write-Host "✓ CORS configuration updated" -ForegroundColor Green
    Write-Host "Backend will restart automatically" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "WARNING: Frontend URL not available" -ForegroundColor Yellow
    Write-Host "Please manually set CORS_ORIGIN in Railway dashboard" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 8: Verify Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($backendUrl) {
    Write-Host "Testing backend health endpoint..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/health" -UseBasicParsing
        Write-Host "✓ Backend health check: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Backend health check failed (may be starting up)" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($frontendUrl) {
    Write-Host "Testing frontend..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
        Write-Host "✓ Frontend accessible: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Frontend check failed (may be starting up)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

if ($backendUrl) {
    Write-Host "Backend:  $backendUrl" -ForegroundColor Green
    Write-Host "API:      $backendUrl/api" -ForegroundColor Green
    Write-Host "Health:   $backendUrl/api/health" -ForegroundColor Green
    Write-Host "Metrics:  $backendUrl/api/metrics/prometheus" -ForegroundColor Green
    Write-Host ""
}

if ($frontendUrl) {
    Write-Host "Frontend: $frontendUrl" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open frontend: $frontendUrl" -ForegroundColor White
Write-Host "2. Test login with demo credentials" -ForegroundColor White
Write-Host "3. Verify critical functionality" -ForegroundColor White
Write-Host "4. Run smoke tests: node validate-deployment.js" -ForegroundColor White
Write-Host "5. Monitor logs: railway logs --service backend" -ForegroundColor White
Write-Host ""

# Save deployment info
$deploymentInfo = @{
    Environment = $Environment
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    BackendUrl = $backendUrl
    FrontendUrl = $frontendUrl
    JwtAccessSecret = $jwtAccessSecret
    JwtRefreshSecret = $jwtRefreshSecret
    MetricsToken = $metricsToken
} | ConvertTo-Json

$deploymentFile = "deployment-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$deploymentInfo | Out-File $deploymentFile
Write-Host "Deployment info saved to: $deploymentFile" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
