# Archive Report — fee-disabled

**Status**: ✅ SHIPPED
**Archived**: 2026-04-19

## Summary

Gated the service-fee feature in `src/components/Settings.tsx` behind a module-level `FEE_ENABLED = false` constant, pending written authorization from redacted (contract clause 3.1). Single-line flip re-enables it.

## Artifacts

| Phase | File |
|-------|------|
| Proposal | `proposal.md` |
| Spec | `spec.md` |
| Tasks | `tasks.md` |
| Archive report | `archive-report.md` |

## Results

- **Settings.test.jsx**: 10 passed + 3 skipped (active tests cover SPEC-FD-001..004; skipped tests cover SPEC-FD-005 re-enable path)
- **Full suite**: 109 passed + 3 skipped (no regressions)
- **0 CRITICAL findings**

## Files Changed

- `src/components/Settings.tsx` — `FEE_ENABLED` constant + 3 guard sites (button, panel, `initialTab` coercion) + default `service_fee="0"`

## Rollback

Set `FEE_ENABLED = true` and un-skip the 3 `.skip` tests in `Settings.test.jsx` to restore full Fee-tab coverage.

## Lessons Learned

- **Source-level flags over env vars**: `FEE_ENABLED` in source is audit-friendlier than an env var — the diff itself is the authorization trail.
- **Preserve, don't delete**: keeping ~150 lines of fee UI/logic avoids rewriting when the flag flips back.
- **Latent CI gap caught by SDD**: the `fix-test-failures` commit committed tests expecting `FEE_ENABLED=false` behavior without the corresponding `Settings.tsx` change — this change closes that gap.
