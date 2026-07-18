
# LampFarms — "Grawing" Design DNA Rollout

Pivot the landing page and the in-app shell to the editorial agriculture aesthetic from the Dribbble reference, then rename and re-group the navigation around farmer mental models.

## Design DNA (locked from reference)

- Palette (HSL tokens in `index.css`):
  - `--background` cream `#F9FAEA`
  - `--foreground` near-black `#101804`
  - `--primary` deep olive `#555C26`
  - `--secondary` sage `#CAD6AE`
  - `--muted-foreground` warm gray `#8F988E`
  - `--accent` olive-tan `#8F8D53`
- Type: Manrope already loaded. Display headline uses a tighter, large-scale tracking-tight weight 800; body Manrope 400/500. Add an oversized editorial display class.
- Layout language: generous whitespace, two-column editorial grids, oversized hero image, small uppercase eyebrow labels, thin hairline dividers, rounded-[28px] image masks, soft `shadow-[0_30px_60px_-30px]` shadows, no harsh borders.
- Imagery: real farm photography via Unsplash (rice fields, drone shots, hands-in-soil, greenhouse, irrigation, poultry close-ups). No AI art.
- Motion: subtle `framer-motion` fades + slow image scale-on-scroll. No bouncy effects.

## Landing Page (`src/pages/Welcome.tsx` — full rewrite)

Sections in order:

1. **Sticky nav** — cream bg, no border. Left: text "LampFarms®". Center pill links: Platform · Solutions · Resources · Pricing. Right: "Sign in" link + dark pill CTA "Get started".
2. **Hero** — Eyebrow "Smart poultry, sustainable yields". Oversized display headline ("Grow smarter, greener, and more profitable poultry."). Two-line lede. Two CTAs: dark pill "Start free" + ghost "Watch demo". Below: full-width rounded farm aerial image with floating stat chip ("12k+ birds tracked daily").
3. **Trust strip** — "Trusted by farms across West Africa" + 6 muted text logos.
4. **Commitment block** — Left column small label "Our commitment". Right column big editorial paragraph + 3 inline stats with hairline dividers (Birds tracked, Active farms, Avg. mortality reduction).
5. **Solutions grid** — 2x2 large cards w/ image left, text right alternating: Flock Intelligence, Feed Formulator, Health & Biosecurity, Yield & Finance. Each card has eyebrow, headline, 2-line body, "Explore →" link.
6. **How it works** — 3-step horizontal row with numbered circles (01/02/03): Set up your farm · Track daily ops · Get smart insights.
7. **Impact numbers** — 4 stats, plain black numerals, thin olive bar underneath (matches existing AnimatedCounter bar mode).
8. **Voices from the field** — 2-up testimonial cards with portrait, name, farm, quote.
9. **Blog/Resources teaser** — 3-card row: IoT poultry housing, Organic feed mixes, Vaccination playbook.
10. **Closing CTA banner** — dark olive bg, cream text, single pill CTA "Create your free farm".
11. **Footer** — 4 columns (Product, Company, Resources, Legal), text-only wordmark, copyright, language toggle.

Each section uses framer-motion fade-up on scroll. Images lazy-load. Mobile: collapses to single column, nav becomes hamburger sheet, hero stat chip stays.

## Renamed Pages & Navigation Concept

Current → New (route stays same to avoid breakage; only labels/icons/groupings change):

| Old label | New label | Route | Group |
|-----------|-----------|-------|-------|
| Dashboard | Overview | `/dashboard` | Today |
| Batches | Flocks | `/batches` | Operations |
| Feed | Feed Lab | `/feed` | Operations |
| Health | Care & Water | `/health` | Operations |
| Eggs | Harvest | `/eggs` | Operations |
| Stock | Inventory | `/stock` | Operations |
| Finance | Ledger | `/finance` | Insights |
| Records | Performance | `/records` | Insights |
| Settings | Farm Settings | `/settings` | Account |

Sidebar gets section labels ("TODAY", "OPERATIONS", "INSIGHTS", "ACCOUNT") matching the editorial small-caps style. Mobile bottom nav primary tabs: Overview · Flocks · Feed Lab · Care · More.

## In-app shell alignment

- `src/components/AppLayout.tsx` — remove the green square + Sprout icon in mobile header; use text-only wordmark.
- `src/components/AppSidebar.tsx` — switch to cream background, olive active states, grouped sections, text-only brand.
- `src/components/MobileNav.tsx` — update labels to new names, keep icons but swap to Lucide equivalents (`Bird` for Flocks, `FlaskConical` for Feed Lab, `HeartPulse` for Care).
- `src/index.css` — replace primary/background/secondary HSL tokens with the new palette; keep existing accent tokens as semantic aliases so cards on Finance/Eggs etc. still work.
- `tailwind.config.ts` — no structural changes; tokens flow through.

## Files Touched

| File | Change |
|------|--------|
| `src/index.css` | Replace core color tokens with Grawing palette (HSL) |
| `src/pages/Welcome.tsx` | Full rewrite (sections above) |
| `src/components/landing/LandingDecorations.tsx` | Trim to editorial helpers (eyebrow, hairline, stat chip) |
| `src/components/landing/AnimatedCounter.tsx` | Keep bar mode; restyle bar to olive primary |
| `src/components/AppSidebar.tsx` | Grouped sections, new labels, cream theme |
| `src/components/AppLayout.tsx` | Remove Sprout, text-only brand |
| `src/components/MobileNav.tsx` | New labels + icons |
| Page titles (`Dashboard.tsx`, `Batches.tsx`, `Feed.tsx`, `Health.tsx`, `Eggs.tsx`, `Finance.tsx`, `Stock.tsx`, `Records.tsx`, `SettingsPage.tsx`) | Update page H1 + breadcrumbs to new names only — no business logic changes |

## Out of scope

- No route path changes (keeps deep links working, all existing data flows untouched).
- No DB schema changes.
- No feature additions to batches/feed/health/etc. — purely visual + naming.

## Acceptance

- Landing page reads as an editorial agriculture site at 320px, 768px, 1280px, 1920px.
- Every nav label uses the new naming consistently across sidebar, mobile nav, page H1, and breadcrumbs.
- No icon appears next to "LampFarms" anywhere.
- Lighthouse-friendly: alt text on every image, single H1 per page, meta title/description on landing.
