# ARGBOT Frontend

React + Vite frontend application for ARGBOT -- automated international money transfers from Europe to Argentina.

## Project Overview

ARGBOT Frontend is a single-page React application that provides a user-friendly interface for automating international remittances via cryptocurrency markets. The app allows users to:

- **Calculate** the exact EUR cost to send a desired ARS amount to Argentina, with a savings comparison vs. traditional services like Remitly
- **Trade** EUR for USDC on their own Binance account via automated market orders
- **Withdraw** USDC from Binance to Argentine crypto wallets (Buenbit, Lemon, Fiwind) via the BSC (BEP20) network
- **Configure** their Binance API keys with server IP whitelisting assistance
- **View** transaction history and track savings over time

The application is fully non-custodial -- it never holds user funds or credentials on the server. All sensitive data is encrypted locally and only transmitted in encrypted form during API calls.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19.x |
| Build Tool | Vite 7.x |
| Language | TypeScript (`.ts`/`.tsx`) + JavaScript (`.jsx`/`.js`) |
| Styling | Inline CSS + Tailwind utility classes (`clsx`, `tailwind-merge`) |
| Icons | Lucide React |
| Authentication | Firebase Auth (Google Sign-In) |
| Encryption | CryptoJS (AES encryption of API keys) |
| PWA | vite-plugin-pwa |
| Unit Testing | Vitest 4.x, React Testing Library, JSDOM |
| E2E Testing | Playwright |
| Linting | ESLint 9.x |

## Project Structure

```
arg-bot-frontend/
├── src/
│   ├── main.jsx                 # Entry point, error boundary, React root
│   ├── App.tsx                  # Root component, auth state management, routing
│   ├── Dashboard.tsx            # Main dashboard view, view switching, data fetching
│   ├── config.ts                # API URL configuration
│   ├── authService.ts           # Firebase Google sign-in / sign-out
│   ├── firebaseConfig.ts        # Firebase app initialization
│   ├── index.css                # Global styles
│   ├── App.css                  # App-level styles
│   ├── components/
│   │   ├── Login.tsx            # Login page with Google auth, landing docs, legal links
│   │   ├── Calculator.tsx       # EUR-to-ARS cost calculator with fee breakdown
│   │   ├── Trade.tsx            # EUR -> USDC trade execution UI
│   │   ├── Withdraw.tsx         # USDC withdrawal UI with wallet address management
│   │   ├── BinanceConfig.tsx    # Binance API key configuration with IP display
│   │   ├── History.tsx          # Local trade history viewer
│   │   ├── Updates.tsx          # Changelog and roadmap modal (frontend + backend)
│   │   ├── LandingDocs.tsx      # Landing page informational cards
│   │   ├── LegalModal.tsx       # Terms & Conditions / Privacy Policy modal
│   │   └── SavingsBadge.tsx     # Total savings vs. Remitly badge
│   ├── constants/
│   │   ├── terms.ts             # Terms and Conditions text constant
│   │   └── privacy.ts           # Privacy Policy text constant
│   ├── services/
│   │   └── ipService.ts         # Public IP fetching utility
│   ├── lib/
│   │   └── utils.js             # `cn()` utility for className merging
│   └── tests/
│       ├── Calculator.test.jsx  # Calculator component tests
│       ├── Trade.test.jsx       # Trade component tests
│       ├── Withdraw.test.jsx    # Withdraw component tests
│       ├── Login.test.jsx       # Login component tests
│       ├── History.test.jsx     # History component tests
│       ├── jest/                # Jest-format tests
│       ├── playwright/          # Playwright E2E tests
│       └── cucumber/            # Cucumber BDD tests
├── public/
├── index.html
├── vite.config.js
├── tsconfig.json
├── eslint.config.js
├── package.json
└── CHANGELOG.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arg-bot-frontend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables (see below).

4. Start the development server:
```bash
npm run dev
```

The app will be available at **http://localhost:10000** with hot module replacement (HMR) enabled.

### Building for Production

```bash
npm run build
```

Output will be written to the `dist/` directory. Preview the production build locally:

```bash
npm run preview
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL. Defaults to `http://localhost:10007`. In production, set to your Render backend URL. |
| `VITE_ENCRYPTION_KEY` | **Yes** | AES encryption key for encrypting Binance API keys before storage in `localStorage`. Must match the backend's `ENCRYPTION_KEY`. |

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:10007
VITE_ENCRYPTION_KEY=your-secret-encryption-key-here
```

> **Important**: The `VITE_ENCRYPTION_KEY` must be identical to the backend's `ENCRYPTION_KEY` for the encryption/decryption cycle to work.

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 10000 with HMR |
| `npm run build` | Build for production (cleans `dist/` first) |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Component Structure

The application uses a simple view-switching pattern managed by state in `Dashboard.tsx` rather than a routing library.

### View Hierarchy

```
App.tsx
├── Login.tsx          (user not authenticated)
│   ├── LandingDocs.tsx
│   ├── Updates.tsx    (modal)
│   └── LegalModal.tsx (modal)
│
└── Dashboard.tsx      (user authenticated)
    ├── [Main Menu]    (default view: grid of action buttons)
    ├── Calculator.tsx (currentView === 'calculator')
    ├── Trade.tsx      (currentView === 'trade')
    ├── Withdraw.tsx   (currentView === 'withdraw')
    ├── BinanceConfig.tsx (currentView === 'binance')
    ├── History.tsx    (currentView === 'history')
    └── Updates.tsx    (modal, triggered from main menu)
