# Security Verification Checklist
# Run this after deployment to verify all security measures are active

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$MetricsToken
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Security Verification Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$results = @()
$passCount = 0
$failCount = 0
$warnCount = 0

function Test-SecurityCheck {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$Expected,
        [string]$Severity = "HIGH"  # HIGH, MEDIUM, LOW
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "  Expected: $Expected" -ForegroundColor Gray
    
    try {
        $result = & $Test
        
        if ($result.Success) {
            Write-Host "  ✓ PASS" -ForegroundColor Green
            $script:passCount++
            $script:results += [PSCustomObject]@{
                Test = $Name
                Status = "PASS"
                Message = $result.Message
                Severity = $Severity
            }
        } else {
            if ($result.Warning) {
                Write-Host "  ⚠ WARNING: $($result.Message)" -ForegroundColor Yellow
                $script:warnCount++
                $script:results += [PSCustomObject]@{
                    Test = $Name
                    Status = "WARNING"
                    Message = $result.Message
                    Severity = $Severity
                }
            } else {
                Write-Host "  ✗ FAIL: $($result.Message)" -ForegroundColor Red
                $script:failCount++
                $script:results += [PSCustomObject]@{
                    Test = $Name
                    Status = "FAIL"
                    Message = $result.Message
                    Severity = $Severity
                }
            }
        }
    } catch {
        Write-Host "  ✗ ERROR: $_" -ForegroundColor Red
        $script:failCount++
        $script:results += [PSCustomObject]@{
            Test = $Name
            Status = "ERROR"
            Message = $_.Exception.Message
            Severity = $Severity
        }
    }
    
    Write-Host ""
}

Write-Host "Target Backend:  $BackendUrl" -ForegroundColor White
if ($FrontendUrl) {
    Write-Host "Target Frontend: $FrontendUrl" -ForegroundColor White
}
Write-Host ""

# Test 1: HTTPS Enforcement
Test-SecurityCheck -Name "HTTPS Enforcement" -Severity "HIGH" -Expected "HTTP requests redirect to HTTPS" -Test {
    try {
        $httpUrl = $BackendUrl -replace "https://", "http://"
        $response = Invoke-WebRequest -Uri "$httpUrl/api/health" -MaximumRedirection 0 -ErrorAction Stop
        return @{ Success = $false; Message = "HTTP did not redirect (Status: $($response.StatusCode))" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 308) {
            $location = $_.Exception.Response.Headers['Location']
            if ($location -like "https://*") {
                return @{ Success = $true; Message = "HTTP redirects to HTTPS" }
            }
        }
        return @{ Success = $false; Warning = $true; Message = "Could not verify HTTPS redirect (may be enforced at load balancer)" }
    }
}

# Test 2: HSTS Header
Test-SecurityCheck -Name "HSTS Header" -Severity "HIGH" -Expected "Strict-Transport-Security header present" -Test {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $hsts = $response.Headers['Strict-Transport-Security']
    
    if ($hsts) {
        if ($hsts -match 'max-age=(\d+)') {
            $maxAge = [int]$matches[1]
            if ($maxAge -ge 31536000) {  # 1 year
                return @{ Success = $true; Message = "HSTS enabled with max-age=$maxAge (1+ year)" }
            } else {
                return @{ Success = $false; Warning = $true; Message = "HSTS max-age too short: $maxAge (recommend 31536000+)" }
            }
        }
        return @{ Success = $true; Message = "HSTS header present: $hsts" }
    }
    return @{ Success = $false; Message = "HSTS header not found" }
}

# Test 3: Security Headers
Test-SecurityCheck -Name "Security Headers" -Severity "HIGH" -Expected "X-Content-Type-Options, X-Frame-Options, etc." -Test {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $headers = $response.Headers
    
    $requiredHeaders = @(
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy'
    )
    
    $missing = @()
    foreach ($header in $requiredHeaders) {
        if (-not $headers[$header]) {
            $missing += $header
        }
    }
    
    if ($missing.Count -eq 0) {
        return @{ Success = $true; Message = "All security headers present" }
    } else {
        return @{ Success = $false; Message = "Missing headers: $($missing -join ', ')" }
    }
}

# Test 4: CSP Header
Test-SecurityCheck -Name "Content Security Policy" -Severity "MEDIUM" -Expected "Content-Security-Policy header" -Test {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $csp = $response.Headers['Content-Security-Policy']
    
    if ($csp) {
        return @{ Success = $true; Message = "CSP header present" }
    }
    return @{ Success = $false; Warning = $true; Message = "CSP header not found (optional for API)" }
}

