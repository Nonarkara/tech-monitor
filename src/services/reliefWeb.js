import axios from 'axios';

// Mocked geopolitical hotspots since ReliefWeb API requires a whitelisted appname (403 Forbidden)
// and typically focuses strictly on humanitarian emergencies rather than pure military conflicts.
const GLOBAL_HOTSPOTS = [
    {
        id: 'hotspot-iran',
        title: 'Iran-Israel Regional Escalation',
        country: 'Middle East',
        type: 'Geopolitical Conflict',
        coordinates: [53.6880, 32.4279] // [lon, lat] for Iran
    },
    {
        id: 'hotspot-ukraine',
        title: 'Russo-Ukrainian War',
        country: 'Ukraine',
        type: 'Ongoing Conflict',
        coordinates: [31.1656, 48.3794]
    },
    {
        id: 'hotspot-gaza',
        title: 'Gaza Strip Crisis',
        country: 'Palestine',
        type: 'Humanitarian Crisis / Conflict',
        coordinates: [34.3088, 31.3547]
    },
    {
        id: 'hotspot-myanmar',
        title: 'Myanmar Civil War',
        country: 'Myanmar',
        type: 'Civil Conflict',
        coordinates: [95.9560, 21.9162]
    },
    {
        id: 'hotspot-sudan',
        title: 'Sudan Conflict',
        country: 'Sudan',
        type: 'Civil War',
        coordinates: [30.2176, 12.8628]
    },
    {
        id: 'hotspot-taiwan',
        title: 'Cross-Strait Tensions',
        country: 'Taiwan Strait',
        type: 'Geopolitical Tension',
        coordinates: [119.5363, 23.6978]
    },
    {
        id: 'hotspot-red-sea',
        title: 'Red Sea Shipping Crisis',
        country: 'Yemen / Red Sea',
        type: 'Maritime Conflict',
        coordinates: [42.6105, 15.3694]
    }
];

export const fetchConflictsAndCrises = async () => {
    try {
        const features = GLOBAL_HOTSPOTS.map(h => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: h.coordinates
            },
            properties: {
                id: h.id,
                title: h.title,
                country: h.country,
                types: h.type
            }
        }));

        try {
            // Attempt to fetch live ReliefWeb data (may fail with 403 on unapproved appnames)
            const response = await axios.post('https://api.reliefweb.int/v1/disasters?appname=techmonitor', {
                profile: "full",
                limit: 20,
                filter: {
                    operator: "AND",
                    conditions: [{ field: "status", value: "current" }]
                }
            });

            const apiFeatures = response.data.data
                .filter(item => item.fields?.primary_country?.location)
                .map(item => {
                    const country = item.fields.primary_country;
                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [country.location.lon, country.location.lat]
                        },
                        properties: {
                            id: item.id,
                            title: item.fields.name,
                            country: country.name,
                            types: item.fields.type?.map(t => t.name).join(', ') || 'Crisis'
                        }
                    };
                });

            // Push API features 
            features.push(...apiFeatures);

        } catch (error) {
            console.warn("ReliefWeb API unavailable (403), falling back to core geopolitical hotspots.", error.message);
        }

        return {
            type: 'FeatureCollection',
            features
        };
    } catch (globalError) {
        console.error("Error generating hotspots:", globalError);
        return { type: 'FeatureCollection', features: [] };
    }
};
