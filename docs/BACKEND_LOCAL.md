# Local backend (Supabase) — zero Windows admin daily

**Canonical backend for LampFarms:** Supabase (Postgres + Auth + RLS + RPCs + Edge Functions).  
There is no separate Express/Python API on `main`.

**Read first:** `docs/NO_ADMIN_STACK.md` — how we avoid UAC / elevation walls.

## Docker model (canonical for this repo)

| Layer | What we use |
|---|---|
| **Engine** | Docker Engine inside **WSL2 Ubuntu** (`dockerd`) as **WSL root** |
| **CLI** | Supabase CLI **inside WSL** (`/opt/supabase-cli`) |
| **Windows app** | Bun + Vite; API URL = `http://<WSL_IP>:54321` (not localhost) |
| **Not required** | Docker Desktop, Admin PowerShell, `netsh portproxy` |

`wsl -u root` is **not** Windows Administrator and does **not** show UAC.

## Prerequisites

1. **WSL2 + Ubuntu** (`wsl -l -v`).
2. **Bun** (`bun -v`) on Windows.
3. Writable repo path `C:\src\exactly-as-seen`.

### Writable path (Windows + Grok)

If `C:\Users\...\Projects` is a **junction to `D:\Projects`**, some sandboxed tools cannot write there.

**Supported layout for agents:**

```text
C:\src\exactly-as-seen     ← preferred working copy (writable)
```

Original may live under `D:\Projects\...` via junction; push/pull via git remotes as usual.

## Quick start (no Admin PowerShell)

```powershell
cd C:\src\exactly-as-seen
bun install
bun run stack:up      # WSL root: containerd + dockerd + supabase
bun run stack:env     # .env.local with WSL IP + keys
bun run db:reset      # migrations (first time / schema change)
bun run frontend
```

Optional after reboot (WSL IP may change): `bun run stack:env` again.

Package manager: **Bun**.  
Scripts: `stack-up.ps1` → `wsl-stack-up.sh` (all no Windows UAC).
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

### “Error getting docker binary key” / backend binary path

**Exact log** (`%LOCALAPPDATA%\Docker\log\host\Docker Desktop.exe.log`):

```text
getting backend binary path: cannot find registry key
"SOFTWARE\\Docker Inc.\\Docker Desktop"
```

**Cause:** Docker Desktop install was interrupted during Phase “Components”.  
Files exist under `C:\Program Files\Docker\Docker` but **HKLM registry was never written**. Starting Desktop from the Start menu fails forever; **no amount of non-admin restarts fixes it**.

**ONE-TIME fix** (single UAC — not daily):

```powershell
bun run docker:fix
# or: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\fix-docker-desktop-once.ps1
```

Click **Yes** on UAC. Wait for installer to finish. Then daily:

```powershell
bun run backend    # no admin
bun run stack:env
bun run db:reset
bun run frontend
```

Also check: you are in the `docker-users` group (you already are if listed under Local Users).

### Other symptoms

| Symptom | Fix |
|---|---|
| `docker_engine` pipe missing (after registry OK) | Open Docker Desktop UI; wait until Running; `wsl --shutdown` then reopen Desktop |
| Installer interrupted mid-Components | `bun run docker:fix` or reinstall via winget with elevation |
| Access denied writing repo | Work under `C:\src\...` not `D:\Projects` junction |
| Port 54321 in use | `bunx supabase stop` then start; or free the port |
| RLS / RPC missing | `bun run db:reset` |
| Admin prompt every day | Stop “Run as administrator” for terminals; only `docker:fix` needs one UAC |
| WSL `sudo: timed out` | WSL Docker Engine path needs passwordless sudo or one interactive password — prefer fixed Desktop |

## Hosted Supabase alternative

If local Docker is unavailable: create a project at supabase.com, set `VITE_SUPABASE_*` to cloud URL/key, run `npx supabase link` + `npx supabase db push`.
