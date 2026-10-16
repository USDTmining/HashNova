# Phase 10 — Local demo access and responsive polish

## Changes
- Rebuilt the first page as a branded HashNova landing page with a responsive hero dashboard preview, feature cards, workflow section and clear demo-only disclosures.
- LocalStorage sign-up/sign-in works on static hosting without making `/api/auth/*` calls. This prevents the static-host 405 error.
- New accounts validate name, email, password length and duplicate emails. Passwords are hashed where Web Crypto is available; the local-only fallback is explicitly not a security feature.
- A demo session persists in the browser; the profile page includes sign-out.
- Added a guest demo entry point and sample sign-in (`demo@hashnova.local` / `demo1234`).
- Trading Terminal has sample quotes and simulated positions when no backend is configured. Activity and verification pages identify local simulation behavior.
- Responsive styles cover mobile, narrow phone, tablet, desktop and reduced-motion preferences. Existing tables keep horizontal scrolling inside their own wrappers.

## Running the demo
Open `index.html` or deploy the folder to any static site host. To use the optional backend, append `?api=1` only when the API service is configured and reachable.

## Important limitation
This remains a product demo. Browser localStorage is not secure authentication and can be inspected or cleared by the user. Do not use real passwords, real identity documents, real funds, or real wallet details. All mining, account, market, wallet and transaction values in local mode are simulated.
