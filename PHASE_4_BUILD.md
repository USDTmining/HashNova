# Edge Nexus — Phase 4: MT5-Compatible Broker Integration Boundary

Phase 4 turns the Phase 3 broker operations build into a white-label architecture for **Edge Nexus**.

## Included

- Edge Nexus tenant branding (logo/domain intentionally unset)
- Broad MT5-compatible multi-asset instrument catalog
- Forex majors/minors/exotics
- Metals
- Energies and commodities
- Global indices
- Crypto CFDs
- Selected equity/stock symbols
- MT5 pricing/specification fields: spread, commission, swaps, contract size, digits, lot limits and steps
- `MT5Adapter` boundary for authorized broker/MT5 connectivity
- Admin endpoint for importing exact MT5 symbol specifications
- Trading terminal asset-class filtering
- Instrument catalog remains usable even when live quotes are not yet available
- Existing risk, wallet, audit and tenant architecture retained

## Important pricing rule

The platform does **not invent or claim universal MT5 spreads/fees**. MT5 is a trading platform and the actual symbol specification is controlled by the broker/account/server. The production adapter must import the exact Edge Nexus/broker MT5 values into `instrument_pricing`.

## Exact MT5 specification import

`POST /api/admin/mt5/specs`

Example payload:

```json
{
  "sourceAccount": "EDGE-NEXUS-MT5-01",
  "specs": [
    {
      "symbol": "EURUSD",
      "spreadMode": "broker_feed",
      "spreadPoints": 8,
      "commissionType": "per_lot",
      "commissionValue": 7,
      "commissionCurrency": "USD",
      "swapLong": -6.2,
      "swapShort": 1.1,
      "swapType": "points",
      "minLot": 0.01,
      "maxLot": 100,
      "lotStep": 0.01,
      "contractSize": 100000,
      "digits": 5,
      "tradeEnabled": true
    }
  ]
}
```

The example values are illustrative only. Production values must come from the acquiring broker's authorized MT5 account/server.

## Integration flow

`MT5 / LP Market Data → MT5Adapter → Market Quotes → Risk Engine → Execution Gateway → Orders/Executions/Positions`

The current execution implementation remains a safe adapter boundary. It must not be treated as live market execution until the authorized broker/LP connector is installed.
