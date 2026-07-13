# Audit & test without containers / backend

Containers (Docker Engine in WSL, Supabase local) are **optional** for journey correctness work. Most of A–K can be audited and verified offline.

## What does not need a live API

| Layer | How to verify |
|---|---|
| Journey contract | `docs/CANONICAL_JOURNEYS.md` vs code (gates, writers, dual matrix) |
| Pure domain rules | Vitest: production-system, ledger-policy, conflicts, feed-safety, batch FSM, password, farm pick |
| Auth / onboarding logic | Vitest + mocked `supabase` client (`src/test/auth.test.tsx` pattern) |
| Route gates | Component tests: `ProtectedRoute`, Register/Login redirects |
| Writer side-effects | Assert which tables/columns/payloads hooks call under intensive vs flexible |
| UI copy / landing | Static review + Vite only (no API) |

## What needs a live API (defer)

- RLS actually blocking wrong user
- Real JWT / email confirm quirks
- RPC + migration apply
- Edge cron (Flow J)
- Full browser E2E with real sessions

**Rule:** Do not block flow A–K on Docker. Mark live smoke as residual risk; ship unit green first.

## Per-flow procedure (offline)

1. **Map** intent → primary UI → writer files → side-effects table row.
2. **Audit** gate order: Auth → farm ready → batch → eligibility → safety → dual → write.
3. **Extract or use** pure helpers; add failing tests first where logic is pure.
4. **Mock** Supabase `from` / `auth` / RPCs; assert call order and payloads.
5. **Fix** gaps with minimal diffs.
6. **Run** `bun run test`.
7. **Document** residual live-smoke risk in plan checkbox.
8. **Commit** that flow only when unit acceptance is green.

## Commands (no Docker)

```powershell
cd C:\src\exactly-as-seen
bun install
bun run test
bun run lint   # optional
bun run dev    # UI-only; API calls will fail until stack:env + backend
```

## Mock pattern (canonical)

```ts
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), /* ... */ },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));
```

Chain `.select().eq()` / `.insert().select().single()` like production so writer tests stay honest.

## Flow acceptance (offline green)

For each flow A–K before starting the next:

- [ ] Contract row audited (gates + dual class)
- [ ] Unit/mock tests cover happy path + key branch (intensive/flexible where relevant)
- [ ] No double-ledger or wrong-table writes in mock assertions
- [ ] Residual: “live smoke when stack available”
