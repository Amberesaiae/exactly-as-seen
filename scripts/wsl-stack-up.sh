#!/usr/bin/env bash
# Bring up Engine + Supabase. Safe re-run. No Windows admin involved.
set -euo pipefail
export PATH="/opt/supabase-cli:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export SUPABASE_GO_BINARY="${SUPABASE_GO_BINARY:-/opt/supabase-cli/supabase-go}"
REPO="${1:-/mnt/c/src/exactly-as-seen}"
cd "$REPO"

mkdir -p /etc/docker
printf '%s\n' '{' '  "dns": ["8.8.8.8", "1.1.1.1"]' '}' > /etc/docker/daemon.json

# --- containerd ---
if ! pgrep -x containerd >/dev/null 2>&1; then
  echo "[stack] starting containerd..."
  systemctl start containerd 2>/dev/null || containerd >/tmp/containerd.log 2>&1 &
  sleep 2
fi
pgrep -x containerd >/dev/null || { echo "containerd failed"; tail -20 /tmp/containerd.log 2>/dev/null; exit 1; }

# --- dockerd (do not kill if healthy) ---
if docker info >/dev/null 2>&1; then
  echo "[stack] dockerd already healthy"
else
  echo "[stack] starting dockerd..."
  pkill -9 -x dockerd 2>/dev/null || true
  rm -f /var/run/docker.pid
  sleep 1
  nohup dockerd \
    -H unix:///var/run/docker.sock \
    -H tcp://127.0.0.1:2375 \
    --containerd=/run/containerd/containerd.sock \
    >/tmp/dockerd.log 2>&1 &
  for i in $(seq 1 40); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi
docker info >/dev/null 2>&1 || { echo "dockerd failed"; tail -30 /tmp/dockerd.log; exit 1; }

# --- supabase CLI ---
if [ ! -x /opt/supabase-cli/supabase ] || [ ! -x /opt/supabase-cli/supabase-go ]; then
  echo "[stack] installing supabase CLI binaries to /opt/supabase-cli..."
  mkdir -p /opt/supabase-cli
  curl -fsSL "https://github.com/supabase/cli/releases/download/v2.109.1/supabase_2.109.1_linux_amd64.tar.gz" \
    | tar -xzf - -C /opt/supabase-cli
  chmod +x /opt/supabase-cli/supabase /opt/supabase-cli/supabase-go
fi
export PATH="/opt/supabase-cli:$PATH"
export SUPABASE_GO_BINARY=/opt/supabase-cli/supabase-go

# Clear stuck CLI only (not this script)
pkill -9 -x supabase 2>/dev/null || true
pkill -9 -x supabase-go 2>/dev/null || true

# If already running and healthy enough, status and exit
if supabase status >/dev/null 2>&1; then
  echo "[stack] supabase already running"
  supabase status || true
  echo "STACK_UP_OK"
  exit 0
fi

echo "[stack] supabase start --ignore-health-check (slow host / low RAM safe)..."
# ignore-health-check: WSL 4GB often fails strict multi-service health deadlines
supabase start --ignore-health-check
supabase status || true
echo "STACK_UP_OK"
