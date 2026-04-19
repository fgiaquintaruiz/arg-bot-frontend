# Specification — access-whitelist

## Overview
This spec defines the behavior of the access whitelist feature for the ARGBOT frontend. All scenarios MUST be implemented via strict TDD (red-first tests) in `src/tests/AccessWhitelist.test.jsx` with runner `npm run test:unit`. Tests MUST use `vi.mock('firebase/auth')` and `vi.stubEnv('VITE_WHITELIST_EMAILS', '...')` patterns matching the existing test suite.

---

## Group A: `checkWhitelist(email: string)` — Pure Function

The `checkWhitelist` function MUST be a pure function in `src/authService.ts` that determines if an email is whitelisted.

### SPEC-AW-001: Whitelisted email returns true (exact match)

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com,alice@example.com"`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `true`

### SPEC-AW-002: Whitelisted email returns true (case-insensitive)

**Given** the env var `VITE_WHITELIST_EMAILS` is `"Fabio@Example.COM,alice@example.com"`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `true`

### SPEC-AW-003: Whitelisted email returns true (whitespace tolerance)

**Given** the env var `VITE_WHITELIST_EMAILS` is `" fabio@example.com , alice@example.com "`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `true`

### SPEC-AW-004: Non-whitelisted email returns false

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com,alice@example.com"`  
**When** `checkWhitelist("bob@example.com")` is called  
**Then** it MUST return `false`

### SPEC-AW-005: Null email returns false

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**When** `checkWhitelist(null)` is called  
**Then** it MUST return `false`

### SPEC-AW-006: Undefined email returns false

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**When** `checkWhitelist(undefined)` is called  
**Then** it MUST return `false`

### SPEC-AW-007: Empty string email returns false

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**When** `checkWhitelist("")` is called  
**Then** it MUST return `false`

### SPEC-AW-008: Missing env var returns false for all emails

**Given** the env var `VITE_WHITELIST_EMAILS` is not set (or is undefined)  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `false`

### SPEC-AW-009: Empty string env var returns false for all emails

**Given** the env var `VITE_WHITELIST_EMAILS` is `""`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `false`

### SPEC-AW-010: Whitespace-only env var returns false for all emails

**Given** the env var `VITE_WHITELIST_EMAILS` is `"   "`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `false`

### SPEC-AW-011: Comma-only env var returns false for all emails

**Given** the env var `VITE_WHITELIST_EMAILS` is `",,,"`  
**When** `checkWhitelist("fabio@example.com")` is called  
**Then** it MUST return `false`

---

## Group B: `loginWithGoogle()` — Google Sign-In Integration

The `loginWithGoogle` function in `src/authService.ts` MUST call `signInWithPopup`, validate the result with `checkWhitelist`, and handle rejections.

### SPEC-AW-012: Happy path — whitelisted email

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**And** `signInWithPopup` resolves with a user whose email is `"fabio@example.com"`  
**When** `loginWithGoogle()` is awaited  
**Then** `signInWithPopup` MUST be called exactly once  
**And** `signOut` MUST NOT be called  
**And** the returned user object MUST have email `"fabio@example.com"`

### SPEC-AW-013: Rejection path — non-whitelisted email

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**And** `signInWithPopup` resolves with a user whose email is `"bob@example.com"`  
**When** `loginWithGoogle()` is awaited  
**Then** `signInWithPopup` MUST be called exactly once  
**And** `signOut(auth)` MUST be called exactly once  
**And** `signOut` MUST be awaited (not fire-and-forget)  
**And** an `Error` with message `"ACCESS_DENIED"` MUST be thrown

### SPEC-AW-014: signOut MUST complete before throw (flash prevention)

**Given** the env var `VITE_WHITELIST_EMAILS` is `"fabio@example.com"`  
**And** `signInWithPopup` resolves with an unauthorized email  
**And** `signOut(auth)` is instrumented with a completion flag  
**When** `loginWithGoogle()` is awaited and catches an `ACCESS_DENIED` error  
**Then** the `signOut` completion flag MUST be set to true BEFORE the error is thrown  
**And** this ordering MUST hold in the same microtask chain (no setTimeout)

