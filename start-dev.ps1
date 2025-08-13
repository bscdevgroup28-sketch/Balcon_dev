#!/usr/bin/env powershell

# Bal-Con Builders Development Server Startup
# This script starts both backend and frontend servers

Write-Host "🏗️  Starting Bal-Con Builders Development Servers" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue
Write-Host ""

# Function to start background process
function Start-BackgroundServer($name, $path, $command, $color) {
    Write-Host "🚀 Starting $name server..." -ForegroundColor $color
    
    $job = Start-Job -ScriptBlock {
        param($workingDir, $cmd)
        Set-Location $workingDir
        Invoke-Expression $cmd
    } -ArgumentList $path, $command
    
    Write-Host "✅ $name server started (Job ID: $($job.Id))" -ForegroundColor Green
    return $job
}

# Check if we're in the right directory
if (-not (Test-Path ".\backend") -or -not (Test-Path ".\frontend")) {
    Write-Host "❌ Please run this script from the project root directory (balcon_v5)" -ForegroundColor Red
    exit 1
}

# Start backend server
$backendJob = Start-BackgroundServer "Backend" ".\backend" "npm run dev:enhanced" "Cyan"
Start-Sleep 3

# Start frontend server
$frontendJob = Start-BackgroundServer "Frontend" ".\frontend" "npm start" "Magenta"

Write-Host ""
Write-Host "🎉 Both servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Blue
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Demo login credentials:" -ForegroundColor Blue
Write-Host "  Owner: owner@balconbuilders.com / admin123" -ForegroundColor White
Write-Host "  Admin: admin@balconbuilders.com / admin123" -ForegroundColor White
Write-Host "  Customer: customer@example.com / customer123" -ForegroundColor White
Write-Host ""
Write-Host "📋 Server Status:" -ForegroundColor Yellow
Write-Host "  Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "  Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  To stop servers:" -ForegroundColor Red
Write-Host "  Stop-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host "  Remove-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "📊 To check server status:" -ForegroundColor Yellow
Write-Host "  Get-Job" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to return to command prompt (servers will continue running)" -ForegroundColor Gray

# Keep script running to show status
try {
    while ($true) {
        Start-Sleep 5
        $backendStatus = (Get-Job $backendJob.Id).State
        $frontendStatus = (Get-Job $frontendJob.Id).State
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Backend: $backendStatus | Frontend: $frontendStatus" -ForegroundColor Gray
        
        if ($backendStatus -eq "Failed" -or $frontendStatus -eq "Failed") {
            Write-Host "⚠️  One or more servers failed. Check the job output:" -ForegroundColor Red
            Write-Host "  Receive-Job $($backendJob.Id)" -ForegroundColor White
            Write-Host "  Receive-Job $($frontendJob.Id)" -ForegroundColor White
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "👋 Servers are still running in background jobs." -ForegroundColor Green
    Write-Host "   Use the stop commands above to terminate them when done." -ForegroundColor Gray
}
