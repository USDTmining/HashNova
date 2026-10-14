# HashNova — Cloud Mining UI/UX Prototype

**Premium dark-themed interactive web prototype** for a cloud mining platform.

## Important Disclaimer

> **This is a DEMO PROTOTYPE only.**  
> All balances, hashrates, contracts, transactions, deposits, and withdrawals are **simulated in the browser**.  
> No real cryptocurrency, blockchain operations, or payment processing occurs.

## Brand & Visual Style

- **Brand**: HashNova  
- **Mining model**: Cloud mining (SHA-256 hashrate contracts)  
- **Palette**: Deep black / graphite, electric green (`#00ff88`), gold (`#ffd700`)  
- **Typography**: Inter + JetBrains Mono  

## Pages & Features

| Page | Description |
|------|-------------|
| **Landing** | Hero, value props, CTA to demo |
| **Login / Register** | Simulated auth flows |
| **Dashboard** | Live hashrate (cosmetic), balances, chart, recent activity |
| **Mining Plans** | 4 contract tiers with purchase flow |
| **My Contracts** | Active & completed contracts with progress |
| **Wallet** | Balances, deposit/withdraw modals, full TX history |
| **Referrals** | Code, stats, invitee list |
| **Profile** | Account & security forms |
| **Support** | FAQ + contact form |

### Interactive (Simulated)

- Purchase mining contracts (deducts demo balance)
- Deposit / withdraw (updates local state)
- Live hashrate ticker
- Toasts, modals, responsive sidebar
- Mobile + desktop layouts

## How to Run

1. Open `index.html` in any modern browser, **or**
2. Serve the folder:

```bash
# From the hashnova directory
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080` (or the port shown).

## File Structure

```
hashnova/
├── index.html          # Single-page app shell
├── css/
│   └── styles.css      # Full design system
├── js/
│   └── app.js          # Navigation, state, simulated logic
└── README.md
```

## Tech

- Pure HTML5 / CSS3 / Vanilla JavaScript  
- No frameworks, no build step  
- Google Fonts (Inter, JetBrains Mono)  
- Fully client-side; state lives in memory for the session  

## Design Notes

- Persistent gold demo banner on every view  
- Explicit “demo / simulated” notices on financial screens  
- Consistent component language (cards, badges, buttons, tables, modals)  
- Sidebar navigation with active states  
- Responsive breakpoints at 1024px and 768px  

---

Built as a comprehensive UI/UX prototype for evaluation and iteration.
