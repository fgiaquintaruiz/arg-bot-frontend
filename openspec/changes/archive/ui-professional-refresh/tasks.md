# Tasks — ui-professional-refresh

## Phase 1 — Theme module

- [ ] 1.1 Create `src/constants/theme.ts` with `colors` and `spacing` exports

## Phase 2 — Drift color cleanup

- [ ] 2.1 Replace `#8897a7` → `#94a3b8` across `src/**/*.tsx` (10 occurrences)
- [ ] 2.2 Replace `#242f3d` → `#334155` across `src/**/*.tsx` (5 occurrences)
- [ ] 2.3 Confirm no other drift colors introduced

## Phase 3 — Global CSS a11y

- [ ] 3.1 Add `*:focus-visible` outline rule to `src/index.css`
- [ ] 3.2 Add font-smoothing rule to `html` in `src/index.css`
- [ ] 3.3 Add `::selection` rule to `src/index.css`

## Phase 4 — aria-label on icon-only buttons

- [ ] 4.1 Scan `src/Dashboard.tsx` for emoji-only buttons and add `aria-label`
- [ ] 4.2 Scan `src/components/LegalModal.tsx` for close button and add `aria-label`
- [ ] 4.3 Scan `src/components/Updates.tsx` for close button and add `aria-label`

## Phase 5 — Verify & Commit

- [ ] 5.1 Run `npx vitest run` — must stay at 109 passed + 3 skipped
- [ ] 5.2 `grep` confirms no drift colors remain
- [ ] 5.3 Archive artifacts to `openspec/changes/archive/ui-professional-refresh/`
- [ ] 5.4 Commit with `style: refresca UI con theme.ts, focus-visible, aria-labels y cleanup de colores drift`
