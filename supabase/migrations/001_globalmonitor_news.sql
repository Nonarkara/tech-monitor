-- ============================================================
-- Globalmonitor (v3-global) — Systematic Data Collection
--
-- Globalmonitor reuses the geopolitics-dashboard Supabase project
-- (https://qbatksnulitgrhigzbta.supabase.co) to keep costs at $0
-- on the free tier. Tables are namespaced with `gm_` prefix to avoid
-- collisions with the existing geopolitics-dashboard schema.
--
-- Apply via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qbatksnulitgrhigzbta/sql/new
-- (Paste this file, click Run.) Safe to re-run — uses IF NOT EXISTS.
-- ============================================================

-- ── PER-COUNTRY NEWS ITEMS ──
-- One row per news article. Country code is ISO-3166 alpha-2
-- (TH, VN, ID, MY, SG, PH, MM, KH, LA, BN) for ASEAN; for Thailand
-- province codes we use the internal codes from src/data/regions.js.
CREATE TABLE IF NOT EXISTS gm_news_items (
    pk             BIGSERIAL PRIMARY KEY,
    region         TEXT NOT NULL,                  -- 'indopacific' | 'thailand' | 'middleeast'
    code           TEXT NOT NULL,                  -- country/province code (TH, VN, BKK, etc.)
    title          TEXT NOT NULL,
    link           TEXT NOT NULL,
    source         TEXT,
    tag            TEXT,                           -- 'tech' | 'urgent' | other
    pub_date       TIMESTAMPTZ,
    fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw            JSONB,
    UNIQUE (region, code, link)                    -- de-dupe by article URL within region/code
);
CREATE INDEX IF NOT EXISTS gm_news_region_code_idx ON gm_news_items(region, code, pub_date DESC);
CREATE INDEX IF NOT EXISTS gm_news_fetched_idx ON gm_news_items(fetched_at DESC);
CREATE INDEX IF NOT EXISTS gm_news_pub_idx ON gm_news_items(pub_date DESC);

-- ── INGESTION RUN LOG ──
-- Heartbeat for each loader run. If a loader stops writing here for >1 hour,
-- the dashboard's Source Health panel can flag it as silent-broken.
CREATE TABLE IF NOT EXISTS gm_ingestion_runs (
    pk             BIGSERIAL PRIMARY KEY,
    loader         TEXT NOT NULL,                  -- 'asean_news' | 'thai_news' | 'firms' | etc.
    region         TEXT,
    status         TEXT NOT NULL,                  -- 'ok' | 'partial' | 'fail'
    rows_inserted  INTEGER DEFAULT 0,
    rows_updated   INTEGER DEFAULT 0,
    error_message  TEXT,
    duration_ms    INTEGER,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS gm_runs_loader_idx ON gm_ingestion_runs(loader, started_at DESC);
CREATE INDEX IF NOT EXISTS gm_runs_status_idx ON gm_ingestion_runs(status, started_at DESC);

-- ── REGION VISIT TELEMETRY ──
-- Counts how often each region tab is opened. Drives the choice of which
-- region to render-prioritise on cold load (always-on for top-3 by visit count).
CREATE TABLE IF NOT EXISTS gm_region_visits (
    region        TEXT PRIMARY KEY,
    visit_count   BIGINT NOT NULL DEFAULT 0,
    last_visit_at TIMESTAMPTZ
);
INSERT INTO gm_region_visits (region, visit_count) VALUES
    ('middleeast', 0), ('indopacific', 0), ('thailand', 0)
ON CONFLICT (region) DO NOTHING;

-- ── ROW-LEVEL SECURITY ──
-- Public read for everyone (the dashboard is a public dashboard).
-- Writes restricted to service_role (server-side ingestion only).
ALTER TABLE gm_news_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_ingestion_runs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_region_visits    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gm_news_public_read" ON gm_news_items;
CREATE POLICY "gm_news_public_read" ON gm_news_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "gm_runs_public_read" ON gm_ingestion_runs;
CREATE POLICY "gm_runs_public_read" ON gm_ingestion_runs FOR SELECT USING (true);

DROP POLICY IF EXISTS "gm_visits_public_read" ON gm_region_visits;
CREATE POLICY "gm_visits_public_read" ON gm_region_visits FOR SELECT USING (true);

-- ── BUMP REGION VISIT (callable from frontend with anon key) ──
CREATE OR REPLACE FUNCTION gm_bump_region_visit(p_region TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO gm_region_visits (region, visit_count, last_visit_at)
    VALUES (p_region, 1, NOW())
    ON CONFLICT (region)
    DO UPDATE SET
        visit_count   = gm_region_visits.visit_count + 1,
        last_visit_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION gm_bump_region_visit(TEXT) TO anon, authenticated;
