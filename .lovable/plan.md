

# Pixel-Perfect Clone of UPA DI Landing Page for LampFarms

## What's Wrong Now

1. **Broken images** — 6 local `.jpg` files are empty binary blobs that don't render
2. **Brand icon still present** — Nav and footer show a green square "LF" icon; AppSidebar uses Sprout icon. Brand must be text-only everywhere
3. **Layout doesn't match reference** — Current page uses generic SaaS patterns. The reference has very specific editorial patterns that are not replicated
4. **Stats are inside colored blocks** — Reference shows numbers as plain black text with colored bars underneath, not inside colored rectangles
5. **Missing content density** — Reference has much more narrative text, profile cards, pull quotes, and a full-width photo section

## Exact Reference Patterns to Clone

From the screenshot analysis:

```text
┌─────────────────────────────────────────┐
│ NAV: logo-text | center-label | MENU +  │  ← sticky, white/cream, no border
├─────────┬───────────┬───────────────────┤
│ PHOTO   │ CREAM+    │ PHOTO (top-right  │  ← hero: 3-col photo collage
│ (left)  │ YELLOW    │ has small circle) │
│         │ STAR      │                   │
│         │           │ green block       │
├─────────┴───────────┴───────────────────┤
│ "ANNUAL REPORT"     "LANDS OF          │  ← massive condensed type over
│ "2023-2024"          ENGAGEMENT"       │     dark gradient, bottom-aligned
├─────────────────────────────────────────┤
│ breadcrumb row                         │
├──────┬──────────────────┬───────────────┤
│ PHOTO│ "Lands of        │ PHOTO         │  ← narrative: 3-col, rotated
│ blue │  Engagement"     │ green accent  │     photo with colored border
│border│  body text...    │               │
├──────┴──────────────────┴───────────────┤
│ breadcrumb row                         │
├──────────────┬──────────────────────────┤
│ PHOTO        │ MARTIN CARON             │  ← profile card 1: photo left
│ yellow bar   │ subtitle                 │     with yellow accent bar
│              │ body text               │
│              │ READ THE FULL TEXT +     │
├──────────────┴──────────────────────────┤
│ breadcrumb row                         │
├──────────────────────────┬──────────────┤
│ MARTIN CARON             │ PHOTO        │  ← profile card 2: reversed
│ subtitle                 │ green/yellow │     text left, photo right
│ body text               │ accent       │
│ colored bars            │              │
├──────────────────────────┴──────────────┤
│ HUGO BEAUREGARD-LA...                  │  ← profile card 3 (like card 1)
│ photo + text + "READ FULL TEXT +"      │
├─────────────────────────────────────────┤
│ breadcrumb row                         │
├─────────────────────────────────────────┤
│ THE FAMILLE AGRICOLE...                │  ← full-width text block
│ COMPETITION INITIATIVE                 │
│ body text...                           │
├─────────────────────────────────────────┤
│ WIDE PHOTO with caption overlay        │  ← panoramic photo
│ "Wendlagounda Bernadette Kassongo"     │
├─────────────────────────────────────────┤
│ breadcrumb   OUR YEAR IN NUMBERS       │
├──────────────┬──────────────────────────┤
│ 142          │         90              │  ← PLAIN BLACK numbers, NOT
│ ▬▬▬ (green)  │         ▬▬▬ (blue)      │     inside colored blocks
│ label        │         label           │     Thick colored bar below
├──────────────┼──────────────────────────┤
│ 90           │                         │  ← staggered: 2nd row offset
│ ▬▬▬ (yellow) │    $9,919,915           │
│ label        │    ▬▬▬ (purple)         │
│              │    label (multi-line)   │
├──────────────┴──────────────────────────┤
│ VIEW THE SECTIONS OF THE REPORT        │
├────────┬─────────┬──────────────────────┤
│ GREEN  │ CYAN    │ BLUE                │  ← 3x2 solid-color cards
│ card   │ card    │ card                │     rounded corners, white text
├────────┼─────────┼──────────────────────┤
│ YELLOW │ ORANGE  │ GREEN               │
│ card   │ card    │ card                │
└────────┴─────────┴──────────────────────┘
```

