# Exploration: access-whitelist
Date: 2026-04-19

---

## 1. Current Firebase Auth Setup

### Providers
- **Google only** (`GoogleAuthProvider` + `signInWithPopup`). No email/password, no other providers.
- Source: `src/authService.ts` — the only provider instantiated is `GoogleAuthProvider`.

### Firebase Config Location
- Hardcoded in `src/firebaseConfig.ts` (NOT in env vars). All config values including `apiKey` are committed in plain text.
- No `.env` or `.env.*` files exist in the project.
- Firebase SDK: **v12.9.0** (latest as of exploration).

### Cloud Functions
- **No `functions/` directory exists.**
- `firebase-functions` is NOT in `package.json`.
- No `firebase.json` config file in project root.
- **Cloud Functions option requires Blaze plan AND project setup from scratch.**

### Auth State Management
- Managed directly in `src/App.tsx` via `onAuthStateChanged` observer (lines 13–18).
- State held in a local `useState<any>` (`user`). No Context, no custom hook, no global store.
- Pattern: single-file observer, dead simple.

### Deployment
- **Render.com** (Static Site) — NOT Firebase Hosting. Confirmed in `DEPLOYMENT.md`.
- URL: `https://arg-bot-frontend.onrender.com`
- Env vars set in Render dashboard: `VITE_API_URL`, `VITE_ENCRYPTION_KEY`.

---

## 2. Current Signup/Login Flow

### Entry Points
- `src/App.tsx:36` — routing: `user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} />`
- `src/components/Login.tsx:27` — Google button calls `onLogin` prop (passed down from App)
- `src/authService.ts:6–13` — `loginWithGoogle()` calls `signInWithPopup(auth, provider)`

### New vs. Existing Users
- **No distinction made.** `onAuthStateChanged` fires for both; `result.user.metadata` (creationTime vs lastSignInTime) is IGNORED. Any Google account that can sign in gets in.

### Routing Logic
- `src/App.tsx` does the gate: if `user` (truthy Firebase User object) → Dashboard; else → Login.
- No intermediate "access denied" state exists.

---

## 3. UI Touch-Points for Banner

### Login Screen
- `src/components/Login.tsx` — pure inline styles, no CSS modules, no Tailwind.
- Color palette: dark (`#0f172a` bg, `#1e293b`, `#334155`, `#94a3b8`, `#64748b`), accent `#60a5fa` (blue).
- Existing pattern: white Google button with box-shadow, centered layout.
- **Banner insertion point**: between the branding header and the Google button, OR as a fixed top bar.

### Dashboard
- `src/Dashboard.tsx` — same inline-styles-only approach.
- Background: `#17212b` cards on darker page bg.
- Top of main view shows user greeting (`Hola, {firstName}`).
- **Banner insertion point**: top of the outer wrapper, before/above the card grid, or as a fixed sticky bar.

### Design System
- **None.** No Tailwind, no styled-components, no CSS modules, no shared component library.
- All styles are inline objects. Convention: Slate palette (Tailwind-inspired values, hand-typed).
- Shared components: `LandingDocs`, `Updates`, `LegalModal` — all self-contained with inline styles.
- For a warning/alert banner: use inline `div` with `backgroundColor: '#7f1d1d'` (dark red) or `'#78350f'` (amber) + `color: '#fef2f2'` matching existing dark palette.

---

## 4. Whitelist Implementation Strategies

### Option A — Firebase Cloud Function `beforeCreate`/`beforeSignIn` blocking trigger
- **How**: Registers a function that Firebase calls server-side before user creation or sign-in. Rejects non-whitelisted accounts with an error before auth token is issued.
- **Security strength**: MAXIMUM. The rejection happens server-side; no Firebase user doc is ever created. Client never receives a valid token.
- **Cost**: Requires **Blaze (pay-as-you-go) plan**. Spark (free) does NOT support blocking functions. First invocations are free but plan upgrade is mandatory.
- **Complexity**: HIGH. Requires setting up Firebase CLI, deploying functions, project upgrade, TypeScript/Node environment for functions, re-configuring from scratch (`firebase init functions`).
- **Offline behavior**: Fail-closed — if Functions are down, no one can sign in (good for security, bad for availability).
- **Reversibility**: Change whitelist array in function code + redeploy (~2 min). Or store whitelist in Firestore and read from function (no redeploy needed).
- **Render compatibility**: Functions deploy to Firebase infra, not Render — orthogonal, fully compatible.
- **Verdict for this project**: Out of scope. No `functions/` dir, no Blaze plan, 30-min target. Would take hours of setup.

