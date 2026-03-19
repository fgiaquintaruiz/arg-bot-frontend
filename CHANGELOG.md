## [1.8.149] - 2026-03-19
### Changed
- Flattened the `src/` directory structure by removing the redundant `client/` subfolder left over from the monorepo architecture.
- Updated entry point path in `index.html` to point directly to `/src/main.jsx`.
- 
## [1.8.148] - 2026-03-19
### Added
- **Repository Split:** This repository is now exclusively the Frontend client (`arg-bot-frontend`). All backend Node.js code has been removed. Future version bumps in this repository will only reflect UI, client logic, and frontend configuration changes.