/**
 * Supabase client singleton — server side.
 *
 * Globalmonitor reuses the geopolitics-dashboard Supabase project to keep
 * costs at $0 (Supabase free tier allows 2 projects per org, so this avoids
 * needing a third). Tables are namespaced with `gm_` to avoid colliding
 * with the existing geopolitics-dashboard schema.
 *
 * Required environment variables (server-side only):
 *   GM_SUPABASE_URL              e.g. https://qbatksnulitgrhigzbta.supabase.co
 *   GM_SUPABASE_SERVICE_KEY      service_role JWT (NEVER ship in client bundle)
 *
 * If either env var is missing the client is null and ingestion silently no-ops.
 * That keeps local dev frictionless — the dashboard works without Supabase.
 */
import { createClient } from '@supabase/supabase-js';

let client = null;
let lastInitMessage = null;

const init = () => {
    if (client) return client;
    const url = process.env.GM_SUPABASE_URL;
    const key = process.env.GM_SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        lastInitMessage = 'Supabase env vars missing — ingestion disabled.';
        return null;
    }
    client = createClient(url, key, { auth: { persistSession: false } });
    lastInitMessage = `Supabase client initialised for ${url}`;
    return client;
};

export const getSupabase = () => init();

export const isSupabaseEnabled = () => Boolean(init());

export const getSupabaseStatusMessage = () => lastInitMessage;

/**
 * Insert news items in bulk. De-duped by (region, code, link) at the DB layer.
 * Returns { inserted, skipped, error } — caller decides what to surface.
 */
export const upsertNewsItems = async (region, code, items) => {
    const sb = init();
    if (!sb) return { inserted: 0, skipped: items.length, error: 'supabase-disabled' };
    if (!Array.isArray(items) || items.length === 0) {
        return { inserted: 0, skipped: 0, error: null };
    }
    const rows = items.map((it) => ({
        region,
        code,
        title: it.title,
        link: it.link,
        source: it.source || null,
        tag: it.tag || null,
        pub_date: it.pubDate ? new Date(it.pubDate).toISOString() : null
    }));
    const { data, error } = await sb
        .from('gm_news_items')
        .upsert(rows, { onConflict: 'region,code,link', ignoreDuplicates: true });
    if (error) return { inserted: 0, skipped: rows.length, error: error.message };
    return { inserted: data?.length || rows.length, skipped: 0, error: null };
};

/**
 * Read recent news items for a region/code. Limit defaults to 8.
 */
export const fetchNewsItems = async (region, code, limit = 8) => {
    const sb = init();
    if (!sb) return [];
    const { data, error } = await sb
        .from('gm_news_items')
        .select('title, link, source, tag, pub_date, fetched_at')
        .eq('region', region)
        .eq('code', code)
        .order('pub_date', { ascending: false, nullsFirst: false })
        .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
        title: r.title,
        link: r.link,
        source: r.source,
        tag: r.tag,
        pubDate: r.pub_date ? new Date(r.pub_date) : new Date(r.fetched_at)
    }));
};

/**
 * Log an ingestion run for the source-health panel.
 */
export const recordIngestionRun = async ({ loader, region = null, status, rowsInserted = 0, rowsUpdated = 0, errorMessage = null, durationMs = 0 }) => {
    const sb = init();
    if (!sb) return;
    await sb.from('gm_ingestion_runs').insert({
        loader,
        region,
        status,
        rows_inserted: rowsInserted,
        rows_updated: rowsUpdated,
        error_message: errorMessage,
        duration_ms: durationMs,
        finished_at: new Date().toISOString()
    });
};
