# Fake / Demo / Hardcoded Data Audit

> Read-only audit of **The Hidden Ledger** (smart-money-buys2). Goal: locate every source of fake, demo, placeholder, or hardcoded sample data, and code that fabricates numbers instead of reading the database. **Nothing was changed** — this is a map for cleanup.
>
> Line numbers are as of this audit; re-check before editing. Items are grouped by severity: **🔴 Fake data shown to users**, **🟠 Hardcoded seed / placeholder**, **🟡 Fabricated-in-UI calculations**, and **🟢 Legitimate config (NOT fake — do not delete)**.

---

## TL;DR

- **The homepage and company list are genuinely DB-backed** — they read real scores from Supabase (`confidence_score_breakdowns`). No fake data there. ✅
- **Three feature pages (Market Pulse, Buyers Corner, Billionaires Corner) are stubs.** Their data arrays are currently **empty** (`[]`), so they render "not connected yet" empty states — but the page scaffolding and footers still describe **"illustrative example"** data, i.e. they were demo features whose fake arrays have been emptied. They produce no real data.
- **The company detail page fabricates two things in the browser:** executive **salary estimates** (used to compute a "conviction ratio") and **fallback "AI reasons"** bullet text when the DB has none. These are shown to users as if real.
- **`seed-companies` hardcodes ~100 tickers** — real company names, but a static list, not sourced live.
- **The scoring weights/thresholds in `calculate-scores` are legitimate algorithm config, not fake data** — but note the whole "AI confidence score" is heuristic (no ML), so the *inputs* are real trades while the *model* is hand-tuned constants.
- **One security issue surfaced incidentally:** a hardcoded admin password.

---

## 🔴 Fake / demo data shown (or formerly shown) to users

