# access-whitelist: Task Breakdown (TDD-First Order)

**Change**: access-whitelist  
**Status**: Ready for implementation  
**Total Tasks**: 14  
**Execution Order**: Strict TDD — Phase 1 (setup) → Phase 2 (RED tests) → Phase 3 (GREEN implementation) → Phase 4 (verify)

---

## Phase 1: Infrastructure Setup

### 1.1 Create `.env.example` with whitelist env var template
**Scope**: Environment configuration  
**Spec coverage**: SPEC-AW-027 (env var parsing setup)  
**Acceptance criteria**:
- File: `.env.example`
- Contains example: `VITE_WHITELIST_EMAILS=alias1@gmail.com,alias2@gmail.com` (with comment explaining comma-separated list)
- Committed to repo (documents env requirement for future deployments)

**Notes**: This is the single source of truth for the env var name and format. No code reads this file — it's informational for deployment.

---

### 1.2 Confirm Vitest config includes `src/tests/*.test.jsx`
**Scope**: Test infrastructure verification  
**Spec coverage**: Testing architecture foundation  
**Acceptance criteria**:
- Check `vitest.config.js` or `vite.config.js` 
- Confirm `include` glob matches `src/tests/**/*.test.{js,jsx,ts,tsx}` (or equivalent that catches `src/tests/AccessWhitelist.test.jsx`)
- If not configured: add the pattern and verify `npm run test:unit` discovers tests
- If already configured: document "no action needed" and proceed

**Notes**: If this step reveals missing Vitest setup, it's a blocker — escalate before proceeding to Phase 2.

---

## Phase 2: RED Tests (Strict TDD — Write Failing Tests First)

### 2.1 Create test file skeleton with mocking boilerplate
**Scope**: Test infrastructure for access-whitelist  
**Spec coverage**: Testing architecture (all scenarios SPEC-AW-001 through SPEC-AW-031 will populate this file)  
**Acceptance criteria**:
- File: `src/tests/AccessWhitelist.test.jsx`
- Boilerplate includes:
  - `import { describe, it, expect, beforeEach, vi }` from Vitest
  - `vi.mock('firebase/auth')` with mocked `signInWithPopup`, `signOut`, `onAuthStateChanged` exported
  - `vi.stubEnv` utility available for tests
  - File structure with describe blocks for each layer (pure function, integration, UI)
- All imports pass (no actual firebase loaded)
- File compiles but has no tests yet

**Notes**: This skeleton will house ~50 test cases across 7 layers. Each downstream task adds describe blocks and test cases.

---

### 2.2 Pure function tests: `checkWhitelist(email)` — core logic (RED)
**Scope**: Unit tests for `src/authService.ts::checkWhitelist()`  
**Spec coverage**: SPEC-AW-001 through SPEC-AW-011 (9 scenarios for pure function behavior)  
**Acceptance criteria**:
- All tests FAIL (RED) — checkWhitelist does not exist yet
- Describe block: `"checkWhitelist(email)"`
- Test cases (one test per spec, listed with coverage):
  - SPEC-AW-001: Returns `true` when email exactly matches whitelisted entry
  - SPEC-AW-002: Returns `false` when email is not in whitelist
  - SPEC-AW-003: Case-insensitive matching (both sides — env parsed uppercase, input lowercase)
  - SPEC-AW-004: Handles comma-separated list with spaces: `"a@x.com , b@x.com"` parses to `["a@x.com", "b@x.com"]`
  - SPEC-AW-005: Empty string email returns `false`
  - SPEC-AW-006: Undefined/null email returns `false`
  - SPEC-AW-007: Missing `VITE_WHITELIST_EMAILS` env var (undefined) → parses to empty set, returns `false` for any email
  - SPEC-AW-008: Empty string env var returns `false` for any email
  - SPEC-AW-009: Whitespace-only env var (e.g., `"   "`) is treated as empty, returns `false`
  - SPEC-AW-010: Malformed email in whitelist (e.g., `"notanemail"`) is stored as-is; exact match comparison still works
  - SPEC-AW-011: No validation of email format — comparison is exact string match after trim

