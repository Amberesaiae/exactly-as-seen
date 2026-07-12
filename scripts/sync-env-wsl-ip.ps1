#Requires -Version 5.1
# Point VITE_SUPABASE_URL at WSL IP when Docker Engine is in WSL
# (localhost published ports often don't reach Windows without Docker Desktop).
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$wslIp = (wsl -d Ubuntu -u root -e bash -lc "hostname -I | awk '{print `$1}'").Trim()
if (-not $wslIp) { throw "Could not read WSL IP" }

$envPath = Join-Path $RepoRoot '.env.local'
$lines = @()
if (Test-Path $envPath) { $lines = Get-Content $envPath }

function Set-Line([string[]]$existing, [string]$key, [string]$value) {
  $found = $false
  $out = foreach ($line in $existing) {
    if ($line -match "^\s*$([regex]::Escape($key))\s*=") {
      $found = $true
      "$key=$value"
    } else { $line }
  }
  if (-not $found) { $out = @($out) + "$key=$value" }
  return @($out)
}

$url = "http://${wslIp}:54321"
$lines = Set-Line $lines 'VITE_SUPABASE_URL' $url
# keep classic demo anon if present; do not wipe keys
Set-Content -Path $envPath -Value $lines -Encoding UTF8
Write-Host "[sync-env-wsl] VITE_SUPABASE_URL=$url"
Write-Host "Restart Vite after this change."
