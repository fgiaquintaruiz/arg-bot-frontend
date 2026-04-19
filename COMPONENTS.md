# ARGBOT Frontend Component Documentation

Detailed reference for all React components in the ARGBOT frontend application.

---

## State Management & Data Flow

### Authentication State

Managed at the `App.tsx` level using Firebase Auth's `onAuthStateChanged` observer:

```
App.tsx
  │
  ├─ user === null  ──► render <Login onLogin={handleLogin} />
  └─ user !== null  ──► render <Dashboard user={user} />
```

- **Source of truth:** Firebase Auth session
- **Persistence:** Firebase handles session persistence automatically
- **Login trigger:** `signInWithPopup(auth, GoogleAuthProvider)`
- **Logout trigger:** `signOut(auth)`

#### Whitelist gate (since 1.8.173)

After `signInWithPopup` returns, `checkWhitelist(user.email)` (in `authService.ts`) verifies the signed-in address against `VITE_WHITELIST_EMAILS`. If the email is not authorized:

1. `await signOut(auth)` — MUST be awaited before `throw` so `onAuthStateChanged` fires with `null` before the render commits
2. `throw` propagates to `handleLogin` in `App.tsx`, which sets `rejected = true`
3. Dashboard renders ONLY when `user && !rejected` — this render gate is the second flash-prevention layer

Empty or missing `VITE_WHITELIST_EMAILS` means **all access is rejected** (fail-closed).

### Dashboard State

`Dashboard.tsx` is the central state container for all authenticated views:

```javascript
const [data, setData] = useState<any>(null);          // Market data + balances
const [currentView, setCurrentView] = useState('main'); // Active view
const [showUpdates, setShowUpdates] = useState(false);  // Updates modal
```

**Data Fetching Pattern:**

```javascript
useEffect(() => {
  fetch(`${API_URL}/api/data`, {
    method: 'POST',
    body: JSON.stringify({ userEmail: user.email, apiKey, apiSecret })
  })
    .then(res => res.json())
    .then(d => setData(d));
}, [user, currentView]); // Re-fetches on user change or view navigation
```

### Local Storage Keys

| Key | Content | Managed By |
|-----|---------|------------|
| `binance_key` | AES-encrypted Binance API Key | `BinanceConfig.tsx` |
| `binance_secret` | AES-encrypted Binance API Secret | `BinanceConfig.tsx` |
| `usdc_wallet` | Destination wallet address (plaintext) | `Withdraw.tsx` |
| `trade_history` | JSON array of trade records | `Trade.tsx` |

### View Switching (Routing)

The application uses a **state-based view switching** pattern instead of a routing library:

```javascript
// In Dashboard.tsx
const renderView = () => {
  switch (currentView) {
    case 'calculator':  return <Calculator data={data} onBack={...} />;
    case 'binance':     return <BinanceConfig onSave={...} onCancel={...} />;
    case 'trade':       return <Trade data={data} onClose={...} onSuccess={...} />;
    case 'withdraw':    return <Withdraw data={data} onClose={...} onSuccess={...} />;
    case 'history':     return <History onClose={...} />;
    default:            return <MainMenu />;
  }
};
```

Navigation is performed by calling `setCurrentView('viewName')` from button `onClick` handlers.

---

## Component Reference

### 1. `App` (App.tsx)

**Role:** Root component. Manages authentication state and decides between login/dashboard.

**Props:** None (root component).

**State:**

| State | Type | Description |
|-------|------|-------------|
| `user` | Firebase User \| null | Current authenticated user |
| `loading` | boolean | Whether Firebase auth state is still initializing |

**Children Rendered:**
- `<Login onLogin={handleLogin} />` when `user === null`
- `<Dashboard user={user} />` when `user !== null`
- Loading screen with `ARGBOT v{version}` during initialization

**Key Behavior:**
- Sets up `onAuthStateChanged` listener on mount
- `handleLogin` calls `loginWithGoogle()` from `authService.ts`
- Displays a dark loading screen with version number while auth is initializing

---

### 2. `Login` (components/Login.tsx)

