# Skill Registry — arg-bot-frontend

**Project**: arg-bot-frontend
**Generated**: 2026-04-24
**Persistence**: engram

## User Skills (triggers)

| Skill | Location | Trigger |
|-------|----------|---------|
| branch-pr | ~/.claude/skills/branch-pr | Creating a PR, opening pull request, preparing changes for review |
| issue-creation | ~/.claude/skills/issue-creation | Creating GitHub issues, bug reports, feature requests |
| judgment-day | ~/.claude/skills/judgment-day | "judgment day", "juzgar", "doble review", parallel adversarial review |
| skill-creator | ~/.claude/skills/skill-creator | Creating new AI agent skills |
| skill-registry | ~/.claude/skills/skill-registry | "update skills", "skill registry", regenerating this file |

## Not applicable to this project

- **go-testing** — Go-only, project is React/JS. SKIP.

## Project Conventions

- **Global**: `~/.claude/CLAUDE.md` — personality, language rules, commit conventions, skill auto-load table, Engram protocol
- **Project-local**: none detected (no CLAUDE.md, agents.md, .cursorrules, GEMINI.md in project root)

## Compact Rules (auto-inject into sub-agent prompts)

### When writing React components or JSX/TSX (src/components/**, src/*.tsx)
- Stack: React 19.2 + Vite 7 + TypeScript loose mode (`strict: false`)
- ESLint: react-hooks + react-refresh; follow rules-of-hooks
- Unused vars allowed only if UPPER_CASE prefixed (`varsIgnorePattern: '^[A-Z_]'`)
- Components are functional, hooks-based
- Persistent state lives in localStorage (wallet addresses, Binance API keys encrypted via crypto-js)
- No backend server — calls go to user's Binance or `/api` proxy (port 10001) in dev
- Mixed .tsx/.jsx allowed — do NOT force TS on existing .jsx files
- Inline styles ONLY (no CSS modules, no Tailwind) — Binance dark theme: #181A20 bg, #1E2329 card, #F0B90B accent, #0ECB81 green, #F6465D red
- Typography: IBM Plex Sans + IBM Plex Mono (monospace values)
- Coverage exclusion: `src/components/Trade.tsx` is intentionally excluded from coverage (vite.config.js)
- E2E seam: `window.__E2E_USER__` set via Playwright `addInitScript` before app code runs
- Backend toggle: `getApiUrl()` from `src/config.ts` — never hardcode API URL
- `FEE_ENABLED = false` in Settings.tsx — do NOT enable without legal authorization

### When writing tests (src/tests/**)
- Runner: **Vitest 4** (NOT Jest — legacy `jest/` dir exists but is EXCLUDED from the runner)
- Import helpers from `vitest` (`describe`, `it`, `expect`, `vi`) and `@testing-library/react`
- Vitest picks up `src/tests/*.test.{js,jsx,ts,tsx}` at root only
- `src/tests/jest/` and `src/tests/playwright/` are excluded from vitest runs
- Global mocks in `src/test/setup.js`: localStorage + fetch — override locally if a test needs different behavior
- E2E: Playwright under `src/tests/playwright/*.spec.ts` — run with `npm run test:e2e`
- Coverage thresholds enforced: statements 98%, branches 95%, functions 97%, lines 99%
- BDD Cucumber features in `src/tests/cucumber/features/` (calculator, trade, withdraw)
- **Strict TDD Mode is ENABLED** — write tests before implementation for any new behavior

### When creating commits
- **NO "Co-Authored-By" or AI attribution** (global CLAUDE.md rule)
- Conventional commits only: `feat:`, `fix:`, `refactor:`, `chore:`, etc.
- Spanish commit messages are accepted (recent history is in Spanish)
- Never `--no-verify`, never skip hooks

### When creating a PR
- Trigger the `branch-pr` skill
- Respect issue-first enforcement — open/reference an issue before the PR

### When reviewing code adversarially
- Trigger `judgment-day` for dual parallel-judge review

### General workflow
- **Never run `npm run build` after changes** (global rule: "Never build after changes")
- Prefer `bat`, `rg`, `fd`, `sd`, `eza` over `cat`, `grep`, `find`, `sed`, `ls` when available
- Verify claims before stating them — "dejame verificar" default posture
