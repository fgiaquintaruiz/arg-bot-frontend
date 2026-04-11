# 🏗️ ARGBOT Architecture — Phased Roadmap

> **Goal:** Independent money transfer pipe — SEPA/USD → USDC → ARS  
> **Last updated:** April 11, 2026

---

## Phase 0: Current State ✅ (Non-Custodial SaaS)

```
User ──► ARGBOT Frontend ──► User's Binance API Keys ──► Binance ──► User's BSC Wallet
```

- User provides their own Binance API keys (stored in browser localStorage only)
- User must have KYC'd Binance account with EUR balance
- ARGBOT is a **remote control** — not a custodian
- **Regulatory burden:** Minimal (you're a software tool)

**Pros:** No regulation, no custody, fast to market  
**Cons:** User needs Binance account, trusts you with API keys

---

## Phase 1: Semi-Automated (Your Exchange Account)

```
User ──► SEPA Transfer ──► Your EU Business Account (Wise/Revolut)
                                      │
                                      ▼
                              Your Corporate Binance/Kraken
                                      │
                               EUR → USDC (auto-trade)
                                      │
                                      ▼
                              User's BSC Wallet (auto-withdraw)
```

### What you need:
1. **EU business entity** (Spain SRL, Estonian OÜ, or Argentine SRL)
2. **Business bank account** with SEPA (Wise Business, Revolut Business)
3. **Corporate crypto exchange** account (Binance Institutional, Kraken)
4. **Backend automation** to detect incoming SEPA → auto-trade → auto-withdraw

### Flow:
```
1. User sends €100 via SEPA to YOUR Wise account (reference: user email)
2. Wise webhook notifies your backend
3. Backend auto-trades EUR→USDC on your Kraken/Binance
4. Backend auto-withdraws USDC to user's saved BSC address
5. User gets notification: "€100 → 121,500 ARS delivered"
```

### Revenue model:
| Item | Amount |
|------|--------|
| User sends | €100.00 |
| EUR→USDC rate (1.075) | 107.50 USDC |
| Binance withdrawal fee | -0.80 USDC |
| Your service fee | -2.00 USDC |
| User receives | ~104.70 USDC |
| USDC→ARS (blue rate ~1160) | ~121,450 ARS |

### Legal considerations:
- **Argentina:** No explicit crypto license required (as of 2024)
- **EU:** VASP registration needed if you hold user funds (varies by country)
- **Workaround:** Position as "currency exchange service" not "crypto custody"
- **Crypto-friendly EU jurisdictions:**
  - 🇱🇹 Lithuania (easiest VASP, ~€5K capital)
  - 🇪🇪 Estonia (stricter now but still viable)
  - 🇵🇹 Portugal (no personal crypto tax, friendly)
  - 🇦🇷 Argentina (no license needed yet)

---

## Phase 2: Fully Automated Pipe

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  User Frontend  │────►│  Your Backend Engine │────►│  ARS Payout      │
│  (React/Vite)   │     │  (Node.js/Express)   │     │  (Argentina)     │
└─────────────────┘     └──────────────────────┘     └──────────────────┘
        │                        │                           │
        ▼                        ▼                           ▼
  SEPA/USD payment        Liquidity Pool              MercadoPago
  Wise/Stripe API         (USDC + EUR reserves)       Lemon/Nexo API
                          Auto DEX/CEX rebalance      P2P network
```

### Components:

#### 1. Payment Gateway
- **SEPA:** Wise Business API / Stripe SEPA
- **USD:** Stripe / Wise USD account
- **Cards:** MoonPay / Transak / Ramp (embedded widgets)
- **Crypto:** Direct USDC/USDT wallet connection

#### 2. Liquidity Engine
- Maintain a **hot pool** of USDC on BSC
- Rebalance via Binance/Kraken when pool runs low
- Use **Chainlink price feeds** for real-time rates
- **Auto-hedge:** Convert EUR→USDC immediately on receipt

#### 3. ARS Payout Layer
- **Lemon API** — buy USDC, sell for ARS, deposit to user's bank
- **Nexo API** — same flow
- **MercadoPago** — direct ARS transfer (if API available)
- **P2P network** — matching buyers/sellers locally

#### 4. Smart Contract (optional)
```solidity
// Escrow contract for trustless settlements
contract ARGBotEscrow {
    // User deposits USDC → contract locks funds
    // Backend confirms ARS payout → contract releases to Argentine wallet
    // If timeout → refund user
}
```

---

## Phase 3: Pure DeFi (Independent)

```
User's Wallet ──► Bridge (any chain → BSC) ──► PancakeSwap/Uniswap
                                                    │
                                                    ▼
                                          USDC → ARS via local rail
```

### How it works:
1. User connects any wallet (MetaMask, Phantom, etc.)
2. User sends any stablecoin (USDC, USDT, DAI, EURC)
3. Smart contract bridges to BSC if needed
4. Contract swaps to USDC via DEX
5. Your backend receives webhook → sends ARS to user's Argentine account

### The EUR problem:
- **No EUR stablecoin has real liquidity** (EURC volume ~$500K/day vs USDC ~$10B/day)
- **Solution:** Accept EUR via SEPA → internally convert to USDC → continue with DeFi pipe
- Or: Wait for **MiCA-regulated EUR stablecoins** (expected 2025-2026)

### Why DeFi is better for USD→ARS:
- USD→USDC is 1:1 (no conversion loss)
- USDC liquidity on BSC is massive
- No regulatory entity needed for the crypto side
- Only the ARS payout needs local compliance

---

## Phase 4: Scale & Expand

```
┌─────────────────────────────────────────────┐
│              ARGBOT Platform                 │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ EUR→ARS │ │ USD→ARS │ │ EUR→Other LATAM│  │
│  └─────────┘ └─────────┘ └───────────────┘  │
│  ┌─────────────────────────────────────┐    │
│  │  DeFi Integration (Aave, Compound)   │    │
│  │  Earn yield on idle reserves         │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  ARGBOT Card (Visa/MC debit)         │    │
│  │  Spend USDC directly in Argentina    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## Immediate Action Plan (Next 4 Weeks)

### Week 1-2: Polish Current MVP
- [x] Address book with edit functionality
- [x] USD support in calculator
- [x] Fix performance issues
- [ ] Add rate fallback mechanism (if Nexo API dies)
- [x] Backend self-polling keep-alive (calls own public URL every 9min)

### Week 3-4: Prepare for Phase 1
- [ ] Research EU entity options (Lithuania vs Estonia vs Portugal)
- [ ] Open Wise Business / Revolut Business account
- [ ] Design backend for incoming SEPA detection
- [ ] Build admin dashboard for payment tracking
- [ ] Create landing page for investor pitch

### Month 2: Raise Seed Funding
- Target: €25-50K via crowdfunding (Republic, Seedrs)
- Pitch: "We're the Wise for Argentina-Europe corridor"
- Metrics needed: monthly volume, user count, retention rate

---

## Key Decisions to Make

1. **Entity location:** Where to register the business?
2. **First corridor:** EUR→ARS or USD→ARS?
3. **Custody model:** Hold funds (Phase 1) or pure DeFi (Phase 3)?
4. **Compliance strategy:** Embrace regulation or stay under the radar?

---

## Infrastructure: Keep-Alive Strategy

### Problem
Render's free tier sleeps web services after **15 minutes** of no incoming requests.

### Solution: Self-Polling Backend
```
First request → Backend wakes up → starts setInterval()
    ↓
Every 9 min: Backend calls https://arg-bot-backend.onrender.com/api/health
    ↓
Request goes through Render's proxy → counts as "incoming activity"
    ↓
Sleep timer resets → backend stays alive ♻️
```

**Why this works:** Render tracks incoming requests at the **proxy/load balancer level**, not the process level. By calling our own **public URL** (not `localhost`), the request flows through Render's infrastructure and counts as activity.

**Trade-offs:**
- ✅ No external service needed (no cron-job.org, no UptimeRobot)
- ✅ Works even when no users are visiting the frontend
- ⚠️ First request still has cold start (~5-15 seconds)
- ⚠️ If the backend crashes, it needs a new first request to restart the polling