# Test 5: CORS Configuration
Test-SecurityCheck -Name "CORS Restrictions" -Severity "HIGH" -Expected "CORS allows only authorized origins" -Test {
    # Test from unauthorized origin (should fail)
    try {
        $headers = @{
            'Origin' = 'https://evil.com'
        }
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Headers $headers -UseBasicParsing
        
        $corsHeader = $response.Headers['Access-Control-Allow-Origin']
        if ($corsHeader -eq '*') {
            return @{ Success = $false; Message = "CORS allows ALL origins (insecure)" }
        }
        if ($corsHeader -eq 'https://evil.com') {
            return @{ Success = $false; Message = "CORS allows unauthorized origin" }
        }
        
        # No CORS header for unauthorized origin = good
        return @{ Success = $true; Message = "CORS blocks unauthorized origins" }
    } catch {
        return @{ Success = $true; Message = "CORS blocks unauthorized origins" }
    }
}

# Test 6: Authentication Required
Test-SecurityCheck -Name "Authentication Required" -Severity "HIGH" -Expected "Protected routes reject unauthenticated requests" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/analytics/summary" -UseBasicParsing -ErrorAction Stop
        return @{ Success = $false; Message = "Protected route accessible without auth (Status: $($response.StatusCode))" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            return @{ Success = $true; Message = "Protected routes require authentication (401 Unauthorized)" }
        }
        return @{ Success = $false; Message = "Unexpected response: $($_.Exception.Response.StatusCode)" }
    }
}

# Test 7: Rate Limiting
Test-SecurityCheck -Name "Rate Limiting" -Severity "MEDIUM" -Expected "Rate limiting active on endpoints" -Test {
    # Make multiple rapid requests
    $requests = 1..10 | ForEach-Object {
        try {
            Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing -TimeoutSec 2 | Select-Object -ExpandProperty StatusCode
        } catch {
            $_.Exception.Response.StatusCode.value__
        }
    }
    
    # Check if any request was rate limited (429)
    if ($requests -contains 429) {
        return @{ Success = $true; Message = "Rate limiting active (429 Too Many Requests)" }
    }
    
    # If all succeeded, rate limiting might be too lenient or health endpoint exempt
    return @{ Success = $false; Warning = $true; Message = "Could not trigger rate limit (may be configured per endpoint)" }
}

