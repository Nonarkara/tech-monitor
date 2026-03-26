import axios from 'axios';

const PC_STAC_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TOKEN_URL = 'https://planetarycomputer.microsoft.com/api/sas/v1/token';
const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000;

const signAssetUrl = async (href) => {
    // Planetary Computer requires SAS token signing for asset access
    try {
        const response = await axios.get(`${PC_TOKEN_URL}/${encodeURIComponent(href)}`, {
            timeout: 10000
        });
        return response.data?.href || href;
    } catch {
        // If signing fails, return unsigned URL (may still work for public assets)
        return href;
    }
};

export const searchPlanetaryComputer = async ({
    bbox,
    datetime,
    collections = ['sentinel-2-l2a'],
    maxCloudCover = 20,
    limit = 5
}) => {
    const key = `pc_${bbox?.join(',')}_${datetime}_${maxCloudCover}`;
    const cached = CACHE.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const now = new Date();
    const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const timeRange = datetime || `${past.toISOString()}/${now.toISOString()}`;

    const body = {
        collections,
        bbox,
        datetime: timeRange,
        limit,
        query: {
            'eo:cloud_cover': { lt: maxCloudCover }
        },
        sortby: [{ field: 'properties.datetime', direction: 'desc' }]
    };

    const response = await axios.post(PC_STAC_URL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
    });

    const features = (response.data?.features || []).map((f) => {
        const cogAssets = {};
        for (const [name, asset] of Object.entries(f.assets || {})) {
            if (asset.type === 'image/tiff; application=geotiff; profile=cloud-optimized'
                || asset.type === 'image/tiff; application=geotiff') {
                cogAssets[name] = {
                    href: asset.href,
                    type: asset.type,
                    title: asset.title || name
                };
            }
        }

        return {
            id: f.id,
            datetime: f.properties?.datetime,
            cloudCover: f.properties?.['eo:cloud_cover'],
            bbox: f.bbox,
            geometry: f.geometry,
            cogAssets,
            source: 'planetary-computer',
            age: f.properties?.datetime
                ? `${Math.round((Date.now() - new Date(f.properties.datetime).getTime()) / 3600000)}h ago`
                : null
        };
    });

    const result = {
        type: 'FeatureCollection',
        numberReturned: features.length,
        features,
        source: 'planetary-computer',
        context: { searchedBbox: bbox, datetime: timeRange, maxCloudCover }
    };

    CACHE.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL });
    return result;
};

export const signCogUrl = signAssetUrl;

export const getBestPcScene = async (params) => {
    const result = await searchPlanetaryComputer({ ...params, limit: 1 });
    return result.features[0] || null;
};
