#Requires -Version 5.1
<#
.SYNOPSIS
  Docker Engine + CLI via WSL2 — primary path (NO Docker Desktop required).

.DESCRIPTION
  Supabase only needs a Docker API. We run Docker Engine inside Ubuntu WSL
  and point the Windows docker CLI at it:

    DOCKER_HOST=tcp://127.0.0.1:2375

  - No Windows Administrator / UAC for daily use
  - No Docker Desktop registry key
  - Install/start dockerd as WSL root (no interactive sudo password)

  Optional: if Desktop is fully installed and healthy, that still works too.
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Distro = if ($env:LAMPFARMS_WSL_DISTRO) { $env:LAMPFARMS_WSL_DISTRO } else { 'Ubuntu' }
$DockerHost = 'tcp://127.0.0.1:2375'
$HostEnvFile = Join-Path $RepoRoot '.docker-host.env'
$InstallScript = Join-Path $RepoRoot 'scripts\wsl-install-docker-engine.sh'

function Write-Info($m) { Write-Host "[docker-cli] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[docker-cli] $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "[docker-cli] $m" -ForegroundColor Red }
function Write-Ok($m)   { Write-Host "[docker-cli] $m" -ForegroundColor Green }

# Windows docker CLI from Desktop install is fine as client-only
$dockerCandidates = @(
  "$env:ProgramFiles\Docker\Docker\resources\bin",
  "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin"
) | Where-Object { Test-Path $_ }
foreach ($bin in $dockerCandidates) {
  if ($env:Path -notlike "*$bin*") { $env:Path = "$bin;$env:Path" }
}

function Test-DockerInfo {
  param([string]$HostOverride)
  $prev = $env:DOCKER_HOST
  try {
    if ($HostOverride) { $env:DOCKER_HOST = $HostOverride }
    & docker info 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  } finally {
    if ($null -eq $prev) { Remove-Item Env:DOCKER_HOST -ErrorAction SilentlyContinue }
    else { $env:DOCKER_HOST = $prev }
  }
}

function Set-DockerHostEnv {
  $env:DOCKER_HOST = $DockerHost
  Set-Content -Path $HostEnvFile -Value "DOCKER_HOST=$DockerHost" -Encoding UTF8
  Write-Ok "DOCKER_HOST=$DockerHost (saved to .docker-host.env)"
}

# --- Fast path: already healthy ---
if (Test-DockerInfo -HostOverride $null) {
  Write-Ok "Docker already healthy (default context)."
  exit 0
}
if (Test-DockerInfo -HostOverride $DockerHost) {
  Set-DockerHostEnv
  Write-Ok "Docker Engine reachable via $DockerHost"
  docker version --format "Client {{.Client.Version}} / Server {{.Server.Version}}" 2>$null
  exit 0
}

# --- Ensure WSL distro ---
Write-Info "Using WSL distro: $Distro"
$wslList = wsl -l -q 2>$null
if ("$wslList" -notmatch [regex]::Escape($Distro)) {
  Write-Err "WSL distro '$Distro' not found. Install Ubuntu from Microsoft Store or set LAMPFARMS_WSL_DISTRO."
  exit 1
}

# Wake distro
wsl -d $Distro -e true 1>$null 2>$null

# --- Install Engine if missing (as root — no password) ---
$hasDocker = wsl -d $Distro -u root -e bash -lc "command -v dockerd >/dev/null && echo YES || echo NO"
if ("$hasDocker" -notmatch 'YES') {
  Write-Info "Installing Docker Engine inside WSL (root, no Windows UAC)..."
  if (-not (Test-Path $InstallScript)) {
    Write-Err "Missing $InstallScript"
    exit 1
  }
  # Map Windows path to /mnt/c/...
  if ($InstallScript -match '^([A-Za-z]):\\(.*)$') {
    $drive = $Matches[1].ToLower()
    $rest = $Matches[2] -replace '\\', '/'
    $wslPath = "/mnt/$drive/$rest"
  } else {
    $wslPath = $InstallScript
  }
  wsl -d $Distro -u root -e bash $wslPath
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Install script exit $LASTEXITCODE (may still be OK if DONE_OK printed)"
  }
}

# --- Start dockerd if needed ---
Write-Info "Ensuring dockerd is running..."
wsl -d $Distro -u root -e bash -lc @'
set -e
# Ensure TCP for Windows docker CLI
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ] || ! grep -q 2375 /etc/docker/daemon.json 2>/dev/null; then
  cat > /etc/docker/daemon.json <<JSON
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://127.0.0.1:2375"]
}
JSON
fi
# systemd unit may conflict with hosts in daemon.json — override if needed
if command -v systemctl >/dev/null 2>&1; then
  mkdir -p /etc/systemd/system/docker.service.d
  cat > /etc/systemd/system/docker.service.d/override.conf <<UNIT
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd --containerd=/run/containerd/containerd.sock
UNIT
  systemctl daemon-reload 2>/dev/null || true
  systemctl start docker 2>/dev/null || systemctl restart docker 2>/dev/null || true
fi
if ! docker info >/dev/null 2>&1; then
  pkill dockerd 2>/dev/null || true
  sleep 1
  nohup dockerd >/tmp/dockerd.log 2>&1 &
  sleep 3
fi
for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then
    echo "wsl-docker-ready"
    exit 0
  fi
  sleep 1
done
echo "wsl-docker-failed"
tail -30 /tmp/dockerd.log 2>/dev/null || true
exit 1
'@

if ($LASTEXITCODE -ne 0) {
  Write-Err "dockerd failed to start in WSL."
  exit 1
}

# --- Point Windows CLI ---
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Warn "Windows 'docker' CLI not on PATH. Using WSL docker for supabase via wrapper."
  Write-Warn "Optional: keep Docker Desktop client-only, or install docker CLI static binary."
  Set-DockerHostEnv
  # Still OK if we run supabase inside WSL
  wsl -d $Distro -u root -e docker version
  exit 0
}

Set-DockerHostEnv
if (Test-DockerInfo -HostOverride $DockerHost) {
  Write-Ok "Docker CLI (Windows) -> Engine (WSL) OK"
  docker version --format "Client {{.Client.Version}} / Server {{.Server.Version}}" 2>$null
  Write-Info "Daily: bun run backend   (no Docker Desktop, no admin)"
  exit 0
}

Write-Err "Engine is up in WSL but Windows CLI cannot connect to $DockerHost"
Write-Info "Try: `$env:DOCKER_HOST='$DockerHost'; docker info"
exit 1