**Role:** Pre-authentication landing page with Google sign-in button, informational cards, and legal/roadmap links.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLogin` | `() => void` | Yes | Callback invoked when the Google login button is clicked |

**State:**

| State | Type | Description |
|-------|------|-------------|
| `showUpdates` | boolean | Controls visibility of the Updates modal |
| `legalView` | `'terms' \| 'privacy' \| null` | Controls visibility and tab of the LegalModal |

**Children:**
- `<LandingDocs />` -- Informational cards about the service
- `<Updates />` (modal) -- Shown when `showUpdates === true`
- `<LegalModal />` (modal) -- Shown when `legalView !== null`, with `initialTab` set

**Layout:**
- Centered header with ARGBOT branding, version badge, and Google login button
- Landing documentation cards below
- Footer with links to Terms, Privacy Policy, and Roadmap

---

### 3. `Dashboard` (Dashboard.tsx)

**Role:** Main authenticated container. Handles data fetching, view switching, and renders the navigation header.

**Props:**

| Prop | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | Firebase User | Yes | Authenticated user object from Firebase |

**State:**

| State | Type | Description |
|-------|------|-------------|
| `data` | object \| null | Market data and balances from `/api/data` |
| `currentView` | string | Active view name (`'main'`, `'calculator'`, `'trade'`, `'withdraw'`, `'binance'`, `'history'`) |
| `showUpdates` | boolean | Controls visibility of the Updates modal |

**Derived Values:**

| Value | Type | Description |
|-------|------|-------------|
| `hasKeys` | boolean | `true` if both `binance_key` and `binance_secret` exist in localStorage |

**View Navigation Map:**

| Button | Sets `currentView` to | Requires API Keys |
|--------|----------------------|-------------------|
| Calculadora | `'calculator'` | No |
| Cambiar EUR | `'trade'` | Yes |
| Retirar ARS | `'withdraw'` | Yes |
| API Binance | `'binance'` | No |
| Historial | `'history'` | No |

**Callback Props Passed to Children:**

| Child | Callback | Action |
|-------|----------|--------|
| Calculator | `onBack` | `setCurrentView('main')` |
| BinanceConfig | `onSave` | `setCurrentView('main')` |
| BinanceConfig | `onCancel` | `setCurrentView('main')` |
| Trade | `onClose` | `setCurrentView('main')` |
| Trade | `onSuccess` | `setCurrentView('main')` |
| Withdraw | `onClose` | `setCurrentView('main')` |
| Withdraw | `onSuccess` | `setCurrentView('main')` |
| History | `onClose` | `setCurrentView('main')` |
| Updates | `onClose` | `setShowUpdates(false)` |

**Data Passed to Children:**

| Child | Prop | Value |
|-------|------|-------|
| Calculator | `data` | Market data object |
| Trade | `data` | Market data object |
| Withdraw | `data` | Market data object |

---

### 4. `Calculator` (components/Calculator.tsx)

**Role:** Cost calculator that breaks down all fees to determine the total EUR cost to send a specified ARS amount to Argentina. Includes savings comparison vs. Remitly.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | object | Yes | Market data object (see Data Structures below) |
| `onBack` | `() => void` | No | Callback for the "Back to Menu" button. If not provided, the button is not rendered. |

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `arsAmount` | string | `'500000'` | User-entered ARS amount to receive |

**Calculation Logic:**

```
usdcForBroker    = arsAmount / usdcArsRate
usdcAtBinance    = usdcForBroker + withdrawalFee
eurBeforeTradeFee = usdcAtBinance / eurUsdcRate
tradingFeeEur    = eurBeforeTradeFee * tradingFeeRate (0.001)
eurToDeposit     = eurBeforeTradeFee + tradingFeeEur
eurTotal         = eurToDeposit + sepaFee (1.00)

