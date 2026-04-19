# Proposal — access-whitelist

> Status: draft (awaiting user approval before `/sdd-spec` + `/sdd-design`)
> Change: `access-whitelist`
> Project: `arg-bot-frontend` (ARGBOT, Render static site)
> Strategy: client-side guard after `signInWithPopup` (decision already made)
> Artifact store: hybrid (engram + openspec)

## 1. Change summary

**What.** Restrict access to the deployed ARGBOT app to a fixed list of authorized Google accounts. Any Google user outside that list who completes the Google sign-in popup is immediately signed out and shown a rejection message. The authorized list lives in the `VITE_WHITELIST_EMAILS` environment variable (comma-separated), managed through the Render dashboard.

**Why.** Fabio's employment contract with redacted (clause 3.1 — exclusivity) requires a written authorization from HR before he can maintain ARGBOT publicly. The authorization letter will state that the deployed app **does not admit open registration**. This proposal exists so that statement is factually true in the deployed artifact. The enforcement must be real, not cosmetic — that is the single most load-bearing constraint of this change.

**For whom.** Fabio (owner) and a short list of trusted Gmail aliases he controls (for example `fabio.family.ar1@gmail.com`). The whitelist is intentionally tiny; this is not a multi-tenant product.

## 2. User-visible behavior

### 2.1 Login screen banner

A visible banner appears above the "Continuar con Google" button.

**Copy (Spanish, final):**

> **Acceso restringido**
> Esta aplicación es de uso privado y solo admite cuentas de Google previamente autorizadas. Si tu cuenta no está en la lista, la sesión se cerrará automáticamente.

**Rationale for copy.** Three goals: (a) make the restriction explicit before the user clicks (reduces confusion), (b) use the literal phrase "acceso restringido" so the automated test can assert on it with a regex, (c) set expectations that rejection will happen automatically, not silently — this matches the flow and removes any "why did it log me out?" mystery.

**Placement.** Directly above the Google button in `Login.tsx`, inside the centered hero block (before line 26 in the current file). Colors: background `#7f1d1d` (dark red), text `#fef2f2`, consistent with the dark palette documented in the explore. Inline styles, no new CSS system.

### 2.2 Login flow — whitelisted email (happy path)

1. User lands on `/`, sees the Login screen with the restriction banner.
2. User clicks **Continuar con Google**.
3. Google popup opens; user picks a whitelisted account (for example `fabio.family.ar1@gmail.com`).
4. Popup closes; `signInWithPopup` resolves.
5. `loginWithGoogle()` calls `checkWhitelist(user.email)` → returns `true`.
6. Promise resolves normally; `onAuthStateChanged` fires with the user; `App.tsx` swaps `<Login>` for `<Dashboard>`.
7. The Dashboard renders with the persistent restriction banner at the top (section 2.4).

### 2.3 Login flow — non-whitelisted email (rejection path)

1. Same steps 1–3 as above; user picks an unauthorized Google account.
2. Popup closes; `signInWithPopup` resolves with that user.
3. `loginWithGoogle()` calls `checkWhitelist(user.email)` → returns `false`.
4. **Immediately**, before the function returns to the caller and before `onAuthStateChanged` can transition `App.tsx` into the Dashboard path: `signOut(auth)` is awaited, and `loginWithGoogle()` throws a typed error (for example `new Error('ACCESS_DENIED')`).
5. `App.tsx`'s `handleLogin` catches the error, detects the `ACCESS_DENIED` marker, and sets a new piece of state `rejected: true`.
6. `onAuthStateChanged` fires a second time with `null` (because `signOut` already ran), keeping `user` null. The Login screen stays mounted the whole time.
7. The Login screen shows a rejection message below the Google button.

**Rejection message copy (Spanish, final):**

> **Cuenta no autorizada.** Esta aplicación es privada.

