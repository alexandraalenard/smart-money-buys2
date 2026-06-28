# Security TODO

Tracking known security gaps that are **out of scope** for the current fake-data
cleanup but should be addressed. These are deferred deliberately, not forgotten.

---

## 1. Unauthenticated admin/pipeline API routes  🔴 open

The `/admin` dashboard password is now verified server-side (see
`app/api/admin/login/route.ts`, gated by the non-public `ADMIN_PW` env var).
**However, that gate only protects the dashboard UI — not the underlying
endpoints.** The following routes have no authentication and can be invoked
directly by anyone who knows the URL:

- **`POST/GET /api/fetch-filings`** — triggers paid sec-api.io ingestion (consumes API credits).
- **`GET /api/calculate-scores`** — recomputes and overwrites the rankings/scores.
- **`GET /api/edgar-import`** — bulk SEC EDGAR ingestion.
- **`GET /api/seed-companies`** — seeds the companies table.
- **`GET /api/cron/daily-pipeline`** — orchestrates the daily refresh.

Additionally, the `/admin` page reads `cron_logs` and `insider_transactions`
using the **public anon key**, so that data is reachable without the password
gate as well (subject only to Supabase row-level security).

**Risk:** anyone can run up sec-api.io credit costs, trigger ingestion load, or
overwrite scores. The password gate is cosmetic with respect to these routes.

**Suggested fix (when prioritized):**
- Require a shared secret / bearer token on the admin-triggered routes (the
  pattern already used by `/api/alerts/send` via `ALERT_CRON_SECRET`, and by the
  cron route via `CRON_SECRET`).
- Or move them behind real server-side session auth + Next.js middleware.
- Confirm Supabase RLS actually restricts the tables the anon key can read.

---

## Notes / required configuration

- The admin login now needs **`ADMIN_PW`** set as a server-side env var (in
  `.env.local` locally and in the Vercel project settings for production). It is
  intentionally **not** `NEXT_PUBLIC_`, so it is never sent to the browser.
- Previously the admin password was hardcoded in the client bundle
  (`app/admin/page.tsx`); that has been removed.
