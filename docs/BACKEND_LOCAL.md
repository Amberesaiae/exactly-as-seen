# Local backend (Supabase) — no daily admin PowerShell

**Canonical backend for LampFarms:** Supabase (Postgres + Auth + RLS + RPCs + Edge Functions).  
There is no separate Express/Python API on `main`.

## Why not admin PowerShell every time

| Do | Don't |
|---|---|
| Run Docker Desktop as a normal user app | Elevate every terminal “as Administrator” |
| Use `npx supabase` or project-local CLI | Require global install under Program Files |
| Add Docker to **user** PATH once | Re-run installers daily |
| Work on a **real writable path** | Use a junction into a drive the agent sandbox blocks |

**One-time UAC** may appear when installing Docker Desktop or enabling WSL. Daily `dev` must not require elevation.

## Prerequisites

1. **Docker Desktop** installed and **Running** (whale icon idle).
2. **WSL2** available (`wsl -l -v` shows Ubuntu or similar).
3. **Node 20+** (`node -v`).
4. **Writable repo path** (see below).

### Writable path (Windows + Grok)

If `C:\Users\...\Projects` is a **junction to `D:\Projects`**, some sandboxed tools cannot write there.

**Supported layout for agents:**

```text
C:\src\exactly-as-seen     ← preferred working copy (writable)
```

Original may live under `D:\Projects\...` via junction; push/pull via git remotes as usual.

## Quick start

```powershell
# 1) Ensure Docker engine is up (normal PowerShell)
docker info
# If it fails: open "Docker Desktop" and wait until Running

# 2) Repo
cd C:\src\exactly-as-seen

# 3) Start Supabase stack (first run pulls images — slow)
.\scripts\dev-backend.ps1
# or: npx supabase start

# 4) Copy keys into .env.local (script prints them)
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=<anon key from status>

# 5) Apply schema (local)
npx supabase db reset
# applies all migrations under supabase/migrations/

# 6) Frontend
.\scripts\dev-frontend.ps1
# or: npm install; npm run dev
```

## Env vars

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Local default `http://127.0.0.1:54321` |
| `VITE_SUPABASE_ANON_KEY` | Yes | From `npx supabase status` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Alias | Accepted if client supports it |
| `VITE_VAPID_PUBLIC_KEY` | No | Push |
| `VITE_DEFAULT_CURRENCY` | No | Default `GHS` |

Copy from `.env.example` → `.env.local`. Prefer `.env.local` over committing secrets.

## Migrations

Apply in timestamp order under `supabase/migrations/`, including:

- `20260711000000_contract_alignment.sql` (feed_logs, assert_farm_owner, hardened RPCs)

See also `docs/DEFERRED_SUPABASE_AND_DOCKER.md`.

## Edge jobs (after stack is up)

```powershell
npx supabase functions serve
# or deploy to linked project when using hosted Supabase
```

Cron wrappers: `advance-batch-weeks`, `generate-daily-tasks`, `check-withdrawal-periods`, `prune-idempotency-keys`, `push-alerts`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker_engine` pipe missing | Open Docker Desktop; wait; reboot once if first install |
| Access denied writing repo | Work under `C:\src\...` not `D:\Projects` junction |
| Port 54321 in use | `npx supabase stop` then start; or free the port |
| RLS / RPC missing | `npx supabase db reset` |
| Admin prompt loops | Don’t run PowerShell as admin for npm/supabase; fix PATH instead |

## Hosted Supabase alternative

If local Docker is unavailable: create a project at supabase.com, set `VITE_SUPABASE_*` to cloud URL/key, run `npx supabase link` + `npx supabase db push`.