**CRITICAL TESTING NOTE**:  
Because `WHITELIST` is a module-level constant (parsed once at `authService.ts` module load), tests that need DIFFERENT `VITE_WHITELIST_EMAILS` values across test cases MUST use the reset pattern:
```js
vi.stubEnv('VITE_WHITELIST_EMAILS', 'a@x.com');
vi.resetModules();
const { checkWhitelist } = await import('../authService');
expect(checkWhitelist('a@x.com')).toBe(true);
```
Failure to reset modules will cause env stubs to leak across tests, producing false passes.

**Implementation hint**: When implementing, export `checkWhitelist` from `src/authService.ts` so tests can import it directly.

---

### 2.3 Integration tests: `loginWithGoogle()` — whitelist check flow (RED)
**Scope**: Integration tests for `src/authService.ts::loginWithGoogle()`  
**Spec coverage**: SPEC-AW-012 through SPEC-AW-014 (3 scenarios for auth flow)  
**Acceptance criteria**:
- All tests FAIL (RED) — loginWithGoogle not yet extended with whitelist check
- Describe block: `"loginWithGoogle() with whitelist"`
- Test cases:
  - SPEC-AW-012: Successful login — email whitelisted, user returned (mocked user object)
  - SPEC-AW-013: Rejected login — email not whitelisted, throws `Error` with message containing `"ACCESS_DENIED"`
  - SPEC-AW-014: Flash prevention — signOut MUST be awaited BEFORE function returns/throws (verify via mock call order: `signInWithPopup` → `signOut` → resolve/throw)

**Mocking setup**:
- `vi.mock('firebase/auth')` with mocked:
  - `signInWithPopup(auth, googleProvider)` → resolves to `{ user: { email: 'test@example.com', uid: 'uid123' } }`
  - `signOut(auth)` → resolves to `undefined` (mock must track call order)
  - Adjust mocks per test case to simulate whitelisted vs rejected emails

**Notes**: These tests verify the glue between `checkWhitelist` and the auth flow. They do NOT test React component rendering.

---

### 2.4 App state tests: rejection state render gate in `App.tsx` (RED)
**Scope**: Unit tests for `App.tsx` rejection handling  
**Spec coverage**: SPEC-AW-015 through SPEC-AW-019 (5 scenarios for App state)  
**Acceptance criteria**:
- All tests FAIL (RED) — App.tsx does not yet have rejected state or render gate
- Describe block: `"App.tsx rejection state"`
- Test cases:
  - SPEC-AW-015: When `rejected === true`, render nothing/null (or rejection message — design says it goes in Login banner, but App gate prevents Dashboard render)
  - SPEC-AW-016: When `rejected === false` and `user === null`, render Login component (normal unauthenticated state)
  - SPEC-AW-017: When `user !== null` and `rejected === false`, render Dashboard component
  - SPEC-AW-018: When `handleLogin` throws `Error('ACCESS_DENIED')`, set `rejected = true`
  - SPEC-AW-019: Render gate: Dashboard renders ONLY when `user !== null AND rejected === false` (combined condition)

**Mocking**:
- Mock `../authService` to control `loginWithGoogle` behavior (throw or return user)
- Mock Login and Dashboard components as simple test doubles

**Notes**: App logic is minimal — mostly state machine. Tests verify gate condition (both user and rejected must be right).

---

### 2.5 Login UI tests: banner and rejection message display (RED)
**Scope**: Unit tests for `src/components/Login.tsx`  
**Spec coverage**: SPEC-AW-020 through SPEC-AW-024 (5 scenarios for Login UI)  
**Acceptance criteria**:
- All tests FAIL (RED) — Login.tsx does not yet have rejection banner
- Describe block: `"Login.tsx banners"`
- Test cases:
  - SPEC-AW-020: Normal login form renders without banner when `rejected === false`
  - SPEC-AW-021: Rejection banner displays when `rejected === true` with text matching regex: `/Cuenta no autorizada/`
  - SPEC-AW-022: Banner text includes secondary message matching regex: `/Esta aplicación es privada/`
  - SPEC-AW-023: Banner is inline JSX (not a shared component)
  - SPEC-AW-024: Login form buttons remain functional for retry (user can attempt login again after rejection)

**Mocking**:
- Mock `../authService` for `loginWithGoogle`
- Render `<Login rejected={false} onLogin={...} />` and `<Login rejected={true} onLogin={...} />`

**Notes**: User-approved Spanish strings are EXACT — assertions use regex with case-insensitive flag if needed. All banners are inline per YAGNI (no shared component).