```

### State Management

- **Authentication**: Firebase `onAuthStateChanged` listener in `App.tsx` drives the login/logout flow.
- **View Switching**: `Dashboard.tsx` uses a `useState('main')` pattern with a `switch` statement to render the active view.
- **Market Data**: Fetched on mount and on every view change via `POST /api/data`. Stored in `Dashboard` state and passed down as props.
- **Credentials**: Binance API keys are stored in `localStorage` as AES-encrypted strings.
- **Trade History**: Persisted in `localStorage` under the key `trade_history`.
- **Wallet Address**: The withdraw component auto-saves the destination wallet address to `localStorage` under `usdc_wallet`.

### Styling Approach

Components use **inline styles** with shared style objects defined as variables within each file. There is no global CSS framework integration beyond the `clsx`/`tailwind-merge` utility (`cn()` function in `lib/utils.js`). The design language features:
- Dark theme (`#0f172a`, `#17212b`, `#1e293b` backgrounds)
- Rounded cards with borders (`borderRadius: '24px'`)
- Color-coded actions (green for trade, purple for withdraw, amber for config)
- SVG pattern background with Euro/Bitcoin symbols

## Testing Instructions

### Unit Tests (Vitest)

```bash
npm run test:unit
```

Tests are located in `src/tests/` with the `.test.jsx` naming convention. The Vitest configuration in `vite.config.js`:
- Uses `jsdom` environment
- Sets `globals: true` for `describe`, `it`, `expect` without imports
- Excludes `node_modules`, `dist`, and Playwright/Cucumber test directories

### Running Individual Test Files

```bash
npx vitest run src/tests/Calculator.test.jsx
```

### Watch Mode

```bash
npx vitest
```

### E2E Tests (Playwright)

Playwright tests are located in `src/tests/playwright/`. Run them with:

```bash
npx playwright test
```

### Test Coverage

Currently the project tests focus on component rendering, user interactions, and API call mocking. Coverage reporting can be enabled by adding the `@vitest/coverage-v8` package and the `--coverage` flag.

## Backend Integration

### API Proxy Configuration

The Vite dev server proxies `/api` requests to `http://localhost:10001` (see `vite.config.js`). In production, `VITE_API_URL` must point to the actual backend URL.

### Communication Pattern

All backend communication follows this pattern:

1. **Data Fetching**: `Dashboard.tsx` sends a `POST /api/data` request on mount and view changes, passing the user's email and encrypted Binance credentials.
2. **Trade Execution**: `Trade.tsx` sends `POST /api/trade` with encrypted credentials and the EUR amount.
3. **Withdrawal**: `Withdraw.tsx` sends `POST /api/withdraw` with encrypted credentials, wallet address, and USDC amount.
4. **Server IP**: `BinanceConfig.tsx` fetches `GET /api/ip` to display the backend's public IP for Binance whitelisting.
5. **Changelog**: `Updates.tsx` fetches `GET /api/changelog` for the backend changelog tab.

### Encryption Flow

```
User enters API keys (plaintext)
       │
       ▼
Frontend encrypts with AES (VITE_ENCRYPTION_KEY)
       │
       ▼
Encrypted strings stored in localStorage
       │
       ▼
On API call: encrypted strings sent in request body
       │
       ▼
Backend decrypts with ENCRYPTION_KEY
       │
       ▼
Backend uses keys for Binance API, then discards them
```

### Error Handling

- If the backend is unreachable, `Dashboard.tsx` falls back to default market data with hardcoded rates.
- Individual components (`Trade`, `Withdraw`) display error messages from API responses in styled error boxes.
- The `main.jsx` entry point includes a global `window.onerror` handler for critical production debugging.

## PWA Support

The project includes `vite-plugin-pwa` for Progressive Web App capabilities. The PWA configuration can be extended in `vite.config.js` to add service worker caching, offline support, and install prompts.

## Accessibility

The application targets Argentine Spanish speakers and uses:
- Local "voseo" dialect in all UI copy
- Clear visual indicators (color-coded buttons, warning banners)
- Confirmation dialogs for irreversible actions (trades, withdrawals)
- Inline error messages and success notifications
