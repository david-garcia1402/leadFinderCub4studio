# Lead Finder by cub4Studio — English — v0.2.0

## Quick start
Requires Node.js 22.9+ (tested with Node 24.19). No external production dependencies.
Open a terminal in this directory:

```bash
npm run dev
```

Product page: http://127.0.0.1:4173
Workspace: http://127.0.0.1:4173/app

```bash
npm test
npm run build
```

The build is already included in `dist/`. To run the distribution alone:

```bash
cd dist
node --env-file-if-exists=.env server.mjs
```

This is a Node application, not a static-only website. Do not open index.html directly, import it as a Shopify theme or upload dist directly to a Cloudflare Worker.

## Changes
- English product page with benefit-led copy, features, FAQ and contact CTA, separate from the workspace.
- New vector Lead Finder product mark using the existing purple/coral palette. This is a proposed product identity, not a certified reproduction of the corporate logo.
- Responsive HTML/CSS product illustration with clearly labeled fictional businesses. No generic stock imagery.
- Three desktop pricing columns, stacked on mobile, with the Professional plan highlighted.
- Proposed monthly BRL prices: R$29.90 / R$59.90 / R$99.90. Proposed allowances: 100 / 300 / 600 businesses. These are not enforced subscription quotas and require commercial validation.
- Interest CTAs select a plan and lead to the corporate contact page. No checkout or waitlist registration is implemented.
- Sample data disabled by default. Real searches never silently fall back to fictional data.
- Preserved filters, browser-saved shortlist, CSV export and editable outreach drafts.
- Explicit HTTPS origin configuration, reduced config exposure and additional local-only live-search checks.

## Enable real searches locally
Copy `.env.example` to `.env`. Set `OUTSCRAPER_API_KEY`, `ENABLE_LIVE_SEARCH=true` and keep `HOST=127.0.0.1`. Use `APP_ORIGIN=http://127.0.0.1:4173` and open that exact address. Set a conservative `MAX_MONTHLY_RECORDS`. Restart the server. When running dist, place .env in dist.
Never include .env in Git, ZIP deliveries or frontend code. The key remains server-side.
The provider integration was preserved, not verified with real credentials. Check pricing, permissions and usage limits in your own provider account before consuming credits. No account, credits or paid services were purchased.
The local budget is global, not per subscriber and not a provider-side monetary cap. Failed reservations are not refunded automatically. Use a single process; jobs/cache are in memory. Monthly reset occurs on startup. Do not restart while a search is pending.

## Development samples
Optionally set `ENABLE_SAMPLE_DATA=true`, then choose sample data in the workspace. Fictional data remains explicitly labeled. Never present samples as real results in advertising. Saved lists remain in the current browser only.

## Actual readiness
This delivery improves the product presentation and experience but does NOT implement a paid multi-user SaaS. Do not advertise immediate subscription access or financial returns. Live operation remains local. IP/header checks do not replace authentication and may depend on proxy behavior; do not expose this backend with an active API key publicly.

Before launching subscriptions: authentication/account recovery; database with tenant isolation; atomic credit accounting; checkout and idempotent billing webhooks; subscription-based search authorization; data retention/deletion; actual privacy/terms documents; abuse protection, logging and monitoring; real provider validation. Confirm provider usage rights and terms. No advertising pixels are installed.

## Campaign analysis
The clearest pain point is time spent researching businesses and organizing outreach. Suggested initial audience: website freelancers and small agencies. Offer: find businesses by location and prioritize those without a listed website. Do not claim ready-to-buy customers or a confirmed absence of a website.
Before subscription campaigns, measure data cost and margins, validate allowances and test real search, payment and cancellation end to end. This page currently supports product presentation and prelaunch conversations. Contact links point to cub4studio.com/#contato; verify that destination before publishing.
Prices/allowances are commercial hypotheses, not recommendations based on current provider tariffs. Volume discounts can erode margin when data costs are high. All prices remain in BRL; no currency conversion was assumed.

## Editing
`public/index.html`: product page, pricing and contact links.
`public/landing.css`: brand and responsive layout.
`public/landing.js`: plan interest selection.
`public/workspace.html`, `public/app.js`, `public/style.css`: workspace.
`public/logo.svg`: vector mark.
`server.mjs` and `lib/`: backend/provider integration.
After editing, run npm test and npm run build to refresh dist.

## Validation
Node build and automated tests run for this delivery. HTTP checks cover pages/assets, disabled samples, origins and internal-file boundaries. Browser visual validation depends on Chromium availability; see VALIDATION.md. No payments, paid provider calls or public deployment were performed.
