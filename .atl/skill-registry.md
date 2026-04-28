# Skill Registry — arg-bot-frontend

**Project**: arg-bot-frontend
**Generated**: 2026-04-24
**Persistence**: engram

## User Skills (triggers)

| Skill | Location | Trigger |
|-------|----------|---------|
| ultimate-coder | ~/.claude/skills/ultimate-coder | Code quality, refactoring, TDD, BDD, DDD, SDD, design patterns, simplicity, technical debt across any file |
| security-coder | ~/.claude/skills/security-coder | User input, auth, API keys, secrets, DB queries, file uploads, external data — any security boundary |
| debugging-methodology | ~/.claude/skills/debugging-methodology | Bug investigation, unexpected behavior, root cause analysis, performance profiling |
| observability-coder | ~/.claude/skills/observability-coder | New endpoints, external API calls, logging, metrics, tracing, health checks |
| adr-writer | ~/.claude/skills/adr-writer | Irreversible decisions, technology choices, architectural patterns, team conventions |
| qa-coder | ~/.claude/skills/qa-coder | Definition of done, acceptance criteria, test strategy, bug severity, QA gates, regression, "can we ship?" |
| front-end-ultimate-coder | ~/.claude/skills/front-end-ultimate-coder | Editing .tsx, .jsx, React components, hooks, UI patterns, any src/components/** file |
| codebase-map | ~/.claude/skills/codebase-map | After exploring files, before delegating sub-agents with code references |
| branch-pr | ~/.claude/skills/branch-pr | Creating a PR, opening pull request, preparing changes for review |
| issue-creation | ~/.claude/skills/issue-creation | Creating GitHub issues, bug reports, feature requests |
| judgment-day | ~/.claude/skills/judgment-day | "judgment day", "juzgar", "doble review", parallel adversarial review |
| skill-creator | ~/.claude/skills/skill-creator | Creating new AI agent skills |
| skill-registry | ~/.claude/skills/skill-registry | "update skills", "skill registry", regenerating this file |
| prompt-master | ~/.claude/skills/prompt-master | Analyzing/optimizing user prompts — auto-triggered by UserPromptSubmit hook |
| ultimate-assertive-communicator | ~/.claude/skills/ultimate-assertive-communicator | comunicación, mensajes, parent skill de comunicación |
| ultimate-user-communicator | ~/.claude/skills/ultimate-user-communicator | updates a usuario/PO/cliente, scope negotiation, stakeholder-facing |
| ultimate-team-communicator | ~/.claude/skills/ultimate-team-communicator | standup, daily, team updates, formato inglés, sync de equipo |
| daily-standup | ~/.claude/skills/daily-standup | /daily-standup, generar standup del día, daily report |

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

### Security Standards (all files touching input/auth/secrets — security-coder)
- Validate ALL inputs at system boundaries — type, range, format. Never trust client data.
- Parameterized queries only — never string-interpolate user input into SQL
- Output encoding context-aware — textContent for HTML, parameterized for SQL, execFile for shell
- No secrets in source code, logs, or error messages — environment variables always
- Authorization server-side on every sensitive operation — default deny
- Error messages must not expose stack traces, paths, or internal state to the client
- Rate limit all user-facing operations that touch external APIs or auth flows
- npm audit / dependency scan before every release — no HIGH/CRITICAL CVEs unaddressed

### Observability Standards (endpoints, external calls, async jobs — observability-coder)
- Every new endpoint must log: correlationId, userId, event name, durationMs, success/error
- External API calls (Binance, CriptoYa) must log request + masked response — never raw secrets
- Errors log at ERROR level with full context; warnings at WARN; normal events at INFO
- No PII or secrets in logs — mask emails (mask@domain.com), never log API keys or passwords
- Health endpoint updated if a new external dependency is added

### Debugging Standards (bug investigation — debugging-methodology)
- Reproduce the bug before touching any code — write a failing test or console proof first
- One hypothesis at a time — test, confirm or reject, then move to the next
- Add logging/observability before fixing production bugs you can't reproduce locally
- EXPLAIN ANALYZE before any SQL optimization — never guess the bottleneck
- Profiler before rewriting — measure where time is spent, don't assume

### QA Standards (all PRs and features — qa-coder)
- No PR merged without tests covering the new behavior — TDD evidence required
- Definition of Done checklist must pass before any feature is considered complete
- Every bug fix includes a failing test FIRST, then the fix
- Acceptance criteria written before implementation starts — in Given/When/Then format
- Coverage thresholds not regressed on any PR
- No `skip`, `xit`, `@Ignore` without a linked issue in the tracker

### Universal Engineering Standards (all files — ultimate-coder)
- Four Rules of Simple Design (Beck): passes tests → reveals intention → no duplication → fewest elements
- YAGNI: don't build what doesn't exist in current requirements
- KISS: the simple solution that works beats the clever solution that also works
- Boy Scout Rule: leave every file cleaner than you found it — one small improvement per touch
- Naming reveals intent — if you need a comment to explain the name, rename it
- Guard clauses over nested conditionals — flat > nested
- Cyclomatic complexity ≤ 10 per function — extract if exceeded
- Fail fast at boundaries: validate at entry points, trust internals
- TDD: red-green-refactor — never write production code without a failing test first
- DDD when domain is complex: ubiquitous language in code matches business language exactly

### Mentor patterns — front-end-ultimate-coder (src/components/**, src/*.tsx, src/*.jsx)
- Container/Presentational split: UI logic stays in presentational components; data fetching, state, effects → container layer or custom hook
- Custom hooks for reusable stateful logic — never duplicate useEffect logic across components
- No business logic inside JSX — extract to helpers or custom hooks
- useEffect dependencies must be complete — never suppress exhaustive-deps lint rule without explicit justification
- Avoid prop drilling past 2 levels — lift state to Dashboard or use React context
- Error states and loading states are always explicit — never silently swallow fetch errors; show UI feedback
- Prefer named exports over default exports for components (easier to refactor and find references)

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
