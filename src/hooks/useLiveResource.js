import { useCallback, useEffect, useRef, useState } from 'react';

const readCachedState = (cacheKey) => {
    if (!cacheKey || typeof window === 'undefined') {
        return { data: null, lastUpdated: null };
    }

    try {
        const raw = window.localStorage.getItem(`tech-monitor:${cacheKey}`);
        if (!raw) return { data: null, lastUpdated: null };

        const parsed = JSON.parse(raw);
        return {
            data: parsed.data ?? null,
            lastUpdated: parsed.lastUpdated ?? null
        };
    } catch {
        return { data: null, lastUpdated: null };
    }
};

const writeCachedState = (cacheKey, data, lastUpdated) => {
    if (!cacheKey || typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(`tech-monitor:${cacheKey}`, JSON.stringify({
            data,
            lastUpdated
        }));
    } catch {
        // Ignore storage write errors. Live rendering should continue.
    }
};

const defaultIsUsable = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

export const useLiveResource = (fetcher, {
    cacheKey,
    enabled = true,
    intervalMs = 300000,
    isUsable = defaultIsUsable
} = {}) => {
    const [cached] = useState(() => readCachedState(cacheKey));
    const dataRef = useRef(cached.data);

    // Stabilize isUsable so it never causes re-render loops
    const isUsableRef = useRef(isUsable);
    isUsableRef.current = isUsable;

    const [data, setData] = useState(cached.data);
    const [lastUpdated, setLastUpdated] = useState(cached.lastUpdated);
    const [isLoading, setIsLoading] = useState(enabled && !cached.data);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isStale, setIsStale] = useState(Boolean(cached.data));
    const [error, setError] = useState(null);

    dataRef.current = data;

    const load = useCallback(async ({ manual = false } = {}) => {
        if (!enabled) return;

        if (manual || dataRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const result = await fetcher();
            const responseMeta = result && typeof result === 'object' ? result.__meta : null;

            if (!isUsableRef.current(result)) {
                throw new Error('No usable live data returned');
            }

            const stampedAt = new Date().toISOString();
            setData(result);
            setLastUpdated(responseMeta?.updatedAt || stampedAt);
            setIsStale(responseMeta?.status === 'stale');
            setError(null);
            writeCachedState(cacheKey, result, responseMeta?.updatedAt || stampedAt);
        } catch (caughtError) {
            setError(caughtError);
            setIsStale(Boolean(dataRef.current || cached.data));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [cacheKey, cached.data, enabled, fetcher]);

    useEffect(() => {
        if (!enabled) return undefined;

        const kickoff = window.setTimeout(() => {
            load();
        }, 0);

        const interval = window.setInterval(() => {
            load();
        }, intervalMs);

        return () => {
            window.clearTimeout(kickoff);
            window.clearInterval(interval);
        };
    }, [enabled, intervalMs, load]);

    return {
        data,
        lastUpdated,
        isLoading,
        isRefreshing,
        isStale,
        error,
        refresh: () => load({ manual: true })
    };
};
