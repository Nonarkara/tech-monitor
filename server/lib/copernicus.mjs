const TOKEN_URL = process.env.COPERNICUS_OAUTH_TOKEN_URL
    || 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = process.env.COPERNICUS_PROCESS_URL
    || 'https://sh.dataspace.copernicus.eu/api/v1/process';

const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 512;
const DEFAULT_LOOKBACK_DAYS = 21;
const DEFAULT_MAX_CLOUD_COVERAGE = 25;

const THEATER_PRESETS = {
    middleeast: {
        theater: 'middleeast',
        label: 'Strait of Hormuz',
        bbox: [52.1, 24.1, 57.8, 28.4]
    },
    depa: {
        theater: 'depa',
        label: 'Bangkok Metro',
        bbox: [99.65, 13.2, 101.55, 14.45]
    }
};

import { EVALSCRIPTS } from './evalscripts.mjs';

const VISUAL_PRESETS = Object.fromEntries(
    Object.entries(EVALSCRIPTS).map(([key, preset]) => [key, {
        id: preset.id,
        label: preset.label,
        evalscript: preset.evalscript
    }])
);

let tokenState = {
    accessToken: null,
    expiresAt: 0
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value) => {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date value: ${value}`);
    }

    return parsed;
};

const parseBbox = (value) => {
    if (!value) return null;

    const parts = value
        .split(',')
        .map((part) => Number(part.trim()));

    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
        throw new Error('bbox must contain four comma-separated numbers');
    }

    const [west, south, east, north] = parts;
    if (west >= east || south >= north) {
        throw new Error('bbox must be ordered as west,south,east,north');
    }

    if (west < -180 || east > 180 || south < -90 || north > 90) {
        throw new Error('bbox must fall within WGS84 longitude/latitude limits');
    }

    return parts;
};

const normalizeTimeRange = ({ from, to, lookbackDays }) => {
    const now = to || new Date();
    const start = from || new Date(now.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));

    if (start > now) {
        throw new Error('from date must be earlier than to date');
    }

    return {
        from: start.toISOString(),
        to: now.toISOString()
    };
};

const getTheaterPreset = (theater) => THEATER_PRESETS[theater] || THEATER_PRESETS.middleeast;

const buildCopernicusInsight = ({ theater, preset }) => {
    if (theater === 'depa' && preset === 'ndvi') {
        return 'Vegetation mode highlights green corridors, floodplain cover, and peri-urban land transitions around Bangkok.';
    }

    if (theater === 'depa') {
        return 'Optical mode helps compare urban expansion, water surfaces, and cloud cover around the Bangkok metro area.';
    }

    if (preset === 'ndvi') {
        return 'Vegetation mode separates irrigated corridors from sparse terrain, making river-adjacent land cover easier to read.';
    }

    return 'Optical mode is best for quickly reading coastlines, port conditions, dust, and cloud cover around the Strait of Hormuz.';
};

export const isCopernicusConfigured = () => Boolean(
    process.env.COPERNICUS_CLIENT_ID && process.env.COPERNICUS_CLIENT_SECRET
);

export const buildCopernicusUnavailablePayload = (options, reason = 'missing_credentials') => ({
    available: false,
    configured: isCopernicusConfigured(),
    source: 'public',
    reason,
    theater: options.theater,
    theaterLabel: options.theaterLabel,
    collection: 'sentinel-2-l2a',
    preset: options.preset,
    presetLabel: options.presetLabel,
    bounds: {
        bbox: options.bbox,
        crs: 'EPSG:4326'
    },
    timeRange: options.timeRange,
    lookbackDays: options.lookbackDays,
    maxCloudCoverage: options.maxCloudCoverage,
    dimensions: {
        width: options.width,
        height: options.height
    },
    insight: buildCopernicusInsight(options)
});

export const parseCopernicusPreviewOptions = (searchParams) => {
    const requestedTheater = (searchParams.get('theater') || 'middleeast').toLowerCase();
    const preset = (searchParams.get('preset') || 'true-color').toLowerCase();
    const presetConfig = VISUAL_PRESETS[preset];

    if (!presetConfig) {
        throw new Error(`Unsupported preset: ${preset}`);
    }

    const theaterPreset = getTheaterPreset(requestedTheater);
    const bbox = parseBbox(searchParams.get('bbox')) || theaterPreset.bbox;
    const width = clamp(Math.round(parseNumber(searchParams.get('width'), DEFAULT_WIDTH)), 256, 1024);
    const height = clamp(Math.round(parseNumber(searchParams.get('height'), DEFAULT_HEIGHT)), 256, 1024);
    const maxCloudCoverage = clamp(
        Math.round(parseNumber(searchParams.get('maxCloudCoverage'), DEFAULT_MAX_CLOUD_COVERAGE)),
        0,
        100
    );
    const lookbackDays = clamp(
        Math.round(parseNumber(searchParams.get('lookbackDays'), DEFAULT_LOOKBACK_DAYS)),
        1,
        60
    );
    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'));
    const timeRange = normalizeTimeRange({ from, to, lookbackDays });

    return {
        bbox,
        width,
        height,
        theater: theaterPreset.theater,
        theaterLabel: theaterPreset.label,
        preset: presetConfig.id,
        presetLabel: presetConfig.label,
        maxCloudCoverage,
        lookbackDays,
        timeRange,
        evalscript: presetConfig.evalscript
    };
};

const getCopernicusAccessToken = async () => {
    if (
        tokenState.accessToken
        && tokenState.expiresAt > Date.now() + 60_000
    ) {
        return tokenState.accessToken;
    }

    const clientId = process.env.COPERNICUS_CLIENT_ID;
    const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing COPERNICUS_CLIENT_ID or COPERNICUS_CLIENT_SECRET');
    }

    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
    });

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Copernicus token request failed (${response.status}): ${text.slice(0, 200)}`);
    }

    const payload = await response.json();
    if (!payload?.access_token) {
        throw new Error('Copernicus token response did not include an access token');
    }

    const expiresInMs = Math.max(60_000, (Number(payload.expires_in) || 3600) * 1000);
    tokenState = {
        accessToken: payload.access_token,
        expiresAt: Date.now() + expiresInMs
    };

    return tokenState.accessToken;
};

