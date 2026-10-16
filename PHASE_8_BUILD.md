# Edge Nexus — Phase 8 Client Experience

Phase 8 turns the client shell into a broker-oriented experience while preserving the server-authoritative money boundaries.

## Added
- Account Activity page with live wallet ledger and trading order history.
- Identity Verification page with KYC status and submission workflow boundary.
- Server endpoints for KYC status/submission and withdrawal history.
- Responsive verification/activity components for phone, tablet and desktop.
- Wallet copy updated to distinguish pending provider settlement from real balance credit.
- Navigation renamed toward trading/account terminology.

## Money / compliance boundaries
- A deposit intent does not increase the wallet balance.
- Wallet credit occurs only after a signed payment-provider settlement webhook.
- Real trading accounts start at zero and can only be funded from settled wallet funds.
- Demo accounts remain virtual and reloadable at $10,000.
- KYC document verification remains behind the authorized KYC-provider boundary; this UI only submits the verification request metadata.
- No claim is made that live broker execution, payment rails, or KYC provider services are connected.

## Responsive design
The existing Phase 7 responsive layer remains active. Phase 8 components use fluid widths, internal table scrolling and mobile-safe form layouts so the application does not create page-level horizontal overflow.

## Migration
Run `sql/007_client_experience.sql` after migrations 001–006.
