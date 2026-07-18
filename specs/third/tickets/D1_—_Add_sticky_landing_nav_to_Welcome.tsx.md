# D1 — Add sticky landing nav to Welcome.tsx

## Context

file:src/pages/Welcome.tsx has been fully rewritten with all 11 editorial sections. The one remaining Track D item is the **sticky navigation bar** specified in file:.lovable/plan.md — the landing page currently has no top nav. The in-app shell (`AppLayout`, `AppSidebar`, `MobileNav`) is already complete.

## Scope

### file:src/pages/Welcome.tsx — add sticky nav section

Add a sticky nav bar as the first element inside the page wrapper, before the Hero section. Per the plan spec:

| Element | Detail |
| --- | --- |
| Background | cream (`bg-background`), no border, `sticky top-0 z-50` |
| Left | Text wordmark "LampFarms®" — no icon |
| Center | Pill-style anchor links: Platform · Solutions · Resources · Pricing |
| Right | "Sign in" link (→ `/login`) + dark pill CTA "Get started" (→ `/register`) |
| Mobile | Collapses to hamburger sheet (use existing shadcn `Sheet` component) |

The nav links scroll to the existing section anchors already present in the page (`#platform`, `#solutions`, `#resources`, `#impact`). "Pricing" can link to `#cta` or be a placeholder.

**What does NOT change:** all existing sections, all existing components, all routes, all business logic.

## Acceptance Criteria

1. A sticky nav bar appears at the top of the landing page on all screen sizes
2. The nav has no icon next to "LampFarms®" — text-only wordmark
3. Center links scroll to the correct page sections
4. "Sign in" navigates to `/login`, "Get started" navigates to `/register`
5. On mobile (< `md`), center links collapse into a hamburger/sheet
6. The nav does not appear inside the authenticated app shell (it is only in `Welcome.tsx`)
7. All existing landing page sections remain unchanged