**Flash risk — addressed.** Between steps 2 and 4, `<Dashboard>` must NOT render. Two reinforcing mechanisms guarantee this:
- The whitelist check runs **inside** `loginWithGoogle()` and awaits `signOut` **before** returning. Because React state updates from `onAuthStateChanged` are batched asynchronously, `setUser(rejectedUser)` and `setUser(null)` collapse without ever painting the Dashboard, provided `signOut` is awaited in the same microtask chain as the popup resolution.
- Additionally, App.tsx will render `<Login>` whenever `user` is null OR `rejected` is true, so even if a render slipped through in a future refactor, it would render Login, not Dashboard.

### 2.4 Dashboard banner (for the paranoia budget)

Once logged in, a thin persistent banner sits at the very top of the Dashboard:

> Acceso restringido — solo usuarios autorizados.

Same dark-red palette as the Login banner. This is part of the "the deployed app visibly enforces a whitelist" claim in the HR letter: anyone opening a screenshot can see the restriction is advertised.

### 2.5 What the user sees between click and outcome

- During the Google popup: the popup itself covers the screen; no app changes.
- After the popup closes, whitelisted path: brief Login screen (< 100 ms) then Dashboard. No spinner needed.
- After the popup closes, rejection path: the Login screen remains visible; the rejection message appears. No spinner, no Dashboard flash, no blank screen.

## 3. Technical design summary (high level)

> Full architecture + sequence diagram go to `/sdd-design`. This section is intentionally terse.

### 3.1 `checkWhitelist(email: string): boolean` — new pure function in `src/authService.ts`

Contract:
- Parses `import.meta.env.VITE_WHITELIST_EMAILS` once at module load.
- Splits on commas, trims each entry, lowercases both sides of the comparison.
- Returns `true` only if `email.trim().toLowerCase()` is present in the parsed list.
- Returns `false` when: list is empty, env var missing, email is null/undefined/empty, email not present.
- No throw, no side effects — fully pure for testing.

### 3.2 `loginWithGoogle()` modification

- After `signInWithPopup` resolves, call `checkWhitelist(result.user.email)`.
- If false: `await signOut(auth)` and `throw new Error('ACCESS_DENIED')`.
- If true: return `result.user` as today.

### 3.3 `App.tsx` — add rejection state

- New state: `const [rejected, setRejected] = useState(false)`.
- `handleLogin` catches errors; if `error.message === 'ACCESS_DENIED'`, calls `setRejected(true)`.
- Any successful future login attempt clears `rejected` (re-click of the button resets the message before opening the popup).
- Render gate remains: signed-in whitelisted user → Dashboard; otherwise Login (passing `rejected` down as a prop).

### 3.4 Banner component — inline, NOT shared

Rationale: the project has zero shared design-system components. Adding an `<AccessRestrictedBanner>` would introduce a new pattern for a two-usage case. Both banners are small inline JSX blocks (one in `Login.tsx`, one in `Dashboard.tsx`). If/when a third banner appears, extract then — YAGNI today.

### 3.5 Env var parsing — where and how

- Parsing happens in `authService.ts` at module load (not per-call), cached in a module-level constant.
- Case-insensitive comparison. No regex — plain `.toLowerCase().trim()` on both sides.
- Empty/missing var → the list is `[]` → every login is rejected. This is the intentional fail-closed default.
- `VITE_WHITELIST_EMAILS` must be set in the Render dashboard's env vars for the static site. A code-level `.env.example` will document the expected shape (`VITE_WHITELIST_EMAILS=alias1@gmail.com,alias2@gmail.com`).

## 4. Rollback plan

### 4.1 Legitimate user is locked out

1. Open Render dashboard → service → Environment → edit `VITE_WHITELIST_EMAILS` → add the email.
2. Save → Render re-deploys the static site (build time ~1 min).
3. The user retries; whitelist now allows them in.
4. No code change, no git push, no PR.

### 4.2 Remove an email

Same flow: edit the env var, save, redeploy.

### 4.3 Full feature rollback

Revert the commit that introduced `checkWhitelist` and the `rejected` state. Because the change is isolated to `authService.ts`, `App.tsx`, `Login.tsx`, `Dashboard.tsx`, and a new test file, a `git revert` is clean.