remitlyEur       = eurTotal * 1.10 (Remitly is ~10% more expensive)
ahorro           = remitlyEur - eurTotal
```

**Data Structures -- `data` prop:**

```typescript
interface MarketData {
  balances: { eur: string; usdc: string };
  rate: string;              // EUR/USDT rate
  usdcArsRate?: string;      // USDT/ARS P2P rate
  fees: {
    withdrawalUSDC_BEP20: number;  // BSC withdrawal fee
    tradingRate: number;           // Spot trading fee (0.001)
  };
}
```

**Fallback Behavior:**
- If `data` is `null`, renders a "Cargando mercado..." message.
- If `usdcArsRate` is missing, defaults to `1121.00`.
- If `rate` is missing, defaults to `1.08`.
- If `fees.withdrawalUSDC_BEP20` is missing, defaults to `0.8`.

---

### 5. `Trade` (components/Trade.tsx)

**Role:** UI for executing EUR to USDC market orders on Binance. Includes balance validation, fee estimation, and a two-step confirmation flow.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `CoreData` | Yes | Market data with balances |
| `onClose` | `() => void` | Yes | Return to main menu |
| `onSuccess` | `() => void` | Yes | Called after successful trade (navigates back after 2s delay) |

**CoreData Interface:**

```typescript
interface CoreData {
  balances: { eur: string; usdc: string };
  rate: string;
  usdcArsRate?: string;
  fees: {
    tradingRate: number;
    withdrawalUSDC_BEP20: number;
  };
}
```

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `eurInput` | string | `''` | User-entered EUR amount |
| `loading` | boolean | `false` | Whether a trade is in progress |
| `errorMsg` | string | `''` | Error message to display |
| `successMsg` | string | `''` | Success message to display |
| `isConfirming` | boolean | `false` | Whether the confirmation dialog is shown |

**Computed Values:**

```
eurAmount   = parseFloat(eurInput) || 0
grossUsdc   = eurAmount * rate
fee         = grossUsdc * tradingRate (0.001)
netUsdc     = grossUsdc - fee
```

**Validation:**
- If `eurInput` is empty or <= 0, trade button is disabled.
- If `eurInput` > `data.balances.eur`, shows "Saldo insuficiente" error.
- Binance minimum: ~10 EUR per order (enforced by Binance, displayed as a note).

**Confirmation Flow:**
1. User enters amount, clicks "EJECUTAR CAMBIO"
2. `isConfirming` becomes `true`, shows confirmation dialog
3. User clicks "SÍ, CONFIRMAR" or "CANCELAR"
4. On confirm: calls `POST /api/trade`
5. On success: saves to `trade_history` in localStorage, shows success message, calls `onSuccess` after 2 seconds

**API Call:**

```javascript
fetch(`${API_URL}/api/trade`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: localStorage.getItem('binance_key'),
    apiSecret: localStorage.getItem('binance_secret'),
    amountEur: eurInput
  })
});
```

**Note:** The Trade component sends `apiKey`/`apiSecret` (not `encKey`/`encSecret`). This differs from the backend's expected parameter names. Check for consistency between frontend and backend implementations.

---

### 6. `Withdraw` (components/Withdraw.tsx)

**Role:** UI for withdrawing USDC from Binance to an external wallet via BSC (BEP20) network. Includes wallet address auto-save and balance validation.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `CoreData` | Yes | Market data with balances |
| `onClose` | `() => void` | No | Return to main menu |
| `onSuccess` | `() => void` | No | Called after successful withdrawal (after 2s delay) |

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `address` | string | `localStorage.getItem('usdc_wallet') \|\| ''` | Destination wallet address |
| `amount` | string | `''` | USDC amount to withdraw |
| `loading` | boolean | `false` | Whether withdrawal is in progress |
| `errorMsg` | string | `''` | Error message to display |
| `successMsg` | string | `''` | Success message to display |

**Side Effects:**
- Auto-saves `address` to `localStorage` under key `usdc_wallet` on every change via `useEffect`.

**Validation:**
- If `address` or `amount` is empty or `amount <= 0`, returns early.
- If `amount` > `data.balances.usdc`, shows "Saldo insuficiente" error.

**Network Warning:**
- Displays a prominent warning that only BSC (BEP20) network addresses are accepted.
- Users are warned that sending to the wrong network will result in permanent loss.

**API Call:**

```javascript
fetch(`${API_URL}/api/withdraw`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: localStorage.getItem('binance_key'),
    apiSecret: localStorage.getItem('binance_secret'),
    address,
    amountUsdc: amount
  })
});
```

---

### 7. `BinanceConfig` (components/BinanceConfig.tsx)

**Role:** Configuration screen for entering and encrypting Binance API credentials. Displays the server's public IP for whitelisting.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSave` | `() => void` | Yes | Called after successfully saving encrypted credentials |
| `onCancel` | `() => void` | Yes | Return to main menu without saving |

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `key` | string | `localStorage.getItem('binance_key') \|\| ''` | API Key (plaintext in input, encrypted on save) |
| `secret` | string | `localStorage.getItem('binance_secret') \|\| ''` | API Secret (plaintext in input, encrypted on save) |
| `serverIp` | string | `'Obteniendo IP del servidor...'` | Server's public IP address |

