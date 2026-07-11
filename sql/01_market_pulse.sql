-- =============================================================================
-- Feature 1 — MARKET PULSE (GDELT news)  +  post-key-fix RLS read policies
-- Run this in the Supabase SQL Editor.
--
-- CONTEXT: the swapped Supabase keys have been fixed, so the server ingestion
-- route (/api/ingest-news) now runs as a TRUE service_role and bypasses RLS on
-- writes. Tables therefore need only PUBLIC READ so the browser (true anon key)
-- can display their contents — no public write policy is required.
--
-- Now that the browser uses the real anon key, every RLS-enabled table the
-- client reads needs a public read policy. These four are read by client pages
-- and were previously only readable because the anon slot secretly held the
-- service_role key:
--   * news_articles          -> Market Pulse feed
--   * article_stock_impacts  -> Market Pulse ticker tags
--   * billionaire_profiles   -> Billionaires Corner page
--   * cron_logs              -> Admin dashboard
-- (companies / rankings / insider_transactions / insiders were verified to read
--  fine under the true anon key already, so they are intentionally untouched.)
--
-- This script also DROPS the public-write policies from the earlier version of
-- this file, in case they were ever applied — writes go through service_role
-- now and should not be left open to the anon key.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- Ensure RLS is on (no-op if already enabled).
alter table news_articles          enable row level security;
alter table article_stock_impacts  enable row level security;
alter table billionaire_profiles   enable row level security;
alter table cron_logs              enable row level security;

-- ---------------------------------------------------------------------------
-- PUBLIC READ (idempotent re-create; matches the project convention).
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public read" on news_articles;
create policy "Allow public read" on news_articles          for select to public using (true);

drop policy if exists "Allow public read" on article_stock_impacts;
create policy "Allow public read" on article_stock_impacts  for select to public using (true);

drop policy if exists "Allow public read" on billionaire_profiles;
create policy "Allow public read" on billionaire_profiles   for select to public using (true);

drop policy if exists "Allow public read" on cron_logs;
create policy "Allow public read" on cron_logs              for select to public using (true);

-- ---------------------------------------------------------------------------
-- CLEANUP — drop the public WRITE policies from the previous version of this
-- file. Writes now go through service_role (which bypasses RLS), so these are
-- no longer needed and should not be left open. Safe if they never existed.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public insert" on news_articles;
drop policy if exists "Allow public update" on news_articles;
drop policy if exists "Allow public insert" on article_stock_impacts;
drop policy if exists "Allow public update" on article_stock_impacts;