---

## Group C: `App.tsx` — Rejection State and Render Gate

The App component MUST manage a `rejected` state and conditionally render Dashboard only when access is fully authorized.

### SPEC-AW-015: Whitelisted login renders Dashboard

**Given** the user successfully logs in with a whitelisted email  
**And** `onAuthStateChanged` has fired with the user object  
**When** `App.tsx` renders  
**Then** the Dashboard component MUST be rendered  
**And** the Login component MUST NOT be rendered

### SPEC-AW-016: Rejected login keeps Login mounted

**Given** the user completes Google sign-in but the email is not whitelisted  
**And** `loginWithGoogle()` throws `ACCESS_DENIED`  
**And** `handleLogin` catches the error and sets `rejected` to `true`  
**When** `onAuthStateChanged` fires with `null`  
**Then** the Login component MUST remain mounted  
**And** the Dashboard component MUST NOT be rendered

### SPEC-AW-017: Rejected state persists until retry

**Given** the user is in the rejected state (email unauthorized)  
**And** the rejected message is displayed  
**When** 2 seconds pass (no state change)  
**Then** the Login component MUST still be mounted  
**And** the rejected message MUST still be visible

### SPEC-AW-018: Re-clicking Google button clears rejected state

**Given** the user is in the rejected state  
**And** the Google sign-in button is clickable  
**When** the user clicks the button a second time  
**Then** `setRejected(false)` MUST be called BEFORE `signInWithPopup` is invoked  
**And** the rejection message MUST be cleared from the UI

### SPEC-AW-019: Dashboard renders only when user is truthy AND rejected is false

**Given** various combinations of `user` and `rejected` state  
**When** `App.tsx` renders  
**Then** Dashboard MUST render only when:
  - `user !== null` AND `rejected === false`  
**And** Login MUST render when:
  - `user === null` OR `rejected === true`

---

## Group D: Login UI — Banners and Messages

The Login component MUST display access-control messaging consistently.

### SPEC-AW-020: Login banner displays above Google button

**Given** the Login component is mounted  
**When** it renders  
**Then** a banner element MUST appear above the Google sign-in button  
**And** the banner MUST contain the text "Acceso restringido"

### SPEC-AW-021: Login banner displays complete Spanish text

**Given** the Login component is rendered  
**When** examining the banner element  
**Then** the banner text MUST match the regex `/acceso restringido/i` (case-insensitive literal)  
**And** the full banner content SHOULD be:
```
Acceso restringido
Esta aplicación es de uso privado y solo admite cuentas de Google previamente autorizadas. Si tu cuenta no está en la lista, la sesión se cerrará automáticamente.
```

### SPEC-AW-022: Rejection message appears below Google button when rejected

**Given** the user is in the rejected state (`rejected === true`)  
**When** the Login component renders  
**Then** a rejection message element MUST appear below the Google button  
**And** the message MUST contain the text "Cuenta no autorizada"

### SPEC-AW-023: Rejection message displays complete Spanish text

**Given** the rejection message is visible  
**When** examining the message element  
**Then** the message text MUST match the regex `/cuenta no autorizada/i` (case-insensitive literal)  
**And** the full message content SHOULD include:
```
Cuenta no autorizada. Esta aplicación es privada.
```

### SPEC-AW-024: Rejection message is not displayed when not rejected

**Given** the user is NOT in the rejected state (`rejected === false`)  
**When** the Login component renders  
**Then** the rejection message element MUST NOT be visible in the DOM

---

## Group E: Dashboard UI — Persistent Banner

The Dashboard component MUST display a permanent access-control banner when rendered.

### SPEC-AW-025: Dashboard renders persistent banner at top

