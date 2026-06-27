-- =============================================================================
-- The Hidden Ledger — additive schema migration
-- Run this in the Supabase SQL Editor.
--
-- WHAT THIS DOES (and does NOT do):
--   * ADDS the 9 tables you don't have yet. Does NOT touch or drop the existing
--     `companies`, `insiders`, `trades`, or `rankings` tables — your data
--     (98 companies / 72 insiders / 326 trades / 98 rankings) stays put.
--   * COPIES the existing trades -> insider_transactions and
--     rankings -> confidence_score_breakdowns so the new tables are populated
--     and the app keeps working after the code is repointed. The old `trades`
--     and `rankings` tables are LEFT IN PLACE as a backup (nothing is dropped).
--
-- DESIGN NOTES:
--   * `insider_transactions` and `confidence_score_breakdowns` are deliberate
--     SUPERSETS of the legacy `trades`/`rankings` tables: they carry the clean
--     normalized columns AND the denormalized columns the UI already reads
--     (insider_name, insider_title, price, ai_summary, ai_reasons, ...). This
--     lets the code change be a pure table-name swap with no column edits.
--   * `price` on insider_transactions is a GENERATED column mirroring
--     price_per_share, so writers that only set price_per_share still satisfy
--     readers that use `price` (company page, sell-alerts, admin).
--   * UUID ids via gen_random_uuid(), matching the existing tables.
--   * Idempotent: CREATE ... IF NOT EXISTS and INSERT ... ON CONFLICT DO NOTHING,
--     so re-running is safe.
-- =============================================================================

create extension if not exists pgcrypto;

begin;

-- NOTE: `companies` and `insiders` already exist and are intentionally NOT
-- recreated here. The FKs below reference them as-is.

-- -----------------------------------------------------------------------------
-- 1. securities — issued securities per company (common stock, options, …)
-- -----------------------------------------------------------------------------
create table if not exists securities (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies (id) on delete cascade,
  title           text not null,            -- e.g. "Common Stock", "Stock Option (Right to Buy)"
  security_type   text not null default 'equity',  -- 'equity' | 'derivative'
  is_derivative   boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (company_id, title)
);
create index if not exists idx_securities_company on securities (company_id);

-- -----------------------------------------------------------------------------
-- 2. filings — one row per SEC Form 4 submission (accession number = adsh)
-- -----------------------------------------------------------------------------
create table if not exists filings (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies (id) on delete cascade,
  accession_number    text not null unique, -- adsh, e.g. 0000320193-24-000123
  form_type           text not null default '4',
  filer_cik           text,
  period_of_report    date,
  filed_at            timestamptz,
  filing_url          text,
  source              text not null default 'sec_edgar',
  created_at          timestamptz not null default now()
);
create index if not exists idx_filings_company on filings (company_id);
create index if not exists idx_filings_filed_at on filings (filed_at);

-- -----------------------------------------------------------------------------
-- 3. insider_transactions — normalized replacement for `trades`.
--    SUPERSET: clean columns + the denormalized columns the UI reads.
--    Unique key matches the existing upsert grain so re-imports stay idempotent.
-- -----------------------------------------------------------------------------
create table if not exists insider_transactions (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references companies (id) on delete cascade,
  insider_id              uuid not null references insiders (id) on delete cascade,
  security_id             uuid references securities (id) on delete set null,
  filing_id               uuid references filings (id) on delete set null,
  transaction_date        date not null,
  trade_date              date,             -- legacy denormalized duplicate of transaction_date
  transaction_code        text,             -- raw Form 4 code: P, S, A, M, F, G, …
  transaction_type        text,             -- normalized: 'BUY' (P) | 'SELL' (S)
  trade_type              text,             -- legacy denormalized duplicate of transaction_type
  acquired_disposed_code  text,             -- 'A' acquired | 'D' disposed
  ownership_type          text,             -- 'D' direct | 'I' indirect
  shares                  numeric not null default 0,
  price_per_share         numeric not null default 0,
  price                   numeric generated always as (price_per_share) stored,  -- UI reads `price`
  total_value             numeric not null default 0,
  shares_owned_following  numeric,
  is_derivative           boolean not null default false,
  insider_name            text,             -- denormalized (CLAUDE.md: intentionally redundant)
  insider_title           text,             -- denormalized
  source                  text not null default 'sec_edgar',
  source_type             text,             -- legacy denormalized source tag
  form4_url               text,
  created_at              timestamptz not null default now(),
  unique (company_id, insider_id, transaction_date, shares)
);
create index if not exists idx_tx_company on insider_transactions (company_id);
create index if not exists idx_tx_insider on insider_transactions (insider_id);
create index if not exists idx_tx_date on insider_transactions (transaction_date);
create index if not exists idx_tx_type on insider_transactions (transaction_type);

