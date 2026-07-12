#!/usr/bin/env bash
# Install Docker Engine inside WSL Ubuntu (no Docker Desktop).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

echo "=== OS ==="
cat /etc/os-release | head -5

echo "=== apt update ==="
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl gnupg

echo "=== docker apt repo ==="
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
  sudo chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
ARCH=$(dpkg --print-architecture)
# Docker may not list 26.04 yet — fall back through known codenames
for CODENAME in "${VERSION_CODENAME}" noble jammy; do
  echo "trying codename=$CODENAME"
  echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  if sudo apt-get update -qq 2>/tmp/apt-docker.err; then
    if sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin; then
      echo "installed docker-ce via $CODENAME"
      break
    fi
  fi
  echo "ce install failed for $CODENAME"
done

if ! command -v dockerd >/dev/null 2>&1; then
  echo "falling back to ubuntu docker.io package"
  sudo apt-get install -y -qq docker.io || true
  sudo apt-get install -y -qq docker-compose-v2 2>/dev/null || true
fi

command -v dockerd
command -v docker || true

echo "=== daemon.json (empty; hosts via dockerd -H flags) ==="
# Note: putting "hosts" in daemon.json breaks systemd unit (-H fd:// conflict).
mkdir -p /etc/docker
echo '{}' > /etc/docker/daemon.json

echo "=== start dockerd (TCP 2375 for Windows CLI) ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/wsl-start-dockerd.sh" ]; then
  bash "$SCRIPT_DIR/wsl-start-dockerd.sh"
else
  # Fallback when script path is only the install file on /mnt/c
  systemctl stop docker.socket docker 2>/dev/null || true
  pkill -x dockerd 2>/dev/null || true
  sleep 1
  systemctl start containerd 2>/dev/null || containerd >/tmp/containerd.log 2>&1 &
  sleep 2
  nohup dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375 \
    --containerd=/run/containerd/containerd.sock >/tmp/dockerd.log 2>&1 &
  for i in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi

usermod -aG docker "${SUDO_USER:-amber}" 2>/dev/null || true

echo "=== docker version ==="
docker version
echo "=== docker info (head) ==="
docker info | head -25
echo "DONE_OK"
