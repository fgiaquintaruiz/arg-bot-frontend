# Proposal — ui-professional-refresh

## Summary

A LOW-RISK polish pass on the frontend visual layer. Three targeted moves: (1) extract the active dark-theme palette into `src/constants/theme.ts` as a single source of truth for future code, (2) fix 15 drift-color occurrences that use near-duplicates of the canonical palette, (3) add baseline a11y — `aria-label` on emoji-only buttons and global focus-visible outlines.

Explicitly **out of scope**: refactoring the 115 existing inline-style usages to consume `theme.ts` (that's a mass rewrite with zero user-visible benefit and high regression risk). The theme module is a seed for new code, not a migration target.

## Motivation

Ad-hoc observations from the repo scan:

- **Color drift**: `#8897a7` (10 uses) is a near-duplicate of `#94a3b8` (64 uses); `#242f3d` (5 uses) duplicates `#334155` (54 uses). Two palettes instead of one.
- **Zero `aria-label`** in the entire codebase (`grep -r 'aria-label' src/**/*.tsx` → 0 hits). Icon-only buttons (emoji back-arrows, close Xs) have no accessible name. Screen readers hear the emoji character — which is garbage.
- **No global focus-visible styles.** Tab-navigating the app is a silent experience; focus is invisible. Bad for keyboard users and accessibility audits.
- **No theme constants.** Every component hardcodes its own copy of the palette. When we eventually want to add a light mode or rebrand, we'd grep 115 inline styles. Seeding `theme.ts` now costs nothing and pays off on the next touch.

## User-visible behavior

- **Visually**: the drift colors (`#8897a7`, `#242f3d`) change to their canonical equivalents (`#94a3b8`, `#334155`). The difference is ~2% in HSL — imperceptible on a non-color-calibrated monitor. Nothing else changes visually.
- **For keyboard users**: Tab focus now shows a visible outline on interactive elements.
- **For screen reader users**: back/close/icon buttons announce their purpose instead of an emoji code point.

## Technical design

### 1. `src/constants/theme.ts` (new file)

```ts
export const colors = {
  bg: {
    base: '#0f172a',      // app background
    surface: '#17212b',   // cards, panels
    raised: '#1e293b',    // inputs, sub-surfaces
    deep: '#0e1621',      // nested panels
  },
  text: {
    primary: '#f8fafc',
    muted: '#94a3b8',     // replaces stray #8897a7
    subtle: '#64748b',
  },
  border: {
    default: '#334155',   // replaces stray #242f3d
    strong: '#1e293b',
  },
  accent: {
    sky: '#38bdf8',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#ef4444',
  },
};

export const spacing = {
  xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px',
};
```

### 2. Drift-color find-replace (15 occurrences across 5 files)

Mechanical:
- `#8897a7` → `#94a3b8`
- `#242f3d` → `#334155`

Affected files: `BinanceConfig.tsx`, `AddressBook.tsx`, `Withdraw.tsx`, `History.tsx`, `Trade.tsx`.

### 3. `src/index.css` — a11y additions

```css
*:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
  border-radius: 4px;
}

html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

::selection { background: #38bdf8; color: #0f172a; }
```

### 4. `aria-label` on icon-only buttons in Dashboard

Target buttons whose visible content is only emoji/icon:
- Back buttons (`⬅`)
- Logout / header icons
- Close (`×`) buttons in modals (LegalModal, Updates, Settings when presented as modal)

One-line edit per button. No layout change.

## Affected modules

- `src/constants/theme.ts` (new)
- `src/index.css` (extended)
- `src/components/BinanceConfig.tsx` — 1 color replace
- `src/components/AddressBook.tsx` — 2 color replaces
- `src/components/Withdraw.tsx` — 1 color replace
- `src/components/History.tsx` — 4 color replaces
- `src/components/Trade.tsx` — 7 color replaces
- `src/Dashboard.tsx` — aria-label on icon-only buttons
- `src/components/LegalModal.tsx` — aria-label on close
- `src/components/Updates.tsx` — aria-label on close

## Rollback plan

`git revert`. Zero state impact; purely presentational.

## Non-goals

- Refactoring existing inline styles to consume `theme.ts` (scope creep, 115 touchpoints, high regression risk — if anything, migrate opportunistically on future touches)
- Adding a CSS-in-JS library, Tailwind, or any framework (README explicitly says "Inline CSS — no CSS framework")
- Light mode (different product decision)
- Changing typography scale, font family, or layout
- Adding loading skeletons or new UX flows
- Animating anything

## Open questions

None — scope is intentionally narrow.
