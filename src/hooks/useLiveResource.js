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

/** Sleep helper for retry backoff */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useLiveResource = (fetcher, {
    cacheKey,
    enabled = true,
    intervalMs = 300000,
    isUsable = defaultIsUsable,
    maxRetries = 3,
    maxStaleMs = 10 * 60 * 1000  // 10 minutes — after this, data is considered stale
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
    const [retryCount, setRetryCount] = useState(0);

    dataRef.current = data;

    const load = useCallback(async ({ manual = false } = {}) => {
        if (!enabled) return;

        if (manual || dataRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        let lastError = null;

        // Retry loop with exponential backoff
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
                    await sleep(backoffMs);
                }

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
                setRetryCount(0);
                writeCachedState(cacheKey, result, responseMeta?.updatedAt || stampedAt);

                // Success — break out of retry loop
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            } catch (caughtError) {
                lastError = caughtError;
            }
        }

        // All retries exhausted
        setError(lastError);
        setRetryCount((prev) => prev + 1);

        // Check if existing data is too old
        const hasData = Boolean(dataRef.current || cached.data);
        if (hasData && lastUpdated) {
            const age = Date.now() - new Date(lastUpdated).getTime();
            setIsStale(age > maxStaleMs);
        } else {
            setIsStale(hasData);
        }

        setIsLoading(false);
        setIsRefreshing(false);
    }, [cacheKey, cached.data, enabled, fetcher, lastUpdated, maxRetries, maxStaleMs]);

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
        retryCount,
        refresh: () => load({ manual: true })
    };
};
