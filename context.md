# Globalmonitor (v3-global) — Live Context

Last updated: 2026-04-28.

## Live URL
- https://globalmonitor.fly.dev/ (Fly.io)
- Fallback configs: `render.yaml`, `vercel.json`

## Three-Region Theater Nav
Global Monitor now has three theaters: Middle East, Indo-Pacific, Thailand.

- Switcher lives in the header bar (top-right). Selecting a region:
  - moves the camera to that region's preset viewState,
  - swaps the Live TV channel grid to the region's curated set,
  - swaps the right-sidebar + bottom-bar panels to region-relevant content,
  - resets the selected country/province (CountryNewsPanel re-defaults to the first item).

Single source of truth: [src/data/regions.js](src/data/regions.js) — viewStates, dot data, news queries, TV channels all live here. Add/edit a theater there and it propagates.

## Map Stack — what changed in this audit
- **Satellite basemap fixed**: previously pointed at MapTiler with the literal docs placeholder key (`get_your_own_OpIi9ZULNHzrESv6T2vL`) — rendered blank in production. Replaced with an inline ESRI World Imagery raster style (no key required).
- **Tile error handler**: `map.on('error')` is now wired in [MapContainer.jsx](src/components/MapContainer.jsx). Failed sources surface as a small amber "N layers unavailable" badge bottom-right.
- **NASA GIBS redundancy**: every GIBS layer in [eoTiles.js](src/services/eoTiles.js) now uses 3 subdomain mirrors (`gibs`, `gibs-a`, `gibs-b`) for round-robin tile loads.
- **Cursor lat/lng readout**: bottom-left of map. Mono, hairline cyan border, copy-to-clipboard button.

## Per-Country News
- ASEAN-10 capitals + 8 Thai sub-regions are rendered as clickable dots when in Indo-Pacific / Thailand mode.
- Click a dot → CountryNewsPanel switches to that country/province → tech + urgent news appear.
- LocalStorage cache: previously-visited countries show cached items instantly while a fresh fetch happens in the background.

## Supabase — Systematic Data Collection

Globalmonitor reuses the existing **geopolitics-dashboard** Supabase project to keep cost at $0 (free tier permits 2 projects per org). Tables are namespaced with `gm_` prefix to avoid colliding with the geopolitics-dashboard schema.

- **Project URL**: https://qbatksnulitgrhigzbta.supabase.co
- **Project ref**: `qbatksnulitgrhigzbta`
- **Tier**: Free (shared org with geopolitics-dashboard)

### Required env vars (server-side only)
```
GM_SUPABASE_URL=https://qbatksnulitgrhigzbta.supabase.co
GM_SUPABASE_SERVICE_KEY=<service_role JWT — see /Users/nonarkara/Projects/shared/.secrets-backup/dashboards_geopolitics-dashboard_.env>
```

If either env var is missing, the Supabase client silently no-ops and the dashboard falls back to direct Google News fetches via the CORS proxy chain. Local dev still works without Supabase configured.

### One-time DB setup (Supabase has no CLI for ad-hoc DDL without DB password)
1. Open https://supabase.com/dashboard/project/qbatksnulitgrhigzbta/sql/new
2. Paste contents of [supabase/migrations/001_globalmonitor_news.sql](supabase/migrations/001_globalmonitor_news.sql)
3. Click Run. Migration is idempotent (`CREATE TABLE IF NOT EXISTS`).

### Tables created
- `gm_news_items` — per-country/province news cache, de-duped by URL
- `gm_ingestion_runs` — heartbeat log per loader run (for source-health surface)
- `gm_region_visits` — region tab visit telemetry (drives render-prioritisation)

All tables have public-read RLS policies. Writes restricted to `service_role`.

### Backend ingestion
- [server/lib/supabase.mjs](server/lib/supabase.mjs) — Supabase client singleton + helpers
- [server/lib/regionalNewsIngest.mjs](server/lib/regionalNewsIngest.mjs) — fetches RSS, persists, returns
- API endpoint: `GET /api/regional-news?region=indopacific&code=TH` (or `region=thailand&code=BKK`)
- Health: `GET /api/supabase-health`

### Frontend integration
- [src/services/regionalCountryNews.js](src/services/regionalCountryNews.js) prefers the backend route. Falls back to direct Google News via `allorigins → codetabs → corsproxy.io` if backend is unreachable.

### Adding more loaders to Supabase
Pattern: extend [server/lib/supabase.mjs](server/lib/supabase.mjs) with an `upsertX` function, write an ingestion lib that calls it + `recordIngestionRun()`, add the route to `server/index.mjs`. Existing loaders (FIRMS, ACLED, weather) are good next candidates — they already have `useCached` wrappers in `index.mjs`; piping the cached payload through `upsert` is a one-liner per loader.

## Anti-Regression Reminders
Read [CLAUDE.md](CLAUDE.md) before editing this project. Hard rules:
- Live world-map visualization stays — do not replace with static.
- Tactical color palette only (amber/obsidian/cyan). Zero pastels, gradients, round corners.
- `[EVENT_ID]` mono incident tags + monospaced coordinate readouts preserved.
- Global scope — do not regress to Middle East only. V1 and V2 exist for that.
