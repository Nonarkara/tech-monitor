import axios from 'axios';

// World Bank API
// Fetches recent GDP Growth rates (indicator: NY.GDP.MKTP.KD.ZG) for all countries
export const fetchMacroEconomy = async () => {
    try {
        // Note: World Bank API is paginated and sometimes slow, getting 1 page of 200 countries
        const response = await axios.get('https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=200&date=2022');

        if (!response.data || !response.data[1]) return { type: 'FeatureCollection', features: [] };

        // We need coordinates for countries. A simple static map of country ISO2 to rough coords:
        // (In a full prod app this would be a proper GeoJSON polygons layer, 
        // but we will use points representing country centers for this macro view)
        const isoCenters = {
            'TH': [100.9925, 15.8700], 'VN': [108.2772, 14.0583], 'ID': [113.9213, -0.7893],
            'MY': [101.9758, 4.2105], 'SG': [103.8198, 1.3521], 'PH': [121.7740, 12.8797],
            'CN': [104.1954, 35.8617], 'JP': [138.2529, 36.2048], 'KR': [127.7669, 35.9078],
            'IN': [78.9629, 20.5937], 'US': [-95.7129, 37.0902], 'GB': [-3.4359, 55.3781],
            'FR': [2.2137, 46.2276], 'DE': [10.4515, 51.1657], 'AU': [133.7751, -25.2744],
            'RU': [105.3188, 61.5240], 'BR': [-51.9253, -14.2350], 'ZA': [22.9375, -30.5595]
        };

        const features = response.data[1]
            .filter(item => item.value !== null && isoCenters[item.countryiso3code.substring(0, 2)])
            .map(item => {
                const iso2 = item.countryiso3code.substring(0, 2);
                const coords = isoCenters[iso2];
                const growth = parseFloat(item.value);

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: coords
                    },
                    properties: {
                        id: item.country.id,
                        country: item.country.value,
                        growth: growth,
                        type: 'economy',
                        // Determine color based on growth
                        color: growth > 3 ? '#10b981' : (growth > 0 ? '#3b82f6' : '#ef4444')
                    }
                };
            });

        return {
            type: 'FeatureCollection',
            features
        };
    } catch (error) {
        console.error("Error fetching World Bank data:", error);
        return { type: 'FeatureCollection', features: [] };
    }
};