### Option B — Firestore security rules + client-side guard
- **How**: After `signInWithPopup` succeeds, client reads a `whitelist/{email}` doc from Firestore. If not found, calls `signOut()`. Security rules on all other Firestore collections require `get(/databases/$(database)/documents/whitelist/$(request.auth.token.email)).data.allowed == true`.
- **Security strength**: MEDIUM-HIGH. The Google auth token IS issued (user exists in Firebase Auth), but all Firestore data is inaccessible without whitelist. Client still briefly holds a valid JWT.
- **Cost**: Firestore is free tier (Spark), but this project has no Firestore at all — requires enabling Firestore, setting up rules, creating whitelist collection.
- **Complexity**: MEDIUM. No existing Firestore SDK usage in this project (only `firebase/auth` imported). Would need to add `getFirestore`, `getDoc`, `doc` imports + setup.
- **Offline behavior**: If Firestore is unreachable, the guard may fail open (user gets in) unless explicitly handled.
- **Reversibility**: Edit the Firestore `whitelist` collection doc — no code deploy needed. Very easy.
- **Render compatibility**: No issues.
- **Verdict**: Better than A for this project but still significant setup (Firestore has never been used). 30-min stretch target at risk.

### Option C — Client-side guard with env-var or hardcoded whitelist
- **How**: After `signInWithPopup` returns `result.user`, check `result.user.email` against a whitelist array (from `VITE_WHITELIST_EMAILS` env var, comma-separated, or hardcoded constant). If not listed, call `signOut()` immediately and set an error state to show the rejection UI.
- **Security strength**: LOW-MEDIUM. The Firebase auth token is issued before the check. A determined attacker with browser dev tools could bypass the `signOut()` call. BUT: the backend receives `userEmail` from the client anyway (see `Dashboard.tsx:58`) and does NOT verify the token server-side. So the "security" of the whole system is already client-trust-based. The whitelist IS honest enforcement at the application layer — which is what the contract letter requires.
- **Cost**: Zero. Pure client-side, no new Firebase services, no plan upgrade.
- **Complexity**: LOW. Touch `src/authService.ts` (or `App.tsx`) + `src/components/Login.tsx` + `src/Dashboard.tsx`. Estimated: 20-30 min.
- **Offline behavior**: If the check can't run (impossible — it's synchronous in-memory), it defaults to checking the array. No network dependency.
- **Reversibility**: Update `VITE_WHITELIST_EMAILS` env var in Render dashboard → redeploy (auto). Or update hardcoded array + push commit.
- **Render compatibility**: Full. No new infra.
- **`VITE_ENCRYPTION_KEY` context**: This project already accepts that client-bundle secrets are visible to trusted users (see DEPLOYMENT.md: "acceptable for trusted users"). A whitelist of personal/family emails in the bundle is identical in threat model. This is NOT security theater for the stated purpose — the app is technically restricted; it just doesn't use the strongest cryptographic enforcement. The contract letter can honestly say: "access is restricted to a whitelist of emails enforced at authentication time."
- **Verdict**: CORRECT choice for this project's constraints, timeline, and existing security posture.

### Recommendation: Option C
The system already operates on client-trust (email sent unverified to backend). Option C is consistent, honest, fast to implement, reversible, and zero-cost. Options A and B are disproportionate to the risk model and would each require 2–8 hours of new infra setup.

**Whitelist storage**: Prefer `VITE_WHITELIST_EMAILS` env var (comma-separated) over hardcoded — easier to add family members without code changes. Render env var update + auto-redeploy.

---

## 5. Constraints Summary

| Constraint | Status |
|---|---|
| ~30 min target | Option C only viable path |
| Reversible | Yes — env var update |
| No Cloud Functions | Confirmed — no setup exists |
| Firebase Spark (free) | Confirmed — no Blaze upgrade possible without billing |
| Render deployment | Static site, Render env vars available |
| `VITE_ENCRYPTION_KEY` bundle visibility | Accepted by project; whitelist in env is same threat model |
| Honest enforcement | Yes — Google sign-in is blocked at app layer; user cannot access Dashboard |

