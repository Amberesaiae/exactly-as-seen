

# Pixel-Perfect Landing Page & Auth Redesign

## Current Problems

1. **Hero text is nearly invisible** — `text-foreground` renders as very light gray, making "Grow Smarter. Farm Better." almost unreadable
2. **SVG decorations are too faint** — opacity values of 0.12-0.20 make them invisible on white backgrounds
3. **Generic SaaS layout** — centered text, symmetrical grid, no editorial personality
4. **No visual storytelling** — the reference uses bold asymmetric layouts, oversized typography, organic botanical shapes, and dramatic scroll reveals
5. **Auth panel is bland** — the decorative right panel has barely visible shapes on a green background

## Design Direction (from reference)

The UPA DI report uses: oversized condensed typography (huge numbers, bold headlines), asymmetric image-text layouts, bold organic motifs (yellow sunflower, green leaf branch) at high opacity, dramatic whitespace, and scroll-triggered content reveals. We adapt this for LampFarms.

## Changes

### 1. `src/pages/Welcome.tsx` — Editorial Rewrite

**Hero (full viewport):**
- Left-aligned layout on desktop (not centered) — headline occupies ~60% width
- Headline uses `text-foreground` at full weight with proper contrast — massive size (text-6xl to text-8xl)
- A bold decorative SVG (stylized golden wheat/sunflower motif) placed asymmetrically on the right side at HIGH opacity (0.6-0.8), inspired by the reference's yellow flower
- A green leaf/branch SVG on the opposite side
- Subheading with clear contrast, generous line-height
- CTAs left-aligned below the heading

**Stats section — "Our Year in Numbers":**
- Full-width section with the heading in oversized condensed uppercase (like reference's "OUR YEAR IN NUMBERS")
- Stats displayed in a staggered, asymmetric layout (not a boring 3-column grid) — numbers at text-7xl/8xl with labels below, offset vertically like the reference
- Thin hairline separators under each number
- Generous vertical spacing between stats

**Features section:**
- Asymmetric 2-column layout: left side has a large headline + description, right side has the feature cards
- Or: features displayed as a vertical list with large icons, not small cards

**CTA Banner:**
- Keep the green gradient but add the botanical SVG motifs at higher opacity
- Bold condensed heading

**Footer:** Keep minimal, refine spacing

### 2. `src/components/landing/LandingDecorations.tsx` — Bold Botanical Motifs

- **New `SunflowerMotif`** — inspired by the reference's yellow burst shape, rendered in primary-gold/amber at 0.5-0.7 opacity
- **Enhanced `LeafDecoration`** — thicker strokes, higher fill opacity (0.3-0.5 instead of 0.12)
- **New `WaveDivider`** — the organic wavy line from the reference used as section dividers
- **`AuthPanel`** — increase all decoration opacities, add the sunflower motif, make the tagline larger

### 3. `src/components/landing/AnimatedCounter.tsx` — Editorial Number Style

- Numbers rendered at text-7xl/8xl with a condensed font-weight
- Staggered layout (not grid) with hairline separator under each
- Label text smaller, uppercase, wide tracking

### 4. `src/pages/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`

- Keep split-screen layout but enhance the right decorative panel
- Higher opacity decorations, add the sunflower motif
- Slightly warmer, more inviting feel on the form side

### 5. `src/index.css` — Possible additions

- Add a CSS variable for an accent gold color (`--accent-gold`) for the sunflower motifs
- Any keyframe animations for section reveals

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Welcome.tsx` | Full rewrite — editorial asymmetric layout |
| `src/components/landing/LandingDecorations.tsx` | New SVG motifs, higher opacities, sunflower shape |
| `src/components/landing/AnimatedCounter.tsx` | Oversized condensed numbers, staggered layout |
| `src/pages/Login.tsx` | Enhanced auth panel styling |
| `src/pages/Register.tsx` | Enhanced auth panel styling |
| `src/pages/ForgotPassword.tsx` | Enhanced auth panel styling |
| `src/pages/ResetPassword.tsx` | Enhanced auth panel styling |
| `src/index.css` | Accent gold CSS variable |

No database changes. All existing auth logic preserved exactly.

