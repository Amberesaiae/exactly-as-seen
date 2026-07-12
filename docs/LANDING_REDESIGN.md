# Landing redesign — LampFarms

**Direction:** *Field ledger* — utilitarian-editorial tool for West African poultry farmers.  
**Anti-AI-generic:** no purple gradients, no 3 identical bento cards, no vague “revolutionize,” no stock-hero dependency, no glassmorphism soup.

## Design system (existing tokens)

| Token | Role |
|---|---|
| Cream background (`--background`) | Paper / ledger |
| Near-black foreground | Ink |
| Farm green primary | Action / health |
| Sage secondary | Surfaces |
| Olive accent | Secondary emphasis |
| Manrope | UI type (no Inter/Roboto swap) |

Memorable detail: **ruled-line ledger aesthetic** — thin horizontal rules, monospace-ish timestamps, house chips, task list UI as the hero “product.”

## Page architecture (`/welcome`)

1. **Site header** — shadcn `Button` + `Sheet` (mobile); sticky, solid after scroll  
2. **Hero** — concrete headline + primary/secondary CTAs + **live product frame** (Today’s house mock built from `Card`, `Badge`, `Progress`, `Separator`)  
3. **Proof strip** — 3 hard claims: Offline-first · Dual intensive/flexible · Withdrawal safety  
4. **Workflow** — numbered steps (create flock → daily log → care & money), not feature cards  
5. **Modules** — shadcn `Tabs` (Batches / Feed / Health / Money) with short copy + bullet outcomes  
6. **Field note** — one honest quote (text + initials `Avatar`), no stock headshots  
7. **FAQ** — shadcn `Accordion`  
8. **Close CTA** — plain dark band, one action  
9. **Footer** — compact columns, languages, no decorative blur orbs  

## Components (reusable under `src/components/landing/`)

| File | Responsibility |
|---|---|
| `SiteHeader.tsx` | Nav + auth actions |
| `SiteFooter.tsx` | Footer |
| `ProductFrame.tsx` | Hero dashboard mock |
| `ProofStrip.tsx` | Trust claims |
| `WorkflowSteps.tsx` | How it works |
| `ModuleTabs.tsx` | Module explorer |
| `FieldNote.tsx` | Quote |
| `LandingFaq.tsx` | FAQ |
| `CloseCta.tsx` | Final CTA |

`Welcome.tsx` only composes these.

## Sub-routes (same system)

| Route | Intent |
|---|---|
| `/platform` | Four layers + constraints + species — no stock photos |
| `/solutions` | Six modules as ruled list + “what you get” cards |
| `/impact` | Honest outcomes (no vanity counters) + field notes with initials |
| `/resources` | Guides mapped to product behaviour + FAQ accordion |

Shared: `PageHero`, `CloseCta`, `SiteHeader` / `SiteFooter`.

## A11y / craft

- Semantic `header` / `main` / `footer` / `section` + headings  
- Contrast on cream + green  
- Focus rings via shadcn defaults  
- Mobile: stack hero, product frame below CTAs  

## Out of scope

- New animation libraries  
- Unsplash hero dependence  
- Rewriting app shell dashboard  
