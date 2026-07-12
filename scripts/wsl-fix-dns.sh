#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' '[network]' 'generateResolvConf = false' > /etc/wsl.conf
rm -f /etc/resolv.conf
printf '%s\n' 'nameserver 8.8.8.8' 'nameserver 1.1.1.1' > /etc/resolv.conf
printf '%s\n' '{' '  "dns": ["8.8.8.8", "1.1.1.1"]' '}' > /etc/docker/daemon.json
echo "=== resolv.conf ==="
cat /etc/resolv.conf
echo "=== daemon.json ==="
cat /etc/docker/daemon.json
pkill -x dockerd 2>/dev/null || true
sleep 1
systemctl start containerd 2>/dev/null || containerd >/tmp/containerd.log 2>&1 &
sleep 2
nohup dockerd \
  -H unix:///var/run/docker.sock \
  -H tcp://127.0.0.1:2375 \
  --containerd=/run/containerd/containerd.sock \
  >/tmp/dockerd.log 2>&1 &
for i in $(seq 1 25); do
  if docker info >/dev/null 2>&1; then
    echo dockerd-ready
    getent hosts ghcr.io || true
    docker pull hello-world
    exit 0
  fi
  sleep 1
done
echo FAIL
tail -30 /tmp/dockerd.log
exit 1
