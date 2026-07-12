#Requires -Version 5.1
<#
.SYNOPSIS
  Start local Supabase using Docker Engine + CLI (WSL) — no admin, no Desktop required.

.DESCRIPTION
  Primary: Docker Engine in WSL + DOCKER_HOST=tcp://127.0.0.1:2375
  Daily path never elevates Windows UAC.
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Write-Info($m) { Write-Host "[dev-backend] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[dev-backend] $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "[dev-backend] $m" -ForegroundColor Red }

# Session PATH for docker CLI client (from Desktop package if present — client only)
$dockerCandidates = @(
  "$env:ProgramFiles\Docker\Docker\resources\bin",
  "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin"
) | Where-Object { Test-Path $_ }
foreach ($bin in $dockerCandidates) {
  if ($env:Path -notlike "*$bin*") { $env:Path = "$bin;$env:Path" }
}

# Load DOCKER_HOST if previously set
$hostEnv = Join-Path $RepoRoot '.docker-host.env'
if (Test-Path $hostEnv) {
  Get-Content $hostEnv | ForEach-Object {
    if ($_ -match '^\s*DOCKER_HOST=(.+)\s*$') { $env:DOCKER_HOST = $Matches[1].Trim() }
  }
}

# Ensure Engine (WSL CLI path)
Write-Info "Ensuring Docker Engine (WSL) + CLI..."
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $RepoRoot 'scripts\ensure-docker-wsl.ps1')
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker Engine not available. See docs/BACKEND_LOCAL.md (Docker CLI / WSL)."
  exit 1
}

# Re-load host after ensure
if (Test-Path $hostEnv) {
  Get-Content $hostEnv | ForEach-Object {
    if ($_ -match '^\s*DOCKER_HOST=(.+)\s*$') { $env:DOCKER_HOST = $Matches[1].Trim() }
  }
}
if (-not $env:DOCKER_HOST) {
  $env:DOCKER_HOST = 'tcp://127.0.0.1:2375'
}

Write-Info "DOCKER_HOST=$env:DOCKER_HOST"
docker info 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Err "docker info failed after ensure."
  exit 1
}

if (-not (Test-Path (Join-Path $RepoRoot 'supabase\config.toml'))) {
  Write-Err "No supabase/config.toml — wrong directory?"
  exit 1
}

Write-Info "Starting Supabase (bunx/npx supabase — uses Docker CLI)..."
$sb = Get-Command bunx -ErrorAction SilentlyContinue
if ($sb) {
  bunx supabase start
} else {
  npx --yes supabase start
}
if ($LASTEXITCODE -ne 0) {
  Write-Err "supabase start failed."
  exit 1
}

Write-Info "Status:"
if ($sb) { bunx supabase status } else { npx --yes supabase status }

Write-Host ""
Write-Info "Next (user-mode, Bun):"
Write-Host "  bun run stack:env"
Write-Host "  bun run db:reset"
Write-Host "  bun run frontend"
