# ARGBOT Frontend

React 19 PWA for EUR → USDC → ARS transfers. Connects to a Kotlin Spring Boot backend (arg-bot-backend-kotlin on Render).

**Version:** 1.8.201

---

> **PROYECTO EDUCATIVO — NO APTO PARA PRODUCCION**
>
> Este proyecto es **puramente educativo y formativo**. Fue creado como ejercicio de aprendizaje de arquitectura frontend, TDD, y desarrollo full-stack moderno con React + TypeScript + Vite.
>
> - No esta disenado ni auditado para uso en produccion con fondos reales.
> - No hay garantias de seguridad, disponibilidad, ni correctitud financiera.
> - Si decidis usarlo, sos responsable de entender completamente cada linea de codigo antes de ejecutar cualquier operacion con dinero real.
> - El objetivo del proyecto es aprender — no reemplazar servicios financieros regulados.

---

## Quick Start

```bash
git clone <repo>
cd arg-bot-frontend
npm install        # or: pnpm install
cp .env.example .env
# edit .env with your values
npm run dev        # starts on http://localhost:10000
```

The dev server proxies `/api` → `http://localhost:10001` (local backend). Without a local backend the app falls back to `VITE_KOTLIN_API_URL`, which defaults to the hosted Render backend.

## What It Does

ARGBOT automates the EUR → USDC → ARS flow through crypto markets:

1. **SEPA Transfer Wizard** — Step-by-step guide: bank → USDC → ARS. Shows Binance IBAN, calculates required EUR, executes Binance spot trade, and initiates USDC withdrawal.
2. **Binance Spot Trading** — Execute EUR → USDC with your own API keys (testnet and production modes).
3. **Withdraw** — Send USDC from Binance to any BSC (BEP20) wallet with address book validation.
4. **Address Book** — Save and manage BSC wallet addresses (AES-encrypted in localStorage, EIP-55 checksum validation).
5. **Rate Alerts** — Service Worker monitors exchange rates and sends push notifications when thresholds are met.
6. **IP Change Detection** — Service Worker detects public IP changes and alerts the user.
7. **Trade History** — Full history with CSV export.
8. **Auto-Update** — Polls `version.json` every 60s; shows update banner when a new version is available.
9. **PWA** — Installable, offline-capable, Firebase Hosting deployed.

The app is fully **non-custodial** — it never holds user funds or credentials on the server. All sensitive data is AES-encrypted locally and only transmitted during API calls.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 |
| Build tool | Vite 7 |
| Language | TypeScript (`strict: false`) |
| Authentication | Firebase 12 (Google Auth + FCM) |
| Push notifications | Firebase Cloud Messaging |
| Encryption | crypto-js 4 (AES, localStorage) |
| Icons | lucide-react |
| QR codes | qrcode.react |
| Unit / component tests | Vitest 4 (jsdom) |
| E2E tests | Playwright 1.58 |

## Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm (lockfile present) or npm
- Firebase project — config is embedded in `src/firebaseConfig.ts` (public config, safe to commit)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_KOTLIN_API_URL` | No | `https://arg-bot-backend-kotlin.onrender.com` | Backend API base URL |
| `VITE_WHITELIST_EMAILS` | **Yes** | — | Comma-separated Gmail addresses allowed to log in. Empty = no access (fail-closed) |
| `VITE_VAPID_PUBLIC_KEY` | No | — | Web Push VAPID public key for Firebase Cloud Messaging push notifications |

```env
VITE_KOTLIN_API_URL=https://arg-bot-backend-kotlin.onrender.com
VITE_WHITELIST_EMAILS=alias1@gmail.com,alias2@gmail.com
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 10000 |
| `npm run build` | Build for production (auto-bumps `version.json`) |
| `npm run preview` | Preview production build locally |
| `npm run test:unit` | Run Vitest unit/component tests (671 tests) |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:headed` | Run Playwright with visible browser |
| `npm run test:e2e:ui` | Open Playwright UI mode |
| `npm run lint` | ESLint check |
| `npm run push` | Bump patch version + auto-commit + push |

## Testing

The project follows strict TDD — every feature ships with tests.

### Unit / Component Tests (Vitest)

- **Location:** `src/tests/**/*.test.{js,jsx}`
- **Environment:** jsdom
- **Coverage thresholds:** 98% statements · 95% branches · 97% functions · 99% lines
- `Trade.tsx` is excluded from coverage thresholds

```bash
npm run test:unit
```

### E2E Tests (Playwright)