---

### 2.6 Dashboard UI tests: persistent access restriction banner (RED)
**Scope**: Unit tests for `src/Dashboard.tsx`  
**Spec coverage**: SPEC-AW-025 through SPEC-AW-026 (2 scenarios for Dashboard UI)  
**Acceptance criteria**:
- All tests FAIL (RED) — Dashboard.tsx does not yet have access restriction banner
- Describe block: `"Dashboard.tsx banners"`
- Test cases:
  - SPEC-AW-025: Dashboard renders normal content with no banner when whitelisted
  - SPEC-AW-026: Persistent inline banner displays with text matching regex: `/Acceso restringido/` and `/solo usuarios autorizados/`

**Mocking**:
- Mock Firebase auth context or pass mock user object to Dashboard

**Notes**: Dashboard banner is informational (reassurance for authorized users). Tests verify banner presence and text. Banner placement is inline JSX (no shared component).

---

### 2.7 Environment variable parsing tests: module-level WHITELIST constant (RED)
**Scope**: Unit tests for env var parsing in `src/authService.ts`  
**Spec coverage**: SPEC-AW-027 through SPEC-AW-031 (5 scenarios for env parsing)  
**Acceptance criteria**:
- All tests FAIL (RED) — WHITELIST constant does not yet exist
- Describe block: `"WHITELIST constant initialization"`
- Test cases:
  - SPEC-AW-027: WHITELIST is parsed once at module load from `VITE_WHITELIST_EMAILS`
  - SPEC-AW-028: Comma-separated values are split and trimmed: `"a@x.com, b@y.com"` → `Set(["a@x.com", "b@y.com"])`
  - SPEC-AW-029: All emails lowercased after parse: `"A@X.COM"` → stored as `"a@x.com"`
  - SPEC-AW-030: Missing/empty env var → WHITELIST = empty Set
  - SPEC-AW-031: Module-level caching (WHITELIST not re-parsed per call) — verify by checking call count of env read

**CRITICAL TESTING PATTERN**:  
Use `vi.resetModules()` + dynamic `import()` for each test case to ensure different env values are parsed correctly:
```js
vi.stubEnv('VITE_WHITELIST_EMAILS', 'a@x.com,b@y.com');
vi.resetModules();
const { WHITELIST } = await import('../authService');
expect(WHITELIST.size).toBe(2);
expect(WHITELIST.has('a@x.com')).toBe(true);
```

**Notes**: These tests are critical to catch env var parsing bugs. Each case tests a different env value, so isolation via reset is mandatory.

---

## Phase 3: GREEN Implementation (Make Tests Pass)

### 3.1 Implement `checkWhitelist(email)` pure function in `src/authService.ts`
**Scope**: Core logic for email whitelisting  
**Spec coverage**: SPEC-AW-001 through SPEC-AW-011 (makes all pure function tests GREEN)  
**Acceptance criteria**:
- Function signature: `export function checkWhitelist(email: string): boolean`
- Reads module-level `WHITELIST` constant (case-insensitive Set of emails)
- Returns `true` if `email.toLowerCase()` is in `WHITELIST`, else `false`
- Handles null/undefined/empty email gracefully (returns `false`)
- No external dependencies (pure function)
- All 9 unit tests from task 2.2 now pass

**Implementation notes**:
- Must be placed BEFORE `loginWithGoogle` in file (dependency order)
- `WHITELIST` constant parsed at module load: `const WHITELIST = new Set((import.meta.env.VITE_WHITELIST_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean))`
- **CRITICAL**: Vite uses `import.meta.env.VITE_*` in the client bundle. `process.env` is NOT populated in a Vite-built client artifact — do not use it here.

---

### 3.2 Extend `loginWithGoogle()` in `src/authService.ts` with whitelist check
**Scope**: Google auth flow with access control  
**Spec coverage**: SPEC-AW-012 through SPEC-AW-014 (makes all integration tests GREEN)  
**Acceptance criteria**:
- Function adds whitelist check AFTER `signInWithPopup` resolves
- Calls `checkWhitelist(result.user.email)` on the returned user
- **If rejected**: `await signOut(auth)` → `throw new Error('ACCESS_DENIED')`. signOut MUST be awaited BEFORE the throw (flash prevention — verified by test mock call order).
- **If accepted**: return `result.user` as today. Do NOT call signOut on the happy path — that would log the user out immediately and break every login.
- All 3 integration tests from task 2.3 now pass

