import http from 'node:http';
import { URL } from 'node:url';
import {
    buildCopernicusUnavailablePayload,
    fetchCopernicusPreview,
    isCopernicusConfigured,
    parseCopernicusPreviewOptions
} from './lib/copernicus.mjs';
import { fetchBriefingPayload, fetchTickerPayload } from './lib/intelligence.mjs';
import { fetchMarketPayload } from './lib/marketData.mjs';

const PORT = Number(process.env.PORT || 4000);
const cache = new Map();
const loaderHealth = new Map();

const json = (response, statusCode, payload, meta = {}) => {
    response.writeHead(statusCode, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Tech-Status': meta.status || 'live',
        'X-Tech-Updated-At': meta.updatedAt || '',
        'X-Tech-Cache': meta.cache || 'miss'
    });
    response.end(JSON.stringify(payload));
};

const recordHealth = (key, ok, message = null) => {
    loaderHealth.set(key, {
        ok,
        checkedAt: new Date().toISOString(),
        message
    });
};

const useCached = async (key, ttlMs, loader, isUsable) => {
    const now = Date.now();
    const current = cache.get(key);

    if (current && current.expiresAt > now) {
        recordHealth(key, true, null);
        return {
            payload: current.payload,
            meta: {
                status: 'live',
                updatedAt: current.updatedAt,
                cache: 'hit'
            }
        };
    }

    try {
        const payload = await loader();

        if (!isUsable(payload)) {
            throw new Error('No usable payload returned');
        }

        const updatedAt = new Date().toISOString();
        cache.set(key, {
            payload,
            updatedAt,
            expiresAt: now + ttlMs
        });
        recordHealth(key, true, null);

        return {
            payload,
            meta: {
                status: 'live',
                updatedAt,
                cache: current ? 'refresh' : 'miss'
            }
        };
    } catch (error) {
        recordHealth(key, false, error.message);

        if (current) {
            return {
                payload: current.payload,
                meta: {
                    status: 'stale',
                    updatedAt: current.updatedAt,
                    cache: 'stale'
                }
            };
        }

        throw error;
    }
};

const parseSourceIds = (searchParams) => {
    const raw = searchParams.get('sourceIds');
    if (!raw) return null;

    return raw.split(',').map((value) => value.trim()).filter(Boolean);
};

const server = http.createServer(async (request, response) => {
    if (!request.url) {
        json(response, 400, { error: 'Missing request URL' }, { status: 'offline' });
        return;
    }

    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        response.end();
        return;
    }

    if (request.method !== 'GET') {
        json(response, 405, { error: 'Method not allowed' }, { status: 'offline' });
        return;
    }

    const url = new URL(request.url, `http://${request.headers.host || `127.0.0.1:${PORT}`}`);
    const sourceIds = parseSourceIds(url.searchParams);

    try {
        if (url.pathname === '/api/health') {
            const entries = Array.from(cache.entries()).map(([key, value]) => ({
                key,
                updatedAt: value.updatedAt,
                expiresInMs: Math.max(0, value.expiresAt - Date.now())
            }));

            json(response, 200, {
                ok: true,
                now: new Date().toISOString(),
                cacheEntries: entries,
                loaderHealth: Object.fromEntries(loaderHealth.entries())
            });
            return;
        }

        if (url.pathname === '/api/ticker') {
            const result = await useCached(
                `ticker:${sourceIds?.join(',') || 'default'}`,
                120000,
                () => fetchTickerPayload(sourceIds),
                (payload) => Array.isArray(payload) && payload.length > 0
            );
            json(response, 200, result.payload, result.meta);
            return;
        }

        if (url.pathname.startsWith('/api/briefings/')) {
            const briefingId = decodeURIComponent(url.pathname.replace('/api/briefings/', ''));
            const result = await useCached(
                `briefing:${briefingId}:${sourceIds?.join(',') || 'default'}`,
                120000,
                () => fetchBriefingPayload(briefingId, sourceIds),
                (payload) => Array.isArray(payload?.items) && payload.items.length > 0
            );
            json(response, 200, result.payload, result.meta);
            return;
        }

        if (url.pathname === '/api/markets') {
            const result = await useCached(
                'markets',
                60000,
                () => fetchMarketPayload(),
                (payload) => Array.isArray(payload) && payload.length > 0
            );
            json(response, 200, result.payload, result.meta);
            return;
        }

        if (url.pathname === '/api/copernicus/preview') {
            const options = parseCopernicusPreviewOptions(url.searchParams);

            if (!isCopernicusConfigured()) {
                json(
                    response,
                    200,
                    buildCopernicusUnavailablePayload(options),
                    { status: 'live', updatedAt: '', cache: 'miss' }
                );
                return;
            }

            const cacheKey = `copernicus:${JSON.stringify(options)}`;
            const result = await useCached(
                cacheKey,
                20 * 60 * 1000,
                () => fetchCopernicusPreview(options),
                (payload) => payload?.available === true && typeof payload?.imageDataUrl === 'string' && payload.imageDataUrl.startsWith('data:image/')
            );
            json(response, 200, result.payload, result.meta);
            return;
        }

        json(response, 404, { error: 'Not found' }, { status: 'offline' });
    } catch (error) {
        json(response, 502, {
            error: 'Upstream fetch failed',
            message: error.message
        }, { status: 'offline' });
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Tech Monitor API listening on http://127.0.0.1:${PORT}`);
});