- **Location:** `src/tests/playwright/`
- **Browser profiles:** `desktop-chrome`, `mobile-chrome` (Pixel 5), `mobile-safari` (iPhone 13), `PWA`
- Dev server is auto-started by Playwright on port 10000
- CI configuration: 2 retries, 1 worker

```bash
npm run test:e2e           # headless
npm run test:e2e:headed    # visible browser
npm run test:e2e:ui        # Playwright UI mode
```

## Architecture

### View Hierarchy

```
App.tsx
├── Login.tsx               (unauthenticated)
│   ├── LandingDocs.tsx         (info cards + trust badges)
│   ├── Updates.tsx             (roadmap + changelogs)
│   └── LegalModal.tsx          (terms + privacy)
│
└── Dashboard.tsx           (authenticated)
    ├── [Main Menu]             (action grid)
    ├── Calculator.tsx          (bidirectional ARS ↔ EUR)
    ├── Trade.tsx               (EUR → USDC, Binance spot)
    ├── Withdraw.tsx            (USDC → BSC wallet)
    ├── BinanceConfig.tsx       (API key setup)
    ├── History.tsx             (trade history + CSV export)
    ├── Settings.tsx            (Binance IBAN/API, IP whitelist, support)
    └── Updates.tsx             (roadmap + changelogs)
```

### State Management

| Concern | Storage |
|---------|---------|
| Auth state | Firebase `onAuthStateChanged` |
| View routing | `useState` switch pattern in Dashboard |
| Binance credentials | AES-encrypted `localStorage` |
| Trade history | `localStorage` (`trade_history`) |
| Address book | AES-encrypted `localStorage` (`address_book`) |

### Key Behaviors

- **Access control** — Google Sign-In restricted to `VITE_WHITELIST_EMAILS`. Unlisted accounts are signed out immediately (fail-closed, no Dashboard flash).
- **Testnet mode** — Binance API calls can be routed to the Binance testnet for safe testing.
- **Service Worker** — Handles rate alerts, IP change detection, and push notifications (FCM).
- **Auto-update** — Polls `version.json` every 60s and shows a banner when a new version is deployed.

## API Reference

All API calls go to `VITE_KOTLIN_API_URL` (default: `https://arg-bot-backend-kotlin.onrender.com`).

| Method | Endpoint | Called from | Description |
|--------|----------|-------------|-------------|
| POST | `/api/data` | Dashboard.tsx | Fetch market data (EUR/USDC rates, balances). Also used as keep-alive ping every ~9 min |
| POST | `/api/trade` | Trade.tsx | Execute EUR → USDC spot trade on Binance |
| POST | `/api/withdraw` | Withdraw.tsx | Withdraw USDC to BSC wallet (BEP20) |
| GET | `/api/ip` | BinanceConfig.tsx, Settings.tsx, useIpChangeDetection.ts | Server public IP (for Binance IP whitelist config) |
| GET | `/api/version` | BackendToggle.tsx | Backend version — used for update detection |
| GET | `/api/changelog` | Updates.tsx | Changelog/release notes as plain text |
| POST | `/api/push/subscribe` | swRegistration.ts | Register device for Web Push notifications |
| POST | `/api/push/notify/trade-complete` | Trade.tsx | Trigger push notification after trade |
| POST | `/api/push/notify/withdraw-complete` | Withdraw.tsx | Trigger push notification after withdrawal |

> **Note**: The backend README documents `/api/market-data` but the frontend calls `/api/data`. If these differ, verify with the backend repo.

## Deployment

| Layer | Platform | URL |
|-------|----------|-----|
| Frontend | Firebase Hosting | Firebase project: `argbot-6deb4` |
| Backend | Render | `https://arg-bot-backend-kotlin.onrender.com` |

### Frontend (Firebase Hosting)

```bash
npm run build
firebase deploy
```

Environment variables must be set at **build time** (Vite bakes them in). Set them in your CI environment or Firebase Hosting build configuration.

### Backend (Render)

See the `arg-bot-backend-kotlin` repository.

### Keep-Alive

The backend runs on Render's free tier, which sleeps after 15 minutes of inactivity. A GitHub Actions workflow in the **backend repository** pings the health endpoint every 9 minutes to keep it awake.

## Contributing

- Every change must come with tests (TDD — failing test first, then implementation).
- Prioritize code clarity over premature optimization.
- Pull requests must explain WHAT changed and WHY, not just HOW.
- Open an issue describing the problem from the end-user perspective before starting work on a fix or feature.

## License

Open source. See [GitHub](https://github.com/fgiaquintaruiz/arg-bot-frontend).
