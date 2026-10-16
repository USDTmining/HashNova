# Start here

The project has now moved from a browser-only demo toward a real platform architecture.

1. Install Node 20+ and PostgreSQL 15+.
2. Create a PostgreSQL database named `hashnova`.
3. Apply `sql/001_init.sql`.
4. In `server/`, copy `.env.example` to `.env` and set secrets/database URL.
5. Run `npm install`.
6. Run `npm start`.
7. Open the same server URL in a browser.

The browser automatically uses the API when served over HTTP. Append `?demo=1` if you want to force the original prototype-only mode.

## First production buyer milestone

The next implementation should convert the dashboard language and data model from mining to Forex/trading while preserving the exact responsive shell. Then add trading accounts, market data, orders, positions, margin, risk, and broker/LP adapters.

Do not connect real client money until the acquiring company has completed its licensing, KYC/AML, payment-provider, custody and risk-control requirements.
