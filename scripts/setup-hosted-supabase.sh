#!/usr/bin/env bash
# Hosted Supabase setup (zero local Docker RAM).
# Prerequisites: free account at https://supabase.com
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...   # from https://supabase.com/dashboard/account/tokens
#   ./scripts/setup-hosted-supabase.sh
#
# Optional:
#   export SUPABASE_PROJECT_REF=abcdefghijklmnop   # skip create; link existing
#   export SUPABASE_ORG_ID=...                     # org for new project
#   export SUPABASE_DB_PASSWORD='a-strong-password'
set -euo pipefail

export PATH="${HOME}/.bun/bin:/opt/supabase-cli:/usr/local/bin:${PATH}"
export SUPABASE_GO_BINARY="${SUPABASE_GO_BINARY:-/opt/supabase-cli/supabase-go}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

die() { echo "[hosted] ERROR: $*" >&2; exit 1; }
info() { echo "[hosted] $*"; }

command -v supabase >/dev/null || die "supabase CLI not found (expected /opt/supabase-cli/supabase)"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  cat <<'EOF'
[hosted] SUPABASE_ACCESS_TOKEN is not set.

1. Open: https://supabase.com/dashboard/account/tokens
2. Generate a token (name: lampfarms-cli)
3. Run:

   export SUPABASE_ACCESS_TOKEN='sbp_...'
   ./scripts/setup-hosted-supabase.sh

Or one-shot:

   SUPABASE_ACCESS_TOKEN='sbp_...' ./scripts/setup-hosted-supabase.sh
EOF
  exit 1
fi

# Persist token for this user (CLI credentials store)
info "Logging in with access token..."
supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null

info "Listing projects..."
supabase projects list || true

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [[ -z "$PROJECT_REF" ]]; then
  # Try to reuse an existing project named lampfarms / exactly-as-seen
  EXISTING="$(supabase projects list -o json 2>/dev/null | \
    python3 -c '
import json,sys
try:
  data=json.load(sys.stdin)
except Exception:
  sys.exit(0)
items=data if isinstance(data,list) else data.get("projects") or data.get("data") or []
for p in items:
  name=(p.get("name") or p.get("Name") or "").lower()
  ref=p.get("id") or p.get("ref") or p.get("Id") or ""
  if name in ("lampfarms","exactly-as-seen","lamp-farms") and ref:
    print(ref); break
' 2>/dev/null || true)"
  if [[ -n "$EXISTING" ]]; then
    PROJECT_REF="$EXISTING"
    info "Reusing existing project ref: $PROJECT_REF"
  fi
fi

if [[ -z "$PROJECT_REF" ]]; then
  if [[ -z "$DB_PASSWORD" ]]; then
    # Generate a password if none provided
    DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
    info "Generated DB password (save it): $DB_PASSWORD"
  fi

  ORG_FLAG=()
  if [[ -n "${SUPABASE_ORG_ID:-}" ]]; then
    ORG_FLAG=(--org-id "$SUPABASE_ORG_ID")
  else
    # Pick first org if possible
    ORG_ID="$(supabase orgs list -o json 2>/dev/null | \
      python3 -c '
import json,sys
try: data=json.load(sys.stdin)
except Exception: sys.exit(0)
items=data if isinstance(data,list) else data.get("organizations") or data.get("data") or []
if items:
  print(items[0].get("id") or items[0].get("Id") or "")
' 2>/dev/null || true)"
    if [[ -n "$ORG_ID" ]]; then
      ORG_FLAG=(--org-id "$ORG_ID")
      info "Using org: $ORG_ID"
    fi
  fi

  info "Creating project 'lampfarms' (this may take 1–2 minutes)..."
  # region: closest sensible default; override with SUPABASE_REGION
  REGION="${SUPABASE_REGION:-eu-west-1}"
  CREATE_OUT="$(supabase projects create lampfarms \
    --db-password "$DB_PASSWORD" \
    --region "$REGION" \
    "${ORG_FLAG[@]}" \
    -o json 2>&1)" || {
      echo "$CREATE_OUT" >&2
      die "project create failed. Set SUPABASE_PROJECT_REF to an existing project and re-run."
    }
  echo "$CREATE_OUT"
  PROJECT_REF="$(echo "$CREATE_OUT" | python3 -c '
