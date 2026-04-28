/**
 * Per-country / per-province news fetcher.
 *
 * Uses the same CORS-proxy fallback chain as RegionalNewsPanel
 * (allorigins → codetabs → corsproxy.io) so a single proxy outage
 * doesn't kill the feed. Returns parsed RSS items keyed by country code.
 */

import { ASEAN_NEWS_QUERIES, THAI_NEWS_QUERIES } from '../data/regions.js';
import { fetchBackendJson } from './backendClient.js';

/** Try the backend Supabase-backed endpoint first. Returns null on failure
 *  so callers can fall back to the direct Google News + CORS proxy chain. */
const tryBackend = async (region, code) => {
    try {
        const data = await fetchBackendJson('/api/regional-news', { region, code });
        if (Array.isArray(data?.items) && data.items.length > 0) {
            return data.items.map((it) => ({
                ...it,
                pubDate: it.pubDate ? new Date(it.pubDate) : new Date()
            }));
        }
    } catch {
        // backend unreachable — caller will try the proxy chain
    }
    return null;
};

const parseRssXml = (xml, max = 6) => {
    if (!xml || typeof xml !== 'string') return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return [];
    const items = doc.querySelectorAll('item');
    const out = [];
    Array.from(items).slice(0, max).forEach((item) => {
        const title = item.querySelector('title')?.textContent;
        const link = item.querySelector('link')?.textContent;
        const pubDateStr = item.querySelector('pubDate')?.textContent;
        const source = item.querySelector('source')?.textContent || 'Google News';
        if (title && link && title !== 'Google News') {
            out.push({
                title,
                link,
                source,
                pubDate: pubDateStr ? new Date(pubDateStr) : new Date()
            });
        }
    });
    return out;
};

const fetchViaProxyChain = async (rssUrl) => {
    const fresh = `${rssUrl}${rssUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
    const encoded = encodeURIComponent(fresh);

    const proxies = [
        { url: `https://api.allorigins.win/get?url=${encoded}`, extract: async (res) => (await res.json())?.contents },
        { url: `https://api.codetabs.com/v1/proxy?quest=${encoded}`, extract: async (res) => res.text() },
        { url: `https://corsproxy.io/?url=${encoded}`, extract: async (res) => res.text() }
    ];

    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy.url);
            if (!res.ok) continue;
            const text = await proxy.extract(res);
            if (typeof text !== 'string' || !text.includes('<')) continue;
            const items = parseRssXml(text);
            if (items.length > 0) return items;
        } catch {
            // try next proxy
        }
    }
    return [];
};

/**
 * Fetch tech + urgent news for one ASEAN country.
 * Returns { code, items: [...] } with the two streams merged + de-duped + sorted.
 */
export const fetchAseanCountryNews = async (countryCode) => {
    const queries = ASEAN_NEWS_QUERIES[countryCode];
    if (!queries) return { code: countryCode, items: [] };

    // Backend (Supabase-backed) is preferred — single round-trip, server-side cache,
    // already de-duped and persisted. Only fall through to direct CORS proxies
    // when the backend is unreachable (e.g. local dev without server running).
    const fromBackend = await tryBackend('indopacific', countryCode);
    if (fromBackend) return { code: countryCode, items: fromBackend };

    const [tech, urgent] = await Promise.all([
        fetchViaProxyChain(queries.tech),
        fetchViaProxyChain(queries.urgent)
    ]);
    const tagged = [
        ...tech.map((it) => ({ ...it, tag: 'tech' })),
        ...urgent.map((it) => ({ ...it, tag: 'urgent' }))
    ];
    const seen = new Set();
    const deduped = tagged.filter((it) => {
        const key = it.link;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    deduped.sort((a, b) => (b.pubDate?.getTime?.() || 0) - (a.pubDate?.getTime?.() || 0));
    return { code: countryCode, items: deduped.slice(0, 8) };
};

/**
 * Same for Thailand sub-region (province / sector code).
 */
export const fetchThaiRegionNews = async (regionCode) => {
    const queries = THAI_NEWS_QUERIES[regionCode];
    if (!queries) return { code: regionCode, items: [] };

    const fromBackend = await tryBackend('thailand', regionCode);
    if (fromBackend) return { code: regionCode, items: fromBackend };

    const [tech, urgent] = await Promise.all([
        fetchViaProxyChain(queries.tech),
        fetchViaProxyChain(queries.urgent)
    ]);
    const tagged = [
        ...tech.map((it) => ({ ...it, tag: 'tech' })),
        ...urgent.map((it) => ({ ...it, tag: 'urgent' }))
    ];
    const seen = new Set();
    const deduped = tagged.filter((it) => {
        const key = it.link;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    deduped.sort((a, b) => (b.pubDate?.getTime?.() || 0) - (a.pubDate?.getTime?.() || 0));
    return { code: regionCode, items: deduped.slice(0, 8) };
};