-- -----------------------------------------------------------------------------
-- 4. confidence_score_breakdowns — normalized replacement for `rankings`.
--    SUPERSET: components + the ai_summary / ai_reasons / reason fields the UI
--    reads. One row per company; matches the upsert in calculate-scores.
-- -----------------------------------------------------------------------------
create table if not exists confidence_score_breakdowns (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references companies (id) on delete cascade,
  ticker                text,
  score                 integer not null default 0,
  insider_conviction    integer not null default 0,
  leadership_alignment  integer not null default 0,
  historical_edge       integer not null default 0,
  capital_commitment    integer not null default 0,
  ai_opportunity        integer not null default 0,
  reason                text,               -- legacy free-text reason
  ai_summary            text,               -- read by homepage / screener / company page
  ai_reasons            jsonb not null default '[]'::jsonb,  -- read by company page (legacy `rankings.ai_reasons` is jsonb)
  ranked_at             timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (company_id)
);
create index if not exists idx_scores_score on confidence_score_breakdowns (score desc);

-- -----------------------------------------------------------------------------
-- 5. billionaire_profiles — tracked wealthy individuals (Billionaires Corner)
--    Maps to page fields: name, cat(egory), flag(country), nw(net worth), firm.
-- -----------------------------------------------------------------------------
create table if not exists billionaire_profiles (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text,                     -- 'richest' | 'affluent' | 'entrepreneur' | 'tech'
  country         text,
  net_worth_usd   numeric,
  firm            text,
  rank            integer,
  bio             text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (name)
);
create index if not exists idx_billionaire_category on billionaire_profiles (category);

