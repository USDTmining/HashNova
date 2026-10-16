# HashNova API foundation

This service is the first backend migration milestone. It is intentionally domain-ready for either cloud mining or a white-label FX/trading client.

## Included now

- Secure server-side password hashing with Node `scrypt`
- HttpOnly signed sessions
- PostgreSQL schema for users, accounts, ledger, deposits, withdrawals and audit events
- Idempotency keys for money-moving requests
- Deposit intents that do **not** credit balances until a verified provider webhook settles them
- Withdrawal creation with an atomic balance check/debit
- Transaction history
- SSE real-time event channel
- Payment webhook signature verification boundary
- Role field ready for client/admin/support/finance permissions

## Run

1. Create PostgreSQL database `hashnova`.
2. Apply `sql/001_init.sql`.
3. Copy `.env.example` to `.env` and set real secrets.
4. `npm install`
5. `npm start`

For production, put the API behind TLS/reverse proxy, use a managed PostgreSQL instance, rotate secrets, add rate limiting/WAF, centralized logs, backups, monitoring and provider-specific webhook verification.

## Forex productization

For a Forex buyer, the next backend milestone should add:

- instruments / symbols
- bid/ask price stream
- trading accounts and leverage profiles
- positions, orders and fills
- margin, equity, free margin and liquidation rules
- execution/audit trail
- KYC/AML provider hooks
- admin/risk console
- broker/LP bridge adapter

The existing dashboard can then become the client-facing trading terminal without changing its responsive shell.