## Implementation Plan

### 1. Delete broken image files
Remove all 6 `src/assets/landing/*.jpg` files (binary garbage).

### 2. `src/pages/Welcome.tsx` — Complete Rewrite

Use **Unsplash URLs** for real images (no local files):
- Hero farmer: `https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80` (farming/agriculture)
- Landscape: `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80`
- Community: `https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80`
- Poultry: `https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80`
- Person portrait 1: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80`
- Person portrait 2: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80`
- Wide farm panorama: `https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80`

**Sections (matching reference exactly):**

- **Nav**: Sticky, cream bg, no border. Text-only "LampFarms" bold uppercase left (NO green square, NO icon). Center: "Smart Poultry Management" in 10px uppercase. Right: "Sign In" link + "MENU +" button.
- **Hero**: 3-column photo collage. Left = large photo. Center = cream panel with `YellowStarBurst`. Right = photo with small circular inset + green block. Bottom: massive condensed title over dark gradient overlay, left-aligned. Subtitle right-aligned.
- **Narrative**: Breadcrumb row. 3-column: rotated photo with blue border | heading + body text | photo with green accent block.
- **Profile Card 1**: Breadcrumb. 2-col: photo left with yellow accent bar underneath | name in huge condensed bold + subtitle + body text + "READ THE FULL TEXT +" link.
- **Profile Card 2**: Reversed: text left (huge name, body) | photo right with colored border accent. Colored bars decoration.
- **Profile Card 3**: Same as card 1 but different person/content, about offline-first technology.
- **Full-width Text Block**: Heading + body text, no photo.
- **Wide Photo**: Full-width panoramic with dark gradient overlay and caption text at bottom.
- **Stats**: "OUR YEAR IN NUMBERS" heading. **Plain black numbers** (text-7xl+) with **thick colored bars underneath** (not inside colored blocks). Staggered 2-column layout. Numbers: 500+, 90, 12, ₵9,919,915. Bar colors: green, blue, yellow, purple.
- **Section Cards**: "EXPLORE THE PLATFORM" heading. 3x2 grid of solid-colored rounded cards with white bold uppercase text.
- **CTA**: Dark bg, gold button, star decoration.
- **Footer**: Text-only "LampFarms" (no icon, no square), links, copyright.

### 3. `src/components/landing/AnimatedCounter.tsx` — Fix Stats Style

Remove the `inBlock` mode entirely. Stats should render as:
- **Plain black numbers** at text-7xl/8xl (not white, not inside colored blocks)
- **Thick colored bar** underneath (h-2, w-20) using `barColor` prop
- Small uppercase label below
- This matches the reference exactly

### 4. `src/components/landing/LandingDecorations.tsx` — Keep + Fix AuthPanel

- Keep `YellowStarBurst`, `LeafBranch`, `WaveDivider` as-is
- Fix `AuthPanel`: ensure no icon in the brand name

### 5. `src/components/AppSidebar.tsx` — Text-Only Brand

Replace the green square with Sprout icon:
- When expanded: bold uppercase "LampFarms" text only
- When collapsed: "LF" as plain text (no colored square, no icon)
- Remove `Sprout` import

### 6. Auth Pages — Already Fixed

Login, Register, ForgotPassword, ResetPassword already use text-only "LampFarms". No changes needed.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Welcome.tsx` | Full rewrite — pixel-perfect reference clone with Unsplash images |
| `src/components/landing/AnimatedCounter.tsx` | Remove `inBlock`, use plain black numbers with colored bars |
| `src/components/AppSidebar.tsx` | Remove Sprout icon, text-only brand |
| Delete `src/assets/landing/*.jpg` | Remove 6 broken binary files |

No database changes. All auth logic preserved.

