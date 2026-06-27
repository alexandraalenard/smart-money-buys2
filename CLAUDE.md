# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above is load-bearing: this repo runs **Next.js 16.2.9** (App Router) with **React 19** and **Tailwind v4**. APIs differ from older Next.js. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/`.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm start        # serve production build
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is no test suite. Requires a `.env.local` (copy `.env.local.example`) for Supabase/Stripe/Resend to function.

## What this is

"The Hidden Ledger" — a subscription web app that surfaces SEC insider-trading signals. It ingests SEC Form 4 filings for a fixed universe of large-cap tickers, derives an "AI confidence score" per company, ranks them, and gates premium features behind Stripe subscriptions with optional email alerts.

## Architecture

**Stack:** Next.js App Router · Supabase (Postgres) · Stripe (subscriptions) · Resend (email) · deployed on Vercel.

**Two Supabase access patterns — keep them separate:**
- **Client pages** (`'use client'`) import the shared anon-key client from `lib/supabase.js` and query Postgres directly in the browser via `useEffect`. There is no server-side data layer for pages; row-level security is the only guard.
- **API routes** (`app/api/**`) construct their own `createClient` with `SUPABASE_SERVICE_ROLE_KEY` (falling back to anon). These do the privileged writes.

### Data pipeline (the core of the app)

The flow is **companies → trades → rankings**, all in Supabase tables:

1. **`/api/seed-companies`** (GET) — one-time seed of ~100 hardcoded large-cap tickers into `companies`. Idempotent (skips existing tickers).
2. **Ingestion** — two interchangeable routes that parse Form 4 XML into the `insiders` + `trades` tables. Both upsert on `company_id,insider_id,transaction_date,shares` and map transaction code `P`→`BUY`, `S`→`SELL`:
   - **`/api/fetch-filings`** — uses the **paid** `sec-api.io` service (`SEC_API_KEY`). Consumes credits; the admin UI warns to use sparingly.
   - **`/api/edgar-import`** — uses the **free** SEC EDGAR full-text search + Archives, resolving CIKs from `company_tickers.json`. Paginated via `offset`/`limit` query params (returns `next_offset`/`done`) and rate-limits itself with `sleep()`. Prefer this for bulk backfill.
3. **`/api/calculate-scores`** (GET) — recomputes per-company scores from all `trades` and upserts into `rankings` (on `company_id`). The scoring model lives entirely here as pure functions: five weighted components (`insiderConviction`, `leadershipAlignment`, `historicalEdge`, `capitalCommitment`, `aiOpportunity`) combined in `computeRawScore`. **If scoring behavior needs to change, this file is the single source of truth** — there is no ML; "AI" is heuristic.
4. **`/api/rankings`** (GET) — read API returning the top 10 by score (joined to `companies`), shaped for the homepage.
5. **`/api/cron/daily-pipeline`** (GET) — orchestrates the daily refresh by calling `fetch-filings` then `calculate-scores` over HTTP. Scheduled by `vercel.json` at `0 6 * * *` (06:00 UTC). Note it calls `fetch-filings` (paid), not `edgar-import`.

The **`/admin`** page (client-side password gate, `ADMIN_PW` hardcoded in the file) manually triggers `fetch-filings` and `calculate-scores` and reads `cron_logs` + recent `trades`.

### Billing & alerts

- **`/api/stripe/checkout`** (POST) creates a subscription Checkout Session (monthly/annual price IDs from env).
- **`/api/stripe/webhook`** (POST) verifies the signature and upserts `subscribers` on `checkout.session.completed` / marks `cancelled` on `customer.subscription.deleted`. Reads the **raw** request body for signature verification — don't parse it as JSON first.
- **`/api/alerts/send`** (POST) is an internal endpoint guarded by `Bearer ${ALERT_CRON_SECRET}`. Sends Resend emails to opted-in `subscribers` for one of three alert types (`massive_trade`, `billionaire_trade`, `high_confidence`). HTML templates and the brand palette are inline in that file.

### Routing quirk

`next.config.ts` rewrites a parallel `/the-hidden-ledger/*` URL space onto the real routes (e.g. `/the-hidden-ledger/pricing` → `/pricing`) and redirects legacy `/smart-money-buys`. When adding a new top-level page, add its `/the-hidden-ledger/...` rewrite too if it should be reachable under the brand path.

## Conventions

- **Mixed JS/TS by layer:** data-pipeline routes are `.js`; Stripe/alerts routes, pages, and config are `.ts`/`.tsx`. Match the surrounding file.
- **Trade type fields are denormalized and inconsistent** across the schema — rows carry both `transaction_type`/`trade_type` and `transaction_date`/`trade_date`, and consumers check multiple spellings (`['S','SELL','s','sell']`). When reading trades, defensively handle both column names and casings rather than assuming one.
- **Styling is split:** Tailwind v4 (via `@tailwindcss/postcss`, configured in `globals.css`) coexists with large blocks of inline `style={{...}}` objects using the fixed brand palette (`#07130E` bg, `#C9A84C` gold, `#2D6A4F`/`#1B4332` greens, `#F7F4EF` text). New UI generally follows the inline-style pattern in existing pages.

## Key environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY_ID`, `STRIPE_PRICE_ANNUAL_ID`; `RESEND_API_KEY`; `SEC_API_KEY` (sec-api.io); `ALERT_CRON_SECRET`, `CRON_SECRET`; `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`. See `.env.local.example`.

Expected Supabase tables: `companies`, `insiders`, `trades`, `rankings`, `subscribers`, `cron_logs`.
