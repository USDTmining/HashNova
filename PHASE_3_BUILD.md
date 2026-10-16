# HashNova Phase 3 — Broker Operations & Risk

Phase 3 turns the Forex prototype into a stronger broker/white-label product foundation.

## Added

### Multi-tenant foundation
- Tenant record and branding configuration.
- Users are scoped to a tenant.
- Tenant config API for future white-label themes, logos, legal documents and feature flags.

### Risk engine
- Per-account risk profiles.
- Leverage, max-position-lot, margin-call and stop-out thresholds.
- Server-side recalculation of equity, margin used, free margin and margin level.
- Continuous risk sweep and realtime `risk.updated` events.
- Account risk states: `normal`, `margin_call`, `stop_out`, `restricted`.

### Position lifecycle
- Positions now have an explicit open/closed lifecycle.
- Close-position endpoint realizes P&L server-side.
- Margin/equity are recalculated after position close.
- Trading UI exposes a Close action.

### Broker Control Center
- Client count and equity overview.
- Withdrawal review queue.
- KYC status visibility.
- Trading-account risk monitor.
- Symbol/side exposure report.
- Recent audit events.
- Approval/rejection boundary for withdrawals.

## Important production boundary

The demo market adapter remains non-production. A real broker deployment must connect an authorized execution and market-data provider, reconcile fills, apply jurisdiction-specific rules, and implement approved KYC/AML, client-money, best-execution, recordkeeping and risk procedures.

The Control Center is an operations UI and API boundary; it is not a substitute for the buyer's regulated broker infrastructure.
