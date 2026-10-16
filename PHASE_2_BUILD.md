# HashNova Phase 2 — Forex Productization

## What was added

### Trading domain
- Broker-neutral trading accounts
- Forex/metals instruments
- Market quote abstraction
- Market orders
- Executions
- Positions and unrealized P&L
- Leverage and margin checks
- Account equity/free-margin calculations
- Idempotent order submission
- Realtime quote/order/position events over SSE
- Responsive Trading Terminal UI

### Commercial positioning
The product is now structured as a **white-label trading client portal** rather than a mining-only dashboard. The original mining pages remain available so the visual foundation is preserved.

### Production migration path
1. Replace `DemoMarketAdapter` with an authorized LP/FIX/MT5 adapter.
2. Add an execution gateway and reconciliation worker.
3. Move market data to a durable pub/sub layer (Redis/NATS/Kafka) for multi-instance deployments.
4. Add a dedicated risk service for margin, stop-out, exposure and instrument rules.
5. Add KYC/AML provider integration and compliance/audit workflows.
6. Add broker admin console: users, accounts, instruments, limits, spreads, orders, withdrawals, reports.
7. Add multi-tenant white-label configuration: logo, colors, domain, legal documents, email/SMS templates.
8. Add observability: structured logs, metrics, tracing, alerting and immutable audit exports.

## Safety / compliance
The demo quote feed and execution adapter are intentionally non-production. Do not present them as live executable prices. A real brokerage deployment needs the acquiring company's licensing/regulatory position, approved market-data and execution providers, KYC/AML, client-money controls, best-execution policy, risk limits, and jurisdiction-specific legal review.
