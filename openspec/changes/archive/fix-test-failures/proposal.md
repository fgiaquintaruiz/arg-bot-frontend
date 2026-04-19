# Proposal — fix-test-failures

## Summary

Fix 2 real test failures surfaced by the current suite and commit the test-drift adjustments in Calculator/History/Withdraw that already align with current component behavior.

## Current state

Running `npx vitest run` reports:
- **107 passed / 2 failed / 3 skipped** (8 test files)
- Test files `Calculator.test.jsx`, `History.test.jsx`, `Withdraw.test.jsx` have uncommitted drift that ALREADY passes against current components (adjustments made during earlier UI changes, never committed).
- New untracked test files `AddressBook.test.jsx`, `Settings.test.jsx` exist; AddressBook has 1 failure, Settings passes.

## Real failures

1. **History.test.jsx:52** — `should handle invalid localStorage data gracefully`
   - Test: `expect(() => render(<History...>)).not.toThrow()` when `localStorage.trade_history === 'invalid-json'`
   - Bug: `src/components/History.tsx:7` calls `JSON.parse(localStorage.getItem('trade_history') || '[]')` without a try/catch → throws SyntaxError on corrupted data.
   - Severity: real. A user with bad localStorage data (corruption, partial write, manual edit) would see the app crash on opening History.

2. **AddressBook.test.jsx:48** — copy mismatch
   - Test expects `/Formato de dirección BSC\/BEP20 inválido/` on invalid input.
   - Bug: `src/components/AddressBook.tsx:99` uses English copy `"Invalid BSC/BEP20 address format. Must be 0x followed by 40 hex characters."` while the other two branches at lines 134 and 166 already use the Spanish copy. Inconsistency.
   - Severity: UX/i18n — app is Spanish, error should be Spanish.

## User-visible behavior

- **Before**: corrupted localStorage crashes History; real-time validation shows English error while other error paths show Spanish.
- **After**: History renders empty state gracefully on corrupted data; all validation copy is unified in Spanish.

## Rollback plan

Both fixes are small and localized. If either regresses, revert the single commit — no data migration.

## Affected modules

- `src/components/History.tsx` — add try/catch around JSON.parse
- `src/components/AddressBook.tsx` — unify line 99-101 copy to Spanish
- `src/tests/Calculator.test.jsx`, `History.test.jsx`, `Withdraw.test.jsx`, `AddressBook.test.jsx`, `Settings.test.jsx` — commit as-is (tests match current components)

## Non-goals

- Rewriting the test architecture
- Component-level refactor of History or AddressBook
- i18n framework (app is Spanish-only)

## Open questions

None — scope is tight.
