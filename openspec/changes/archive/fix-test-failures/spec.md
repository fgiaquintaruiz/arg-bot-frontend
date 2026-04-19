# Specification — fix-test-failures

## Overview

Two targeted fixes. Both tests already exist in the suite and are RED; this spec documents the GREEN acceptance criteria.

---

## Group A: `History.tsx` — Defensive JSON parsing

### SPEC-FTF-001: History component MUST NOT throw on corrupted localStorage

**Given** `localStorage.getItem('trade_history')` returns the literal string `"invalid-json"`
**When** the History component is rendered
**Then** the render MUST NOT throw a `SyntaxError`
**And** the component MUST render the empty-state UI (same as when no history exists)

**Test location**: `src/tests/History.test.jsx:52` (`'should handle invalid localStorage data gracefully'`)

**Acceptance**: `expect(() => render(<History onClose={() => {}} />)).not.toThrow()`

---

## Group B: `AddressBook.tsx` — Unified Spanish validation copy

### SPEC-FTF-002: Real-time address validation uses Spanish copy

**Given** the AddressBook form is open
**When** the user types `"invalid"` into the BSC/BEP20 address input
**Then** a validation error MUST appear
**And** the error text MUST match the regex `/Formato de dirección BSC\/BEP20 inválido/` (case-sensitive literal)
**And** the copy MUST match the Spanish copy already used in `handleSaveEdit` (line 134) and `handleAddAddress` (line 166)

**Test location**: `src/tests/AddressBook.test.jsx:48`

**Acceptance**: `expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument()`

---

## Acceptance Criteria

- `npx vitest run` MUST report 0 failures (109 passed / 3 skipped expected)
- No regressions in the other 6 test files
- Test file drift (Calculator/History/Withdraw) committed as-is — already aligned with current components
