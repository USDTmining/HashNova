# HashNova Forex Core — Phase 2

This phase turns the client portal into a broker-neutral trading product without coupling the UI to a particular broker, liquidity provider, MT5 server, or payment provider.

## Architecture

- **Client portal:** existing responsive dashboard + new Trading Terminal.
- **API:** Node.js HTTP service with PostgreSQL.
- **Trading domain:** trading accounts, instruments, quotes, orders, executions, positions.
- **Market adapter boundary:** `/server/market-adapter.js` can later be replaced with a real LP/FIX/MT5 feed.
- **Execution adapter boundary:** future adapter consumes approved orders and returns executions.
- **Risk engine:** server-side margin/leverage checks; never trust browser calculations.
- **Realtime:** Server-Sent Events for quotes, order updates, positions and account equity.

## Important commercial boundary

The included quote engine is a deterministic demo feed. It is **not** a real market feed and must not be represented as live executable pricing. Before production, connect an authorized broker/LP/MT5/FIX provider and implement the company's regulatory, KYC/AML, best-execution, suitability, recordkeeping and risk requirements.

## Initial API

- `GET /api/trading/instruments`
- `GET /api/trading/quotes`
- `GET /api/trading/accounts`
- `POST /api/trading/accounts`
- `GET /api/trading/orders`
- `POST /api/trading/orders`
- `POST /api/trading/orders/:id/cancel`
- `GET /api/trading/positions`
- `GET /api/trading/account/:id/summary`
- `GET /api/trading/stream`

All order-creation requests require `Idempotency-Key` and are checked server-side.
