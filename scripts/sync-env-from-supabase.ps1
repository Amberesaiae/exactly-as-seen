#Requires -Version 5.1
<#
.SYNOPSIS
  Write VITE_SUPABASE_* into .env.local from local `supabase status` (user-mode, no admin).
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Write-Info($m) { Write-Host "[stack:env] $m" -ForegroundColor Cyan }
function Write-Err($m)  { Write-Host "[stack:env] $m" -ForegroundColor Red }

$dockerCandidates = @(
  "$env:ProgramFiles\Docker\Docker\resources\bin",
  "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin"
) | Where-Object { Test-Path $_ }
foreach ($bin in $dockerCandidates) {
  if ($env:Path -notlike "*$bin*") { $env:Path = "$bin;$env:Path" }
}

Write-Info "Reading supabase status..."
$statusOut = & npx --yes supabase status 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
  Write-Err "supabase status failed. Run: npm run backend"
  Write-Host $statusOut
  exit 1
}

# Prefer env-style if available
$envOut = & npx --yes supabase status -o env 2>&1 | Out-String
$apiUrl = $null
$anonKey = $null

if ($envOut -match 'API_URL=["'']?([^\s"'']+)') {
  $apiUrl = $Matches[1]
}
if ($envOut -match 'ANON_KEY=["'']?([^\s"'']+)') {
  $anonKey = $Matches[1]
}

# Fallback: parse human status
if (-not $apiUrl -and $statusOut -match 'API URL\s*:\s*(\S+)') {
  $apiUrl = $Matches[1].Trim()
}
if (-not $anonKey -and $statusOut -match 'anon key\s*:\s*(\S+)') {
  $anonKey = $Matches[1].Trim()
}
if (-not $anonKey -and $statusOut -match 'Publishable\s*:\s*(\S+)') {
  $anonKey = $Matches[1].Trim()
}

if (-not $apiUrl -or -not $anonKey) {
  Write-Err "Could not parse API URL / anon key from supabase status."
  Write-Host $statusOut
  exit 1
}

$envPath = Join-Path $RepoRoot '.env.local'
$lines = @()
if (Test-Path $envPath) {
  $lines = Get-Content $envPath
}

function Set-EnvLine([string[]]$existing, [string]$key, [string]$value) {
  $found = $false
  $out = foreach ($line in $existing) {
    if ($line -match "^\s*$([regex]::Escape($key))\s*=") {
      $found = $true
      "$key=$value"
    } else {
      $line
    }
  }
  if (-not $found) {
    $out = @($out) + "$key=$value"
  }
  return @($out)
}

$lines = Set-EnvLine $lines 'VITE_SUPABASE_URL' $apiUrl
$lines = Set-EnvLine $lines 'VITE_SUPABASE_ANON_KEY' $anonKey
$lines = Set-EnvLine $lines 'VITE_SUPABASE_PUBLISHABLE_KEY' $anonKey

Set-Content -Path $envPath -Value $lines -Encoding UTF8
Write-Info "Wrote $envPath"
Write-Info "VITE_SUPABASE_URL=$apiUrl"
Write-Info "VITE_SUPABASE_ANON_KEY=<set, length $($anonKey.Length)>"
Write-Host ""
Write-Info "Next: npm run db:reset   then   npm run frontend"