**Given** a whitelisted user is logged in and Dashboard is rendered  
**When** examining the component  
**Then** a banner element MUST appear at the top of the page  
**And** the banner MUST contain the text "Acceso restringido"

### SPEC-AW-026: Dashboard banner displays complete Spanish text

**Given** the Dashboard banner is visible  
**When** examining the banner element  
**Then** the banner text MUST match the regex `/acceso restringido/i` (case-insensitive literal)  
**And** the full banner content SHOULD be:
```
Acceso restringido — solo usuarios autorizados.
```

---

## Group F: Env Var Parsing — Module-Level Caching

Environment variable parsing MUST happen once at module load and MUST be cached.

### SPEC-AW-027: Parsing happens once at module load

**Given** `src/authService.ts` is imported  
**When** the module is evaluated  
**Then** the env var `VITE_WHITELIST_EMAILS` MUST be read and parsed exactly once  
**And** the result MUST be cached in a module-level constant (not re-read per function call)

### SPEC-AW-028: Comma-separated values split correctly

**Given** the env var `VITE_WHITELIST_EMAILS` is `"alice@example.com,bob@example.com,charlie@example.com"`  
**When** `checkWhitelist` is evaluated  
**Then** exactly three entries MUST be recognized  
**And** `checkWhitelist("alice@example.com")`, `checkWhitelist("bob@example.com")`, and `checkWhitelist("charlie@example.com")` MUST each return `true`

### SPEC-AW-029: Trailing/leading whitespace per entry is trimmed

**Given** the env var `VITE_WHITELIST_EMAILS` is `" alice@example.com , bob@example.com , charlie@example.com "`  
**When** `checkWhitelist` evaluates each entry  
**Then** all three emails MUST match correctly (whitespace ignored)  
**And** `checkWhitelist("alice@example.com")` MUST return `true`

### SPEC-AW-030: Comparison is case-insensitive

**Given** the env var `VITE_WHITELIST_EMAILS` is `"ALICE@EXAMPLE.COM,Bob@Example.com"`  
**When** various case combinations are checked  
**Then** `checkWhitelist("alice@example.com")` MUST return `true`  
**And** `checkWhitelist("bob@example.com")` MUST return `true`  
**And** `checkWhitelist("ALICE@EXAMPLE.COM")` MUST return `true`

### SPEC-AW-031: Fail-closed default — missing or empty env

**Given** `VITE_WHITELIST_EMAILS` is missing or empty  
**When** `checkWhitelist` is called with any email  
**Then** it MUST return `false`  
**And** the system MUST NOT throw an error

---

## Mocking Strategy

All tests in `src/tests/AccessWhitelist.test.jsx` MUST use:

- `vi.mock('firebase/auth')` to mock `signInWithPopup` and `signOut`
- `vi.stubEnv('VITE_WHITELIST_EMAILS', '<value>')` to override the env var per test
- RTL (React Testing Library) utilities for UI tests (`render`, `screen`, `within`, etc.)
- MSW or mocked Firebase patterns matching `src/tests/App.test.jsx`

---

## Acceptance Criteria

- All 31 scenarios (SPEC-AW-001 through SPEC-AW-031) MUST have corresponding red-first tests
- Tests MUST pass with `npm run test:unit`
- No console errors or warnings (excluding Firebase mock warnings if expected)
- Whitelist parsing MUST be cached at module load, not per call
- signOut MUST be awaited in the rejection path before throw
- Dashboard MUST never flash on rejection (race condition prevented)
- Both Login and Dashboard banners MUST be inline JSX (not shared component)
- All Spanish text MUST match the approved copy exactly or be asserted with case-insensitive regex

---

## Non-Goals

- Cloud Functions, Firestore, or server-side validation
- Multi-role or admin UI
- Rate-limiting or brute-force protection
- Hiding `VITE_WHITELIST_EMAILS` from the client bundle (mitigated via aliases)
- Preventing Firebase Auth user-entry creation (cosmetic only)
