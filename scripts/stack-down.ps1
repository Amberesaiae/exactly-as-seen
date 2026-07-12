#Requires -Version 5.1
# Stop Supabase containers only — leaves dockerd running (no Windows admin).
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Distro = if ($env:LAMPFARMS_WSL_DISTRO) { $env:LAMPFARMS_WSL_DISTRO } else { 'Ubuntu' }
if ($RepoRoot -match '^([A-Za-z]):\\(.*)$') {
  $drive = $Matches[1].ToLower()
  $rest = $Matches[2] -replace '\\', '/'
  $wslRepo = "/mnt/$drive/$rest"
} else {
  $wslRepo = $RepoRoot
}
Write-Host "[stack:down] Stopping supabase containers..."
wsl -d $Distro -u root -e bash -lc "export PATH=/opt/supabase-cli:/usr/local/bin:`$PATH; export SUPABASE_GO_BINARY=/opt/supabase-cli/supabase-go; cd $wslRepo; supabase stop"