### 4.4 Env var is empty, missing, or malformed

- **Empty or missing**: every login is rejected (fail-closed). Expected behavior, documented.
- **Malformed** (for example trailing comma, stray whitespace, mixed case): parsing trims + lowercases + filters empties, so `a@x.com, ,B@X.COM,` is normalized to `['a@x.com', 'b@x.com']`. No throw.
- **Contains non-email garbage** (for example `not-an-email`): it's still a string in the array; it simply never matches any real email, so nothing breaks. We do NOT validate the format of whitelist entries — the admin (Fabio) owns the env var and can read.

## 5. Affected modules / files

From the explore:

| File | Change |
|------|--------|
| `src/authService.ts` | Add `checkWhitelist()`; extend `loginWithGoogle()` with whitelist check + signOut |
| `src/App.tsx` | Add `rejected` state; catch `ACCESS_DENIED`; pass `rejected` to Login |
| `src/components/Login.tsx` | Add restriction banner + rejection message (new `rejected` prop) |
| `src/Dashboard.tsx` | Add persistent restriction banner at top |
| `src/tests/AccessWhitelist.test.jsx` | NEW — TDD scenarios |
| `.env.example` | NEW or updated — document `VITE_WHITELIST_EMAILS` |

No other file is touched. No new dependency.

## 6. Test strategy (high level)

**Strict TDD is active.** Red-first tests MUST be written and must FAIL before any implementation lands. Test runner: `npm run test:unit`.

**Scope of tests (high-level — concrete assertions go to `/sdd-spec`):**

1. `checkWhitelist()` unit tests — pure function, no mocks needed:
   - whitelisted email returns true
   - non-whitelisted email returns false
   - empty env var → always false
   - missing env var → always false
   - case-insensitive match
   - whitespace tolerance
2. `loginWithGoogle()` integration tests — mock `firebase/auth`:
   - whitelisted: `signInWithPopup` called, `signOut` NOT called, returns user
   - non-whitelisted: `signInWithPopup` called, `signOut` called, throws `ACCESS_DENIED`
3. UI tests (React Testing Library):
   - Login screen shows the banner (`/acceso restringido/i`)
   - Login screen shows the rejection message after a denied attempt
   - Dashboard shows the persistent banner

**Mocking pattern.** Use `vi.mock('firebase/auth')` matching the existing pattern in `App.test.jsx` (referenced in the explore). Mock `signInWithPopup` and `signOut` per test. Mock `import.meta.env.VITE_WHITELIST_EMAILS` via `vi.stubEnv`.

**Location.** `src/tests/AccessWhitelist.test.jsx`. Vitest picks it up via the existing include pattern. Tests from `src/tests/jest/`, `playwright/`, `cucumber/` subdirs are NOT touched.

## 7. Open questions for the user

The exploration resolved every technical decision. The only item I want Fabio to confirm before we proceed:

- **Banner + rejection message copy.** The copy in sections 2.1, 2.3, and 2.4 is proposed literal text. If he wants different wording, adjust here before `/sdd-spec` writes the assertion regexes.

No other open questions. Everything else has a decision or a documented default.

## 8. Non-goals

Explicitly NOT in scope for this change:

- Firebase Cloud Functions (`beforeCreate` trigger) — rejected: no Blaze plan.
- Firestore rules or Firestore at all — rejected: never used in this project.
- Server-side email validation — no backend exists.
- Multi-user role system (admin / user / guest) — single trust level only.
- Admin UI for managing the whitelist — Render dashboard is the UI.
- Rate-limiting on login attempts — no backend, no state to persist.
- Preventing Firebase Auth user entry creation for rejected users — accepted as cosmetic; decided by user.
- Hiding `VITE_WHITELIST_EMAILS` from the client bundle — impossible with client-only React; mitigated by using aliases the user controls, not personal family emails.
- Changing `firebaseConfig.ts` hardcoded values — accepted risk, separate concern.

---

**Dependencies after approval:** `/sdd-spec` and `/sdd-design` can run in parallel. `/sdd-tasks` depends on both.
