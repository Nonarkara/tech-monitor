/**
 * UN SDG Data Service
 *
 * Fetches indicator data from the UN Statistics Division SDG API
 * and maps it onto country GeoJSON polygons for choropleth rendering.
 */
import worldGeoJson from '../data/countries.json';

const API_BASE = 'https://unstats.un.org/SDGAPI/v1/sdg';

// List of interesting SDG series codes. We fetch one as the primary layer.
// 'SI_POV_DAY1' - Proportion of population below international poverty line (%)
// 'EG_ELC_ACCS' - Proportion of population with access to electricity (%)
// 'EN_ATM_CO2'  - CO2 emissions per unit of value added
const TARGET_SERIES_CODE = 'EG_ELC_ACCS'; // Using Electricity Access as a core development metric

/**
 * Fetch SDG data for a specific series code and merge it into the GeoJSON boundaries.
 * We look for the most recent data point (usually 2020-2022).
 */
export async function fetchSdgLayer() {
    try {
        // 1. Fetch data from UN SDG API for all areas for the target series
        const res = await fetch(`${API_BASE}/Series/Data?seriesCode=${TARGET_SERIES_CODE}&pageSize=10000`);
        if (!res.ok) throw new Error(`SDG API error: ${res.status}`);

        const json = await res.json();
        const records = json.data || [];

        // 2. Build a map of ISO Alpha-3 code -> most recent indicator value
        const countryDataMap = new Map();

        records.forEach(record => {
            // UN API uses M49 region codes in geoAreaCode, but we need standard country codes.
            // Luckily, many records include the country name in geoAreaName which we can try to match,
            // or we use a pre-existing properties mapping if available.
            // For robust mapping, we just match by geoAreaName for simplicity in this demo.
            const name = record.geoAreaName;
            const value = parseFloat(record.value);
            const year = parseInt(record.timePeriodStart);

            if (!isNaN(value)) {
                // Keep the most recent year's value
                if (!countryDataMap.has(name) || countryDataMap.get(name).year < year) {
                    countryDataMap.set(name, { value, year });
                }
            }
        });

        // 3. Deep clone the world GeoJSON and inject the values into the properties
        const featureCollection = {
            type: 'FeatureCollection',
            features: worldGeoJson.features.map(feature => {
                // The countries.geojson has properties.ADMIN which is the country name
                const countryName = feature.properties.ADMIN;
                const matchName = mapCountryName(countryName);

                const dataPoint = countryDataMap.get(matchName);

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        sdgValue: dataPoint ? dataPoint.value : null,
                        sdgYear: dataPoint ? dataPoint.year : null,
                    }
                };
            })
        };

        return featureCollection;
    } catch (error) {
        console.error('Failed to fetch SDG data:', error);
        return null;
    }
}

/** Helper to handle slight mismatches between the GeoJSON names and UN API names */
function mapCountryName(geoJsonName) {
    const mappings = {
        'United States of America': 'United States of America',
        'Russia': 'Russian Federation',
        'South Korea': 'Republic of Korea',
        'North Korea': 'Democratic People\'s Republic of Korea',
        'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
        'Iran': 'Iran (Islamic Republic of)',
        'Syria': 'Syrian Arab Republic',
        'Venezuela': 'Venezuela (Bolivarian Republic of)',
        'Bolivia': 'Bolivia (Plurinational State of)',
        'Vietnam': 'Viet Nam',
        'Laos': 'Lao People\'s Democratic Republic',
        'Tanzania': 'United Republic of Tanzania',
        'Ivory Coast': 'Côte d\'Ivoire',
        'Democratic Republic of the Congo': 'Democratic Republic of the Congo',
        'Republic of the Congo': 'Congo'
    };
    return mappings[geoJsonName] || geoJsonName;
}
