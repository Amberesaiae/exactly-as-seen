#!/usr/bin/env bash
# Start Docker Engine in WSL (no Desktop). Safe to re-run: does NOT kill a healthy dockerd.
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ] || ! grep -q '"dns"' /etc/docker/daemon.json 2>/dev/null; then
  printf '%s\n' '{' '  "dns": ["8.8.8.8", "1.1.1.1"]' '}' > /etc/docker/daemon.json
fi

# Fast path: already healthy — never restart (restart kills all containers)
if docker info >/dev/null 2>&1; then
  echo "already-ready"
  exit 0
fi

# Only hard-reset if engine is dead
systemctl stop docker.socket 2>/dev/null || true
systemctl stop docker 2>/dev/null || true
pkill -9 -x dockerd 2>/dev/null || true
rm -f /var/run/docker.pid
# keep socket cleanup only if no dockerd
if ! pgrep -x dockerd >/dev/null 2>&1; then
  rm -f /var/run/docker.sock
fi
sleep 1

if ! pgrep -x containerd >/dev/null 2>&1; then
  systemctl start containerd 2>/dev/null || containerd >/tmp/containerd.log 2>&1 &
  sleep 2
fi

nohup dockerd \
  -H unix:///var/run/docker.sock \
  -H tcp://127.0.0.1:2375 \
  --containerd=/run/containerd/containerd.sock \
  >/tmp/dockerd.log 2>&1 &

for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then
    echo "dockerd-ready"
    exit 0
  fi
  sleep 1
done

echo "dockerd-failed"
tail -40 /tmp/dockerd.log || true
exit 1
