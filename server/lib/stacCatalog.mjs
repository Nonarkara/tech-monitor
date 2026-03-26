import axios from 'axios';

const COPERNICUS_STAC_URL = 'https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search';
const SCENE_CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const buildSearchBody = ({ bbox, datetime, collections = ['sentinel-2-l2a'], maxCloudCover = 20, limit = 5 }) => {
    const body = {
        collections,
        bbox,
        limit,
        distinct: 'date',
        fields: {
            include: [
                'id', 'geometry', 'properties.datetime', 'properties.eo:cloud_cover',
                'properties.created', 'assets', 'bbox'
            ]
        }
    };

    if (datetime) {
        body.datetime = datetime;
    } else {
        const now = new Date();
        const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        body.datetime = `${past.toISOString()}/${now.toISOString()}`;
    }

    body.filter = {
        op: 'and',
        args: [
            { op: '<=', args: [{ property: 'eo:cloud_cover' }, maxCloudCover] }
        ]
    };
    body['filter-lang'] = 'cql2-json';

    return body;
};

const cacheKey = (params) => `${params.bbox?.join(',')}_${params.datetime || 'latest'}_${params.maxCloudCover || 20}`;

export const searchStacScenes = async ({ bbox, datetime, maxCloudCover = 20, limit = 5, accessToken = null }) => {
    const key = cacheKey({ bbox, datetime, maxCloudCover });
    const cached = SCENE_CACHE.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const body = buildSearchBody({ bbox, datetime, maxCloudCover, limit });
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await axios.post(COPERNICUS_STAC_URL, body, {
        headers,
        timeout: 15000
    });

    const features = (response.data?.features || []).map((f) => ({
        id: f.id,
        datetime: f.properties?.datetime,
        cloudCover: f.properties?.['eo:cloud_cover'],
        bbox: f.bbox,
        geometry: f.geometry,
        assets: Object.fromEntries(
            Object.entries(f.assets || {}).map(([k, v]) => [k, {
                href: v.href,
                type: v.type,
                title: v.title
            }])
        ),
        age: f.properties?.datetime
            ? `${Math.round((Date.now() - new Date(f.properties.datetime).getTime()) / 3600000)}h ago`
            : null
    }));

    const result = {
        type: 'FeatureCollection',
        numberReturned: features.length,
        features,
        context: {
            searchedBbox: bbox,
            datetime: body.datetime,
            maxCloudCover
        }
    };

    SCENE_CACHE.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL });
    return result;
};

export const getBestScene = async (params) => {
    const result = await searchStacScenes({ ...params, limit: 1 });
    return result.features[0] || null;
};
