# Lead Finder by cub4Studio

Separate English (US) and Portuguese (Brazil) Node deployments.

| Plan | USA / month | Brasil / mês | Proposed businesses / month |
| --- | --- | --- | --- |
| Essential / Essencial | US$ 9.99 | R$ 39,99 | 100 |
| Professional / Profissional | US$ 19.99 | R$ 59,99 | 300 |
| Scale / Escala | US$ 29.99 | R$ 89,99 | 600 |

Brazil uses **independent BRL prices** (R$ 39,99 / 59,99 / 89,99), not a live USD conversion, payment-provider rate or tax calculation. The US version keeps the USD list and does not accept payment.

The Brazil app opens the Kiwify checkout for Essencial, Profissional and Escala after account login. The monthly software allowance is released only after the Kiwify webhook confirms the payment for the same email. Each Brazil customer must also connect their own Outscraper API key in /conta. Outscraper data credits and charges are separate from the Lead Finder subscription; checkout does not create an Outscraper account. Customer keys are encrypted using the server-only CREDENTIAL_ENCRYPTION_KEY. The US CTAs still qualify launch interest and do not accept payments.

## Run and validate

In either `LeadFinder-cub4Studio-*/leadfinder-*` directory, run `npm test`, `npm run build`, and `npm run dev`. Requires Node 22.9+. There are no production dependencies. Builds are generated locally in ignored `dist/` folders.

Copy `.env.example` to `.env` and configure the real HTTPS `PUBLIC_SITE_URL` before production indexing. Configure both locale origins (`EN_SITE_URL`, `PT_BR_SITE_URL`) consistently in both deployments. Without a valid public origin, indexing is disabled intentionally. Keep secrets private. The Brazil app uses customer-owned keys; see its README for setup and current storage/job limitations. The English app still uses its existing local search configuration.

## Changes

- Correct USD prices for the US version; independent proposed BRL prices for Brazil.
- Three responsive pricing columns with differentiated prospecting CTAs.
- Copyable qualification brief: selected plan/price, service, target industry and city. Nothing is submitted or persisted automatically.
- Localized metadata and H1, SoftwareApplication JSON-LD, canonical/og:url, optional reciprocal hreflang, robots and sitemap.
- Workspace excluded from indexing; existing search security restrictions preserved.
- Automated pricing, handoff-data, SEO configuration and HTTP regression checks in both versions.
