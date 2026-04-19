# Tasks — fee-disabled

## Phase 1 — Implementation (already in working copy)

- [x] 1.1 Add `const FEE_ENABLED = false;` at module level in `src/components/Settings.tsx` with comment referencing redacted clause 3.1
- [x] 1.2 Coerce `initialTab === "fee"` to `"sync"` in the `useState` initializer when `!FEE_ENABLED`
- [x] 1.3 Wrap Fee tab button JSX in `{FEE_ENABLED && (...)}`
- [x] 1.4 Wrap Fee tab panel JSX in `{FEE_ENABLED && activeTab === "fee" && (...)}`
- [x] 1.5 Change default `service_fee` from `"0.50"` to `"0"` when the flag is off

## Phase 2 — Testing (already committed in `fix-test-failures`)

- [x] 2.1 `src/tests/Settings.test.jsx` covers SPEC-FD-001..004 (3 active tests)
- [x] 2.2 `.skip` tests cover SPEC-FD-005 for re-enable path (3 skipped tests)
- [x] 2.3 All active tests green against current implementation

## Phase 3 — Verify

- [ ] 3.1 Run `npm test -- Settings` and confirm 3 pass + 3 skipped
- [ ] 3.2 Run full `npm test` and confirm no regressions (should remain at 109/0/3)

## Phase 4 — Archive & Commit

- [ ] 4.1 Move `openspec/changes/fee-disabled/*` to `openspec/changes/archive/fee-disabled/`
- [ ] 4.2 Write `archive-report.md` summarizing the change
- [ ] 4.3 Commit with message `feat: gatear fee detrás de FEE_ENABLED=false (pendiente autorización redacted cláusula 3.1)` including `src/components/Settings.tsx` + archived SDD artifacts