### 1. `app/market-pulse/page.tsx` — News feature stub
- **Line ~3:** `const TODAY = 'June 26, 2026'` — hardcoded date string (not today's real date).
- **Line ~5:** `const NEWS_ITEMS: {...}[] = []` — **empty** array typed to hold news items with `tickers` / `tags`.
- **Renders:** the `/market-pulse` route. With the array empty it shows the empty state *"Live market data is not connected yet — check back soon."*
- **Footer (~line 143):** explicitly states *"News items are illustrative examples of the type of content this feature will provide when integrated with live news APIs."*
- **Classification:** Demo feature, fake data currently emptied out. The copy/footer still markets illustrative content. No real data source wired up.

### 2. `app/buyers-corner/page.tsx` — Volume-spike feature stub
- **Line ~5:** `const VOLUME_EXPLOSIONS: any[] = []` — **empty** array meant to hold unusual-volume trade rows.
- **Renders:** the `/buyers-corner` route. Empty state: *"No unusual-volume data connected yet — this needs a live market-data feed."*
- **Footer (~line 189):** *"Volume data is illustrative. Not financial advice."*
- **Classification:** Demo feature, fake data emptied out. This is the page the planned volume-spike feature (see `API_RESEARCH.md`) would fill with real data.

### 3. `app/billionaires-corner/page.tsx` — Billionaire holdings stub
- **Line ~5:** `const D: T[] = []` — **empty** array meant to hold billionaire holdings.
- **Renders:** the `/billionaires-corner` route. Empty state: *"Billionaire holdings are not connected to a live data source yet."*
- **Classification:** Demo feature, fake data emptied out.

> Note: these three arrays are currently `[]`, so they don't *display* fabricated numbers right now — they display empty states. They are flagged because (a) the page copy/footers still present them as illustrative demo features, and (b) recent git history (`Update NEWS_ITEMS type`, `VOLUME_EXPLOSIONS array`) shows these previously held hardcoded sample arrays. Cleanup = either wire real data or remove the stub pages.

### 4. `app/congress/page.tsx` & `app/institutions/page.tsx` — "Coming Soon" stubs
- **~Line 25:** "Coming Soon" badge.
- **~Lines 33–43:** hardcoded example feature cards (Congress: *"House Members," "Senate Members," "All Sectors"*; Institutions: *"Hedge Funds," "Asset Managers," "New Positions"*).
- **Renders:** `/congress` and `/institutions`. Placeholder UI only — no data, just illustrative cards.

---

## 🟡 Fabricated-in-browser calculations (company detail page)

### 5. `app/company/[ticker]/page.tsx` — Estimated executive salaries
- **Lines ~109–124:** `getEstimatedSalary(title)` returns **hardcoded** annual comp by title:
  - CEO/Chief Executive `$5,000,000`; CFO `$3,500,000`; COO `$3,000,000`; CTO `$2,500,000`; President `$2,500,000`; EVP `$2,000,000`; SVP `$1,500,000`; VP `$1,000,000`; Director `$400,000`; Chairman `$600,000`; **default (unknown title) `$500,000`**.
- **Used by:** `getConvictionRatio()` (~lines 126–137), which computes `trade value ÷ estimated salary` and shows e.g. `3.4x 🔥` / `⚡`.
- **Renders:** the company detail page (`/company/[ticker]`) "Conviction Ratio" — i.e. "how many years of salary this trade represents." **The salary denominator is entirely fabricated**, so the ratio shown to users is based on a made-up number, not real compensation data.
- **Classification:** Fake input to a user-facing metric. Real fix = pull actual compensation (e.g. from DEF 14A / a data provider) or relabel as a rough estimate.

### 6. `app/company/[ticker]/page.tsx` — Fallback "AI reasons" text
- **Lines ~147–159:** `aiReasons` uses `ranking.ai_reasons` from the DB **if present**, otherwise falls back to hardcoded bullets keyed off the score:
  - score ≥ 70 → *"Significant insider purchases detected," "No insider selling in previous 12 months," "Pattern historically associated with outperformance."*
  - score ≥ 50 → *"Mixed insider activity worth monitoring," …*
  - else → *"Recent filings are mostly sales or share grants," …*
- **Renders:** company detail page "Why this ranked highly" section.
- **Classification:** Placeholder text presented as AI analysis when the DB has no real summary. Note the claim *"No insider selling in previous 12 months"* is a **fixed string**, not derived from the company's actual trades — potentially misleading.

### 7. `app/company/[ticker]/page.tsx` — Hardcoded scoring example
- **Lines ~310–320:** a static "How the Score Works" example (CEO purchase +20, CFO +18, multiple insiders +25, purchase >$5M +20, no recent selling +10, price down 30% +10).
- **Renders:** company page sidebar, informational card.
- **Classification:** Illustrative/educational — clearly an example, lower concern, but it's hardcoded and the point values don't necessarily match the real `calculate-scores` weights.

---

## 🟠 Hardcoded seed data & placeholders

### 8. `app/api/seed-companies/route.js` — Hardcoded company universe
- **Lines ~9–108:** `const TOP_100_COMPANIES = [...]` — ~100 entries like `{ ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology' }`.
- **Flow:** `GET /api/seed-companies` upserts these into the **`companies`** table (idempotent — skips existing tickers).
- **Classification:** Hardcoded seed data. The names/tickers are **real**, so not "fake," but it's a static list baked into code rather than sourced live. This is the fixed universe the whole pipeline operates on.

### 9. `app/stock-screener/page.tsx` — Hardcoded ticker shortcuts & labels
- **Line ~19:** `const POPULAR = ['AAPL','MSFT','NVDA','GOOGL','META','AMZN','TSLA','AMD']` — quick-select buttons.
- **Lines ~21–27:** `const COMPONENTS` — static scoring-component labels (Insider Conviction, Leadership Alignment, etc.).
- **Lines ~29–35:** `const NAV` — static nav menu items.
- **Renders:** `/stock-screener`. `POPULAR` is a convenience list (real tickers, hardcoded); `COMPONENTS`/`NAV` are UI labels, not data. Low concern.

### 10. `lib/supabase.js` — Placeholder Supabase credentials (fallback)
- **Lines ~11–12:** falls back to `'https://placeholder.supabase.co'` and `'placeholder-key'` if env vars are missing.
- **Classification:** Runtime safety fallback, not data shown to users. Harmless if env vars are always set; would silently produce a non-functional client if they aren't.

### 11. `app/pricing/page.tsx` — Hardcoded pricing & feature lists
- **Lines ~33–82:** hardcoded plan features, prices (**$19/mo or $149/yr**, "35% savings"), and FAQ Q&A.
- **Line ~65:** *"Stripe payments coming soon"* placeholder text (note: a Stripe checkout API route exists, so this copy may be stale).
- **Classification:** Hardcoded marketing/config content — not "fake data" per se, but static and possibly out of sync with the actual Stripe integration. Verify prices match real Stripe price IDs.

---

## 🟢 Legitimate config — NOT fake data (do not delete)

### 12. `app/api/calculate-scores/route.js` — Scoring algorithm constants
- **Lines ~9–68:** point tables for insider title (CEO 30 / CFO 25 / … / default 5), multiple-insider counts, same-period windows, recent-selling penalty, recency, and purchase-size brackets ($10M+ → 40 pts, etc.).
- **Lines ~77–105:** per-component multipliers (×1.5/2.0/3.5/2.5/1.1, capped at 100) and final composite weights (`insiderConviction 0.25`, `leadershipAlignment 0.20`, `historicalEdge 0.20`, `capitalCommitment 0.20`, `aiOpportunity 0.15`).
- **Flow:** computed from **real `trades` rows**, written to the rankings/`confidence_score_breakdowns` table, then read by the homepage and company pages.
- **Classification:** **Legitimate business-logic config, not fake data.** Important nuance for cleanup: the "AI confidence score" is a **hand-tuned heuristic, not ML** — the *inputs* are real insider trades, but the *model* is these hardcoded weights. If you consider heuristic-presented-as-"AI" a concern, this is where it lives. Otherwise leave it.

### 13. `app/api/alerts/send/route.ts` — Alert threshold
- **Line ~46:** confidence-score threshold `80` for high-confidence alerts ("This exceeds our alert threshold of 80").
- **Classification:** Legitimate business rule constant.

### 14. Real data pipelines (no fake data)
- `app/api/edgar-import/route.js` and `app/api/fetch-filings/route.js` fetch **real** SEC data (EDGAR full-text search, Archives, `company_tickers.json`, and sec-api.io). They parse real Form 4 XML into `insiders`/`trades`. Not fake.
- `supabase/migrations/0001_hidden_ledger_schema.sql` defines schema and migrates existing `trades`→`insider_transactions`, `rankings`→`confidence_score_breakdowns`. No sample-row inserts / no fake data.

---

## 🔴 Security note (incidental, not "fake data" but worth flagging)

### 15. `app/admin/page.tsx` — Hardcoded admin password
- **Line ~6:** `const ADMIN_PW = 'ledger2026'` — plaintext password checked client-side (~line 59) to gate the `/admin` dashboard.
- **Risk:** the password ships in the client bundle and is trivially visible. Not fake data, but found during the audit and worth fixing alongside cleanup.

---

## Cleanup priority (suggested)

| Priority | Item | File | Action |
|---|---|---|---|
| High | Fabricated salary → conviction ratio | `app/company/[ticker]/page.tsx` (~109–124) | Source real comp or relabel/remove the metric |
| High | Fallback "AI reasons" fixed strings | `app/company/[ticker]/page.tsx` (~147–159) | Generate from real trades, or hide when DB empty |
| High | Hardcoded admin password | `app/admin/page.tsx` (~6) | Move to env/server-side auth |
| Medium | Stub feature pages (illustrative copy) | `market-pulse`, `buyers-corner`, `billionaires-corner` | Wire real data (see `API_RESEARCH.md`) or remove |
| Medium | "Coming Soon" stubs | `congress`, `institutions` | Remove or finish |
| Medium | Pricing copy vs real Stripe | `app/pricing/page.tsx` (~33–82) | Sync with real price IDs; fix "coming soon" text |
| Low | Hardcoded company universe | `app/api/seed-companies/route.js` (~9–108) | Optional: source dynamically |
| Low | Hardcoded scoring example | `app/company/[ticker]/page.tsx` (~310–320) | Optional: derive from real weights |
| — | Scoring weights / alert threshold | `calculate-scores`, `alerts/send` | **Keep** (legitimate config) |

*Audit complete. No files other than this report were created or modified.*
