# ARGBOT Frontend

React + Vite frontend application for ARGBOT -- automated international money transfers from Europe to Argentina.

**Version:** 1.8.169

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
5. **Settings** — Configure service fees, Google Drive sync, and support.

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
| Testing | Vitest, Playwright |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL. Defaults to `http://localhost:10007` |
| `VITE_ENCRYPTION_KEY` | **Yes** | AES key for encrypting API keys. Must match backend's `ENCRYPTION_KEY` |

```env
VITE_API_URL=http://localhost:10007
VITE_ENCRYPTION_KEY=your-secret-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 10000) |
| `npm run build` | Build for production |
| `npm run test:unit` | Run unit tests |
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
    ├── Settings.tsx        (sync, fees, support)
    └── Updates.tsx         (roadmap + changelogs)
```

### Key Features

- **Bidirectional Calculator** — Edit ARS to see required EUR, or edit EUR to see resulting ARS
- **SEPA Transfer Helper** — Binance IBAN details with copy-to-clipboard and bank app deep link
- **Address Book** — BSC/BEP20 address management with EIP-55 checksum validation, edit/delete
- **Address Validation** — Withdraw only allows addresses from the address book
- **Service Fees** — Configurable fee (€0.10–€1.00) per transaction with email whitelist for exemptions
- **Auto-Update Detection** — Polls `version.json` every 60s, shows banner when new version available
- **PWA Optimized** — Touch-friendly UI (44px min targets), overscroll prevention, theme colors

### State Management

- **Auth**: Firebase `onAuthStateChanged`
- **Views**: `useState` with switch pattern in Dashboard
- **Credentials**: AES-encrypted in `localStorage`
- **Trade History**: `localStorage` under `trade_history`
- **Address Book**: `localStorage` under `address_book`

## Deployment

### Frontend (Render Static Site)

1. Push to `main` branch
2. Render auto-deploys from GitHub
3. Set `VITE_API_URL` to your backend URL in Render settings
4. Set `VITE_ENCRYPTION_KEY` to match backend

### Backend (Render Web Service)

See `arg-bot-backend` repository.

## Keep-Alive

The backend self-pings its public URL every 9 minutes to prevent Render's 15-minute free tier sleep. No external service needed.

## License

Open source. See [GitHub](https://github.com/fgiaquintaruiz/arg-bot-frontend).
