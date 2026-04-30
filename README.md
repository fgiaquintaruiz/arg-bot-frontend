# ARGBOT Frontend

React + Vite frontend application for ARGBOT -- automated international money transfers from Europe to Argentina.

**Version:** 1.8.179

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
npm install && npm run dev
```

The app will be available at **http://localhost:10000**.

## What It Does

ARGBOT helps Argentines in Europe send money home cheaper by automating the EUR → USDC → ARS flow through crypto markets:

1. **Calculator** — Enter how many ARS you want to receive, see exactly how many EUR you need. Includes savings comparison vs Remitly.
2. **Trade** — Execute EUR → USDC on Binance with one click (uses your own API keys).
3. **Withdraw** — Send USDC from Binance to any BSC (BEP20) wallet with address book validation.
4. **Address Book** — Save and manage BSC wallet addresses with EIP-55 checksum validation.
5. **Settings** — Google Drive sync, Binance IBAN/API keys, IP whitelist, and support.

The app is fully **non-custodial** — it never holds user funds or credentials on the server. All sensitive data is encrypted locally and only transmitted during API calls.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19.x |
| Build Tool | Vite 7.x |
| Language | TypeScript |
| Styling | Inline CSS (no CSS framework) |
| Authentication | Firebase Auth (Google Sign-In) |
| Encryption | CryptoJS (AES) |
| Icons | Lucide React |
| Unit Testing | Vitest |
| E2E Testing | Playwright |

## Tests

The project follows a strict TDD approach as part of its educational focus.

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit / Component | Vitest | 306 passing tests |
| End-to-End | Playwright | Login, onboarding, CSP, critical flows |

```bash
# Unit tests
npm run test:unit

# E2E tests (requires dev server running)
npm run test:e2e
```

Tests live under `src/__tests__/` (unit) and `e2e/` (Playwright). All new features are expected to ship with tests.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL. Defaults to `http://localhost:10007` |
| `VITE_ENCRYPTION_KEY` | **Yes** | AES key for encrypting API keys. Must match backend's `ENCRYPTION_KEY` |
| `VITE_WHITELIST_EMAILS` | **Yes** | Comma-separated Gmail aliases allowed to sign in. Empty/missing → **all access rejected** (fail-closed) |

```env
VITE_API_URL=http://localhost:10007
VITE_ENCRYPTION_KEY=your-secret-key
VITE_WHITELIST_EMAILS=alias1@gmail.com,alias2@gmail.com
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 10000) |
| `npm run build` | Build for production |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Architecture

### View Hierarchy

```
App.tsx
├── Login.tsx          (not authenticated)
│   ├── LandingDocs.tsx     (info cards + trust badges)
│   ├── Updates.tsx         (roadmap + changelogs)
│   └── LegalModal.tsx      (terms + privacy)
│
└── Dashboard.tsx      (authenticated)
    ├── [Main Menu]         (action grid)
    ├── Calculator.tsx      (bidirectional ARS↔EUR)
    ├── Trade.tsx           (EUR → USDC)
    ├── Withdraw.tsx        (USDC → BSC wallet)
    ├── BinanceConfig.tsx   (API key setup)
    ├── History.tsx         (trade history + savings)
    ├── Settings.tsx        (sync, Binance IBAN/API, IP whitelist, support)
    └── Updates.tsx         (roadmap + changelogs)
```

### Key Features

- **Bidirectional Calculator** — Edit ARS to see required EUR, or edit EUR to see resulting ARS
- **SEPA Transfer Helper** — Binance IBAN details with copy-to-clipboard and bank app deep link
- **Address Book** — BSC/BEP20 address management with EIP-55 checksum validation, edit/delete
- **Address Validation** — Withdraw only allows addresses from the address book
- **Access Whitelist** — Google Sign-In restricted to authorized Gmail aliases via `VITE_WHITELIST_EMAILS`; unlisted accounts are signed out immediately (fail-closed, no flash of Dashboard)
- **Auto-Update Detection** — Polls `version.json` every 60s, shows banner when new version available
- **PWA Optimized** — Touch-friendly UI (44px min targets), overscroll prevention, theme colors

### State Management

- **Auth**: Firebase `onAuthStateChanged`
- **Views**: `useState` with switch pattern in Dashboard
- **Credentials**: AES-encrypted in `localStorage`
- **Trade History**: `localStorage` under `trade_history`
- **Address Book**: `localStorage` under `address_book`

## Deployment

### Frontend (Vercel)

1. Push to `main` branch
2. Vercel auto-deploys from GitHub
3. Set `VITE_API_URL` to your backend URL in Vercel environment settings
4. Set `VITE_ENCRYPTION_KEY` to match backend
5. Set `VITE_WHITELIST_EMAILS` with authorized Gmail aliases

### Backend (Render Web Service)

See `arg-bot-backend` repository.

## Keep-Alive

The backend runs on Render's free tier, which sleeps after 15 minutes of inactivity. A GitHub Actions workflow in the **backend repository** pings the public URL every 9 minutes to keep it awake. No external scheduler or frontend polling needed.

## Contributing / Proyecto

Este proyecto es un laboratorio de aprendizaje abierto. Las contribuciones son bienvenidas siempre que mantengan el espiritu educativo:

- Cada cambio debe venir acompanado de tests (TDD primero cuando sea posible).
- Priorizar la claridad del codigo sobre la optimizacion prematura.
- Los pull requests deben incluir contexto de QUE se cambio y POR QUE, no solo COMO.
- Este no es un SaaS — no hay roadmap de producto ni SLAs. Es un proyecto para aprender haciendo.

Si encontras un bug o tenes una idea de mejora, abre un issue explicando el problema desde la perspectiva del usuario final.

## License

Open source. See [GitHub](https://github.com/fgiaquintaruiz/arg-bot-frontend).
