# Database Migration Verification Script
# Run this after deployment to verify all migrations are applied correctly

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Database Migration Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('local', 'railway')]
    [string]$Environment = 'local'
)

# Expected migrations (in order)
$expectedMigrations = @(
    "001-add-sprint4-inquiry-system.ts",
    "002-add-kpi-tables.ts",
    "003-add-new-roles-and-demo-users.ts",
    "004-add-refresh-tokens.ts"
)

Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

if ($Environment -eq 'railway') {
    Write-Host "Checking Railway database migrations..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if in backend directory
    if (-not (Test-Path "package.json")) {
        Write-Host "Switching to backend directory..." -ForegroundColor Yellow
        Push-Location backend
    }
    
    # Check migration status on Railway
    Write-Host "Running: railway run npm run migrate:status --service backend" -ForegroundColor Gray
    Write-Host ""
    
    $output = railway run npm run migrate:status --service backend 2>&1
    Write-Host $output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migration status check completed" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Migration status check failed" -ForegroundColor Red
        exit 1
    }
    
} else {
    Write-Host "Checking local database migrations..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if in backend directory
    if (-not (Test-Path "package.json")) {
        Write-Host "Switching to backend directory..." -ForegroundColor Yellow
        Push-Location backend
    }
    
    # Run migration status check
    Write-Host "Running: npm run migrate:status" -ForegroundColor Gray
    Write-Host ""
    
    $output = npm run migrate:status 2>&1
    Write-Host $output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migration status check completed" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Migration status check failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Migration Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parse output to verify expected migrations
$appliedCount = 0
$missingMigrations = @()

foreach ($migration in $expectedMigrations) {
    if ($output -match $migration) {
        Write-Host "✓ $migration" -ForegroundColor Green
        $appliedCount++
    } else {
        Write-Host "✗ $migration (NOT FOUND)" -ForegroundColor Red
        $missingMigrations += $migration
    }
}

Write-Host ""
Write-Host "Applied Migrations: $appliedCount / $($expectedMigrations.Count)" -ForegroundColor $(if ($appliedCount -eq $expectedMigrations.Count) { 'Green' } else { 'Yellow' })

if ($missingMigrations.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing Migrations:" -ForegroundColor Red
    foreach ($migration in $missingMigrations) {
        Write-Host "  - $migration" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Run migrations with:" -ForegroundColor Yellow
    if ($Environment -eq 'railway') {
        Write-Host "  railway run npm run migrate --service backend" -ForegroundColor Gray
    } else {
        Write-Host "  npm run migrate" -ForegroundColor Gray
    }
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " All Migrations Applied Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Cleanup
if ((Get-Location).Path.EndsWith('backend')) {
    Pop-Location
}