**Implementation notes**:
- Existing try/catch in App.tsx will catch the `Error('ACCESS_DENIED')` — no App changes needed for this task
- signOut call order is critical ONLY on the rejection branch: resolve popup → whitelist check fails → await signOut → throw. The happy path does not touch signOut.

---

### 3.3 Add `rejected` state to `src/App.tsx` with render gate
**Scope**: App-level state machine for rejection handling  
**Spec coverage**: SPEC-AW-015 through SPEC-AW-019 (makes all App state tests GREEN)  
**Acceptance criteria**:
- New state: `const [rejected, setRejected] = useState(false)`
- `handleLogin` updated:
  - Clear rejected before retry: `setRejected(false)` before calling `loginWithGoogle`
  - Catch `Error('ACCESS_DENIED')`: set `setRejected(true)`
- Render gate: Dashboard renders ONLY when `user !== null && !rejected`
- When rejected, render Login component (allow retry)
- All 5 App state tests from task 2.4 now pass

**Implementation notes**:
- `rejected` state prevents flash of Dashboard if whitelist check fails
- No changes to auth context or onAuthStateChanged logic
- All 5 state tests from task 2.4 now GREEN

---

### 3.4 Add rejection banner to `src/components/Login.tsx`
**Scope**: User-facing feedback for unauthorized accounts  
**Spec coverage**: SPEC-AW-020 through SPEC-AW-024 (makes all Login UI tests GREEN)  
**Acceptance criteria**:
- New prop: `rejected: boolean` (passed from App.tsx)
- Inline JSX banner that displays ONLY when `rejected === true`
- Banner text:
  - Line 1: "Cuenta no autorizada." (user-approved exact string)
  - Line 2: "Esta aplicación es privada." (user-approved exact string)
- Banner styling: clear, inline div (no shared component)
- Login form remains fully functional for retry attempts
- All 5 Login UI tests from task 2.5 now GREEN

