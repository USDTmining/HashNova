# HashNova → White-label Forex / Trading Platform

The immediate goal is not to bolt a fake trading engine onto the prototype. It is to turn the existing responsive dashboard into a **sellable white-label client portal** with a real financial backend and clean integration boundaries.

## Product position

The visual shell can be rebranded for a Forex company while preserving the polished dashboard, wallet, notifications, account area and mobile experience.

### Replace mining concepts with trading concepts

| Current | White-label FX version |
|---|---|
| Mining Power | Account Equity / Buying Power |
| Today's Earnings | Today's P&L |
| Total Mined | Net Profit |
| Mining Rigs | Open Positions |
| Mining Plans | Account / Funding Plans |
| Contracts | Trading Accounts |
| Hashrate chart | Equity / P&L chart |
| Mining reward | Realized P&L / credit |
| Wallet | Funding & withdrawals |

## Backend milestones

### Phase 1 — completed in this package

- PostgreSQL schema
- secure password hashing
- HttpOnly sessions
- authentication API
- account balances
- double-entry-style ledger boundary
- idempotent deposits and withdrawals
- signed payment webhook boundary
- transaction history
- audit events
- SSE event stream

### Phase 2 — trading core

- instruments and symbol metadata
- live bid/ask feed adapter
- trading accounts
- leverage and margin profiles
- market / limit / stop orders
- fills and execution reports
- positions and realized/unrealized P&L
- swap/commission rules
- risk checks before execution
- account equity and free-margin calculations
- forced liquidation rules

### Phase 3 — broker integrations

Create provider adapters rather than coupling the UI to a single broker/LP:

- FIX / broker API adapter
- MT5 bridge where permitted by the buyer's infrastructure
- liquidity-provider price adapter
- payment provider adapter
- KYC/AML provider adapter
- email/SMS/push notification adapter

### Phase 4 — operator console

A separate admin/risk application should expose:

- client search and account review
- KYC status
- deposits and withdrawal queues
- manual review / approval
- exposure and risk limits
- execution monitoring
- audit trail
- user/device/session management
- configurable fees and spreads
- branded content and feature flags

## Security requirements before production

- TLS everywhere
- secure secret management
- MFA / TOTP for staff and optional clients
- rate limiting and bot protection
- device/session controls
- immutable audit trail
- database backups and point-in-time recovery
- webhook signature verification + replay protection
- idempotency for every money-moving command
- server-authoritative balances
- no private keys in browser code
- KYC/AML and licensing review by the acquiring company

## Commercially useful architecture

Keep the frontend as a tenant-aware client portal. Put branding, colors, logo, enabled modules, supported currencies and feature flags behind configuration so the same codebase can be sold to multiple financial companies.

The next major deliverable should be the **Forex dashboard conversion + trading-account data model**, while keeping the current screenshot-matched responsive quality.
