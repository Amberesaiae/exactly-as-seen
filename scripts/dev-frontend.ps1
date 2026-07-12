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

$hasBun = Get-Command bun -ErrorAction SilentlyContinue
if (-not $hasBun -and -not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Neither bun nor node found. Install Bun: https://bun.sh  (or Node 20+)."
}

# Refresh WSL IP in .env.local (no admin) so Windows Vite reaches Engine-in-WSL
$syncEnv = Join-Path $RepoRoot 'scripts\stack-env.ps1'
if (Test-Path $syncEnv) {
  try {
    Write-Info "Refreshing Supabase URL (WSL IP)..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $syncEnv
  } catch {
    Write-Warn "stack:env refresh skipped: $_"
  }
}

$envFile = Join-Path $RepoRoot '.env.local'
$envAlt  = Join-Path $RepoRoot '.env'
if (-not (Test-Path $envFile) -and -not (Test-Path $envAlt)) {
  Write-Warn "No .env.local — run: bun run stack:up && bun run stack:env"
} else {
  $content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { Get-Content $envAlt -Raw }
  if ($content -notmatch 'VITE_SUPABASE_URL\s*=\s*https?://') {
    Write-Warn "VITE_SUPABASE_URL missing. Run: bun run stack:env"
  }
}
if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
  if ($hasBun) {
    Write-Info "bun install..."
    bun install
  } else {
    Write-Info "npm install..."
    npm install
  }
}

if ($hasBun) {
  Write-Info "Starting Vite (bun run dev)..."
  bun run dev
} else {
  Write-Info "Starting Vite (npm run dev)..."
  npm run dev
}