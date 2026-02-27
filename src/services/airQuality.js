import axios from 'axios';

// SEA / Asia Major Cities for Air Quality Monitoring
const CITIES = [
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
    { name: 'Chiang Mai', lat: 18.7902, lon: 98.9817 },
    { name: 'Phuket', lat: 7.8804, lon: 98.3923 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
    { name: 'Manila', lat: 14.5995, lon: 120.9842 },
    { name: 'Ho Chi Minh', lat: 10.8231, lon: 106.6297 },
    { name: 'Yangon', lat: 16.8409, lon: 96.1451 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Seoul', lat: 37.5665, lon: 126.9780 }
];

export const fetchAirQuality = async () => {
    try {
        const promises = CITIES.map(city =>
            axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5`)
        );

        const responses = await Promise.all(promises);

        const features = responses.map((res, index) => {
            const city = CITIES[index];
            const aqi = res.data.current.us_aqi;
            const pm25 = res.data.current.pm2_5;

            // US AQI Colors
            let color = '#3b82f6'; // Good / Blue
            let category = 'Good';
            if (aqi > 50) { color = '#10b981'; category = 'Moderate'; }
            if (aqi > 100) { color = '#f59e0b'; category = 'Unhealthy for Sensitive Groups'; }
            if (aqi > 150) { color = '#ef4444'; category = 'Unhealthy'; }
            if (aqi > 200) { color = '#b91c1c'; category = 'Very Unhealthy'; }
            if (aqi > 300) { color = '#7f1d1d'; category = 'Hazardous'; }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [city.lon, city.lat]
                },
                properties: {
                    id: `aqi-${index}`,
                    city: city.name,
                    title: `Air Quality: ${city.name}`, // Shared interface for EventDetailsPanel
                    aqi: aqi,
                    pm25: pm25,
                    category: category,
                    type: 'aqi', // For distinct details panel logic
                    color: color
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features
        };

    } catch (error) {
        console.error("Error fetching Air Quality:", error);
        return { type: 'FeatureCollection', features: [] };
    }
};
