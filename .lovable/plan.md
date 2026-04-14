

# Pixel-Perfect Landing Page Redesign — Matching UPA DI Reference

## Analysis of Reference Design

From the screenshot and HTML, the UPA DI annual report uses these exact patterns:

1. **Hero**: Full-viewport with a photo mosaic/collage. Massive condensed bold uppercase title ("ANNUAL REPORT 2023-2024") bottom-left. Secondary title ("LANDS OF ENGAGEMENT") bottom-right. A large yellow star/burst accent shape overlapping content. Sticky minimal nav bar.

2. **Narrative Section**: White background, centered narrow column of body text with a serif-style feel. Large heading ("Lands of Engagement"). Below it, a small photo accent on the side.

3. **Profile Cards**: Asymmetric two-column — large photo on one side, name in huge condensed bold + role + body text on the other. Colored accent shapes overlapping photos (yellow rectangles, green shapes). A "READ THE FULL TEXT +" link.

4. **Stats ("OUR YEAR IN NUMBERS")**: Section heading centered in uppercase. Numbers displayed HUGE (text-7xl+) in a **staggered asymmetric 2-column layout** — not a grid. Each number has a **thick colored bar** underneath (yellow, green, cyan — not hairlines). Small label text below each number. The numbers are: 142, 90, 90, $9,919,915.

5. **Section Cards ("VIEW THE SECTIONS")**: Bold colored rectangular cards in a 3x2 grid. Each card is a single solid color (green, cyan, yellow, orange) with white uppercase text. Card titles like "BRINGING EXPERTISE TOGETHER", "GENDER EQUALITY", etc.

6. **Nav**: Ultra-minimal — logo text left, section label center, "MENU +" right. White background, no border, sticky.

7. **Color Palette**: Black text, white backgrounds, accent colors: yellow (#F5C518-ish), green (#16a34a), cyan/teal (#06b6d4), orange (#f97316).

## Key Correction: Brand Logo

**LampFarms is text-only — NO icon.** Remove the Sprout icon from ALL instances: nav, auth pages, footer.

## Implementation Plan

### 1. `src/pages/Welcome.tsx` — Full Rewrite

Pixel-perfect adaptation of the reference layout:

**Nav**: Sticky, white bg, no border. "LampFarms" as bold text left (no icon). "Smart Poultry Management" center label. "MENU +" or "Sign In" / "Get Started" right.

**Hero Section** (full viewport):
- CSS gradient background (deep green to black) since we have no photos — or a geometric pattern made of colored SVG shapes
- Bottom-left: "GROW SMARTER FARM BETTER" in massive condensed uppercase bold (matching reference's "ANNUAL REPORT 2023-2024" positioning)
- Bottom-right: "WEST AFRICA'S LEADING POULTRY PLATFORM" in condensed uppercase
- Large yellow star/burst SVG accent overlapping from top-right (matching reference exactly)
- Green leaf SVG accent on the left edge

**Narrative Section** (white, centered):
- "Lands of Growth" or similar heading
- Body text in a narrow centered column (max-w-2xl)
- Small decorative accent shape on the side

**Stats Section** — "OUR YEAR IN NUMBERS":
- Exact reference layout: heading centered uppercase
- 2-column staggered grid with numbers at text-7xl/8xl
- **Thick colored bars** (not hairlines) under each number — yellow for first, green for second, cyan for third, yellow for fourth
- Numbers: 500+, 1M+, 12+, and a cost figure
- Small uppercase labels below

**Features Section** — "EXPLORE LAMPFARMS":
- 3x2 grid of solid-color cards (matching reference's "VIEW THE SECTIONS" exactly)
- Each card: solid background color (green, cyan, yellow, orange, teal, amber)
- White uppercase bold text inside
- Cards for: Batch Management, Feed Calculator, Health Tracking, Egg Production, Finance & Stock, Offline-First

**CTA + Footer**: Minimal

### 2. `src/components/landing/LandingDecorations.tsx` — Rebuild

- **YellowStarBurst**: Matches the reference's yellow star shape exactly — a multi-pointed star, not a sunflower
- **LeafBranch**: Green organic shape for overlapping photos/sections
- **AuthPanel**: Text-only logo (no Sprout icon), higher opacity decorations
- Remove unused components (DotsGrid, FeatherDecoration)

### 3. `src/components/landing/AnimatedCounter.tsx` — Restyle

- Thick colored bar underneath (8px height, 80px width) instead of 1px hairline
- Bar color passed as prop (yellow, green, cyan)
- Number style: text-7xl font-black, black color
- Label: small uppercase tracking-widest

### 4. Auth Pages — Text-Only Logo

All four auth pages (`Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`):
- Replace icon+text logo with **text-only "LampFarms"** in bold
- Keep all existing auth logic exactly as-is
- AuthPanel gets matching updates

### 5. `src/index.css` — Add accent cyan variable

Add `--accent-cyan` for the third accent color used in stats bars and feature cards.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Welcome.tsx` | Full rewrite — pixel-perfect reference match |
| `src/components/landing/LandingDecorations.tsx` | Yellow star burst, text-only AuthPanel, remove unused |
| `src/components/landing/AnimatedCounter.tsx` | Thick colored bars, prop-driven accent color |
| `src/pages/Login.tsx` | Text-only logo (remove Sprout icon) |
| `src/pages/Register.tsx` | Text-only logo (remove Sprout icon) |
| `src/pages/ForgotPassword.tsx` | Text-only logo (remove Sprout icon) |
| `src/pages/ResetPassword.tsx` | Text-only logo (remove Sprout icon) |
| `src/index.css` | Add --accent-cyan CSS variable |

No database changes. All auth logic preserved exactly.

