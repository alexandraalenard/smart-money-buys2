# API Research — Market Data & News Data

> Research task for **The Hidden Ledger**. Goal: find real market data (for a volume-spike feature) and news data (for a news-analysis feature). Findings below are current as of **June 2026**.
>
> ⚠️ **The single most important finding:** *Every* provider here restricts its standard/free and cheap paid tiers to **personal, non-commercial use**, and **prohibits public display/redistribution** without a separate commercial/display licensing agreement. The Hidden Ledger is a **public, paid subscription site**, so displaying any of this data to your visitors is a commercial, redistributive use. See the "Licensing reality check" section at the end — it changes the recommendation.
>
> Note: pricing pages for several providers are JavaScript-rendered and block automated fetching, so a few exact dollar figures are from 2026 third-party reviews and are flagged "verify on the live page." Rate limits and terms-of-service language are corroborated from official sources.

---

## MARKET DATA (volume-spike feature)

### 1. Alpha Vantage

1. **Free tier?** Yes — email + organization name, **no credit card**.
   - **25 API requests/day** (this is the binding cap; the old "500/day" number is obsolete).
   - **5 requests/minute.**
   - Free US equities are **end-of-day only** (real-time / 15-min-delayed US prices are paywalled).
   - Paid (removes daily cap, only per-minute ceiling applies): **75/min = $49.99/mo**, 150/min = $99.99, 300/min = $149.99, 600/min = $199.99, 1,200/min = $249.99 (annual ≈ 2 months free). Real-time US data needs the **$99.99 (150/min)** tier or higher; $49.99 gives 15-min-delayed.

2. **What it provides (price/volume):**
   - `TIME_SERIES_INTRADAY` — OHLCV at 1/5/15/30/60-min, pre/post-market, 20+ yrs history (`month=YYYY-MM`).
   - `TIME_SERIES_DAILY` / `TIME_SERIES_DAILY_ADJUSTED` — daily OHLCV, 20+ yrs, 100k+ symbols, JSON/CSV.
   - Every series carries a `volume` field → volume-spike detection (latest vs trailing average) is directly supported.
   - ⚠️ **25 req/day free is far too tight** to scan a ~100-ticker universe; that alone forces a paid tier.

3. **License — public commercial display?** **No, not on standard plans.** TOS grants only "**personal, non-commercial use**." Your use is explicitly "commercial" under their definition (you let "individuals or entities other than you access information"). Public display/redistribution requires a **separate commercial data-onboarding/licensing agreement** (contact premium@alphavantage.co). Real-time/delayed US prices add a second exchange-licensing layer. No explicit attribution clause that would substitute for the license.

4. **Sign up / key:** https://www.alphavantage.co/support/#api-key — fill in role, organization, email; key issued instantly, no card. Pass as `&apikey=` query param.
   - Env var (de-facto): **`ALPHAVANTAGE_API_KEY`** (also seen: `ALPHA_VANTAGE_API_KEY`).

---

### 2. Finnhub

1. **Free tier?** Yes — email only, **no credit card**, key instantly in dashboard.
   - **60 API calls/minute** (≈30/sec sub-limit). No published hard monthly quota — the 60/min throttle is the practical limit.
   - WebSocket free streaming limited to 50 symbols.
   - Paid: **modular per-data-category** pricing. Exact figures couldn't be confirmed from the JS-rendered page; secondary sources span ~$50/mo entry market-data plans up to enterprise "hundreds/mo." **Verify on https://finnhub.io/pricing.**

2. **What it provides (price/volume):**
   - `/quote` — current price/OHLC/prev-close: **free** (US).
   - ⚠️ **`/stock/candle` (OHLCV incl. volume, intraday + daily) is now PAID** — free keys get **HTTP 403**. This is a hard blocker: **historical/intraday volume bars are not available free anymore.** A volume-spike feature needing candle history **requires a paid plan** (you could only approximate live spikes by polling `/quote`).

