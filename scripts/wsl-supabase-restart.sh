#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/supabase-cli:/usr/local/bin:/usr/sbin:/usr/bin:$PATH"
export SUPABASE_GO_BINARY=/opt/supabase-cli/supabase-go
REPO="${1:-/mnt/c/src/exactly-as-seen}"
cd "$REPO"

# Ensure dockerd (safe - no kill if healthy)
bash "$REPO/scripts/wsl-start-dockerd.sh"

# Clear stuck CLI processes only (do NOT match this script path)
pkill -9 -x supabase 2>/dev/null || true
pkill -9 -x supabase-go 2>/dev/null || true
sleep 1

# Remove all supabase containers for this project
ids=$(docker ps -aq --filter name=supabase_ 2>/dev/null || true)
if [ -n "${ids:-}" ]; then
  docker rm -f $ids || true
fi

echo "Starting supabase..."
supabase start
echo "--- status ---"
supabase status
