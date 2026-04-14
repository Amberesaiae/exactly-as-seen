

# Landing Page and Login Redesign Plan

## Design Inspiration from Reference

The UPA DI annual report uses bold editorial design: oversized typography, organic leaf/flower motifs, generous whitespace, scroll-driven storytelling, asymmetric image placement, and animated counters. We will adapt these patterns for LampFarms while keeping it a single-page landing that converts visitors into users.

## What Gets Built

### 1. New Landing Page (`src/pages/Welcome.tsx`) — Full Rewrite

A scroll-driven marketing page with these sections:

**Hero Section (viewport height)**
- Large hero image area with a subtle green gradient overlay (no stock photos needed — use CSS gradient + organic SVG shapes like leaves/feathers as decorative elements)
- Oversized display heading: "Grow Smarter. Farm Better." in bold Manrope
- Subheading with the value proposition
- Two CTAs: "Get Started Free" (primary, rounded-full) and "Sign In" (ghost)
- Decorative organic shape (stylized feather/leaf) as a floating SVG accent, inspired by the reference's yellow flower and green branch motifs

**Social Proof / Stats Section (animated counters)**
- Inspired by the reference's "OUR YEAR IN NUMBERS" section
- Three large animated counter stats: "500+ Farms", "1M+ Birds Tracked", "12+ Countries"
- Each with a label beneath, using the same oversized number + small text pattern
- Numbers animate on scroll into view using framer-motion

**Features Grid**
- 3-column grid (stacks on mobile) showing core modules:
  - Batch Management (Bird icon)
  - Feed Calculator (Wheat icon)
  - Health Tracking (Heart icon)
  - Egg Production (Egg icon)
  - Finance & Stock (Wallet icon)
  - Offline-First (Wifi icon)
- Each card: icon + title + one-line description, with subtle hover lift

**CTA Banner**
- Full-width green gradient section
- "Ready to transform your farm?" + "Create Free Account" button

**Footer**
- Minimal: LampFarms logo + copyright + links to login/register

### 2. Redesigned Login Page (`src/pages/Login.tsx`)

Split-screen layout on desktop (form left, visual right). Mobile: form-only with decorative top section.

- Left: Clean login form (current functionality preserved — Google OAuth, email/password, forgot password link)
- Right: Green gradient panel with decorative organic SVG shapes and a tagline
- Refined input styling: slightly larger, more padding, softer borders
- Smooth entrance animations via framer-motion

### 3. Redesigned Register Page (`src/pages/Register.tsx`)

Same split-screen pattern as Login for consistency. All existing fields preserved (Full Name, Email, Password with strength indicator, Farm Name, Google OAuth).

### 4. Auth Pages Consistency (`ForgotPassword.tsx`, `ResetPassword.tsx`)

Apply the same split-screen layout with the decorative green panel for visual cohesion.

### 5. Shared Decorative Component

Create `src/components/landing/LandingDecorations.tsx` — reusable SVG organic shapes (feather, leaf, abstract farm motifs) used across the landing and auth pages. Pure CSS/SVG, no external images needed.

## Files Changed

| File | Action |
|------|--------|
| `src/pages/Welcome.tsx` | Full rewrite — multi-section landing page |
| `src/pages/Login.tsx` | Redesign — split-screen layout |
| `src/pages/Register.tsx` | Redesign — split-screen layout |
| `src/pages/ForgotPassword.tsx` | Redesign — split-screen layout |
| `src/pages/ResetPassword.tsx` | Redesign — split-screen layout |
| `src/components/landing/LandingDecorations.tsx` | New — shared SVG decorations |
| `src/components/landing/AnimatedCounter.tsx` | New — scroll-triggered number animation |
| `src/index.css` | Add any needed keyframes for scroll animations |

## Technical Notes

- All animations via framer-motion (already installed) and CSS keyframes
- No external images or assets — decorative elements are inline SVGs
- Responsive: mobile-first, split-screen collapses to single column
- All existing auth logic (Google OAuth, email/password, redirects, farmReady checks) is preserved exactly
- No database changes needed

