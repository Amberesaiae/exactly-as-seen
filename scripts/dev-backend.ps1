#Requires -Version 5.1
<#
.SYNOPSIS
  Start local Supabase backend without requiring Administrator PowerShell.

.DESCRIPTION
  - Ensures Docker CLI is on PATH
  - Starts Docker Desktop if the engine pipe is missing (user-mode)
  - Runs `npx supabase start` and prints env keys for .env.local
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Write-Info($m) { Write-Host "[dev-backend] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[dev-backend] $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "[dev-backend] $m" -ForegroundColor Red }

# --- Docker on PATH (session) ---
$dockerCandidates = @(
  "$env:ProgramFiles\Docker\Docker\resources\bin",
  "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin"
) | Where-Object { Test-Path $_ }

foreach ($bin in $dockerCandidates) {
  if ($env:Path -notlike "*$bin*") {
    $env:Path = "$bin;$env:Path"
  }
}

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
  Write-Err "docker CLI not found. Install Docker Desktop once, then re-open this terminal."
  exit 1
}

# --- Start Docker Desktop if engine down ---
if (-not (Test-Path '\\.\pipe\docker_engine')) {
  $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path $dd)) {
    Write-Err "Docker Desktop.exe not found at $dd"
    exit 1
  }
  Write-Warn "Docker engine not running. Starting Docker Desktop (user-mode)..."
  Start-Process $dd
  $deadline = (Get-Date).AddMinutes(4)
  while (-not (Test-Path '\\.\pipe\docker_engine')) {
    if ((Get-Date) -gt $deadline) {
      Write-Err "Docker engine did not start. Open Docker Desktop UI and wait until it says Running, then re-run."
      exit 1
    }
    Start-Sleep -Seconds 3
  }
}

Write-Info "Checking docker info..."
docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Err "docker info failed. Finish Docker Desktop first-run (WSL2) then retry."
  exit 1
}

# --- Supabase ---
if (-not (Test-Path (Join-Path $RepoRoot 'supabase\config.toml'))) {
  Write-Err "No supabase/config.toml in repo. Are you in the right directory?"
  exit 1
}

Write-Info "Starting Supabase (npx — no admin, no global install required)..."
npx --yes supabase start
if ($LASTEXITCODE -ne 0) {
  Write-Err "supabase start failed."
  exit 1
}

Write-Info "Status (copy keys into .env.local):"
npx --yes supabase status

Write-Host ""
Write-Info "Next:"
Write-Host "  1) Put API URL + anon key into .env.local as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"
Write-Host "  2) npx supabase db reset   # apply migrations"
Write-Host "  3) .\scripts\dev-frontend.ps1"