3. **License — public commercial display?** **No.** TOS: "**All plans … are strictly for personal use unless explicitly stated otherwise**," and "**agree to not redistribute or share access to data or derived results … with anyone or any 3rd party without written approval.**" Showing data to your site's subscribers violates this. Commercial use needs a dedicated license — https://finnhub.io/pricing-startups-and-enterprise / sales@finnhub.io.

4. **Sign up / key:** https://finnhub.io/register → verify email → key in dashboard, no card. Pass via `?token=` or `X-Finnhub-Token` header.
   - Env var (conventional): **`FINNHUB_API_KEY`** (some use `FINNHUB_TOKEN`).

---

### 3. Financial Modeling Prep (FMP)

1. **Free tier?** Yes ("Basic"), **no credit card**.
   - **250 API requests/day** (hard daily cap), 500 MB/30-day bandwidth.
   - **US exchanges only**, effectively **end-of-day** (no real-time/intraday free).
   - Paid (approx, 2026 third-party review — **verify on live page**): Starter ~$22/mo (300 calls/min, real-time US, news), Premium ~$59/mo (intraday charts, +UK/CA, 30-yr history), Ultimate ~$149/mo (1-min intraday, global), Enterprise custom.

2. **What it provides (price/volume):**
   - `/quote` — real-time price + volume (real-time needs **Starter+**).
   - `/historical-price-eod` — daily OHLCV incl. volume, many years (**available free, EOD**) → daily volume-spike detection works on free for US stocks within 250 calls/day.
   - `historical-chart` 1/5/15/30min/1h/4h — intraday OHLCV; **other intervals = Premium**, **1-min = Ultimate**. Not on free.
   - Also offers Stock News / General News / Press Releases (Starter+).

3. **License — public commercial display?** **No, not by default.** Public display/redistribution requires a separate **"Data Display and Licensing Agreement."** Without it you're "prohibited from showcasing FMP Services or Data" on "websites … designed for utilization by multiple individuals — irrespective of whether … complimentary or paid." Standard API plans = internal/analytical use only.

4. **Sign up / key:** https://site.financialmodelingprep.com/developer/docs → sign up (email+password), no card; key auto-generated in Dashboard. Pass as `?apikey=`.
   - Env var (de-facto): **`FMP_API_KEY`**. Keep it server-side only (never `NEXT_PUBLIC_`).

---

### 4. Polygon.io (rebranded **"Massive"**, polygon.io → massive.com)

1. **Free tier?** Yes (Basic), **no credit card**.
   - **5 API calls/minute**, **end-of-day data only**, ~2 yrs history.
   - Paid (Stocks; approx — **verify live**): Starter ~$29/mo (unlimited calls, 15-min delayed, 5-yr), Developer ~$79 (real-time **IEX-only**, ~10-yr), Advanced ~$199 (real-time full-market **SIP** + WebSocket, 20+ yr), Business ~$2,000+ (real-time SIP **+ redistribution rights**).
   - All paid tiers = unlimited calls. Note IEX (Developer) ≠ consolidated tape volume — matters for accurate volume spikes.

