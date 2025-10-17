<#!
Railway Deployment Helper Script
Usage examples:
  # Full flow (install/check CLI, login, link, deploy backend & frontend, validate)
  powershell -ExecutionPolicy Bypass -File .\railway-deploy.ps1 -Full

  # Just deploy backend
  powershell -ExecutionPolicy Bypass -File .\railway-deploy.ps1 -Backend

  # Just deploy frontend
  powershell -ExecutionPolicy Bypass -File .\railway-deploy.ps1 -Frontend

  # Validate health after deploy
  powershell -ExecutionPolicy Bypass -File .\railway-deploy.ps1 -Validate https://your-backend.railway.app

Parameters:
  -Full       Runs install/login/link + backend + frontend + validate scaffold
  -Backend    Deploy backend only
  -Frontend   Deploy frontend only
  -Validate   Provide base backend URL to hit /api/health
  -ProjectId  (Optional) Explicit Railway project ID if auto-link fails
  -SkipLogin  Skip login step (useful in CI where token already set)
  -ServiceBackendName  Override backend service name (default 'backend')
  -ServiceFrontendName Override frontend service name (default 'frontend')
!>
param(
  [switch] $Full,
  [switch] $Backend,
  [switch] $Frontend,
  [string] $Validate,
  [string] $ProjectId,
  [switch] $SkipLogin,
  [string] $ServiceBackendName = 'backend',
  [string] $ServiceFrontendName = 'frontend'
)

$ErrorActionPreference = 'Stop'

function Write-Section($title) { Write-Host "`n==== $title ====\n" -ForegroundColor Cyan }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR ] $msg" -ForegroundColor Red }

function Ensure-RailwayCLI {
  Write-Section 'Checking Railway CLI'
  $cli = (Get-Command railway -ErrorAction SilentlyContinue)
  if (-not $cli) {
    Write-Info 'Railway CLI not found. Installing globally via npm...'
    npm install -g @railway/cli | Out-Null
  } else {
    Write-Info "Railway CLI already installed: $($cli.Source)"
  }
  Write-Info "Railway CLI Version: $(railway --version 2>$null)"
}

function Railway-Login {
  if ($SkipLogin) { Write-Info 'Skipping login (SkipLogin flag set)'; return }
  Write-Section 'Authenticating'
  Write-Info 'Opening browser for Railway auth (if token not cached).'
  railway login
}

function Railway-Link {
  Write-Section 'Linking Project'
  if ($ProjectId) {
    Write-Info "Linking to explicit project ID: $ProjectId"
    railway link --project $ProjectId
  } else {
    $status = railway status 2>$null | Out-String
    if ($LASTEXITCODE -ne 0 -or -not ($status -match 'Project:')) {
      Write-Info 'No existing link found. Running interactive link.'
      railway link
    } else {
      Write-Info 'Already linked:'
      Write-Host $status
    }
  }
}

function Deploy-Backend {
  Write-Section 'Deploy Backend'
  Push-Location backend
  try {
    # Pre-build sanity check
    if (Test-Path package.json) {
      Write-Info 'Installing backend dependencies (production-ish)...'
      npm install --no-audit --no-fund > $null
      Write-Info 'Building backend TypeScript...'
      npm run build 2>&1 | Write-Host
    }
    Write-Info "Deploying via Railway (service: $ServiceBackendName)"
    railway up --service $ServiceBackendName
  } finally { Pop-Location }
}

function Deploy-Frontend {
  Write-Section 'Deploy Frontend'
  Push-Location frontend
  try {
    if (Test-Path package.json) {
      Write-Info 'Installing frontend dependencies...'
      npm install --no-audit --no-fund > $null
      Write-Info 'Building frontend (React)...'
      npm run build 2>&1 | Write-Host
    }
    Write-Info "Deploying via Railway (service: $ServiceFrontendName)"
    railway up --service $ServiceFrontendName
  } finally { Pop-Location }
}

function Validate-Backend($baseUrl) {
  Write-Section "Validating Deployed Backend: $baseUrl"
  if (-not $baseUrl) { Write-Warn 'No base URL supplied'; return }
  $health = "$baseUrl/api/health"
  try {
    Write-Info "GET $health"
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $health -TimeoutSec 20
    Write-Host $resp.Content
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
      Write-Info 'Health check succeeded.'
    } else {
      Write-Warn "Non-2xx status: $($resp.StatusCode)"
    }
  } catch {
    Write-Err "Health check failed: $($_.Exception.Message)"
  }
}

if ($Full) {
  $Backend = $true; $Frontend = $true
}

Ensure-RailwayCLI
Railway-Login
Railway-Link

if ($Backend) { Deploy-Backend }
if ($Frontend) { Deploy-Frontend }
if ($Validate) { Validate-Backend $Validate }

Write-Section 'Complete'
Write-Info 'Script finished.'
