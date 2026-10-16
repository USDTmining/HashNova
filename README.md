# HashNova — Responsive Browser Demo

HashNova is a responsive cloud-mining and trading UI demo with browser-local sign-up/sign-in, simulated balances and responsive desktop/mobile layouts.

## Current phase
Phase 6 adds:
- demo vs real trading-account separation
- USD 10,000 demo starting balance
- demo reload/reset after positions are closed
- real-money funding from settled wallet balances
- broader market universe: Forex, metals, energies, commodities, indices, stocks, ETFs, bonds and crypto
- MT5-compatible instrument specification/pricing boundaries
- broker-neutral execution and reconciliation architecture

## Demo money boundary
Demo funds are virtual. They never enter the real wallet, payment ledger, deposit settlement or withdrawal flow.

Real money follows the intended path:

`Payment Provider -> Settled Wallet -> Real Trading Account -> Risk Engine -> Authorized Broker/MT5/FIX`

## MT5 pricing
There is no universal MT5 spread/commission schedule. The authorized broker's MT5 server/account is the source of truth for spread, commissions, swaps, contract sizes, trading sessions and symbol availability. The backend foundation stores and imports those values rather than fabricating them.

## Run
1. Apply SQL migrations in order through `006_edge_nexus_phase6.sql`.
2. Copy `server/.env.example` to `.env` and configure PostgreSQL.
3. `cd server && npm install && npm start`
4. Open the app through the API server.

Production execution and payment movement must be connected to authorized providers and the acquiring firm's applicable compliance/regulatory controls.


## Browser-only demo mode

The app now defaults to a local demo, so the landing page, sign-up and sign-in work on static hosting without `/api` endpoints. New demo accounts and the active demo session are stored in this browser's `localStorage`; passwords are hashed where Web Crypto is available. This is only for previews and is **not production authentication**. Do not use a real/reused password or store sensitive information here.

- Open `index.html` or publish the folder to any static host.
- Use **Explore the demo** to enter without registering, or create a local account and sign in later in the same browser.
- Sample sign-in: `demo@hashnova.local` / `demo1234`.
- Backend API mode is now opt-in: use `?api=1` only when the configured backend API is available. Without it, the browser will not submit auth requests to `/api` (fixes static-host 405 errors).
- All balances, mining rewards, price quotes, trading orders and verification requests are simulated.
