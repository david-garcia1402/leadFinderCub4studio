# Lead Finder by cub4Studio

The repository contains two standalone Node deployments: `LeadFinder-cub4Studio-pt-BR-v0.2.0/leadfinder-pt-BR` and `LeadFinder-cub4Studio-en-v0.2.0/leadfinder-en`. Each includes the same account-based Lead Finder CRM, with localized sales copy, prices, checkout settings and a separate customer-data directory.

| Plan | USA / month | Brasil / mês | Businesses per paid cycle |
| --- | ---: | ---: | ---: |
| Essential / Essencial | US$ 9.99 | R$ 39,99 | 100 |
| Professional / Profissional | US$ 19.99 | R$ 59,99 | 300 |
| Scale / Escala | US$ 29.99 | R$ 89,99 | 600 |

Every plan includes the account-based CRM, customizable pipeline and fields, contact history, follow-up tasks, CSV import/export and integrated business search. Customers do not configure a data-provider account or API key. Each installation uses a single operator-owned Outscraper key on its server, with a persisted, shared record ceiling. See each localized README for checkout, search budget and deployment setup.

## Run either version

Requires Node.js 22.9 or later. Copy that app's `.env.example` to `.env`, add the payment links and webhook settings you intend to use, then run `npm run dev`. The app contains no production package dependencies. Checkout stays disabled until its plan URL and a valid payment webhook secret are configured.

`npm run build` writes a portable Node distribution to that app's `dist` directory. The app stores account and CRM data in `.data/accounts.json`; use persistent disk and run one process per data directory. The English and Portuguese installations must not share that directory. Do not use static-only hosting.

Live search stays disabled by default. After paid demand is confirmed, add the operator's Outscraper key to the server environment, set `ENABLE_LIVE_SEARCH=true`, review provider payment settings, and set a safe `OUTSCRAPER_RECORD_CAP`. The current provider pricing lists its first 500 Google Maps records at no charge and postpaid billing above the free tier; verify the shared key's existing usage before enabling requests.

For public indexing, set `PUBLIC_SITE_URL` to the app's real HTTPS origin and configure `EN_SITE_URL` and `PT_BR_SITE_URL` on both deployments. See the localized READMEs for persistent storage, checkout event mapping, and the budget window.
