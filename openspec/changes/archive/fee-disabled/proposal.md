# Proposal — fee-disabled

## Summary

Disable the service-fee feature in the Settings UI pending written authorization from redacted (contractual requirement). Preserve ALL fee logic and state so re-enabling is a single-line flip once authorization is obtained.

## Motivation

The app is in active use on Render; the fee tab allowed the user to configure and charge a service fee per-transfer. Clause 3.1 of the redacted contract prohibits any revenue-generating activity without written authorization. The authorization letter is drafted but not yet sent. Until it's sent, reviewed, and approved, the fee feature MUST not be visible nor reachable.

**This is NOT a rollback**: the feature is complete and working. We are gating it behind a compile-time flag so the audit trail is clean ("fee was disabled at time X") and flipping it back on is a one-line change.

## User-visible behavior

**Before**: `⚙️ Settings` → 4 tabs (Sync, Binance, Fee, Soporte). Fee tab is clickable, configures `service_fee` in localStorage, applied on every Withdraw.

**After**: `⚙️ Settings` → 3 tabs (Sync, Binance, Soporte). Fee button is NOT rendered. If code elsewhere tries to deep-link to `initialTab="fee"`, it's coerced to `"sync"`. Default `service_fee` in localStorage is `"0"` instead of `"0.50"`. Fee panel content is not rendered even if `activeTab === "fee"` somehow.

## Technical design

Single module-level constant `FEE_ENABLED = false` in `src/components/Settings.tsx`. Three guard sites:
1. `useState` initializer for `activeTab` — coerce `"fee"` to `"sync"` when disabled
2. Tab button render — skip the `💰 Fee` button when disabled
3. Tab panel render — skip the Fee panel content when disabled

The ENTIRE fee UI and localStorage read/write logic are preserved intentionally. Re-enabling is `FEE_ENABLED = true`.

## Affected modules

- `src/components/Settings.tsx` — add `FEE_ENABLED` constant + 3 guards
- `src/tests/Settings.test.jsx` — already committed (in `fix-test-failures`) and covers the gating behavior (3 active tests + 3 skipped fee-on tests for when it flips back)

## Rollback plan

Revert this commit OR set `FEE_ENABLED = true`. Tests that verify the gated behavior would fail when flipped; un-skip the 3 `.skip` tests to restore full fee-tab coverage.

## Non-goals

- Removing fee logic (would lose ~150 lines that we'll need again)
- Server-side enforcement (there is no server fee logic yet)
- Config via env var (would require Vite rebuild + redeploy to flip — harder to audit than a source diff)

## Open questions

None — implementation already complete in working copy, just needs SDD wrap + commit.
