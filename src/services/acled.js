/**
 * ACLED conflict events — fetches geocoded attack/battle data from backend.
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:4000' : '';

export const fetchAcledEvents = async () => {
    const res = await fetch(`${API_BASE}/api/acled`);
    if (!res.ok) throw new Error(`ACLED fetch failed: ${res.status}`);
    return res.json();
};
