#Requires -Version 5.1
<#
.SYNOPSIS
  Bring up local Supabase with ZERO Windows elevation.
  Uses WSL root (not Windows Administrator).
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Distro = if ($env:LAMPFARMS_WSL_DISTRO) { $env:LAMPFARMS_WSL_DISTRO } else { 'Ubuntu' }

function Write-Info($m) { Write-Host "[stack:up] $m" -ForegroundColor Cyan }
function Write-Err($m)  { Write-Host "[stack:up] $m" -ForegroundColor Red }

Write-Info "Using WSL distro '$Distro' as root (no Windows UAC)..."
Write-Info "This is NOT 'Run as administrator'."

$wslScript = '/mnt/c/src/exactly-as-seen/scripts/wsl-stack-up.sh'
# Map repo to /mnt/<drive>/...
if ($RepoRoot -match '^([A-Za-z]):\\(.*)$') {
  $drive = $Matches[1].ToLower()
  $rest = $Matches[2] -replace '\\', '/'
  $wslScript = "/mnt/$drive/$rest/scripts/wsl-stack-up.sh"
  $wslRepo = "/mnt/$drive/$rest"
} else {
  $wslRepo = $RepoRoot
}

# Ensure install script ran at least once (idempotent)
$hasDocker = wsl -d $Distro -u root -e bash -lc "command -v dockerd >/dev/null && echo YES || echo NO"
if ("$hasDocker" -notmatch 'YES') {
  Write-Info "Installing Docker Engine in WSL (first time)..."
  $install = "$wslRepo/scripts/wsl-install-docker-engine.sh"
  wsl -d $Distro -u root -e bash $install
}

wsl -d $Distro -u root -e bash $wslScript $wslRepo
if ($LASTEXITCODE -ne 0) {
  Write-Err "stack:up failed (exit $LASTEXITCODE). Try again or see docs/NO_ADMIN_STACK.md"
  exit $LASTEXITCODE
}

Write-Info "Next: bun run stack:env   then   bun run frontend"