**Encryption on Save:**

```javascript
const encryptedKey = CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
const encryptedSecret = CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
localStorage.setItem('binance_key', encryptedKey);
localStorage.setItem('binance_secret', encryptedSecret);
onSave();
```

**IP Fetching:**

```javascript
useEffect(() => {
  fetch(`${API_URL}/api/ip`)
    .then(res => res.json())
    .then(data => setServerIp(data.ip))
    .catch(() => setServerIp('No se pudo conectar al servidor'));
}, []);
```

**Environment Variable:**
- `VITE_ENCRYPTION_KEY` -- Required. If missing, `handleSave` shows an alert and does nothing.

---

### 8. `History` (components/History.tsx)

**Role:** Displays the user's local trade history from `localStorage`.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | `() => void` | Yes | Return to main menu |

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `history` | array | `[]` | Trade records from localStorage |

**Data Source:**

```javascript
const data = JSON.parse(localStorage.getItem('trade_history') || '[]');
setHistory(data.reverse()); // Most recent first
```

**Trade Record Structure:**

```typescript
interface TradeRecord {
  date: string;   // ISO 8601 timestamp
  eur: string;    // EUR amount traded
  savings: string; // Approximate savings in EUR (currently hardcoded to '0.00')
}
```

**Empty State:**
- Displays "No hay operaciones registradas aún." when history is empty.

---

### 9. `Updates` (components/Updates.tsx)

**Role:** Full-screen modal displaying the project roadmap, frontend changelog, and backend changelog.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | `() => void` | Yes | Close the modal |

**State:**

| State | Type | Default | Description |
|-------|------|---------|-------------|
| `activeTab` | `'roadmap' \| 'frontend' \| 'backend'` | `'roadmap'` | Active tab content |
| `backChangelog` | string | `'Cargando changelog del servidor...'` | Backend changelog text |

**Tabs:**

| Tab | Content Source |
|-----|---------------|
| Roadmap | Hardcoded Markdown string within the component |
| Frontend Changelog | Imported via Vite's `?raw` import: `import frontChangelog from '../../CHANGELOG.md?raw'` |
| Backend Changelog | Fetched from `GET ${API_URL}/api/changelog` on tab activation |

**Styling:**
- Fixed position overlay covering the full viewport (`zIndex: 9999`)
- Scrollable content area with dark theme
- Tab buttons with active state highlighting

---

### 10. `LandingDocs` (components/LandingDocs.tsx)

**Role:** Informational cards displayed on the login page explaining how ARGBOT works, prerequisites, and security information.

**Props:** None.

**Content Sections:**

1. **"Como te ayuda ARGBOT?"** -- Explains the calculation, automation, and multi-wallet support.
2. **"Antes de arrancar"** -- Prerequisites: Binance account, Argentine exchange account, SEPA-only transfers, name matching requirement.
3. **"Tu plata, tu seguridad"** -- Non-custodial architecture, minimum API permissions, IP whitelisting, independent tool disclaimer, and user responsibility.

**Styling:**
- Three card components with consistent styling (`backgroundColor: '#1e293b'`, rounded borders)
- Color-coded headers: blue (info), amber (warning), red (security)

---

### 11. `LegalModal` (components/LegalModal.tsx)

