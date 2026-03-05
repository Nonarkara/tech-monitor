import axios from 'axios';

const GLOBAL_HOTSPOTS = [
    {
        id: 'hotspot-iran',
        title: 'Iran Regional Escalation',
        country: 'Iran / Gulf Airspace',
        type: 'Conflict and aviation disruption',
        severity: 'Severe',
        status: 'Airspace and airline operations at risk',
        operationalFocus: 'Watch Tehran, Gulf hubs, and regional reroutes.',
        coordinates: [53.688, 32.4279]
    },
    {
        id: 'hotspot-ukraine',
        title: 'Russo-Ukrainian War',
        country: 'Ukraine',
        type: 'Ongoing conflict',
        severity: 'Severe',
        status: 'Persistent infrastructure and civilian risk',
        operationalFocus: 'Track energy systems, logistics, and displacement.',
        coordinates: [31.1656, 48.3794]
    },
    {
        id: 'hotspot-gaza',
        title: 'Gaza Humanitarian Crisis',
        country: 'Gaza Strip',
        type: 'Humanitarian emergency',
        severity: 'Severe',
        status: 'Humanitarian access constrained',
        operationalFocus: 'Monitor aid corridors, hospitals, and border access.',
        coordinates: [34.3088, 31.3547]
    },
    {
        id: 'hotspot-myanmar',
        title: 'Myanmar Civil Conflict',
        country: 'Myanmar',
        type: 'Civil conflict',
        severity: 'High',
        status: 'Political instability and conflict events ongoing',
        operationalFocus: 'Watch border crossings, urban unrest, and displacement.',
        coordinates: [95.956, 21.9162]
    },
    {
        id: 'hotspot-sudan',
        title: 'Sudan Conflict',
        country: 'Sudan',
        type: 'Civil war',
        severity: 'Severe',
        status: 'Critical humanitarian and security conditions',
        operationalFocus: 'Monitor corridors, food systems, and health access.',
        coordinates: [30.2176, 12.8628]
    },
    {
        id: 'hotspot-red-sea',
        title: 'Red Sea Shipping Risk',
        country: 'Red Sea',
        type: 'Maritime disruption',
        severity: 'High',
        status: 'Shipping and logistics exposed',
        operationalFocus: 'Watch reroutes, insurance costs, and port throughput.',
        coordinates: [42.6105, 15.3694]
    },
    {
        id: 'hotspot-syria',
        title: 'Syria Instability',
        country: 'Syria',
        type: 'Post-conflict instability',
        severity: 'High',
        status: 'Political transition and humanitarian needs',
        operationalFocus: 'Watch cross-border dynamics, reconstruction, and displacement.',
        coordinates: [38.9968, 34.8021]
    },
    {
        id: 'hotspot-lebanon',
        title: 'Lebanon Crisis',
        country: 'Lebanon',
        type: 'Economic and security crisis',
        severity: 'High',
        status: 'Economic collapse and regional spillover risk',
        operationalFocus: 'Monitor currency, infrastructure, and border security.',
        coordinates: [35.8623, 33.8547]
    }
];

const ALERT_COLORS = { Red: 'Severe', Orange: 'High', Green: 'Moderate' };

const toFeature = (hotspot) => ({
    type: 'Feature',
    geometry: {
        type: 'Point',
        coordinates: hotspot.coordinates
    },
    properties: {
        id: hotspot.id,
        title: hotspot.title,
        country: hotspot.country,
        type: 'conflict',
        types: hotspot.type,
        severity: hotspot.severity,
        status: hotspot.status,
        operationalFocus: hotspot.operationalFocus
    }
});

const buildGdacsDateRange = () => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().split('T')[0];
    return { from: fmt(from), to: fmt(to) };
};

export const fetchConflictsAndCrises = async () => {
    const features = GLOBAL_HOTSPOTS.map(toFeature);

    // Try GDACS API for live disaster/crisis events (free, no auth)
    try {
        const dates = buildGdacsDateRange();
        const response = await axios.get(
            `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF,DR&fromDate=${dates.from}&toDate=${dates.to}&alertlevel=Orange;Red`,
            { timeout: 15000 }
        );

        const gdacsFeatures = (response.data?.features || [])
            .filter((f) => f.geometry?.coordinates)
            .slice(0, 15)
            .map((f) => {
                const props = f.properties || {};
                const coords = f.geometry.coordinates;
                const alertLevel = props.alertlevel || 'Green';
                const countries = (props.affectedcountries || []).map((c) => c.countryname).join(', ');

                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
                    properties: {
                        id: `gdacs-${props.eventtype}-${props.eventid}`,
                        title: props.name || props.description || 'GDACS Event',
                        country: countries || props.country || 'Unknown',
                        type: 'conflict',
                        types: props.eventtype || 'Crisis',
                        severity: ALERT_COLORS[alertLevel] || 'Moderate',
                        status: props.severitydata?.severitytext || `Alert: ${alertLevel}`,
                        operationalFocus: props.description || 'Live event reported by GDACS.'
                    }
                };
            });

        return {
            type: 'FeatureCollection',
            features: [...features, ...gdacsFeatures]
        };
    } catch (error) {
        console.warn('GDACS live feed unavailable, using curated hotspots.', error.message);
        return {
            type: 'FeatureCollection',
            features
        };
    }
};
