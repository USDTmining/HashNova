# Edge Nexus — Phase 5: Institutional Connectivity & Reconciliation

This phase adds the production boundary between the Edge Nexus application and an authorized broker/MT5/FIX/liquidity-provider environment.

## Added
- Broker connection registry with environment/status/heartbeat metadata.
- Broker-neutral execution gateway.
- MT5 adapter contract for quote, execution, account, order and position synchronization.
- Reconciliation run and exception model.
- External IDs on trading accounts, orders, executions and positions.
- Operations API for connectivity health and reconciliation.
- Broker Control Center connectivity panel.
- Server-side close routing through the execution gateway.
- Margin release on position close.

## Production sequence
1. Configure an authorized MT5 Manager/API or broker gateway.
2. Populate the connection record without exposing broker credentials to clients.
3. Stream broker quotes into `market_quotes` with timestamps and source metadata.
4. Route orders through `ExecutionGateway`.
5. Persist broker order/execution IDs.
6. Consume execution/position/account events.
7. Run periodic reconciliation and resolve exceptions before settlement/reporting.

The included MT5 adapter remains a safe `not_connected` boundary until a real authorized bridge is supplied. It does not fabricate live market data or claim live execution.
