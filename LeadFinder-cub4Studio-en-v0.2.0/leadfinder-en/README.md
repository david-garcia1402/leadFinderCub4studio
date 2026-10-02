# Lead Finder CRM — English

## Run it

Requires Node.js 22.9 or later. Copy `.env.example` to `.env`, then run `npm run dev`. Open the sales page at `http://127.0.0.1:4173`, sign in at `/login`, and open the workspace at `/app`. There are no external packages to install.

To make the application available on the public internet, run it as a long-lived Node.js process behind HTTPS and attach persistent storage for `.data`. This app writes a local JSON database and keeps pending provider jobs in process memory; run one instance per data directory. Do not deploy it to static hosting/serverless or share its data directory between the English and Portuguese processes.

## Product workflow

Customers sign up, pay the selected monthly software plan, and search directly from Lead Finder. They do not create an Outscraper account, provide an API key or purchase provider credits. The software allowance is 100, 300 or 600 requested business records per paid billing cycle. Each search accepts up to 25. Reserving requested results up front prevents repeated billing when a provider response is delayed or fails. Cached repeats do not create another request. Provider credits are funded centrally by the operator and are separate from the paid customer allowance.

The workspace includes a six-stage customizable sales pipeline, account-specific companies and contacts, deal amounts, tags, notes, custom fields, stage probabilities, activity history, follow-up tasks, overdue/today views, archive/restore and safe CSV import/export. Customer data is isolated by account and persists in `.data/accounts.json`. Activities are notes in the CRM; the app does not send messages or external reminders. Google Maps opens a manual search link only; Maps URLs cannot import result data. Live import uses the server integration.

## Turn on billing

Set `BILLING_PROVIDER=hosted`, a separate HTTPS `CHECKOUT_URL_ESSENTIAL`, `CHECKOUT_URL_PROFESSIONAL` and `CHECKOUT_URL_SCALE`, and a random `BILLING_WEBHOOK_SECRET`. Map each external product ID to `BILLING_PRODUCT_ESSENTIAL`, `BILLING_PRODUCT_PROFESSIONAL` and `BILLING_PRODUCT_SCALE`. Configure the payment service to POST confirmed purchase, renewal, refund and cancellation events to `{APP_ORIGIN}/api/billing/webhook/hosted`. Prefer an HMAC SHA-256 signature in `x-billing-signature` over a plain token. Events should include email, product ID or English `planId`, event name and a unique order/event ID. A plan opens only when both its checkout link and a webhook secret are configured; an unconfirmed checkout does not activate access. Return the customer to `/account` after checkout.

The built-in Kiwify and Mercado Pago options remain available if you explicitly configure them. Use a USD-capable provider and confirm recurring billing support for international cards before enabling subscriptions.

## Turn on integrated search

After a customer has purchased a plan, configure one operator-owned `OUTSCRAPER_API_KEY` on the server and set `ENABLE_LIVE_SEARCH=true`. Add a provider payment method before paid usage is possible; Outscraper lists a free allowance for the first 500 Google Maps records and postpaid invoices when use exceeds that tier. Pricing and provider eligibility can change; confirm the provider account's current terms and past usage first. The key is never returned by the app.

The app defaults to a conservative global ceiling of 500 requested records for a 30-day window; configure `OUTSCRAPER_RECORD_CAP` lower if you need a tighter spend limit. The ceiling counts reserved records, not successful results, and is shared by all customers using this server key. It is persisted across restarts. Before a fresh window, review the provider account balance/invoice and explicitly set a new `OUTSCRAPER_BUDGET_START`, then restart. The ceiling cannot see activity performed outside this app on the same provider account. Never set it above the spend you have reviewed and accepted. Billing-plan renewals do not reset the operator budget.

## Language, checkout and data

Set `PUBLIC_SITE_URL` to the real HTTPS origin without a path; set `EN_SITE_URL` and `PT_BR_SITE_URL` on both apps to enable matching language links. The English plan prices are $9.99, $19.99 and $29.99 USD per month. Checkout pages are configured per plan and remain unavailable until you add provider links and webhook settings.

The JSON store is suitable for one small installation, not concurrent multi-instance hosting. Back up `.data/accounts.json` securely and use persistent disks. Plan for email verification, password recovery, database backups/restore, retention and account deletion before public scale. Keep `.env`, `.data` and runtime logs out of source control and customer ZIPs.

## Package and source

`npm run build` creates a portable Node.js copy in `dist`; run it with `cd dist` and `npm run start` after providing its runtime `.env`. The package contains source, static assets and `.env.example`, not provider credentials or customer data.
