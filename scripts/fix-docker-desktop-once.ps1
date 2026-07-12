#Requires -Version 5.1
<#
.SYNOPSIS
  ONE-TIME repair for broken Docker Desktop install (UAC once only).

.DESCRIPTION
  Symptom (Docker Desktop.exe.log):
    getting backend binary path: cannot find registry key
    "SOFTWARE\\Docker Inc.\\Docker Desktop"

  Cause:
    Installer interrupted during Phase Components. Program Files exist but
    HKLM registry key was never written.

  After success: daily bun run backend needs NO admin.
#>
$ErrorActionPreference = 'Stop'

function Write-Info($m) { Write-Host "[fix-docker] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[fix-docker] $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "[fix-docker] $m" -ForegroundColor Red }
function Write-Ok($m)   { Write-Host "[fix-docker] $m" -ForegroundColor Green }

$regPath = 'HKLM:\SOFTWARE\Docker Inc.\Docker Desktop'
if (Test-Path $regPath) {
  Write-Ok "Registry key already present."
  Write-Info "Next: bun run backend"
  exit 0
}

Write-Warn "Missing HKLM Docker Desktop registry key (incomplete install)."
Write-Warn "This matches: error getting docker binary key / backend binary path."

$installer = $null
$candidates = @(
  "$env:ProgramFiles\Docker\Docker\Docker Desktop Installer.exe",
  "$env:ProgramFiles\Docker\Docker\InstallerCli.exe"
)
foreach ($c in $candidates) {
  if (Test-Path $c) { $installer = $c; break }
}

if (-not $installer) {
  Write-Err "Docker Desktop Installer not found."
  Write-Info "Install once with: winget install --id Docker.DockerDesktop -e"
  Write-Info "Or download: https://docs.docker.com/desktop/setup/install/windows-install/"
  exit 1
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)

$argList = @('install', '--accept-license', '--backend=wsl-2', '--no-windows-containers')
if ($isAdmin) {
  $argList = @('install', '--quiet', '--accept-license', '--backend=wsl-2', '--no-windows-containers')
}

Write-Info "Installer: $installer"
Write-Info "Args: $($argList -join ' ')"

if (-not $isAdmin) {
  Write-Warn "Click YES on the single UAC prompt..."
  $p = Start-Process -FilePath $installer -ArgumentList $argList -Verb RunAs -Wait -PassThru
} else {
  $p = Start-Process -FilePath $installer -ArgumentList $argList -Wait -PassThru
}

Write-Info "Installer exit code: $($p.ExitCode)"
Start-Sleep -Seconds 3

if (Test-Path $regPath) {
  Write-Ok "Registry key created."
  $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dd) {
    Write-Info "Starting Docker Desktop (user-mode)..."
    Start-Process -FilePath $dd
  }
  Write-Ok "After whale icon is idle, run:"
  Write-Host "  bun run backend"
  Write-Host "  bun run stack:env"
  Write-Host "  bun run db:reset"
  Write-Host "  bun run frontend"
  exit 0
}

Write-Err "Registry key still missing."
Write-Info "Manual recovery:"
Write-Host "  A) Right-click Docker Desktop Installer, Run as administrator"
Write-Host "  B) winget install --id Docker.DockerDesktop -e"
Write-Host "  C) Reboot if Windows asked to enable WSL features"
Write-Host "Logs:"
Write-Host "  C:\ProgramData\DockerDesktop\install-log-admin.txt"
Write-Host "  $env:LOCALAPPDATA\Docker\log\host\Docker Desktop.exe.log"
exit 1
