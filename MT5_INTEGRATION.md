# Edge Nexus — MT5 Integration Contract

## Goal

Connect Edge Nexus to an authorized MT5/broker environment without redesigning the client portal.

## Adapter responsibilities

The production adapter should expose:

- symbol discovery
- symbol visibility/trading status
- contract size
- digits and tick size
- minimum/maximum volume and volume step
- bid/ask and timestamps
- spread mode/value
- commission model/value/currency
- swap long/short/type
- trading sessions
- execution mode/filling mode
- margin rules
- order submission
- execution reports
- order status updates
- position synchronization
- account equity/balance/margin updates

## Synchronization direction

### Market data

`MT5 → Edge Nexus`

The quote stream is authoritative for the client UI and risk calculations.

### Trading

`Edge Nexus → Execution Gateway → MT5/Broker`

The client never receives broker credentials. All execution is server-side.

### Reconciliation

`MT5/Broker → Edge Nexus`

Periodic and event-driven reconciliation should compare orders, executions, positions, balances and margin.

## Pricing parity

Spreads and fees are **not hard-coded as universal MT5 values**. The exact values must be imported from the target broker's MT5 server/account and stored in `instrument_pricing`.

This preserves the user's requested "same spread/fees" requirement without fabricating broker-specific pricing.
