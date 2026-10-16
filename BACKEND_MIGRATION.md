# HashNova backend migration plan

The current build is intentionally frontend-only. The dashboard state lives in `js/app.js` under the `DEMO` object so the UI can be wired to real services later without redesigning the screens.

## Suggested production boundaries

- `POST /auth/login`
- `POST /auth/register`
- `GET /me`
- `GET /dashboard/summary`
- `GET /dashboard/earnings?range=7d`
- `GET /mining/rigs`
- `GET /mining/plans`
- `POST /mining/contracts`
- `GET /wallet/balances`
- `GET /wallet/transactions`
- `POST /wallet/deposit-intents`
- `POST /wallet/withdrawals`
- `GET /referrals`
- `POST /support/tickets`

## Real-time layer

Use WebSocket or Server-Sent Events for:

- live mining power / rig status
- earnings ticks
- transaction status changes
- withdrawal status changes
- notifications

The browser should never hold private wallet keys or authorize blockchain transfers directly. Payment and withdrawal flows should be server-side, authenticated, audited, rate-limited, and idempotent.

## Payment migration

For real payments, replace the demo deposit/withdraw handlers with a server-created payment intent and webhook-confirmed settlement flow. Never credit a balance solely because the browser reports success.
