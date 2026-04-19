# Archive Report — docs-refresh

**Status**: ✅ SHIPPED
**Archived**: 2026-04-19

## Summary

Brought the 6 root-level docs up to date with the current shipped state (as of commit `418671d`). Major drift fixed: whitelist env var now documented everywhere, fee advertised as configurable was replaced with the Access Whitelist feature, CHANGELOG gained 3 entries (`1.8.173`, `1.8.174`, `1.8.175`), and `PROJECT_SUMMARY.md` is now labeled as a historical snapshot.

## Artifacts

| Phase | File |
|-------|------|
| Proposal | `proposal.md` |
| Spec | `spec.md` |
| Tasks | `tasks.md` |
| Archive report | `archive-report.md` |

## Results

- 6 docs touched: README.md, CHANGELOG.md, ARCHITECTURE.md, COMPONENTS.md, DEPLOYMENT.md, PROJECT_SUMMARY.md
- No code changes, no test impact
- Lint: pre-existing errors unchanged (vitest globals in test files — out of scope)

## Files Changed

- `README.md` — Version bump, `VITE_WHITELIST_EMAILS` row, Access Whitelist feature bullet, Settings description updated
- `CHANGELOG.md` — 3 new entries prepended (`1.8.173` whitelist, `1.8.174` History/AddressBook fixes, `1.8.175` fee-disabled)
- `ARCHITECTURE.md` — Last updated date bumped to April 19, 2026
- `COMPONENTS.md` — Whitelist gate paragraph added under Authentication State
- `DEPLOYMENT.md` — `VITE_WHITELIST_EMAILS` added to env vars and pre-deploy checklist
- `PROJECT_SUMMARY.md` — Historical snapshot banner added at top

## Rollback

`git revert` the commit. Zero runtime impact.

## Lessons Learned

- **Docs drift quietly**: the fee-disabled commit had no docs impact per-se, but together with access-whitelist and fix-test-failures it created a cumulative gap where README advertised a feature that was no longer reachable.
- **Historical snapshots beat deletion**: `PROJECT_SUMMARY.md` was tempting to delete, but flagging it as a dated snapshot preserves the audit trail of the repo-split milestone.
