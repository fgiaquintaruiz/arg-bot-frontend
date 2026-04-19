# Proposal — docs-refresh

## Summary

Refresh the six root-level Markdown docs (`README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `DEPLOYMENT.md`, `PROJECT_SUMMARY.md`) so they accurately reflect the current shipped state of the app as of `418671d` (fee-disabled). The docs currently describe behavior that no longer exists (configurable fee) and omit behavior that does (email access whitelist).

## Motivation

Between `1.8.167` (last time docs were coherently updated) and `1.8.175` (current), three substantive changes shipped but weren't reflected in docs:

1. **access-whitelist** (`b11f058`, 2026-04-19) — client-side email allow-list + `VITE_WHITELIST_EMAILS` env var
2. **fix-test-failures** (`1dcb309`, 2026-04-19) — test drift fixes, History/AddressBook copy
3. **fee-disabled** (`418671d`, 2026-04-19) — fee feature gated behind `FEE_ENABLED=false`

Concrete drift:

- **README.md** — `Service Fees — Configurable fee (€0.10–€1.00) per transaction with email whitelist for exemptions` is no longer true (fee tab hidden, whitelist is for ACCESS not exemptions). Missing `VITE_WHITELIST_EMAILS` env var.
- **CHANGELOG.md** — last entry is `1.8.170` (2026-04-12). Three new versions unaccounted for.
- **PROJECT_SUMMARY.md** — claims `115/115 tests passing`; actual is `109 passed + 3 skipped`. Describes AddressBook as ✨ NEW (shipped months ago). Acts as a historical snapshot but isn't labeled as such.
- **ARCHITECTURE.md** — `Last updated: April 11, 2026` — stale date, otherwise roadmap is still valid.
- **DEPLOYMENT.md** — missing `VITE_WHITELIST_EMAILS` env var.
- **COMPONENTS.md** — Authentication section doesn't mention the whitelist gate or `rejected` state.

## User-visible behavior

Docs are internal/GitHub-facing; no runtime behavior change. Consumers of the docs (new contributors, self) will see accurate env vars, accurate test count, accurate feature list, and a coherent recent-changes timeline.

## Technical design

Targeted edits — no rewrites. Each doc gets a diff that brings it to current reality:

### README.md
- Bump `**Version:** 1.8.170` → current version
- Env vars table: add `VITE_WHITELIST_EMAILS` (required, fail-closed)
- Replace `Service Fees — Configurable fee (€0.10–€1.00) per transaction with email whitelist for exemptions` with `Access Whitelist — Google Sign-In restricted to authorized Gmail accounts; fail-closed on empty/missing env var`
- Remove "fees" from the Settings feature line (just `⚙️ Settings — Google Drive sync, Binance config, support`)
- Update tech stack row: add `Access Control: Email whitelist (client-side)` if helpful

### CHANGELOG.md
Prepend three new entries (in reverse-chronological order as existing docs):

- `[1.8.175] - 2026-04-19` — Gating fee feature (FEE_ENABLED=false, redacted clause 3.1)
- `[1.8.174] - 2026-04-19` — localStorage resilience in History + Spanish copy in AddressBook
- `[1.8.173] - 2026-04-19` — Email access whitelist (VITE_WHITELIST_EMAILS, fail-closed, flash-prevention)

### ARCHITECTURE.md
- Bump `**Last updated:** April 11, 2026` → `**Last updated:** April 19, 2026`
- Week 1-2 checklist: check off `[x] Add rate fallback mechanism` if still applicable (leave as-is if not done)

### COMPONENTS.md
- In Authentication State section, add a note about the whitelist gate:
  > After `signInWithPopup` returns, `checkWhitelist(user.email)` runs. Non-whitelisted users are signed out via awaited `signOut` + `rejected` state flag. Dashboard renders only when `user && !rejected`.

### DEPLOYMENT.md
- Add `VITE_WHITELIST_EMAILS` to the env vars section with example and fail-closed note

### PROJECT_SUMMARY.md
- Add a banner at the top: `> **Historical snapshot — 2026-03-XX.** This file captures a specific deployment milestone; for current state see README.md and CHANGELOG.md.`
- Do NOT update test counts or feature lists — that's what README/CHANGELOG are for. Keep as a historical artifact.

## Affected modules

- `README.md`
- `CHANGELOG.md`
- `ARCHITECTURE.md`
- `COMPONENTS.md`
- `DEPLOYMENT.md`
- `PROJECT_SUMMARY.md`

## Rollback plan

`git revert` the commit. No runtime impact.

## Non-goals

- Rewriting any doc from scratch
- Changing code (no `.ts`/`.tsx` edits)
- Documenting future roadmap items (ui-professional-refresh is separate)
- Adding new docs (no CONTRIBUTING.md, no SECURITY.md) — scope-creep

## Open questions

- `SESSION_LOG.md` is untracked — leave alone (already gitignored in `0f26a8e`).
- `PROJECT_SUMMARY.md` historical banner date: use `2026-03-19` (matches its "repo split" context in the last CHANGELOG entry it aligns with).