-- -----------------------------------------------------------------------------
-- 6. billionaire_holdings — what a billionaire bought/sold/holds
--    Maps to page fields: ticker, stock, action, value, date, notes.
-- -----------------------------------------------------------------------------
create table if not exists billionaire_holdings (
  id              uuid primary key default gen_random_uuid(),
  billionaire_id  uuid not null references billionaire_profiles (id) on delete cascade,
  company_id      uuid references companies (id) on delete set null,
  ticker          text,
  stock_name      text,
  action          text,                     -- 'BUY' | 'SELL' | 'HOLD'
  value_usd       numeric,
  holding_date    date,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_holdings_billionaire on billionaire_holdings (billionaire_id);
create index if not exists idx_holdings_company on billionaire_holdings (company_id);

-- -----------------------------------------------------------------------------
-- 7. news_articles — market news feed (Market Pulse)
--    Maps to page fields: headline, summary, category, impact, timeAgo,
--    tags, insiderSignal, insiderNote.
-- -----------------------------------------------------------------------------
create table if not exists news_articles (
  id              uuid primary key default gen_random_uuid(),
  headline        text not null,
  summary         text,
  category        text,
  impact          text,                     -- 'HIGH' | 'MEDIUM' | 'LOW'
  insider_signal  text,                     -- 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  insider_note    text,
  tags            text[] not null default '{}',
  source          text,
  url             text,
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_news_published on news_articles (published_at);
create index if not exists idx_news_impact on news_articles (impact);

-- -----------------------------------------------------------------------------
-- 8. article_stock_impacts — junction: which tickers each article moves
-- -----------------------------------------------------------------------------
create table if not exists article_stock_impacts (
  id              uuid primary key default gen_random_uuid(),
  article_id      uuid not null references news_articles (id) on delete cascade,
  company_id      uuid references companies (id) on delete set null,
  ticker          text not null,
  sentiment       text,                     -- 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  impact          text,                     -- 'HIGH' | 'MEDIUM' | 'LOW'
  created_at      timestamptz not null default now(),
  unique (article_id, ticker)
);
create index if not exists idx_impacts_article on article_stock_impacts (article_id);
create index if not exists idx_impacts_company on article_stock_impacts (company_id);

-- -----------------------------------------------------------------------------
-- 9. market_volume_signals — unusual-volume / "volume explosion" events
-- -----------------------------------------------------------------------------
create table if not exists market_volume_signals (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies (id) on delete cascade,
  ticker              text not null,
  signal_date         date not null,
  volume              bigint,
  avg_volume          bigint,
  volume_ratio        numeric,
  price               numeric,
  price_change_pct    numeric,
  signal_type         text,                 -- e.g. 'VOLUME_EXPLOSION'
  notes               text,
  created_at          timestamptz not null default now(),
  unique (ticker, signal_date)
);
create index if not exists idx_volume_company on market_volume_signals (company_id);
create index if not exists idx_volume_date on market_volume_signals (signal_date);

-- =============================================================================
-- DATA BACKFILL — copy existing rows into the new tables (old tables untouched).
-- `price` is GENERATED, so it is intentionally excluded from the column list.
-- =============================================================================

-- Column-type reconciliation (verified against the live schema):
--   trades.transaction_date is TEXT  -> cast to date; skip rows that aren't a
--                                       valid YYYY-MM-DD (target is NOT NULL).
--   trades.trade_date       is DATE  -> direct copy (NULLs pass through).
--   trades.created_at        is TIMESTAMP (no tz) -> cast to timestamptz.
--   trades.shares            is INTEGER -> widens to numeric implicitly.
insert into insider_transactions (
  company_id, insider_id, transaction_date, trade_date,
  transaction_type, trade_type, shares, price_per_share, total_value,
  insider_name, insider_title, source, source_type, form4_url, created_at
)
select
  company_id, insider_id,
  btrim(transaction_date::text)::date,
  trade_date,
  transaction_type, trade_type, shares, price_per_share, total_value,
  insider_name, insider_title, source, source_type, form4_url,
  created_at::timestamptz
from trades
where btrim(transaction_date::text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
on conflict (company_id, insider_id, transaction_date, shares) do nothing;

insert into confidence_score_breakdowns (
  company_id, ticker, score,
  insider_conviction, leadership_alignment, historical_edge,
  capital_commitment, ai_opportunity, reason, ai_summary, ai_reasons,
  ranked_at, updated_at
)
-- Column-type reconciliation (verified against the live schema):
--   rankings.score      is NUMERIC -> cast to integer.
--   rankings.ai_reasons is JSONB   -> matches the jsonb column; coalesce NULLs.
--   rankings.ranked_at  is TIMESTAMP (no tz) -> cast to timestamptz.
--   rankings.updated_at is TIMESTAMPTZ -> direct copy.
select
  company_id, ticker, score::integer,
  insider_conviction, leadership_alignment, historical_edge,
  capital_commitment, ai_opportunity, reason, ai_summary,
  coalesce(ai_reasons, '[]'::jsonb),
  ranked_at::timestamptz, updated_at::timestamptz
from rankings
on conflict (company_id) do nothing;

commit;

-- Sanity check (optional — run separately after committing):
--   select 'trades' src, count(*) from trades
--   union all select 'insider_transactions', count(*) from insider_transactions
--   union all select 'rankings', count(*) from rankings
--   union all select 'confidence_score_breakdowns', count(*) from confidence_score_breakdowns;
