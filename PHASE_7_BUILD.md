# Edge Nexus — Phase 7 Build

## Responsive client experience

Phase 7 hardens the client UI for commercial use across desktop, tablet and mobile devices.

### Device-safe layout
- Removed reliance on oversized/fixed page widths.
- Added width constraints using `min()`, `clamp()` and fluid columns.
- Trading terminal collapses from desktop two-column to tablet/phone single-column layouts.
- Market tiles use fluid two-column mobile grids without forcing horizontal page overflow.
- Order ticket controls resize to narrow phones; below 340px the order controls stack vertically.
- Tables retain readable column sizes inside horizontal scroll containers rather than shrinking the entire page.
- Added iOS/Android safe-area support for the bottom navigation.
- Added landscape-phone handling for short viewports.
- Added reduced-motion accessibility support.

### Product UX direction
The existing demo/real money boundary remains unchanged:
- Demo accounts are virtual and reloadable to $10,000.
- Real accounts start at $0 and can only be funded from settled wallet funds.
- Live broker execution remains behind the authorized MT5/broker adapter boundary.

### Validation target
The layout is designed for:
- 320px, 360px, 375px, 390px and 430px phone widths
- 768px tablet breakpoint
- 820–1100px tablet/compact desktop widths
- 1280px+ desktop screens

No page should require horizontal scrolling; only intentionally wide data tables may scroll inside their own table container.
