#Requires -Version 5.1
<#
.SYNOPSIS
  Install deps and run Vite dev server (user-mode).
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Write-Info($m) { Write-Host "[dev-frontend] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[dev-frontend] $m" -ForegroundColor Yellow }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node not found. Install Node 20+ from https://nodejs.org"
}

$envFile = Join-Path $RepoRoot '.env.local'
$envAlt  = Join-Path $RepoRoot '.env'
if (-not (Test-Path $envFile) -and -not (Test-Path $envAlt)) {
  Write-Warn "No .env.local or .env — copy .env.example and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"
} else {
  $content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { Get-Content $envAlt -Raw }
  if ($content -notmatch 'VITE_SUPABASE_URL\s*=\s*https?://') {
    Write-Warn "VITE_SUPABASE_URL may be missing or placeholder. Local stack: http://127.0.0.1:54321"
  }
}

if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
  Write-Info "npm install..."
  npm install
}

Write-Info "Starting Vite (npm run dev)..."
npm run dev
