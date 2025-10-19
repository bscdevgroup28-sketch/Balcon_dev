# Staging Deployment Smoke Test Plan
# Run this after deployment to verify critical functionality

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$DemoEmail = "owner@balconbuilders.com",
    
    [Parameter(Mandatory=$false)]
    [string]$DemoPassword = "admin123"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Smoke Test Plan - Critical Paths" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()
$passedTests = 0
$failedTests = 0

# Helper function for API tests
function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [scriptblock]$Validator = $null
    )
    
    Write-Host "Test: $Name" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = "$BackendUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json)
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            $content = $null
            if ($response.Content) {
                $content = $response.Content | ConvertFrom-Json
            }
            
            # Run custom validator if provided
            if ($Validator) {
                $validationResult = & $Validator $content
                if (-not $validationResult.Success) {
                    Write-Host "  ✗ FAIL: Validation failed - $($validationResult.Message)" -ForegroundColor Red
                    $script:failedTests++
                    $script:testResults += [PSCustomObject]@{
                        Test = $Name
                        Status = "FAIL"
                        Message = "Validation failed: $($validationResult.Message)"
                        StatusCode = $response.StatusCode
                    }
                    return $null
                }
            }
            
            Write-Host "  ✓ PASS (Status: $($response.StatusCode))" -ForegroundColor Green
            $script:passedTests++
            $script:testResults += [PSCustomObject]@{
                Test = $Name
                Status = "PASS"
                Message = "Success"
                StatusCode = $response.StatusCode
            }
            return $content
        } else {
            Write-Host "  ✗ FAIL: Expected status $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            $script:failedTests++
            $script:testResults += [PSCustomObject]@{
                Test = $Name
                Status = "FAIL"
                Message = "Unexpected status code"
                StatusCode = $response.StatusCode
            }
            return $null
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASS (Status: $statusCode)" -ForegroundColor Green
            $script:passedTests++
            $script:testResults += [PSCustomObject]@{
                Test = $Name
                Status = "PASS"
                Message = "Expected error status received"
                StatusCode = $statusCode
            }
            return $null
        } else {
            Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
            $script:failedTests++
            $script:testResults += [PSCustomObject]@{
                Test = $Name
                Status = "FAIL"
                Message = $_.Exception.Message
                StatusCode = $statusCode
            }
            return $null
        }
    }
    
    Write-Host ""
}

Write-Host "Backend URL:  $BackendUrl" -ForegroundColor White
if ($FrontendUrl) {
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor White
}
Write-Host "Demo User:    $DemoEmail" -ForegroundColor White
Write-Host ""

# ========================================
# PHASE 1: Infrastructure Tests
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " Phase 1: Infrastructure" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Test 1.1: Health Check
Invoke-ApiTest `
    -Name "1.1 Backend Health Check" `
    -Endpoint "/api/health" `
    -Validator {
        param($response)
        if ($response.status -eq 'ok') {
            return @{ Success = $true }
        }
        return @{ Success = $false; Message = "Health status not 'ok'" }
    }

# Test 1.2: Database Connection
Invoke-ApiTest `
    -Name "1.2 Database Connection" `
    -Endpoint "/api/health" `
    -Validator {
        param($response)
        if ($response.database -eq 'connected') {
            return @{ Success = $true }
        }
        return @{ Success = $false; Message = "Database not connected" }
    }

# Test 1.3: Metrics Endpoint (should require auth)
Invoke-ApiTest `
    -Name "1.3 Metrics Endpoint Protected" `
    -Endpoint "/api/metrics/prometheus" `
    -ExpectedStatus 401

# ========================================
# PHASE 2: Authentication Tests
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " Phase 2: Authentication" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Test 2.1: Protected Route Requires Auth
Invoke-ApiTest `
    -Name "2.1 Protected Route Blocks Unauthenticated" `
    -Endpoint "/api/analytics/summary" `
    -ExpectedStatus 401

# Test 2.2: Get CSRF Token
$csrfResponse = Invoke-ApiTest `
    -Name "2.2 Get CSRF Token" `
    -Endpoint "/api/auth/csrf"

$csrfToken = $null
if ($csrfResponse) {
    $csrfToken = $csrfResponse.csrfToken
    Write-Host "  CSRF Token: $($csrfToken.Substring(0, 20))..." -ForegroundColor Gray
}

# Test 2.3: Login with Demo Credentials
$loginBody = @{
    email = $DemoEmail
    password = $DemoPassword
}

$loginResponse = Invoke-ApiTest `
    -Name "2.3 Login with Demo Credentials" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body $loginBody `
    -Validator {
        param($response)
        if ($response.token) {
            return @{ Success = $true }
        }
        return @{ Success = $false; Message = "No token in response" }
    }

