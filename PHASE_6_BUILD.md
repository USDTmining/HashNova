# Edge Nexus Phase 6 — Client Product Layer

## Delivered
- Edge Nexus branding with no logo/domain configured.
- Strict separation between demo trading balances and real-money wallet balances.
- Demo accounts start at USD 10,000 and can be reloaded to USD 10,000 after all demo positions are closed.
- Real trading accounts start at zero and can only be funded from a user's settled USD wallet balance through the server-side transfer boundary.
- Added broader market categories: forex, metals, energies, commodities, indices, stocks, ETFs, bonds and crypto.
- Added a larger MT5-compatible catalog seed. Exact spreads, commissions, swaps and contract specifications remain broker/account specific and are imported from the authorized MT5 adapter.
- Added real-account funding endpoint backed by the settled wallet ledger.
- Added demo/real labels to the trading-account selector.

## Money boundary
Demo funds are never represented in `accounts`, `ledger_entries`, payment intents, or withdrawals. They exist only on a `trading_accounts.account_type='demo'` account.

Real funds follow: payment provider -> settled wallet -> explicit wallet-to-real-trading-account transfer -> trading account -> execution/risk engine.

## Production note
MT5-compatible does not mean there is a universal MT5 spread/fee schedule. The acquiring broker's server/account profile must provide the authoritative spread, commission, swap, contract size and trading-session rules.