---

## 6. TDD — Tests to Write (RED-FIRST)

### How Firebase Auth is mocked in existing tests
- `src/App.test.jsx`: `vi.mock('./authService', ...)` — mocks the entire module.
- `src/tests/Login.test.jsx`: mocks child components, tests `onLogin` prop callback.
- `src/test/setup.js`: mocks `localStorage` and `fetch`. Does NOT mock Firebase directly.
- Pattern: Firebase is never imported in tests — the `authService` module is fully mocked at the boundary.

### New test file: `src/tests/AccessWhitelist.test.jsx`

#### Scenario 1 — Whitelisted user is allowed through
```
GIVEN: VITE_WHITELIST_EMAILS = "fabio@gmail.com,family@gmail.com"
WHEN: signInWithPopup resolves with user { email: "fabio@gmail.com" }
THEN: signOut is NOT called
AND: onLogin callback IS called (user proceeds to Dashboard)
```
Test name: `"should allow whitelisted email through"`

#### Scenario 2 — Non-whitelisted user is rejected
```
GIVEN: VITE_WHITELIST_EMAILS = "fabio@gmail.com"
WHEN: signInWithPopup resolves with user { email: "stranger@gmail.com" }
THEN: signOut IS called
AND: onLogin callback is NOT called
AND: returned error/state indicates "access denied"
```
Test name: `"should reject email not in whitelist"`

#### Scenario 3 — Empty whitelist blocks everyone
```
GIVEN: VITE_WHITELIST_EMAILS = "" (empty)
WHEN: signInWithPopup resolves with ANY user
THEN: signOut IS called
```
Test name: `"should block all users when whitelist is empty"`

#### Scenario 4 — Case-insensitive email comparison
```
GIVEN: whitelist = ["Fabio@Gmail.com"]
WHEN: Google returns email "fabio@gmail.com" (lowercase)
THEN: user IS allowed (no signOut called)
```
Test name: `"should be case-insensitive for email comparison"`

#### Scenario 5 — Login banner is rendered in Login component
```
GIVEN: Login component renders
THEN: a banner/element with text matching /acceso restringido|solo usuarios autorizados/i is in the document
```
Test name: `"should display access restriction banner on login screen"`

#### Scenario 6 — Dashboard banner is rendered
```
GIVEN: Dashboard renders with a valid user
THEN: a banner/element with text matching /acceso restringido|solo usuarios autorizados/i is in the document
```
Test name: `"should display access restriction banner on dashboard"`

#### Scenario 7 — Rejection error is shown in UI
```
GIVEN: signInWithPopup resolves with non-whitelisted user
WHEN: the rejection state is set
THEN: Login renders an error message visible to the user
```
Test name: `"should show rejection message after denied login attempt"`

### Where to put whitelist logic
- Extract into `src/authService.ts` as `loginWithGoogleRestricted()` — keeps the guard co-located with auth.
- Or add a `checkWhitelist(email: string): boolean` pure function — easiest to unit test in isolation.
- Tests mock `signInWithPopup` via `vi.mock('firebase/auth')`.

---

## Key Gotchas

1. **Firebase config is hardcoded**, not in env vars. The `apiKey` is committed. This is a known accepted risk for this project.
2. **No Firestore in the project** — do not suggest Option B without flagging that `getFirestore` has never been imported and the SDK subset used is auth-only.
3. **`signInWithPopup` creates the Firebase Auth user** before client-side checks run. Option C does NOT prevent user creation in Firebase Auth — it only prevents access to the app. This is acceptable since the project has no server-side token validation.
4. **`VITE_*` vars are baked into the static bundle at build time** — changing them requires a Render redeploy (usually auto-triggered by git push OR manually via Render dashboard env var update + manual redeploy).
5. **No existing test for `authService.ts`** — the test file `App.test.jsx` mocks the whole module. The whitelist guard must be testable without importing real Firebase.
6. **Vitest include pattern** (`**/tests/**/*.test.{js,jsx,ts,tsx}`) — new test file must go in `src/tests/`, not `src/`.
