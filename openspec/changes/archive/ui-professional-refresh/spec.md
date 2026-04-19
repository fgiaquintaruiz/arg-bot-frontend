# Spec — ui-professional-refresh

## Scope

Presentation-layer polish in `src/`. No runtime logic changes.

## Requirements

- R-UP-1: `src/constants/theme.ts` MUST exist and export `colors` and `spacing` constants matching the palette in use.
- R-UP-2: No file in `src/` MAY contain `#8897a7` (drift color — canonical is `#94a3b8`).
- R-UP-3: No file in `src/` MAY contain `#242f3d` (drift color — canonical is `#334155`).
- R-UP-4: `src/index.css` MUST define a global `*:focus-visible` outline.
- R-UP-5: `src/index.css` MUST enable font smoothing (`-webkit-font-smoothing: antialiased`).
- R-UP-6: Every emoji-only `<button>` in `src/Dashboard.tsx`, `src/components/LegalModal.tsx`, and `src/components/Updates.tsx` MUST carry an `aria-label` attribute describing its purpose.
- R-UP-7: The full test suite MUST continue to pass with no regressions (109 passed + 3 skipped baseline).

## Scenarios

### SPEC-UP-001 — theme module exists

**Given** a fresh checkout
**When** a developer imports `colors` from `src/constants/theme.ts`
**Then** the import resolves
**And** `colors.text.muted` equals `'#94a3b8'`
**And** `colors.border.default` equals `'#334155'`

### SPEC-UP-002 — no drift colors remain

**Given** the codebase after this change
**When** `grep -r '#8897a7\|#242f3d' src/` runs
**Then** zero matches are returned

### SPEC-UP-003 — focus-visible outline is global

**Given** a user tabs through interactive elements
**When** a button, input, or link receives keyboard focus
**Then** a visible outline is rendered (matching `*:focus-visible` rule in `index.css`)

### SPEC-UP-004 — font smoothing enabled

**Given** `src/index.css` is parsed
**When** a reader inspects the `html` rule
**Then** `-webkit-font-smoothing: antialiased` is present

### SPEC-UP-005 — icon-only buttons are accessible

**Given** a screen reader focuses the back button (`⬅`) in Dashboard
**When** the button renders
**Then** an `aria-label` is present describing the action (e.g. `"Volver al menú"`, `"Cerrar"`, `"Cerrar sesión"`)

### SPEC-UP-006 — test suite remains green

**Given** the change is applied
**When** `npx vitest run` executes
**Then** the suite reports the same pass/skip counts as before (109 passed + 3 skipped)

## Non-requirements

- NR-UP-1: Migrating the 115 existing inline-style usages to consume `theme.ts`
- NR-UP-2: Adding a CSS framework or CSS-in-JS library
- NR-UP-3: Implementing dark/light mode toggle
- NR-UP-4: Changing any component's layout, typography scale, or animation
- NR-UP-5: Adding `aria-label` to buttons that already have visible text
