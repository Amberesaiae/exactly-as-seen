# LampFarms â€” Poultry Operations Ledger

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/exactly-as-seen&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Supabase%20project%20credentials)

A **premium PWA** for small and medium-scale poultry farmers â€” full offline support, batch lifecycle management, financial ledger, feed formulation (HiGHS LP solver), health task tracking, and branded PDF report generation.

---

## Features

| Module | Capabilities |
|---|---|
| **Batches** | Create, manage, and close broiler/layer/turkey flocks |
| **Feed** | Schedule feeds, log consumption, LP-optimised formulations |
| **Health** | Vaccination & medication tasks, conflict detection, auto-scheduling |
| **Mortality** | Daily mortality logging with cause classification |
| **Finance** | Expense ledger, revenue recording, FCR / ROI / net margin |
| **Records** | Batch history timeline, multi-batch comparison charts, financial summary |
| **Exports** | CSV export + branded multi-page jsPDF reports |
| **Settings** | Farm profile, market price overrides, push notification preferences |
| **PWA** | Offline-first with Workbox, install prompt, background sync |

---

## Quick Start

```bash
# 1. Clone (on Windows, prefer a real path on C: if agents cannot write D:\ junctions)
git clone https://github.com/your-org/exactly-as-seen
cd exactly-as-seen
# Recommended agent workspace: C:\src\exactly-as-seen

# 2. Install
npm install

# 3. Local backend (Docker Desktop must be Running — normal user, not admin shell)
#    .\scripts\dev-backend.ps1
#    then: npx supabase db reset
# Or point env at a hosted Supabase project.

# 4. Environment
cp .env.example .env.local
# Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)

# 5. Run frontend
npm run dev
# or: .\scripts\dev-frontend.ps1
```

See **[docs/BACKEND_LOCAL.md](docs/BACKEND_LOCAL.md)** for Docker/Supabase without daily admin PowerShell.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | âœ… | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | âœ… | Public anon key from Supabase dashboard |
| `VITE_VAPID_PUBLIC_KEY` | Optional | VAPID public key for Web Push notifications |
| `VITE_DEFAULT_CURRENCY` | Optional | Default currency code (default: `GHS`) |

---

## Deploy to Vercel

1. Push to GitHub
2. Click **Deploy with Vercel** above
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables
4. Deploy â€” SPA routing and service worker headers are pre-configured in `vercel.json`

### Manual deploy

```bash
npm run build          # Produces dist/ with service-worker.js
npx vercel --prod      # Deploy to production
```

---

## Architecture

**Runtime stack:** React 18 + Vite + Supabase (Postgres, RLS, RPCs, Edge Functions).  
**Canonical contracts:** [`docs/CANONICAL_RUNTIME.md`](docs/CANONICAL_RUNTIME.md) and [`src/lib/canonical.ts`](src/lib/canonical.ts) â€” enums, money, production systems, synergy sources. Do not invent alternate category slugs in UI.

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ settings/      # Settings tabs
â”‚   â””â”€â”€ records/       # Batch analytics tabs
â”œâ”€â”€ hooks/             # Domain data hooks
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ canonical.ts   # Runtime enums & money helpers (source of truth)
â”‚   â”œâ”€â”€ production-system.ts
â”‚   â”œâ”€â”€ pdf-report.ts
â”‚   â”œâ”€â”€ feed-lp.ts     # HiGHS LP feed optimiser
â”‚   â”œâ”€â”€ synergy.ts     # Cross-module auto ledger/stock
â”‚   â””â”€â”€ sync.ts        # Offline sync queue (Dexie + Supabase; partial)
â”œâ”€â”€ pages/
â”œâ”€â”€ service-worker.ts
â””â”€â”€ stores/
supabase/
â”œâ”€â”€ migrations/        # SQL schema + RPCs (apply with supabase db push)
â””â”€â”€ functions/         # Edge cron wrappers
```

---


## Database / Docker (deferred)

Infra may not be running yet. **Code on `main` expects migrations including** `20260711000000_contract_alignment.sql`.

See **[docs/DEFERRED_SUPABASE_AND_DOCKER.md](docs/DEFERRED_SUPABASE_AND_DOCKER.md)** for:
- what is already in git vs what needs Supabase/Docker
- full migration list and apply commands
- Edge Function deploys and post-apply checklist

When ready: `supabase db push` (hosted) or apply SQL against self-hosted Postgres per that guide.

## PDF Reports

Click **Records â†’ Exports â†’ Download PDF** to generate a branded multi-page batch report including:

- Cover page with farm name and date
- KPI grid (birds, mortality %, FCR, feed, revenue, net margin)
- Mortality records table
- Feed schedule log
- Health tasks log
- Expense and revenue ledgers

Financial data is automatically masked if **Cost Privacy** is enabled in Settings â†’ Preferences.

---

## Push Notifications

Enable in **Settings â†’ Alerts**. Supported triggers:

- ðŸ”´ Mortality spike (> 2% daily loss)
- ðŸŸ¡ Overdue health task
- ðŸ”µ Feed schedule reminder
- ðŸŸ¢ Batch close-out reminder

Generate a VAPID key pair for server-side push:

```bash
npx web-push generate-vapid-keys
# Add VITE_VAPID_PUBLIC_KEY to .env.local
# Add VAPID_PRIVATE_KEY to your Supabase Edge Function secrets
```

### Edge Function Deployment

1. Set your Supabase Edge Function secrets:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="your-public-key"
   supabase secrets set VAPID_PRIVATE_KEY="your-private-key"
   supabase secrets set VAPID_SUBJECT="mailto:support@lampfarms.com"
   ```

2. Deploy the `push-alerts` function:
   ```bash
   supabase functions deploy push-alerts
   ```

3. In your Supabase Dashboard, navigate to **Database -> Webhooks** and create a new webhook:
   - **Name**: `mortality_spike_alert`
   - **Table**: `mortality_records`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://<your-project-ref>.supabase.co/functions/v1/push-alerts`
   - **Headers**: Add `Authorization: Bearer <your-service-role-key>` so it bypasses RLS and triggers the push secure logic.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on :8080 |
| `npm run build` | Production build with code splitting |
| `npm run preview` | Preview production build locally |
| `npx vitest run` | Run full test suite |
| `npx tsc -p tsconfig.app.json --noEmit` | Type check |
