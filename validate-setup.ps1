#!/usr/bin/env powershell

# Bal-Con Builders System Validation Script
# This script tests all major functionality after setup

Write-Host "🧪 Bal-Con Builders System Validation" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue
Write-Host ""

$backendUrl = "http://localhost:8082"
$frontendUrl = "http://localhost:3000"

# Function to test HTTP endpoint
function Test-Endpoint($url, $description) {
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test with authentication
function Test-AuthEndpoint($url, $token, $description) {
    try {
        $headers = @{ "Authorization" = "Bearer $token" }
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 10
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "🔍 Testing Backend Endpoints..." -ForegroundColor Yellow
Write-Host ""

# Basic connectivity tests
$tests = @(
    @{ Url = "$backendUrl/api/health"; Description = "Health Check Endpoint" },
    @{ Url = "$backendUrl/api/test"; Description = "Test Endpoint" },
    @{ Url = "$backendUrl/api/auth/demo-accounts"; Description = "Demo Accounts Endpoint" }
)

$backendWorking = $true
foreach ($test in $tests) {
    if (-not (Test-Endpoint $test.Url $test.Description)) {
        $backendWorking = $false
    }
}

Write-Host ""

if ($backendWorking) {
    Write-Host "🔐 Testing Authentication..." -ForegroundColor Yellow
    
    # Test login
    try {
        $loginData = @{
            email = "owner@balconbuilders.com"
            password = "admin123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        $token = $loginResponse.token
        
        Write-Host "✅ Login successful" -ForegroundColor Green
        
        # Test authenticated endpoints
        $authTests = @(
            @{ Url = "$backendUrl/api/projects"; Description = "Projects endpoint (authenticated)" },
            @{ Url = "$backendUrl/api/quotes"; Description = "Quotes endpoint (authenticated)" },
            @{ Url = "$backendUrl/api/users"; Description = "Users endpoint (authenticated)" }
        )
        
        foreach ($test in $authTests) {
            Test-AuthEndpoint $test.Url $token $test.Description | Out-Null
        }
        
    } catch {
        Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping authentication tests due to backend connectivity issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Testing Frontend..." -ForegroundColor Yellow

# Test frontend accessibility
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend returned status code: $($frontendResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Testing File System..." -ForegroundColor Yellow

# Check required directories and files
$fileChecks = @(
    @{ Path = ".\backend\enhanced_database.sqlite"; Description = "Enhanced Database File" },
    @{ Path = ".\backend\uploads"; Description = "Upload Directory" },
    @{ Path = ".\backend\dist"; Description = "Backend Build Directory" },
    @{ Path = ".\frontend\build"; Description = "Frontend Build Directory (optional)" }
)

foreach ($check in $fileChecks) {
    if (Test-Path $check.Path) {
        Write-Host "✅ $($check.Description)" -ForegroundColor Green
    } else {
        if ($check.Description -contains "optional") {
            Write-Host "⚠️  $($check.Description) - Not found (optional)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ $($check.Description) - Not found" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🗄️  Testing Database..." -ForegroundColor Yellow

# Test database connection by checking for key tables
try {
    $dbPath = ".\backend\enhanced_database.sqlite"
    if (Test-Path $dbPath) {
        # Use SQLite command line if available, otherwise skip detailed DB test
        if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
            $tables = sqlite3 $dbPath ".tables"
            if ($tables -match "Users.*Projects.*Quotes") {
                Write-Host "✅ Database tables exist" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Database exists but tables may be missing" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✅ Database file exists (detailed check requires sqlite3 CLI)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Database file not found" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Database check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Validation Summary" -ForegroundColor Blue
Write-Host "====================" -ForegroundColor Blue
Write-Host ""

if ($backendWorking) {
    Write-Host "✅ Backend API is working" -ForegroundColor Green
} else {
    Write-Host "❌ Backend API has issues" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Blue
Write-Host ""

if ($backendWorking) {
    Write-Host "1. ✅ Backend is ready" -ForegroundColor Green
    Write-Host "2. 🌐 Open http://localhost:3000 in your browser" -ForegroundColor Cyan
    Write-Host "3. 🔑 Login with demo credentials:" -ForegroundColor Cyan
    Write-Host "   - Owner: owner@balconbuilders.com / admin123" -ForegroundColor White
    Write-Host "   - Admin: admin@balconbuilders.com / admin123" -ForegroundColor White
    Write-Host "4. 🧪 Test the application features" -ForegroundColor Cyan
} else {
    Write-Host "1. ❌ Fix backend issues first" -ForegroundColor Red
    Write-Host "2. 🔧 Check that backend server is running:" -ForegroundColor Yellow
    Write-Host "   cd backend && npm run dev:enhanced" -ForegroundColor White
    Write-Host "3. 🔍 Check backend logs for errors" -ForegroundColor Yellow
    Write-Host "4. 🗄️  Ensure database is properly initialized:" -ForegroundColor Yellow
    Write-Host "   npm run db:init:enhanced && npm run db:seed:enhanced" -ForegroundColor White
}

Write-Host ""
Write-Host "📖 For troubleshooting, see CLEANUP_AND_SETUP_GUIDE.md" -ForegroundColor Gray