2. **What it provides (price/volume):** Excellent OHLCV coverage.
   - **Aggregates (Bars)** — minute/hour/day bars per ticker over a range (core spike endpoint).
   - **Grouped Daily** — daily OHLCV for **every** US ticker in one call → ideal for a once-daily market-wide volume scan (fits this repo's daily-cron pattern).
   - **Snapshots** — current-day aggregate + minute bar + prev-day, all tickers or single.
   - History depth scales by tier (2→5→10→20+ yrs).

3. **License — public commercial display?** **No on the individual tiers** (this contradicts Polygon's older reputation). Current **Market Data Terms** (Oct 2024) grant only "personal, non-business, and non-commercial purposes," "**strictly for display use only**," no redistribution to third parties. There are now split terms: **Individuals** (non-commercial) vs **Businesses** (commercial — the license that actually permits public-website display). Compliant public display → **Business/commercial agreement** (~$2,000/mo or custom). Confirm with Massive sales whether cheaper tiers can opt into Business use.

4. **Sign up / key:** https://massive.com/dashboard/signup (polygon.io redirects), no card for free; key in Dashboard → API Keys. Auth via `?apiKey=` or `Authorization: Bearer`.
   - Env var (conventional): **`POLYGON_API_KEY`**.

---

## NEWS DATA (news-analysis feature)

### 5. Alpha Vantage — News & Sentiment API (`NEWS_SENTIMENT`)

1. **Free tier?** Same free key as above (**25 req/day, 5/min**); same paid tiers lift the daily cap.

2. **What it provides:** Array of articles, each with `title`, `url`, `time_published`, `authors`, `summary`, `banner_image`, `source`, `source_domain`, `category_within_source`, plus:
   - `topics` — topic labels each with a relevance score (Earnings, IPO, Technology, Financial Markets, etc.).
   - `overall_sentiment_score` + `overall_sentiment_label` (Bearish → Bullish scale, roughly −0.35…+0.35).
   - `ticker_sentiment[]` — per-mentioned-ticker `relevance_score`, `ticker_sentiment_score`, `ticker_sentiment_label`.
   - Query filters: `tickers`, `topics`, `time_from`/`time_to`, `sort`, `limit` (up to 1,000).
   - **This is the standout for news *analysis*** — sentiment scoring is built in, so you don't have to run your own NLP.

3. **License:** Same personal/non-commercial restriction as the price data — public commercial display needs the separate commercial agreement.

4. **Sign up / key:** Same key & env var as Alpha Vantage above (**`ALPHAVANTAGE_API_KEY`**).

### 6. Finnhub — Company News API (`/company-news`)

1. **Free tier?** Available on the free tier (**60 calls/min**).

2. **What it provides:** `GET /company-news?symbol=AAPL&from=YYYY-MM-DD&to=YYYY-MM-DD` → array of articles with `headline`, `summary`, `source`, `datetime` (UNIX), `url`, `id`, `image`, `related` (tickers), `category`.
   - Coverage: **North America (US/Canada) only.** History depth ≈ **1 year** on free (more = paid).
   - ⚠️ **No sentiment scores** on this endpoint — you'd run your own analysis on headline/summary text. (Finnhub's separate news-sentiment endpoint is premium.)

3. **License:** Same Finnhub personal-use / no-redistribution restriction — commercial display needs a license.

4. **Sign up / key:** Same key & env var as Finnhub above (**`FINNHUB_API_KEY`**).

---

## Licensing reality check (read before choosing)

For a **public, paid** product, the off-the-shelf API subscriptions from **all four** providers are not, by their written terms, sufficient to legally display their data to your visitors:

| Provider | Cheap-tier commercial public display? | What's actually required |
|---|---|---|
| Alpha Vantage | ❌ personal/non-commercial | Separate commercial + redistribution agreement (premium@alphavantage.co); exchange licensing for live US prices |
| Finnhub | ❌ "strictly for personal use," no 3rd-party redistribution | Commercial license (sales@finnhub.io) |
| FMP | ❌ no public showcasing without agreement | "Data Display and Licensing Agreement" |
| Polygon/Massive | ❌ individual tiers are non-commercial, display-only-to-you | Business/commercial terms (~$2,000/mo or custom) |

Practical implications:
- For **prototyping / internal evaluation** (not public), any free tier is fine within its rate limits.
- For **launch**, you must either (a) buy a commercial/display license from one provider, or (b) consider providers whose terms explicitly permit attributed commercial redistribution. Two worth evaluating later, outside this task's scope: **Tiingo** (commercial-friendly, cheap) and **Marketstack / Twelve Data** (paid tiers permit commercial display with attribution). Also note **SEC EDGAR** data (already used in this repo) is public-domain and unrestricted — only the *price/volume* and *news* layers carry these constraints.
- Always confirm current terms directly with the vendor before launch — these terms change and several pricing pages couldn't be machine-verified.

---

## Recommendation — best free/cheap combination to start with

**For building & prototyping now (free, fastest path):**

- **News analysis → Alpha Vantage `NEWS_SENTIMENT`.** It's the only option here that returns **ready-made sentiment + per-ticker scores + topics**, which is exactly what a "news-analysis feature" needs, with zero NLP work on your side. Free tier works for development.
- **Volume spikes → Financial Modeling Prep (free Basic).** It gives **daily EOD OHLCV with volume for US stocks back many years on the free tier** (250 calls/day), enough to build and test a daily volume-spike scan that mirrors this repo's existing daily-cron pattern. (Alpha Vantage's 25/day cap is too small to also carry the price scan; Finnhub's free candles are now 403; Polygon free is 5/min + EOD + 2-yr.)

**When you move to a cheap paid + real data, pick ONE primary vendor to minimize licensing overhead:**

- **Cheapest path that covers both features from one vendor → Alpha Vantage paid** ($49.99/mo for 15-min-delayed price/volume + the same key powers `NEWS_SENTIMENT`). One key, one license conversation.
- **If you need true real-time, market-wide volume → Polygon/Massive Advanced** (~$199/mo) is technically the strongest for volume (Grouped Daily + Aggregates + SIP), paired with Alpha Vantage for news sentiment.
- **For launch, budget for a commercial/display license** from whichever price vendor you choose (see table above) — the cheap tiers do not cover public display.

**Suggested starting combo:** *Alpha Vantage (news sentiment) + FMP (daily volume)* for the free prototype → consolidate onto *Alpha Vantage paid* (or *Polygon Advanced + Alpha Vantage*) for production, with a commercial license in place.

---

## Environment variable keys you'll need to add later

Add to `.env.local` (and Vercel project env). All are **server-side only** — keep them out of any `NEXT_PUBLIC_` var, and read them inside `app/api/**` routes only.

```bash
# News analysis (and, if used, Alpha Vantage price/volume) — one key covers both Alpha Vantage features
ALPHAVANTAGE_API_KEY=

# Volume-spike price/volume data (free prototype + paid path)
FMP_API_KEY=

# Optional alternatives depending on which vendor(s) you adopt:
FINNHUB_API_KEY=
POLYGON_API_KEY=
```

Minimum to start the recommended free prototype: **`ALPHAVANTAGE_API_KEY`** + **`FMP_API_KEY`**.

---

## ADDENDUM — Commercial-friendly providers for an actual launch

Because the four requested providers all forbid public commercial display on their cheap tiers, here are providers that *do* sell a self-serve license covering "display data on a public client-facing website." Use these when you move from prototype to launch.

### Twelve Data — clearest legal fit ⭐
- **Free (Basic):** 8 credits/min, 800 credits/day. **Licensed "internal non-display" only** — not for public display. No credit card for free.
- **Data:** daily + intraday OHLCV with volume (`time_series`), real-time `quote`/`price`, WebSocket on paid; also a news endpoint.
- **Commercial display:** the **business pricing tiers map license rights explicitly** — **Venture (~$499/mo)** grants "external display data access" for "client-facing apps or websites" (this is the tier that legally covers your site); Enterprise (~$1,099/mo) adds external *distribution*. Individual tiers (Grow $79 / Pro $229 / Ultra $999) are personal/non-commercial. No attribution string required.
- **Sign up:** twelvedata.com, instant key, no card for free. Env var: **`TWELVE_DATA_API_KEY`**.
- **Verdict:** the most straightforward legally-clean single vendor for price/volume **and** news on a public paid site.

### Databento — best license terms, metered billing
- **No perpetual free tier**, but **$125 free credit** on signup; billing is **usage-based** (pay per data consumed), not flat monthly.
- **Commercial display:** strongest story — markets a **zero-license-fee US-equities bundle explicitly free to license for distribution, display, and non-display use** on web apps. No per-user/display license fees.
- For a once-daily EOD volume scan the data volume is tiny, so $125 of credit could last a very long time.
- Env var: **`DATABENTO_API_KEY`**. **Verdict:** best fit if you're comfortable with metered billing instead of a flat fee.

### Marketstack (apilayer/Idera) — cheapest flat commercial fee ⭐ display terms CONFIRMED
- **Free:** EOD-only, ~**100 req/mo** (official pricing page) vs "1,000/mo" (official FAQ — pages conflict; verify in dashboard). Free tier is **not** commercial-licensed.
- **Commercial Use is a listed feature only from the paid Basic tier (~$9.99/mo, 10,000 req/mo, +intraday, 10-yr history).** Cheapest flat commercial option here.
- ✅ **Display to end users is permitted** (resolved the earlier uncertainty). The usage terms state: *"you are permitted to receive, process, and **display marketstack API Data & Services to individual end-users of your application(s)**, provided such end users use [it] strictly for their own personal use, and you do not permit your end users to store, distribute, or otherwise exploit [it] for any other purposes."* So a commercial licensee on a paid plan **may show the data in its UI**; the "personal use" limit binds *your end users* (consumption only, no re-redistribution) — the normal B2C subscription pattern. Don't expose a raw data dump or re-serve their data via your own API.
- ℹ️ **Marketstack's US equity data is sourced from Tiingo, Inc.** (per their docs) — i.e. you get Tiingo data, display-licensed, for $9.99/mo flat, far cheaper than Tiingo's own quote-based display licence.
- Env var: **`MARKETSTACK_API_KEY`**. **Recommended cheapest launch option for price/volume.**

### Tiingo — good data, but display NOT self-serve
- Cheap headline pricing (free + ~$30–$50/mo paid) and 30+ yr daily OHLCV, IEX intraday, plus a separate News API.
- ⚠️ **All standard plans — including the paid "Commercial" plan — are "internal consumption only."** Publicly displaying/redistributing requires a **separate redistribution license** (quote-based, reported ~$250–$500/mo via sales) and a **"Data sourced by Tiingo"** attribution link. **Do not ship Tiingo data publicly on free/Commercial plans.** Env var: **`TIINGO_API_KEY`**.

### EODHD — cheap but personal-only at low tiers
- Free: 20 calls/day, EOD-only. Cheap "EOD All World" ~$19.99/mo is **personal-use licensed**; genuine commercial/display rights need business plans starting ~$299–$399/mo. Same trap as Marketstack but pricier to clear.

### Note on free/public-domain sources
- **SEC EDGAR (already used in this repo) cannot supply prices** — it's regulatory filings (Form 4, 10-K), with no OHLCV/volume feed. The volume-spike feature genuinely needs a separate market-data vendor; you can't reuse the `edgar-import` pipeline for it.

### Revised launch recommendation
| Stage | Price/volume | News | Why |
|---|---|---|---|
| **Prototype (free)** | FMP free (daily EOD US) | Alpha Vantage `NEWS_SENTIMENT` | Best free data; AV gives ready-made sentiment |
| **Launch — simplest** | **Twelve Data Venture (~$499/mo)** | Twelve Data news endpoint (same key) | One vendor, one license that explicitly permits public display, covers both features |
| **Launch — cheapest flat** | **Marketstack Basic (~$9.99/mo)** + Alpha Vantage commercial license for news | — | Lowest cost, but confirm Marketstack display wording in writing |
| **Launch — best license** | **Databento** ($125 credit, metered) | pair with a news vendor | Cleanest commercial-display rights; metered billing |

**Added env var keys for the launch options above (server-side only):**
```bash
TWELVE_DATA_API_KEY=     # simplest single-vendor launch (price/volume + news)
DATABENTO_API_KEY=       # best commercial license, metered billing
MARKETSTACK_API_KEY=     # cheapest flat commercial fee (price/volume)
TIINGO_API_KEY=          # only if you obtain a redistribution license
```

> Reminder: pricing/limits and license terms change and several pricing pages are JS-rendered (couldn't be machine-verified). Confirm the current commercial-display terms directly with whichever vendor you choose before launch.

---

## Free commercial-use options (no paid licence)

The question: is there a **genuinely free** source — no paid plan, no non-commercial restriction — whose licence lets me **display the data on a public, paid (commercial) website**? Honest answer per need below. *(Not legal advice — given the case law cited, have an IP attorney sign off before launch.)*

### Market data (stock prices + volume) — **NO free commercial option for real market data**

**Blunt verdict: there is no free, commercial-display-permitted source of consolidated US stock prices + volume. For a real product you will need a paid, redistribution/"display"-licensed feed.** Why — checked specifically:

- **SEC / EDGAR — public domain, but has NO prices/volume.** EDGAR is *filings only* (Form 4, 10-K, etc.); there is no market-quote feed. Public domain (17 U.S.C. §105), so commercially free to use — but useless for the volume-spike feature. (Great for your existing insider-data pipeline; not a market-data source.)
- **IEX — the one partial free+commercial option, with a big caveat.** IEX *Cloud* shut down for good in **Aug 2024** (dead). The **IEX Exchange** still offers free **delayed** TOPS/DEEP/HIST feeds with unusually permissive redistribution (delayed data is free to display, no end-user exchange agreement). **BUT it reflects only IEX-traded volume (~2–3% of US volume), not consolidated market volume** — so the "volume" number won't match what users expect for a volume-spike feature. Real-time IEX data needs a signed Data Subscriber Agreement. Usable only if IEX-only volume is acceptable; confirm current delayed-redistribution terms with IEX first.
- **Nasdaq Data Link / Quandl — no free commercial US price dataset.** The old free **WIKI Prices** dataset was frozen in **March 2018** and is deprecated; Nasdaq itself states there's no free replacement. All current US equity pricing is paid.
- **Stooq — legally unsafe.** Free OHLCV downloads exist, but the terms grant **no explicit commercial/redistribution right** (terms page wouldn't even render). Absence of a grant = you don't have the right. Don't ship it on a paid public site.
- **Yahoo Finance — prohibited.** No official free API; the developer ToS restricts data to **personal, non-commercial use** and forbids commercial redistribution. Scraping (`yfinance` etc.) violates the ToS. Exclude.
- **Public-domain / Creative-Commons OHLCV+volume — none exists.** Prices/volume are generated by exchanges, who license them for fees; the consolidated tape (SIP/CTA/UTP) is licensed, not public domain. There is no government/exchange/CC-BY dataset of free, commercially-redistributable consolidated US OHLCV+volume.
- **Alpha Vantage / Tiingo / Twelve Data free tiers — all non-commercial.** Confirmed: AV = "personal, non-commercial"; Tiingo = "internal consumption only"; Twelve Data free = no commercial use. Exclude all free tiers.

➡️ **Conclusion for market data: budget for a paid plan.** The cheapest *commercial-display-licensed* options remain (from the addendum above): **Marketstack Basic ~$9.99/mo** (flat, confirm display wording), **Databento** ($125 credit, metered, cleanest licence), or **Twelve Data Venture ~$499/mo** (explicit external-display licence + news). The only $0 path is **IEX delayed feed accepting IEX-only volume**.

### Financial news (headlines + summaries + links) — **YES, free commercial options exist**

**Blunt verdict: yes — but only from public-domain government data and a few explicitly-licensed sources. All mainstream publisher RSS feeds and most "free" news APIs forbid commercial use.** Stick to **headline + short snippet + link + attribution**; never reproduce full article text (the underlying articles stay copyrighted even when the feed is free).

**Safe (free + commercial use permitted):**
- **SEC EDGAR / SEC press-release RSS — safest, and already your core data.** Public domain (17 U.S.C. §105): no copyright, no commercial restriction, displayable behind a paywall. Feeds: `https://www.sec.gov/news/pressreleases.rss`, EDGAR full-text-search RSS, and `browse-edgar?...&output=atom` company/Form-4 feeds. **Only obligations are technical:** send a real `User-Agent` with a contact email and stay under 10 req/s. (Your `/api/edgar-import` already self-rate-limits — just set a contact User-Agent.)
- **GDELT DOC 2.0 API — best for broad market headlines.** Terms: "unlimited and unrestricted use for any academic, **commercial**, or governmental use… without fee." Returns headline (`title`), `url`, date, domain, thumbnail. **Mandatory: cite "The GDELT Project" with a link.** Caveat: the licence covers GDELT's *metadata* (headlines+links = low risk); **skip the `socialimage` thumbnails** (publisher-owned). No body snippet — you'd generate your own blurb.
- **NewsData.io — the one news API whose FREE tier explicitly allows commercial use.** Terms: "users can use the data for their personal or **commercial** purposes." Caveat: it's an aggregator, so commercial use is "at your own risk" and article copyright stays with publishers. (Re-confirm terms before shipping — page blocked automated fetch.)
- **Wikinews — CC BY** (attribution only, commercial OK). Clean but niche/low financial volume; supplement only.

**NOT free for commercial use (exclude unless licensed):**
- **All major publisher RSS** — Yahoo Finance, MarketWatch (Dow Jones), CNBC, Reuters (killed free RSS ~2020), Seeking Alpha, Investing.com, Nasdaq: uniformly "personal, non-commercial use only."
- **Free news APIs that are dev/non-commercial only:** NewsAPI.org (dev/testing only, no production), GNews ("free… cannot be used for commercial projects"), Mediastack (free = non-commercial), Marketaux (personal/non-commercial), **Finnhub company-news** (free = personal use only), Alpha Vantage / Tiingo / FMP / Polygon news (free = personal/internal).

**Legal nuance on headline+snippet+link (your exact design):**
- **US — generally fine.** Headlines usually aren't copyrightable (short-phrase doctrine); short factual snippet + link + attribution is classic fair use; "hot news" misappropriation is largely preempted (*Barclays v. Theflyonthewall*) **if you attribute and don't pass content off as your own**. But note *MidlevelU v. Newstex* (11th Cir.): an RSS feed grants only an **implied personal-use licence**, and a *commercial* aggregator reproducing summaries+links in a **paid** product exceeded it — almost your exact fact pattern. So prefer sources that *explicitly* licence you (above) over relying on fair use.
- **EU/UK — riskier.** EU CDSM Art. 15 gives publishers a right but exempts links and "very short extracts" (a multi-sentence summary can trigger licensing). UK *NLA v Meltwater*: headlines can be copyright and commercial clipping needs a licence.

➡️ **Conclusion for news: build on SEC EDGAR (public-domain, already your core) + GDELT DOC 2.0 (free, explicitly commercial, must cite GDELT, skip thumbnails), optionally NewsData.io free tier (commercial-OK, at your own risk) or Wikinews (CC BY). Avoid all publisher RSS and dev-only news APIs.**

### Summary table

| Need | Genuinely free + commercial-use option? | Name |
|---|---|---|
| Stock prices + **consolidated** volume | ❌ No — paid plan required | (cheapest: Marketstack ~$9.99/mo / Databento metered) |
| Stock prices + volume, **IEX-only volume acceptable** | ⚠️ Partial / $0 | IEX Exchange delayed TOPS/DEEP feed |
| Filings-as-news / company filings | ✅ Yes | SEC EDGAR RSS (public domain) |
| Broad financial news headlines+links | ✅ Yes | GDELT DOC 2.0 (cite GDELT) |
| News API, free tier, commercial-OK | ✅ Yes (at own risk) | NewsData.io |

**Env vars these free options would need (server-side only):**
```bash
# SEC EDGAR — no key; requires a contact User-Agent header instead:
SEC_EDGAR_USER_AGENT="The Hidden Ledger contact@yourdomain.com"
# GDELT DOC 2.0 — no API key required (open HTTP endpoint)
# NewsData.io (optional):
NEWSDATA_API_KEY=
```
