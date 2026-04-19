# Spec — docs-refresh

## Scope

Accuracy of root-level documentation against shipped code state as of commit `418671d` (2026-04-19).

## Requirements

- R-DR-1: `README.md` MUST list `VITE_WHITELIST_EMAILS` as a required env var with a fail-closed note.
- R-DR-2: `README.md` MUST NOT advertise `Configurable fee` or `email whitelist for exemptions` as a current feature; fee is gated off.
- R-DR-3: `README.md` MUST include an `Access Whitelist` feature bullet describing client-side Gmail restriction.
- R-DR-4: `CHANGELOG.md` MUST contain one entry per shipped commit since `1.8.170`: access-whitelist, fix-test-failures/copy, and fee-disabled.
- R-DR-5: `DEPLOYMENT.md` MUST list `VITE_WHITELIST_EMAILS` in its env vars section.
- R-DR-6: `COMPONENTS.md` Authentication section MUST mention the post-`signInWithPopup` whitelist check, `signOut` on rejection, and `rejected` render gate.
- R-DR-7: `ARCHITECTURE.md` `Last updated` date MUST be bumped to the day the docs-refresh commit lands.
- R-DR-8: `PROJECT_SUMMARY.md` MUST carry a banner flagging it as a historical snapshot to avoid misleading readers with stale test counts.

## Scenarios

### SPEC-DR-001 — README env vars reflects whitelist

**Given** `README.md` is opened
**When** a reader scans the Environment Variables table
**Then** `VITE_WHITELIST_EMAILS` is present with a `**Yes**` in the Required column and a description noting fail-closed behavior

### SPEC-DR-002 — README no longer advertises configurable fee

**Given** `README.md` Key Features section
**When** a reader scans for `Service Fees` or `Configurable fee`
**Then** those strings are absent
**And** an `Access Whitelist` bullet is present describing Gmail restriction

### SPEC-DR-003 — CHANGELOG covers the three new versions

**Given** `CHANGELOG.md`
**When** a reader reads the top of the file
**Then** there are entries for versions introducing access-whitelist, History/AddressBook fixes, and fee gating — all dated `2026-04-19`

### SPEC-DR-004 — DEPLOYMENT mentions whitelist env var

**Given** `DEPLOYMENT.md` env vars section
**When** a reader sets up a Render deployment
**Then** `VITE_WHITELIST_EMAILS` is listed alongside `VITE_API_URL` and `VITE_ENCRYPTION_KEY`

### SPEC-DR-005 — COMPONENTS documents whitelist gate

**Given** `COMPONENTS.md` Authentication State section
**When** a reader follows the login flow description
**Then** the doc mentions `checkWhitelist`, awaited `signOut`, and the `rejected` render gate

### SPEC-DR-006 — PROJECT_SUMMARY flagged as historical

**Given** `PROJECT_SUMMARY.md`
**When** a reader opens the file
**Then** the first content line is a blockquote banner flagging the file as a historical snapshot with a reference to README/CHANGELOG for current state

### SPEC-DR-007 — ARCHITECTURE date bumped

**Given** `ARCHITECTURE.md`
**When** a reader checks the `Last updated` line
**Then** the date is `April 19, 2026`

## Non-requirements

- NR-DR-1: Rewriting roadmap content in ARCHITECTURE.md
- NR-DR-2: Updating test counts in PROJECT_SUMMARY.md (preserve historical accuracy)
- NR-DR-3: Creating new doc files (CONTRIBUTING, SECURITY, etc.)
- NR-DR-4: Translating docs (English stays English, Spanish CHANGELOG entries stay Spanish)
