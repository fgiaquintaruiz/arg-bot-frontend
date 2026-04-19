# Archive Report — ui-professional-refresh

**Status**: ✅ SHIPPED
**Archived**: 2026-04-19

## Summary

Low-risk polish pass: extracted the active dark-theme palette into `src/constants/theme.ts` as a seed for new code, cleaned 15 drift-color occurrences (`#8897a7`→`#94a3b8`, `#242f3d`→`#334155`), added global focus-visible + font-smoothing + selection styles to `index.css`, and added `aria-label` to 4 emoji-only buttons (settings, 3 modal closes).

## Artifacts

| Phase | File |
|-------|------|
| Proposal | `proposal.md` |
| Spec | `spec.md` |
| Tasks | `tasks.md` |
| Archive report | `archive-report.md` |

## Results

- **Tests**: 109 passed + 3 skipped (same as baseline — zero regressions)
- **Drift colors**: 0 remaining
- **`aria-label`** coverage: 4 emoji-only buttons (up from 0)

## Files Changed

- `src/constants/theme.ts` (NEW) — single source of truth palette + spacing
- `src/index.css` — `*:focus-visible`, font smoothing, `::selection`
- `src/Dashboard.tsx` — aria-label on ⚙️ settings button
- `src/components/LegalModal.tsx` — aria-label on ✖
- `src/components/Updates.tsx` — aria-label on ✖
- `src/components/Settings.tsx` — aria-label on ✖
- `src/components/AddressBook.tsx`, `BinanceConfig.tsx`, `History.tsx`, `Trade.tsx`, `Withdraw.tsx` — drift color cleanup

## Rollback

`git revert`. Pure presentational change.

## Lessons Learned

- **Seed theme, don't migrate**: creating `theme.ts` without refactoring the 115 existing inline usages is a principled compromise — new code gets a source of truth, old code stays stable, and opportunistic migration on future touches compounds over time.
- **Drift is invisible until you grep**: `#8897a7` vs `#94a3b8` look identical to the eye but diverge the palette. A one-line grep surfaces these cheaply.
- **a11y baseline**: going from zero `aria-label` to four covers the highest-impact icon-only controls — the rest of the UI already uses text labels.
