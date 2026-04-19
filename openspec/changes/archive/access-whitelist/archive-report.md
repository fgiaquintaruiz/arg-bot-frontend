# Archive Report — access-whitelist

**Status**: ✅ SHIPPED
**Commit**: `b11f058` — `feat: whitelist de emails autorizados con banners de acceso restringido`
**Archived**: 2026-04-19

## Summary

Implemented client-side email allow-list to restrict ARGBOT access to authorized Google accounts. Flash-prevention achieved via two-layer defense: awaited `signOut` before throw + render gate `(user && !rejected)`.

## Artifacts

| Phase | File | Topic Key (engram) |
|-------|------|--------------------|
| Explore | `explore.md` | `sdd/access-whitelist/explore` |
| Proposal | `proposal.md` | `sdd/access-whitelist/proposal` |
| Spec | `spec.md` | `sdd/access-whitelist/spec` |
| Design | `design.md` | `sdd/access-whitelist/design` |
| Tasks | `tasks.md` | `sdd/access-whitelist/tasks` |
| Apply progress | — | `sdd/access-whitelist/apply-progress` |
| Verify report | — | `sdd/access-whitelist/verify-report` |
| Archive report | `archive-report.md` | `sdd/access-whitelist/archive-report` |

## Results

- **31/31 spec scenarios green** (`src/tests/AccessWhitelist.test.jsx`)
- **0 CRITICAL findings** in verify
- **1 WARNING** — AW-014 test uses setTimeout in mock (methodology note, not blocker)

## Files Changed (in commit `b11f058`)

- `src/authService.ts` — `WHITELIST` Set + `checkWhitelist()` + `loginWithGoogle` extended with signOut-before-throw
- `src/App.tsx` — `rejected` state + `handleLogin` + render gate `(user && !rejected)`
- `src/components/Login.tsx` — persistent access banner + conditional rejection message
- `src/Dashboard.tsx` — persistent header banner
- `src/tests/AccessWhitelist.test.jsx` — 31 tests across 6 layers
- `.env.example` — `VITE_WHITELIST_EMAILS` block added

## Pending (post-archive, separate workstreams)

- User must fill `VITE_WHITELIST_EMAILS` in local `.env` with actual Gmail aliases
- `fix-test-failures` change — drift in Calculator/History/Withdraw tests
- `fee-disabled` change — `Settings.tsx` `FEE_ENABLED=false` flag (redacted clause 3.1)
- `docs-refresh` and `ui-professional-refresh` changes in roadmap
- SDD infra (`openspec/`, `.atl/`) — separate `chore:` commit

## Lessons Learned

- **Vitest queue pollution**: `mockImplementationOnce` queues across tests share the same vi.fn() instance when vi.mock factories don't re-run on resetModules. Use `mockReset()` at the start of a test that needs clean state.
- **ESM in tests**: `require()` fails in Vitest — always use `await import()`.
- **Vite env rule**: client code uses `import.meta.env.VITE_*`, NEVER `process.env.*`.
- **Flash prevention requires explicit await**: `await signOut(auth)` BEFORE `throw` is non-negotiable; fire-and-forget would flash Dashboard before onAuthStateChanged fires with null.
- **Happy path must NOT call signOut** (obvious in hindsight — would log every user out immediately).
