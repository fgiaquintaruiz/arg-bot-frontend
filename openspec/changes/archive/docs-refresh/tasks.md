# Tasks — docs-refresh

## Phase 1 — README.md

- [ ] 1.1 Bump `Version:` line to current `package.json` version
- [ ] 1.2 Add `VITE_WHITELIST_EMAILS` row to Env Vars table (Required: Yes, fail-closed)
- [ ] 1.3 Replace fee bullet in Key Features with `Access Whitelist` bullet
- [ ] 1.4 Adjust Settings description in `What It Does` (remove fees reference)

## Phase 2 — CHANGELOG.md

- [ ] 2.1 Prepend `[1.8.175] - 2026-04-19` entry for fee-disabled
- [ ] 2.2 Prepend `[1.8.174] - 2026-04-19` entry for History/AddressBook fixes
- [ ] 2.3 Prepend `[1.8.173] - 2026-04-19` entry for access-whitelist

## Phase 3 — Other docs

- [ ] 3.1 Bump `ARCHITECTURE.md` Last updated to April 19, 2026
- [ ] 3.2 Add `VITE_WHITELIST_EMAILS` to `DEPLOYMENT.md` env vars section
- [ ] 3.3 Add whitelist gate paragraph to `COMPONENTS.md` Authentication State section
- [ ] 3.4 Add historical-snapshot banner to top of `PROJECT_SUMMARY.md`

## Phase 4 — Verify & Commit

- [ ] 4.1 Run `npm run lint` (should still pass — no code changes)
- [ ] 4.2 Visually inspect each doc for consistency
- [ ] 4.3 Archive artifacts to `openspec/changes/archive/docs-refresh/`
- [ ] 4.4 Commit with `docs: refresca README/CHANGELOG/DEPLOYMENT/COMPONENTS con whitelist, fee-disabled y conteo de tests actual`
