## [1.8.160] - 2026-03-20
### Refactored
- Extracted hardcoded legal texts into separate constant files (`terms.ts` and `privacy.ts`) to keep the `LegalModal` component clean and maintainable.
- 
## [1.8.159] - 2026-03-20
### Added
- Added full Privacy Policy documentation to `LegalModal.tsx`.
- 
## [1.8.158] - 2026-03-20
### Added
- Integrated comprehensive Terms and Conditions modal (`LegalModal.tsx`).
### Changed
- Replaced the term "Remesas" with "Transferencias internacionales".
- Updated platform references to explicitly state "Buenbit by Nexo".
- 
## [1.8.157] - 2026-03-20
### Changed
- Added Updates modal to view roadmap and changelogs from inside and outside the app.
- 
## [1.8.156] - 2026-03-20
### Changed
- Redesigned `LandingDocs.tsx` with a friendlier UI (cards, better spacing, softer colors).
- Rewrote copy using local Argentine dialect ("voseo") and simplified terms to make legal and technical constraints more approachable and user-friendly.
- 
## [1.8.155] - 2026-03-20
### Refactored
- Extracted legal disclaimers and documentation from `Login.tsx` into a new `LandingDocs.tsx` component to improve maintainability.
- 
## [1.8.153] - 2026-03-20
### Changed
- Migrated `authService.js` to `authService.ts` to enforce strict typing and maintain consistency across the React codebase.
- 
## [1.8.152] - 2026-03-20
### Added
- Added a robot emoji favicon in `index.html`.
- Updated `BinanceConfig.tsx` to fetch and display the backend's public IP address for easier Binance API whitelisting.
- 
## [1.8.151] - 2026-03-19
### Fixed
- Updated relative import paths for `package.json` in `App.tsx` and `Dashboard.tsx` to reflect the newly flattened `src/` directory structure, resolving Vite build errors.
## [1.8.150] - 2026-03-19
### Fixed
- Purged corrupted `node_modules` and reinstalled dependencies to resolve missing packages (e.g., rollup) caused by workspace separation.

## [1.8.150] - 2026-03-19
### Fixed
- Purged corrupted `node_modules` and reinstalled dependencies to resolve missing packages (e.g., rollup) caused by workspace separation.

## [1.8.149] - 2026-03-19
### Changed
- Flattened the `src/` directory structure by removing the redundant `client/` subfolder left over from the monorepo architecture.
- Updated entry point path in `index.html` to point directly to `/src/main.jsx`.
- 
## [1.8.148] - 2026-03-19
### Added
- **Repository Split:** This repository is now exclusively the Frontend client (`arg-bot-frontend`). All backend Node.js code has been removed. Future version bumps in this repository will only reflect UI, client logic, and frontend configuration changes.