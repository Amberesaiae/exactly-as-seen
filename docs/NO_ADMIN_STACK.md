# Zero Windows-Admin stack (how we resolve elevation pain)

## The problem you hit

Several different “admin” walls get mixed up:

| Wall | What it is | Daily? |
|---|---|---|
| **Windows UAC** (“Run as administrator”) | Real elevation | **Never for daily work** |
| **Docker Desktop incomplete install** | Needs one UAC to finish registry | Optional; we **do not** use Desktop |
| **`netsh portproxy`** | Needs admin for localhost→WSL | **Avoid** — use WSL IP instead |
| **WSL `sudo` password** | Linux password for user `amber` | **Avoid** — use `wsl -u root` |
| **Docker Engine flapping** | dockerd killed / OOM | Stability scripts, more WSL RAM |

**Rule:** Daily LampFarms dev must use **zero Windows UAC**.

---

## Canonical architecture (no Windows admin)

```
Windows (normal user)
  bun run frontend     → Vite on Windows
  browser              → http://localhost:5173
         │
         │  VITE_SUPABASE_URL=http://<WSL_IP>:54321
         ▼
WSL2 Ubuntu (root via `wsl -u root` — NOT Windows admin)
  containerd + dockerd
  supabase CLI
  Postgres / Auth / REST containers
```

- **No Docker Desktop**
- **No `netsh` / portproxy**
- **No Admin PowerShell**
- WSL root ≠ Windows Administrator (Microsoft allows `wsl -d Ubuntu -u root` without UAC)

---

## One-time setup (still no Windows admin if WSL already works)

```powershell
# From normal PowerShell / Grok on Windows
cd C:\src\exactly-as-seen
bun install

# Install Engine + start Supabase entirely inside WSL as root
bun run stack:up
bun run stack:env     # writes .env.local with WSL IP + keys
```

If Docker Engine is not installed yet, `stack:up` runs the install script as WSL root (no Windows UAC).

Optional comfort (user file, **no admin**): create `%USERPROFILE%\.wslconfig` so WSL gets more RAM (reduces OOM / exit 137):

```ini
[wsl2]
memory=6GB
processors=4
swap=2GB
localhostForwarding=true
```

Then from **normal** PowerShell: `wsl --shutdown` and reopen Ubuntu (no UAC).

---

## Daily commands (always normal user)

```powershell
cd C:\src\exactly-as-seen

# 1) Backend stack (WSL root under the hood)
bun run stack:up

# 2) Refresh URL if WSL IP changed after reboot
bun run stack:env

# 3) App
bun run frontend
```

If stack was already up: just `bun run frontend` (and `stack:env` after reboot).

---

## What we deliberately will NOT require

| Avoid | Why |
|---|---|
| Daily “Run as administrator” | Not needed with WSL Engine path |
| Completing Docker Desktop install | Broken/incomplete on this machine; optional forever |
| `netsh interface portproxy` | Needs admin; WSL IP is enough |
| Interactive `sudo` in WSL for docker | Scripts use `wsl -u root` |
| Killing healthy `dockerd` | Kills all containers (exit 137 chaos) |

---

## Canonical daily path: hosted Supabase (zero Docker)

**Preferred for this repo (2026-07-13+):** hosted Supabase + local Vite only.  
No Docker Engine, no PowerShell stack scripts, no UAC.

```bash
# Ubuntu / WSL normal user
cd /mnt/c/src/exactly-as-seen   # or C:\src\exactly-as-seen
bun install
# .env.local already points at https://<project>.supabase.co when linked
bun run db:push    # migrations to hosted (CLI token once)
bun run dev        # frontend only — ~0 backend RAM locally
```

Package scripts that need Windows/WSL Docker are prefixed `win:*` (opt-in).  
Default `bun run backend` prints the hosted reminder and does **not** start Docker.

### Escape hatch was the old local stack

If you still need local containers: `bun run win:stack:up` (WSL root dockerd — still no Windows Admin).

---

## Recovery cheatsheet

| Symptom | Fix (no Windows admin) |
|---|---|
| `connection refused` on 54321 | `bun run stack:up` then `bun run stack:env` |
| `docker.sock` missing | `bun run stack:up` (starts containerd+dockerd) |
| Containers exit 137 | Raise `.wslconfig` memory; don’t restart dockerd while stack is up |
| API works in WSL, not Windows localhost | Expected — use WSL IP via `stack:env` |
| Auth unit tests fail offline | Fine; they mock Supabase |

---

## Scripts map

| npm/bun script | Does | Windows admin? |
|---|---|---|
| `stack:up` | WSL root: engine + supabase start | No |
| `stack:env` | WSL IP + anon keys → `.env.local` | No |
| `stack:down` | supabase stop (containers only) | No |
| `docker:engine` | Ensure dockerd only | No |
| `docker:fix` | Desktop registry repair | **Yes UAC once** — optional, not used |

Primary: **`bun run stack:up` → `bun run stack:env` → `bun run frontend`**.
