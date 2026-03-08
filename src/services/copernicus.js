import { fetchBackendJson } from './backendClient.js';

const THEATER_BY_VIEW_MODE = {
    middleeast: 'middleeast',
    depa: 'depa'
};

const getInsight = ({ theater, preset }) => {
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

const buildPublicFallbackPayload = (theater, preset, lookbackDays, maxCloudCoverage) => {
    const now = new Date();
    const from = new Date(now.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));

    return {
        available: false,
        configured: false,
        source: 'public',
        theater,
        theaterLabel: theater === 'depa' ? 'Bangkok Metro' : 'Strait of Hormuz',
        collection: 'public-satellite',
        preset,
        presetLabel: preset === 'ndvi' ? 'Vegetation' : 'Optical',
        timeRange: {
            from: from.toISOString(),
            to: now.toISOString()
        },
        lookbackDays,
        maxCloudCoverage,
        insight: getInsight({ theater, preset })
    };
};

export const fetchCopernicusPreview = async (viewMode, preset = 'true-color') => {
    const theater = THEATER_BY_VIEW_MODE[viewMode] || 'middleeast';
    const lookbackDays = theater === 'depa' ? 14 : 21;
    const maxCloudCoverage = theater === 'depa' ? 20 : 25;

    try {
        return await fetchBackendJson('/api/copernicus/preview', {
            theater,
            preset,
            width: 720,
            height: 420,
            lookbackDays,
            maxCloudCoverage
        });
    } catch {
        return buildPublicFallbackPayload(theater, preset, lookbackDays, maxCloudCoverage);
    }
};
