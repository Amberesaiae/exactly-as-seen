#!/usr/bin/env bash
# Run supabase start inside WSL against local Docker Engine (unix socket).
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/supabase:$PATH"

REPO="${1:-/mnt/c/src/exactly-as-seen}"
cd "$REPO"

bash "$REPO/scripts/wsl-start-dockerd.sh"

install_cli() {
  local dir="$HOME/.local/share/supabase"
  mkdir -p "$dir"
  local ver
  ver=$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest | grep -oP '"tag_name":\s*"\K[^"]+' | head -1)
  ver=${ver:-v2.109.1}
  local asset="supabase_${ver#v}_linux_amd64.tar.gz"
  echo "Downloading $asset ..."
  curl -fsSL "https://github.com/supabase/cli/releases/download/${ver}/${asset}" -o /tmp/sb.tgz \
    || curl -fsSL "https://github.com/supabase/cli/releases/download/v2.109.1/supabase_2.109.1_linux_amd64.tar.gz" -o /tmp/sb.tgz
  tar -xzf /tmp/sb.tgz -C "$dir"
  chmod +x "$dir"/supabase* 2>/dev/null || true
  export PATH="$dir:$PATH"
  # if only one binary, still try
  ls -la "$dir" | head -20
}

if ! command -v supabase >/dev/null 2>&1 || ! command -v supabase-go >/dev/null 2>&1; then
  # Prefer npm package (ships both binaries) if node available
  if command -v npm >/dev/null 2>&1; then
    echo "Installing supabase via npm -g..."
    npm i -g supabase 2>&1 | tail -5
  else
    install_cli
  fi
fi

export PATH="$HOME/.local/share/supabase:$PATH"
echo "supabase: $(command -v supabase)"
supabase --version || true
supabase start
supabase status