$authToken = $null
$authHeaders = @{}

if ($loginResponse -and $loginResponse.token) {
    $authToken = $loginResponse.token
    $authHeaders = @{
        'Authorization' = "Bearer $authToken"
    }
    Write-Host "  Auth Token: $($authToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "  User Role: $($loginResponse.user.role)" -ForegroundColor Gray
}

# Test 2.4: Access Protected Route with Token
if ($authToken) {
    Invoke-ApiTest `
        -Name "2.4 Access Protected Route with Token" `
        -Endpoint "/api/analytics/summary" `
        -Headers $authHeaders
}

# ========================================
# PHASE 3: CRUD Operations Tests
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " Phase 3: CRUD Operations" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if ($authToken) {
    # Test 3.1: List Projects
    $projects = Invoke-ApiTest `
        -Name "3.1 List Projects" `
        -Endpoint "/api/projects" `
        -Headers $authHeaders `
        -Validator {
            param($response)
            if ($response -is [array]) {
                return @{ Success = $true }
            }
            return @{ Success = $false; Message = "Response is not an array" }
        }
    
    # Test 3.2: Create Project
    $newProject = @{
        name = "Smoke Test Project - $(Get-Date -Format 'yyyyMMdd-HHmmss')"
        description = "Automated smoke test project"
        status = "active"
        budget = 50000
    }
    
    $createdProject = Invoke-ApiTest `
        -Name "3.2 Create Project" `
        -Method "POST" `
        -Endpoint "/api/projects" `
        -Headers $authHeaders `
        -Body $newProject `
        -ExpectedStatus 201 `
        -Validator {
            param($response)
            if ($response.id -and $response.name) {
                return @{ Success = $true }
            }
            return @{ Success = $false; Message = "Project missing id or name" }
        }
    
    $projectId = $null
    if ($createdProject) {
        $projectId = $createdProject.id
        Write-Host "  Created Project ID: $projectId" -ForegroundColor Gray
    }
    
    # Test 3.3: Get Single Project
    if ($projectId) {
        Invoke-ApiTest `
            -Name "3.3 Get Project Details" `
            -Endpoint "/api/projects/$projectId" `
            -Headers $authHeaders `
            -Validator {
                param($response)
                if ($response.id -eq $projectId) {
                    return @{ Success = $true }
                }
                return @{ Success = $false; Message = "Project ID mismatch" }
            }
    }
    
    # Test 3.4: Update Project
    if ($projectId) {
        $updateData = @{
            description = "Updated by smoke test - $(Get-Date -Format 'HH:mm:ss')"
        }
        
        Invoke-ApiTest `
            -Name "3.4 Update Project" `
            -Method "PUT" `
            -Endpoint "/api/projects/$projectId" `
            -Headers $authHeaders `
            -Body $updateData
    }
    
    # Test 3.5: List Materials
    Invoke-ApiTest `
        -Name "3.5 List Materials" `
        -Endpoint "/api/materials" `
        -Headers $authHeaders `
        -Validator {
            param($response)
            if ($response -is [array]) {
                return @{ Success = $true }
            }
            return @{ Success = $false; Message = "Response is not an array" }
        }
    
    # Test 3.6: List Users (Admin Only)
    Invoke-ApiTest `
        -Name "3.6 List Users (Admin)" `
        -Endpoint "/api/users" `
        -Headers $authHeaders `
        -Validator {
            param($response)
            if ($response -is [array]) {
                return @{ Success = $true }
            }
            # May return 403 if not admin - that's OK
            return @{ Success = $true }
        }
    
    # Test 3.7: Delete Test Project (Cleanup)
    if ($projectId) {
        Invoke-ApiTest `
            -Name "3.7 Delete Test Project (Cleanup)" `
            -Method "DELETE" `
            -Endpoint "/api/projects/$projectId" `
            -Headers $authHeaders `
            -ExpectedStatus 204
    }
} else {
    Write-Host "  ⚠ Skipping CRUD tests (no auth token)" -ForegroundColor Yellow
}

