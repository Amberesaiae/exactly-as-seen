# BC-0 — Supabase Docker Self-Hosting Migration

## Overview

Migrate the LampFarms Supabase project from the cloud free tier to a self-hosted Docker instance on a VPS. This eliminates the 1-week inactivity pausing problem and enables `pg_cron` + Edge Function deployment required by BC-5.

**Sprint:** Sprint 0 (prerequisite for Sprint 3 only — BC-1 through BC-4 can proceed against Supabase Cloud in parallel).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-0 section.

## Scope

### VPS provisioning

Provision a VPS with minimum 2 vCPU, 4 GB RAM, 40 GB SSD. Recommended: Hetzner CX21 (~€5.77/month) or DigitalOcean Basic Droplet ($12/month). Ubuntu 22.04 LTS.

### Supabase Docker setup

Clone the official Supabase Docker Compose stack from `github.com/supabase/supabase/tree/master/docker`. Configure `.env` with:

- `POSTGRES_PASSWORD` — strong random password
- `JWT_SECRET` — 32+ character random string
- `ANON_KEY` and `SERVICE_ROLE_KEY` — generated from `JWT_SECRET`
- `SITE_URL` — the VPS public IP or domain

Run `docker compose up -d`. Verify all services start: PostgreSQL, GoTrue, PostgREST, Realtime, Storage, Kong, Studio.

### Migration application

Run `supabase db push --db-url postgresql://postgres:$POSTGRES_PASSWORD@$VPS_IP:5432/postgres` to apply all 3 existing migrations to the self-hosted instance.

### Frontend env update

Update `VITE_SUPABASE_URL` to `http://$VPS_IP:8000` (Kong gateway port) and `VITE_SUPABASE_PUBLISHABLE_KEY` to the new `ANON_KEY`. No code changes in file:src/integrations/supabase/client.ts — it reads from env vars.

### pg_cron enablement

Enable the `pg_cron` extension on the self-hosted Postgres instance:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
```

### Verification

Run the full app against the self-hosted instance. Verify: auth (login/register), farm setup, batch creation, health tasks, feed formulation, stock, eggs, finance, records, settings. All existing functionality must work identically.

## Acceptance Criteria

1. Self-hosted Supabase Docker stack running on VPS — all services healthy
2. All 3 existing migrations applied successfully to self-hosted Postgres
3. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` updated to self-hosted values
4. Full app functionality verified against self-hosted instance (auth, all pages)
5. `pg_cron` extension enabled and accessible
6. Instance stays live after 1 week of inactivity (no pausing)
7. Supabase Studio accessible at `http://$VPS_IP:3000`

## Dependencies

None — can run in parallel with BC-1 through BC-4.