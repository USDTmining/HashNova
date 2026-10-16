# Edge Nexus

Edge Nexus is a responsive, white-label-ready trading platform foundation for broker/Forex operations.

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
There is no universal MT5 spread/commission schedule. The authorized broker's MT5 server/account is the source of truth for spread, commissions, swaps, contract sizes, trading sessions and symbol availability. Edge Nexus stores and imports those values rather than fabricating them.

## Run
1. Apply SQL migrations in order through `006_edge_nexus_phase6.sql`.
2. Copy `server/.env.example` to `.env` and configure PostgreSQL.
3. `cd server && npm install && npm start`
4. Open the app through the API server.

Production execution and payment movement must be connected to authorized providers and the acquiring firm's applicable compliance/regulatory controls.
