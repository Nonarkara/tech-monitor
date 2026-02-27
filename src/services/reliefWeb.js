import axios from 'axios';

// ReliefWeb API (Humanitarian API) 
// Fetches recent global disasters and crisis reports
export const fetchConflictsAndCrises = async () => {
    try {
        // Look for active disasters with location data
        const response = await axios.post('https://api.reliefweb.int/v1/disasters?appname=techmonitor', {
            profile: "full",
            limit: 50,
            filter: {
                operator: "AND",
                conditions: [
                    {
                        field: "status",
                        value: "current"
                    }
                ]
            }
        });

        // Transform into GeoJSON
        const features = response.data.data
            .filter(item => item.fields?.primary_country?.location)
            .map(item => {
                const country = item.fields.primary_country;

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        // Reliefweb provides [lat, lon], MapLibre wants [lon, lat]
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

        return {
            type: 'FeatureCollection',
            features
        };
    } catch (error) {
        console.error("Error fetching ReliefWeb data:", error);
        return { type: 'FeatureCollection', features: [] };
    }
};