**Role:** Full-screen modal for displaying Terms and Conditions or Privacy Policy.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | `() => void` | Yes | Close the modal |
| `initialTab` | `'terms' \| 'privacy'` | No (default: `'terms'`) | Which tab to show on open |

**State:**

| State | Type | Description |
|-------|------|-------------|
| `activeTab` | `'terms' \| 'privacy'` | Currently active tab |

**Content Sources:**
- Terms: `import { TERMS_TEXT } from '../constants/terms'`
- Privacy: `import { PRIVACY_TEXT } from '../constants/privacy'`

**Styling:**
- Fixed overlay with `zIndex: 9999`
- Tab navigation between Terms and Privacy
- Scrollable content area

---

### 12. `SavingsBadge` (components/SavingsBadge.tsx)

**Role:** Displays the total accumulated savings vs. Remitly across all trades.

**Props:** None.

**Data Source:**

```javascript
const history = JSON.parse(localStorage.getItem("trade_history") || "[]");
const totalSaved = history.reduce((acc, item) => acc + parseFloat(item.savings), 0);
```

**Conditional Rendering:**
- Returns `null` (renders nothing) if `totalSaved <= 0`.
- Currently, `savings` is hardcoded to `'0.00'` in the Trade component, so this badge will not display until the savings calculation is implemented.

---

## Component Interaction Map

```
                    ┌─────────┐
                    │  App.tsx │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
       user === null         user !== null
              │                     │
              ▼                     ▼
        ┌──────────┐        ┌─────────────┐
        │  Login   │        │  Dashboard  │
        └────┬─────┘        └──────┬──────┘
             │                     │
    ┌────────┼────────┐     ┌──────┼──────────────────────┐
    │        │        │     │      │                      │
    ▼        ▼        ▼     ▼      ▼                      ▼
 Landing  Updates  Legal   Main  Calculator  Trade/Withdraw/
  Docs    (modal)  (modal) Menu   (view)     Binance/History
                                           (views)
```

### Key Interactions

1. **Login to Dashboard:** `Login.onLogin` triggers Firebase auth, `App` re-renders with `Dashboard`.
2. **Dashboard to Sub-view:** Button click sets `Dashboard.currentView`, re-fetches market data, renders the selected component.
3. **Sub-view to Dashboard:** Child calls `onClose`/`onBack`/`onSuccess`/`onCancel` callback, which resets `currentView` to `'main'`.
4. **Trade/Withdraw to Backend:** Component makes `fetch` call to `/api/trade` or `/api/withdraw`, handles response, updates localStorage, calls `onSuccess`.
5. **Updates Modal:** Can be opened from both `Login` and `Dashboard`. Fetches backend changelog from `/api/changelog` when backend tab is active.

---

## Testing Approach

### Unit Tests (Vitest + React Testing Library)

Tests focus on:
- **Rendering:** Component renders with correct title/elements
- **Loading states:** Displays loading message when data is null
- **User interactions:** Input changes, button clicks, modal open/close
- **Calculations:** Correct fee breakdown and savings computation
- **API mocking:** `global.fetch` is mocked with `vi.fn()` for trade/withdraw tests
- **localStorage:** Tests verify reading/writing to localStorage
- **Error handling:** Error messages display on API failures
- **Callback invocation:** `onClose`, `onBack`, `onSuccess` called correctly

### Test File Locations

| Component | Test File |
|-----------|-----------|
| Calculator | `src/tests/Calculator.test.jsx` |
| Trade | `src/tests/Trade.test.jsx` |
| Withdraw | `src/tests/Withdraw.test.jsx` |
| Login | `src/tests/Login.test.jsx` |
| History | `src/tests/History.test.jsx` |

### Mocking Strategy

- **Firebase modules:** Not mocked in current tests (components receive `user` as prop)
- **fetch API:** Mocked globally with `vi.fn()` in Trade and Withdraw tests
- **Child components:** Mocked in Login tests with `vi.mock()` for LandingDocs, Updates, LegalModal
- **localStorage:** Cleared in `beforeEach`, populated as needed per test