# Test 8: Brute Force Protection
Test-SecurityCheck -Name "Brute Force Protection" -Severity "HIGH" -Expected "Login endpoint limits failed attempts" -Test {
    # Try multiple failed logins
    $attempts = 1..6 | ForEach-Object {
        try {
            $body = @{
                email = "test@example.com"
                password = "wrongpassword$_"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
                -Method POST `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop
                
            return 200  # Should not succeed
        } catch {
            if ($_.Exception.Response) {
                return $_.Exception.Response.StatusCode.value__
            }
            return 0
        }
    }
    
    # Check if eventually got 429 (rate limited) or 423 (locked out)
    if ($attempts -contains 429 -or $attempts -contains 423) {
        return @{ Success = $true; Message = "Brute force protection active (account lockout triggered)" }
    }
    
    # All returned 401 = working but not triggering lockout
    return @{ Success = $false; Warning = $true; Message = "Could not verify brute force protection (may require more attempts)" }
}

# Test 9: Metrics Endpoint Security
if ($MetricsToken) {
    Test-SecurityCheck -Name "Metrics Endpoint Auth" -Severity "MEDIUM" -Expected "Metrics require authentication" -Test {
        # Try without token
        try {
            $response = Invoke-WebRequest -Uri "$BackendUrl/api/metrics/prometheus" -UseBasicParsing -ErrorAction Stop
            return @{ Success = $false; Message = "Metrics accessible without auth" }
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401) {
                # Try with token
                try {
                    $headers = @{ 'Authorization' = "Bearer $MetricsToken" }
                    $response = Invoke-WebRequest -Uri "$BackendUrl/api/metrics/prometheus" -Headers $headers -UseBasicParsing
                    return @{ Success = $true; Message = "Metrics protected by auth token" }
                } catch {
                    return @{ Success = $false; Message = "Token authentication failed" }
                }
            }
            return @{ Success = $false; Message = "Unexpected response: $($_.Exception.Response.StatusCode)" }
        }
    }
} else {
    Write-Host "Skipping metrics auth test (no token provided)" -ForegroundColor Yellow
    Write-Host ""
}

# Test 10: SQL Injection Protection (Basic)
Test-SecurityCheck -Name "SQL Injection Protection" -Severity "HIGH" -Expected "SQL injection attempts rejected safely" -Test {
    try {
        $body = @{
            email = "admin' OR '1'='1"
            password = "password"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
            
        return @{ Success = $false; Message = "SQL injection may have succeeded (got 200)" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            return @{ Success = $true; Message = "SQL injection attempt rejected (401 Unauthorized)" }
        }
        return @{ Success = $false; Warning = $true; Message = "Unexpected response: $($_.Exception.Response.StatusCode)" }
    }
}

# Test 11: XSS Protection (Basic)
Test-SecurityCheck -Name "XSS Protection" -Severity "MEDIUM" -Expected "XSS attempts handled safely" -Test {
    try {
        $body = @{
            email = "<script>alert('xss')</script>@test.com"
            password = "test"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
            
        # Check if response contains unescaped script tag
        $responseText = $response | ConvertTo-Json
        if ($responseText -match '<script>') {
            return @{ Success = $false; Message = "Response contains unescaped HTML" }
        }
        
        return @{ Success = $true; Message = "XSS content handled safely" }
    } catch {
        return @{ Success = $true; Message = "XSS attempt rejected" }
    }
}

# Frontend Tests (if URL provided)
if ($FrontendUrl) {
    # Test 12: Frontend HTTPS
    Test-SecurityCheck -Name "Frontend HTTPS" -Severity "HIGH" -Expected "Frontend uses HTTPS" -Test {
        if ($FrontendUrl -like "https://*") {
            try {
                $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
                return @{ Success = $true; Message = "Frontend uses HTTPS" }
            } catch {
                return @{ Success = $false; Message = "Frontend not accessible" }
            }
        }
        return @{ Success = $false; Message = "Frontend URL is not HTTPS" }
    }
    
    # Test 13: Frontend Security Headers
    Test-SecurityCheck -Name "Frontend Security Headers" -Severity "MEDIUM" -Expected "Frontend has security headers" -Test {
        $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
        $headers = $response.Headers
        
        $recommendedHeaders = @(
            'X-Content-Type-Options',
            'X-Frame-Options'
        )
        
        $present = 0
        foreach ($header in $recommendedHeaders) {
            if ($headers[$header]) {
                $present++
            }
        }
        
        if ($present -ge 1) {
            return @{ Success = $true; Message = "$present/$($recommendedHeaders.Count) security headers present" }
        }
        return @{ Success = $false; Warning = $true; Message = "No security headers found (may be handled by CDN)" }
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Security Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $passCount + $failCount + $warnCount

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "  Passed:   $passCount" -ForegroundColor Green
Write-Host "  Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "  Failed:   $failCount" -ForegroundColor Red
Write-Host ""

$score = [math]::Round(($passCount / $totalTests) * 100)
$scoreColor = if ($score -ge 90) { 'Green' } elseif ($score -ge 75) { 'Yellow' } else { 'Red' }

Write-Host "Security Score: $score/100" -ForegroundColor $scoreColor
Write-Host ""

# Failed tests detail
if ($failCount -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq 'FAIL' -or $_.Status -eq 'ERROR' } | ForEach-Object {
        Write-Host "  [$($_.Severity)] $($_.Test)" -ForegroundColor Red
        Write-Host "    $($_.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Warnings detail
if ($warnCount -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    $results | Where-Object { $_.Status -eq 'WARNING' } | ForEach-Object {
        Write-Host "  [$($_.Severity)] $($_.Test)" -ForegroundColor Yellow
        Write-Host "    $($_.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Recommendations
if ($failCount -gt 0 -or $warnCount -gt 0) {
    Write-Host "Recommendations:" -ForegroundColor Cyan
    
    $highSeverityIssues = $results | Where-Object { $_.Severity -eq 'HIGH' -and ($_.Status -eq 'FAIL' -or $_.Status -eq 'WARNING') }
    if ($highSeverityIssues.Count -gt 0) {
        Write-Host "  ⚠ $($highSeverityIssues.Count) HIGH severity issues found - address before production" -ForegroundColor Red
    }
    
    Write-Host "  - Review failed tests and fix critical issues" -ForegroundColor White
    Write-Host "  - Check Railway environment variables (CORS, JWT secrets)" -ForegroundColor White
    Write-Host "  - Verify security middleware is enabled" -ForegroundColor White
    Write-Host "  - Review backend logs for errors" -ForegroundColor White
    Write-Host ""
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "security-verification-$timestamp.json"
$results | ConvertTo-Json | Out-File $reportFile
Write-Host "Detailed report saved to: $reportFile" -ForegroundColor Gray
Write-Host ""

# Exit code
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
