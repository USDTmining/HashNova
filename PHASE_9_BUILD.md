# Edge Nexus Phase 9 — Broker Terminal Experience

## Added
- Responsive price chart surface with 1H / 4H / 1D / 1W controls.
- Client-side watchlist with local persistence and quick symbol switching.
- Broker-feed status wording that does not claim live execution when the adapter is not connected.
- Four-second quote refresh while the Trading Terminal is open.
- Real-account funding action from settled wallet funds only.
- Explicit demo/real boundary in the funding UI.
- Mobile-first chart sizing, horizontal watchlist scrolling, touch-friendly controls and narrow-device handling.

## Money boundary
Demo funds remain virtual and isolated. Real trading accounts can only be funded by an authenticated transfer from settled wallet funds through the existing server-side funding endpoint.

## Production boundary
The chart remains a presentation layer until an authorized market-data/MT5/FIX adapter is connected. No universal MT5 spread or commission values are invented; the authorized broker/account profile remains authoritative.
