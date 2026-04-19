# Tasks — fix-test-failures

## Phase 1 — Verify RED state

- [x] 1.1 Run `npx vitest run` → confirm exactly 2 failures: `History.test.jsx:52` + `AddressBook.test.jsx:48`

## Phase 2 — GREEN implementation

- [x] 2.1 `src/components/History.tsx` — wrap the `JSON.parse(localStorage.getItem('trade_history') || '[]')` call at line 7 in a try/catch that returns `[]` on parse error. Keep silent (no toast); corrupted data is recoverable by re-logging trades.
- [x] 2.2 `src/components/AddressBook.tsx` — replace line 99 English error `"Invalid BSC/BEP20 address format..."` with the existing Spanish copy `"Formato de dirección BSC/BEP20 inválido"` (match lines 134/166 exactly). Also unify line 101 checksum message to Spanish `"La dirección no pasa la validación de checksum"`.

## Phase 3 — Verify GREEN

- [x] 3.1 Run `npx vitest run` → 0 failures, 109 passed / 3 skipped

## Phase 4 — Commit

- [x] 4.1 Stage only the scope of this change:
  - `src/components/History.tsx`
  - `src/components/AddressBook.tsx`
  - `src/tests/Calculator.test.jsx`
  - `src/tests/History.test.jsx`
  - `src/tests/Withdraw.test.jsx`
  - `src/tests/AddressBook.test.jsx` (new)
  - `src/tests/Settings.test.jsx` (new)
- [x] 4.2 Commit message: `fix: localStorage corrupto en History + copy español unificado en AddressBook`