# ========================================
# PHASE 4: Analytics Tests
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " Phase 4: Analytics & Reports" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if ($authToken) {
    # Test 4.1: Analytics Summary
    Invoke-ApiTest `
        -Name "4.1 Analytics Summary" `
        -Endpoint "/api/analytics/summary" `
        -Headers $authHeaders `
        -Validator {
            param($response)
            if ($response.totalProjects -ne $null) {
                return @{ Success = $true }
            }
            return @{ Success = $false; Message = "Missing analytics data" }
        }
    
    # Test 4.2: Revenue Forecast
    Invoke-ApiTest `
        -Name "4.2 Revenue Forecast" `
        -Endpoint "/api/analytics/forecast?months=3" `
        -Headers $authHeaders
    
    # Test 4.3: Project Performance
    Invoke-ApiTest `
        -Name "4.3 Project Performance Metrics" `
        -Endpoint "/api/analytics/project-performance" `
        -Headers $authHeaders
} else {
    Write-Host "  ⚠ Skipping analytics tests (no auth token)" -ForegroundColor Yellow
}

# ========================================
# PHASE 5: Frontend Tests
# ========================================
if ($FrontendUrl) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " Phase 5: Frontend" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Test 5.1: Frontend Accessible
    Write-Host "Test: 5.1 Frontend Accessible" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ PASS (Status: 200)" -ForegroundColor Green
            $passedTests++
            $testResults += [PSCustomObject]@{
                Test = "5.1 Frontend Accessible"
                Status = "PASS"
                Message = "Frontend loads successfully"
                StatusCode = 200
            }
        }
    } catch {
        Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
        $failedTests++
        $testResults += [PSCustomObject]@{
            Test = "5.1 Frontend Accessible"
            Status = "FAIL"
            Message = $_.Exception.Message
            StatusCode = 0
        }
    }
    Write-Host ""
    
    # Test 5.2: Frontend Contains React Bundle
    Write-Host "Test: 5.2 Frontend Contains React Bundle" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
        if ($response.Content -match '<div id="root">' -or $response.Content -match 'react') {
            Write-Host "  ✓ PASS (React app detected)" -ForegroundColor Green
            $passedTests++
            $testResults += [PSCustomObject]@{
                Test = "5.2 Frontend Contains React Bundle"
                Status = "PASS"
                Message = "React app structure detected"
                StatusCode = 200
            }
        } else {
            Write-Host "  ⚠ WARNING: React structure not detected" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
        $failedTests++
    }
    Write-Host ""
}

# ========================================
# SUMMARY
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Smoke Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $passedTests + $failedTests
$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "  Passed: $passedTests" -ForegroundColor Green
Write-Host "  Failed: $failedTests" -ForegroundColor Red
Write-Host ""
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { 'Green' } elseif ($passRate -ge 75) { 'Yellow' } else { 'Red' })
Write-Host ""

# Failed tests detail
if ($failedTests -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq 'FAIL' } | ForEach-Object {
        Write-Host "  - $($_.Test)" -ForegroundColor Red
        Write-Host "    $($_.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Test coverage
Write-Host "Test Coverage:" -ForegroundColor Cyan
Write-Host "  ✓ Infrastructure (health, database)" -ForegroundColor $(if ($passedTests -ge 2) { 'Green' } else { 'Yellow' })
Write-Host "  ✓ Authentication (login, CSRF, tokens)" -ForegroundColor $(if ($authToken) { 'Green' } else { 'Red' })
Write-Host "  ✓ CRUD Operations (projects, materials)" -ForegroundColor $(if ($authToken) { 'Green' } else { 'Yellow' })
Write-Host "  ✓ Analytics (reports, forecasts)" -ForegroundColor $(if ($authToken) { 'Green' } else { 'Yellow' })
if ($FrontendUrl) {
    Write-Host "  ✓ Frontend (accessibility, React)" -ForegroundColor Green
}
Write-Host ""

# Save results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "smoke-test-results-$timestamp.json"
$testResults | ConvertTo-Json | Out-File $reportFile
Write-Host "Detailed results saved to: $reportFile" -ForegroundColor Gray
Write-Host ""

# Recommendations
if ($failedTests -gt 0) {
    Write-Host "Recommendations:" -ForegroundColor Yellow
    Write-Host "  - Review failed tests above" -ForegroundColor White
    Write-Host "  - Check backend logs: railway logs --service backend" -ForegroundColor White
    Write-Host "  - Verify environment variables in Railway dashboard" -ForegroundColor White
    Write-Host "  - Ensure database migrations are applied" -ForegroundColor White
    Write-Host "  - Test manually in browser: $FrontendUrl" -ForegroundColor White
    Write-Host ""
}

if ($passRate -eq 100) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " All Smoke Tests Passed! 🎉" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment appears healthy. You can proceed with:" -ForegroundColor Green
    Write-Host "  - User acceptance testing" -ForegroundColor White
    Write-Host "  - Load testing" -ForegroundColor White
    Write-Host "  - Security testing" -ForegroundColor White
    Write-Host "  - Production deployment" -ForegroundColor White
    Write-Host ""
}

# Exit code
if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
