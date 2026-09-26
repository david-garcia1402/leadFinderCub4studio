# Lead Finder by cub4Studio

Separate English (US) and Portuguese (Brazil) Node deployments.

| Plan | USA / month | Brasil / mês | Proposed businesses / month |
| --- | --- | --- | --- |
| Essential / Essencial | US$ 9.99 | R$ 51,85 | 100 |
| Professional / Profissional | US$ 19.99 | R$ 103,75 | 300 |
| Scale / Escala | US$ 29.99 | R$ 155,65 | 600 |

Brazil uses USD × 5.19, rounded to two decimals: 9.99 × 5.19 = 51.8481; 19.99 × 5.19 = 103.7481; 29.99 × 5.19 = 155.6481. This is a **fixed reference conversion**, not a live FX quote, payment-provider rate or tax calculation. Reference observed September 26, 2026: [Ordem dos Economistas do Brasil — USD/BRL](https://www.oeb.org.br/indicadores/dolar), R$ 5.19 (source listed there: AwesomeAPI). The landing labels proposed BRL prices and conversion date.

Subscriptions, billing and per-customer quotas are not implemented. Allowances remain launch proposals and require cost validation. CTAs qualify launch interest; they do not accept payments or promise immediate activation.

## Run and validate

In either `LeadFinder-cub4Studio-*/leadfinder-*` directory, run `npm test`, `npm run build`, and `npm run dev`. Requires Node 22.9+. There are no production dependencies. Builds are generated locally in ignored `dist/` folders.

Copy `.env.example` to `.env` and configure the real HTTPS `PUBLIC_SITE_URL` before production indexing. Configure both locale origins (`EN_SITE_URL`, `PT_BR_SITE_URL`) consistently in both deployments. Without a valid public origin, indexing is disabled intentionally. Keep API keys private and real searches local until customer authentication and billing are implemented.

## Changes

- Correct USD prices for the US version; converted BRL prices for Brazil.
- Three responsive pricing columns with differentiated prospecting CTAs.
- Copyable qualification brief: selected plan/price, service, target industry and city. Nothing is submitted or persisted automatically.
- Localized metadata and H1, SoftwareApplication JSON-LD, canonical/og:url, optional reciprocal hreflang, robots and sitemap.
- Workspace excluded from indexing; existing search security restrictions preserved.
- Automated pricing, handoff-data, SEO configuration and HTTP regression checks in both versions.
