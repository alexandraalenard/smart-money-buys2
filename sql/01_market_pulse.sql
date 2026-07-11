-- =============================================================================
-- Feature 1 — MARKET PULSE (GDELT news)
-- Run this in the Supabase SQL Editor.
--
-- The `news_articles` and `article_stock_impacts` tables ALREADY EXIST (from the
-- earlier 11-table migration) and already have public read access. This script
-- only adds the WRITE access the ingestion route needs.
--
-- WHY WRITE POLICIES ARE NEEDED HERE:
--   The env keys are currently swapped — SUPABASE_SERVICE_ROLE_KEY holds an
--   ANON-role JWT — so the server route writes as the anon role and RLS blocks
--   it. Rather than change your live keys (which affects the whole site), these
--   two policies let the ingestion route insert/tag news on these two tables
--   only. This is a private personal-use tool, so scoped public write here is an
--   acceptable trade-off. (If you later fix the key swap so the route truly runs
--   as service_role, service_role bypasses RLS and you can drop these two write
--   policies.)
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- Make sure RLS is on (no-op if already enabled).
alter table news_articles          enable row level security;
alter table article_stock_impacts  enable row level security;

-- Public READ (idempotent re-create; matches the project convention).
drop policy if exists "Allow public read" on news_articles;
create policy "Allow public read" on news_articles          for select to public using (true);

drop policy if exists "Allow public read" on article_stock_impacts;
create policy "Allow public read" on article_stock_impacts  for select to public using (true);

-- WRITE access for the ingestion route (insert new articles, update summaries,
-- and upsert ticker tags).
drop policy if exists "Allow public insert" on news_articles;
create policy "Allow public insert" on news_articles          for insert to public with check (true);

drop policy if exists "Allow public update" on news_articles;
create policy "Allow public update" on news_articles          for update to public using (true) with check (true);

drop policy if exists "Allow public insert" on article_stock_impacts;
create policy "Allow public insert" on article_stock_impacts  for insert to public with check (true);

drop policy if exists "Allow public update" on article_stock_impacts;
create policy "Allow public update" on article_stock_impacts  for update to public using (true) with check (true);
