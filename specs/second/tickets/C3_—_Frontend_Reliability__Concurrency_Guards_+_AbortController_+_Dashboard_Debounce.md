# C3 — Frontend Reliability: Concurrency Guards + AbortController + Dashboard Debounce

## Scope

Fix three frontend reliability issues that cause race conditions and stale state under normal usage conditions.

### Included

file:artifacts/lampfarms/src/lib/sync.ts**:**

- Add a module-level `let flushing = false` guard to `flushOutbox`
- If `flushing` is true when `flushOutbox` is called, return immediately
- Set `flushing = true` at the start, `flushing = false` in a `finally` block

file:artifacts/lampfarms/src/contexts/AuthContext.tsx**:**

- Add `AbortController` to the two `fetch` calls inside `checkFarmSetup`
- Create the controller at the start of `checkFarmSetup`, pass `{ signal: controller.signal }` to both fetches
- Return a cleanup function from the `useEffect` that calls `controller.abort()`

file:artifacts/lampfarms/src/pages/Dashboard.tsx**:**

- Add a minimum-interval guard to the `useEffect` that loads dashboard data
- Only re-fetch when `isOnline` transitions from `false` to `true` (not on every toggle)
- Track `lastFetchedAt` in a `useRef` — skip the fetch if `isOnline` is true and the last fetch was less than 30 seconds ago

file:artifacts/lampfarms/src/components/AppSidebar.tsx**:**

- Change the "Water & Health" nav label to "Water-Health" to match the spec domain glossary (file:specs/00_CONVENTIONS.md)

### Explicitly out

- Backend changes
- Changes to the sync outbox data model
- PWA service worker changes

## Why these are one ticket

All three are small, isolated reliability fixes in the frontend layer. None has a dependency on the others. Grouping avoids three trivially small tickets.

## Acceptance criteria

- Rapidly toggling the device offline and online does not cause multiple concurrent `flushOutbox` calls — only one runs at a time
- Navigating away from the app during auth initialization does not produce "Can't perform a React state update on an unmounted component" warnings in React 18 strict mode
- The Dashboard does not re-fetch from the server when `isOnline` toggles back to `true` within 30 seconds of the last successful fetch
- The Dashboard does re-fetch when `isOnline` transitions to `true` after being offline for more than 30 seconds

## Dependencies

Depends on C2 (all correctness fixes should land before reliability hardening).

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — issues 28, 29, 30.