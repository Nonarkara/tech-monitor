import React, { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchNaturalDisasters } from '../services/nasaEonet';
import { fetchConflictsAndCrises } from '../services/reliefWeb';
import { fetchLiveWeather } from '../services/weather';
import { fetchMacroEconomy } from '../services/worldBank';
import { fetchAirQuality } from '../services/airQuality';

const MapContainer = ({ viewState, onMove, activeLayers, onMarkerClick }) => {

    const [disastersData, setDisastersData] = useState(null);
    const [crisesData, setCrisesData] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [economyData, setEconomyData] = useState(null);
    const [aqiData, setAqiData] = useState(null);

    useEffect(() => {
        const fetchDisasters = () => {
            if (activeLayers.includes('disasters')) fetchNaturalDisasters().then(setDisastersData);
        };
        fetchDisasters();
        const interval = setInterval(fetchDisasters, 120 * 1000);
        return () => clearInterval(interval);
    }, [activeLayers]);

    useEffect(() => {
        const fetchConflicts = () => {
            if (activeLayers.includes('conflicts')) fetchConflictsAndCrises().then(setCrisesData);
        };
        fetchConflicts();
        const interval = setInterval(fetchConflicts, 120 * 1000);
        return () => clearInterval(interval);
    }, [activeLayers]);

    useEffect(() => {
        const fetchWeather = () => {
            if (activeLayers.includes('weather')) fetchLiveWeather().then(setWeatherData);
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 120 * 1000);
        return () => clearInterval(interval);
    }, [activeLayers]);

    useEffect(() => {
        const fetchEconomyAndAqi = () => {
            if (activeLayers.includes('economy')) fetchMacroEconomy().then(setEconomyData);
            if (activeLayers.includes('aqi')) fetchAirQuality().then(setAqiData);
        };
        fetchEconomyAndAqi();
        const interval = setInterval(fetchEconomyAndAqi, 120 * 1000);
        return () => clearInterval(interval);
    }, [activeLayers]);

    // Helper to render interactive pulsing markers
    const renderMarkers = (data, catClass) => {
        if (!data || !data.features) return null;
        return data.features.map((feature, index) => {
            const [lng, lat] = feature.geometry.coordinates;
            // Provide a stable key, fallback to index if missing id
            const key = feature.properties.id || `${catClass}-${index}`;
            const markerColor = feature.properties.color || '';
            return (
                <Marker key={key} longitude={lng} latitude={lat} anchor="center" onClick={e => {
                    e.originalEvent.stopPropagation();
                    onMarkerClick(feature);
                }}>
                    <div
                        className={`pulse-marker ${catClass}`}
                        style={markerColor ? { '--marker-color': markerColor } : {}}
                    />
                </Marker>
            );
        });
    };

    return (
        <div className="map-wrapper">
            <Map
                mapLib={maplibregl}
                minZoom={2.5}
                {...viewState}
                onMove={evt => onMove(evt.viewState)}
                style={{ width: '100vw', height: '100vh' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            >
                {/* Dynamic Weather Radar Layer */}
                {activeLayers.includes('weather') && (
                    <Source
                        id="rainviewer"
                        type="raster"
                        tiles={['https://tilecache.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png']}
                        tileSize={256}
                    >
                        <Layer
                            id="rainviewer-layer"
                            type="raster"
                            paint={{ 'raster-opacity': 0.6 }}
                            beforeId="waterway-label" // Try to render under labels if they exist in the style
                        />
                    </Source>
                )}

                {activeLayers.includes('disasters') && renderMarkers(disastersData, 'marker-disaster')}
                {activeLayers.includes('conflicts') && renderMarkers(crisesData, 'marker-conflict')}
                {activeLayers.includes('weather') && renderMarkers(weatherData, 'marker-weather')}
                {activeLayers.includes('economy') && renderMarkers(economyData, 'marker-economy')}
                {activeLayers.includes('aqi') && renderMarkers(aqiData, 'marker-aqi')}
            </Map>
        </div>
    );
};

export default MapContainer;