import json,sys,re
raw=sys.stdin.read()
try:
  data=json.loads(raw)
  print(data.get("id") or data.get("ref") or "")
except Exception:
  m=re.search(r"[a-z]{20}", raw)
  print(m.group(0) if m else "")
' 2>/dev/null || true)"
  [[ -n "$PROJECT_REF" ]] || die "Could not parse project ref from create output. Set SUPABASE_PROJECT_REF and re-run."
  info "Created project ref: $PROJECT_REF"
  # Persist password for human
  umask 077
  printf '%s\n' "$DB_PASSWORD" > "$REPO_ROOT/.supabase-db-password"
  info "DB password saved to .supabase-db-password (gitignored if matched)"
fi

info "Linking local repo to $PROJECT_REF..."
if [[ -n "${DB_PASSWORD:-}" ]]; then
  supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD" -y 2>/dev/null \
    || supabase link --project-ref "$PROJECT_REF" -y
else
  supabase link --project-ref "$PROJECT_REF" -y
fi

info "Fetching API keys..."
# Prefer modern API keys output
KEYS_JSON="$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null || true)"
ANON=""
if [[ -n "$KEYS_JSON" ]]; then
  ANON="$(echo "$KEYS_JSON" | python3 -c '
import json,sys
data=json.load(sys.stdin)
items=data if isinstance(data,list) else data.get("api_keys") or data.get("data") or []
for k in items:
  name=(k.get("name") or k.get("Name") or "").lower()
  val=k.get("api_key") or k.get("apiKey") or k.get("key") or ""
  if name in ("anon","anonymous","publishable") and val:
    print(val); break
if not any(True for _ in []):
  pass
' 2>/dev/null || true)"
  # second pass: any key with anon in name
  if [[ -z "$ANON" ]]; then
    ANON="$(echo "$KEYS_JSON" | python3 -c '
import json,sys
data=json.load(sys.stdin)
items=data if isinstance(data,list) else []
for k in items:
  name=(k.get("name") or "").lower()
  val=k.get("api_key") or k.get("apiKey") or ""
  if "anon" in name or "publishable" in name:
    print(val); break
' 2>/dev/null || true)"
  fi
fi

[[ -n "$ANON" ]] || die "Could not fetch anon key. Copy it from Dashboard → Project Settings → API."

API_URL="https://${PROJECT_REF}.supabase.co"

info "Writing .env.local (hosted — no local Docker)..."
umask 077
cat > "$REPO_ROOT/.env.local" <<EOF
# Hosted Supabase — zero local backend RAM
# Generated by scripts/setup-hosted-supabase.sh
VITE_SUPABASE_URL=${API_URL}
VITE_SUPABASE_ANON_KEY=${ANON}
VITE_DEFAULT_CURRENCY=GHS
EOF

info "Pushing migrations to hosted project..."
supabase db push --linked -y 2>&1 || {
  info "db push with --linked failed; trying default..."
  supabase db push -y
}

info "Smoke test REST..."
HTTP="$(curl -sS -o /dev/null -w '%{http_code}' \
  "${API_URL}/rest/v1/" \
  -H "apikey: ${ANON}" \
  -H "Authorization: Bearer ${ANON}" || echo fail)"
info "REST HTTP ${HTTP} (200/401 expected depending on schema exposure)"

cat <<EOF

[hosted] DONE
  Project:  ${PROJECT_REF}
  URL:      ${API_URL}
  Env:      ${REPO_ROOT}/.env.local

Start the app (local RAM ≈ Vite + browser only):
  bun run dev

Optional Edge Functions later:
  supabase functions deploy advance-batch-weeks
  supabase functions deploy generate-daily-tasks
  ...
EOF