**Implementation notes**:
- Banner placement: above or below form (designer's choice for layout)
- No shared component — YAGNI (inline JSX only)
- Prop drilling from App to Login is acceptable (shallow hierarchy)

---

### 3.5 Add persistent access restriction banner to `src/Dashboard.tsx`
**Scope**: Informational banner for authorized users  
**Spec coverage**: SPEC-AW-025 through SPEC-AW-026 (makes all Dashboard UI tests GREEN)  
**Acceptance criteria**:
- Inline JSX banner that displays at top of Dashboard
- Banner text:
  - "Acceso restringido — solo usuarios autorizados." (user-approved exact string or close variant)
- Banner styling: informational, non-intrusive
- Dashboard content renders normally below banner
- All 2 Dashboard UI tests from task 2.6 now GREEN

**Implementation notes**:
- No conditional rendering — banner is always visible (context: users are already whitelisted)
- Reassurance to authorized users that app is protected
- Inline JSX (no shared component)

---

## Phase 4: Verification & Closure

### 4.1 Run full test suite and verify all tests pass
**Scope**: Test validation  
**Acceptance criteria**:
- Command: `npm run test:unit` (or `vitest`)
- All 50+ tests in `AccessWhitelist.test.jsx` pass (GREEN)
- No test failures or warnings
- No skipped tests (all tasks from Phase 2 implemented in Phase 3)
- Coverage report (if available): core functions have >90% coverage

**Notes**: This is the mechanical verification gate. If any test fails, revert to the failing task's implementation and debug.

---

### 4.2 Manual smoke test checklist (user-run)
**Scope**: End-to-end functional validation  
**User instructions** (copy this into CHANGELOG or README):

1. **Setup**: Set `VITE_WHITELIST_EMAILS=your-test-account@gmail.com` in `.env` (or `.env.local`)
2. **Whitelisted access**:
   - Start dev server: `npm run dev`
   - Open app in browser (localhost:5173)
   - Click "Sign in with Google"
   - Use the whitelisted test account
   - Verify: Dashboard loads with access restriction banner visible
3. **Rejected access**:
   - Open app in private/incognito window
   - Click "Sign in with Google"
   - Use a different Google account (not in whitelist)
   - Verify: Rejection banner appears ("Cuenta no autorizada / Esta aplicación es privada")
   - Verify: Dashboard does NOT flash or load
   - Click login button again with same account
   - Verify: Same rejection banner (no errors)
4. **Retry after rejection**:
   - Still in rejection state, close private window
   - Open new private window, return to app
   - Verify: App is back at clean Login state (rejected flag cleared)

**Notes**: Manual testing confirms UX flow end-to-end. Automated tests cover logic; manual test covers user flow + no flashes.

---

### 4.3 Document `VITE_WHITELIST_EMAILS` usage (user decision)
**Scope**: Deployment and maintenance documentation  
**Acceptance criteria**:
- Either (user chooses):
  - **Option A**: Add section to `README.md` under "Configuration" or "Environment Variables" with:
    - Env var name: `VITE_WHITELIST_EMAILS`
    - Format: comma-separated Google account emails (case-insensitive)
    - Example: `VITE_WHITELIST_EMAILS=user1@example.com,user2@example.com`
    - Behavior: fail-closed (missing/empty env → reject all)
  - **Option B**: Add to `CHANGELOG.md` under the access-whitelist feature entry with the same info
- Document deployed (either in README or CHANGELOG)

**Notes**: This is metadata documentation for future deployments. Left to user's preference on where to document (README more permanent, CHANGELOG more change-focused).

---

## Task Summary

| Phase | Task ID | Title | Est. Time | Status |
|-------|---------|-------|-----------|--------|
| **1** | 1.1 | Create `.env.example` | 5 min | Pending |
| **1** | 1.2 | Confirm Vitest config | 10 min | Pending |
| **2** | 2.1 | Test skeleton + mocking boilerplate | 15 min | Pending (RED) |
| **2** | 2.2 | Pure function tests: checkWhitelist | 20 min | Pending (RED) |
| **2** | 2.3 | Integration tests: loginWithGoogle | 15 min | Pending (RED) |
| **2** | 2.4 | App state tests: rejected gate | 15 min | Pending (RED) |
| **2** | 2.5 | Login UI tests: rejection banner | 15 min | Pending (RED) |
| **2** | 2.6 | Dashboard UI tests: access banner | 10 min | Pending (RED) |
| **2** | 2.7 | Env parsing tests: WHITELIST constant | 15 min | Pending (RED) |
| **3** | 3.1 | Implement checkWhitelist | 15 min | Pending (GREEN) |
| **3** | 3.2 | Extend loginWithGoogle | 15 min | Pending (GREEN) |
| **3** | 3.3 | Add rejected state to App | 15 min | Pending (GREEN) |
| **3** | 3.4 | Add rejection banner to Login | 10 min | Pending (GREEN) |
| **3** | 3.5 | Add access banner to Dashboard | 10 min | Pending (GREEN) |
| **4** | 4.1 | Run full test suite | 5 min | Pending |
| **4** | 4.2 | Manual smoke test (user) | 10 min | Pending |
| **4** | 4.3 | Document VITE_WHITELIST_EMAILS | 5 min | Pending |

**Total**: 200 minutes (~3–4 hours with focus)

---

## Key Design Principles (from spec & design)

1. **Strict TDD**: All Phase 2 tests must be written and FAIL before any Phase 3 implementation
2. **Module-level caching**: WHITELIST parsed once at authService.ts module load — tests MUST use `vi.resetModules()` for env var variation
3. **Flash prevention**: signOut awaited inside loginWithGoogle before return/throw (critical for UX)
4. **Fail-closed**: Missing or empty `VITE_WHITELIST_EMAILS` → reject all access
5. **Inline JSX only**: No shared component for banners (YAGNI)
6. **Case-insensitive**: Email matching on both sides (env parse + comparison)

---

## Notes for Apply Agent (sdd-apply)

- **Order matters**: Execute Phase 1 → Phase 2 (ALL RED tests) → Phase 3 (GREEN implementation) → Phase 4 (verify)
- **vi.resetModules() critical**: Any task in Phase 2 or 3 that involves env var variation MUST use reset pattern to avoid test leaks
- **Mock call order verification** (task 2.3): Manually inspect mock call order in test assertions — signOut must come after signInWithPopup completes
- **Exact strings**: User-approved Spanish strings are exact — use regex with `/.../ flags if needed for whitespace/case tolerance