export const fetchCopernicusPreview = async (options) => {
    const token = await getCopernicusAccessToken();

    const response = await fetch(PROCESS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'image/png'
        },
        body: JSON.stringify({
            input: {
                bounds: {
                    bbox: options.bbox
                },
                data: [
                    {
                        type: 'sentinel-2-l2a',
                        dataFilter: {
                            timeRange: options.timeRange,
                            maxCloudCoverage: options.maxCloudCoverage,
                            mosaickingOrder: 'mostRecent'
                        }
                    }
                ]
            },
            output: {
                width: options.width,
                height: options.height,
                responses: [
                    {
                        identifier: 'default',
                        format: {
                            type: 'image/png'
                        }
                    }
                ]
            },
            evalscript: options.evalscript
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Copernicus Process API failed (${response.status}): ${text.slice(0, 240)}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    return {
        available: true,
        configured: true,
        source: 'copernicus',
        theater: options.theater,
        theaterLabel: options.theaterLabel,
        collection: 'sentinel-2-l2a',
        preset: options.preset,
        presetLabel: options.presetLabel,
        bounds: {
            bbox: options.bbox,
            crs: 'EPSG:4326'
        },
        timeRange: options.timeRange,
        lookbackDays: options.lookbackDays,
        maxCloudCoverage: options.maxCloudCoverage,
        dimensions: {
            width: options.width,
            height: options.height
        },
        insight: buildCopernicusInsight(options),
        imageDataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`
    };
};
