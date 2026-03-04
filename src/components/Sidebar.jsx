import React from 'react';
import { Layers, Activity, CloudRain, Flame, AlertTriangle, Wind } from 'lucide-react';
import { EO_TILE_LAYERS } from '../services/eoTiles';

const Sidebar = ({ activeLayers, toggleLayer }) => {
    const layerConfigs = [
        {
            id: 'economy',
            title: 'Macro Economy',
            desc: 'Latest GDP growth baselines (World Bank)',
            icon: <Activity size={20} />
        },
        {
            id: 'disasters',
            title: 'Natural Disasters',
            desc: 'Active events (NASA EONET)',
            icon: <AlertTriangle size={20} />
        },
        {
            id: 'conflicts',
            title: 'Conflicts & Logistics',
            desc: 'Hotspots, humanitarian risk, airspace stress',
            icon: <Flame size={20} />
        },
        {
            id: 'weather',
            title: 'Live Weather',
            desc: 'Conditions overview (Open-Meteo)',
            icon: <CloudRain size={20} />
        },
        {
            id: 'aqi',
            title: 'Air Quality (AQI)',
            desc: 'PM2.5 & Health (Open-Meteo)',
            icon: <Wind size={20} />
        }
    ];

    return (
        <aside className="grid-panel" style={{ flex: 1 }}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* White Container Interventions for JPEGs */}
                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        {/* DEPA is the largest/primary logo */}
                        <img src="/Logo on White BG-01.jpg" alt="depa" style={{ height: '48px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', color: '#0f172a', padding: '6px 10px', borderRadius: '999px', background: '#e2e8f0' }}>
                                SMART CITY TH
                            </span>
                            <img src="/mdes.png" alt="MDES" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    </div>
                    <div className="brand" style={{ fontSize: '1.2rem', lineHeight: '1.4', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Iran Conflict Monitor</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>by Dr Non / depa.</span>
                    </div>
                </div>
            </div>
            <div className="sidebar-content">
                <div>
                    <h3 className="section-title">Data Layers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {layerConfigs.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);
                            return (
                                <div
                                    key={layer.id}
                                    className={`layer-card ${isActive ? 'active' : ''}`}
                                    onClick={() => toggleLayer(layer.id)}
                                >
                                    <div className="layer-icon-wrapper">
                                        {layer.icon}
                                    </div>
                                    <div className="layer-info">
                                        <span className="layer-title">{layer.title}</span>
                                        <span className="layer-desc">{layer.desc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Earth Observation Satellite Layers */}
                <div>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🛰️</span> Earth Observation
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                        Satellite imagery from NASA GIBS, JAXA, ESA. Toggle layers to overlay on the map.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {EO_TILE_LAYERS.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);
                            return (
                                <div
                                    key={layer.id}
                                    className={`layer-card ${isActive ? 'active' : ''}`}
                                    onClick={() => toggleLayer(layer.id)}
                                    style={{ padding: '10px 14px', gap: '10px' }}
                                >
                                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{layer.icon}</span>
                                    <div className="layer-info">
                                        <span className="layer-title" style={{ fontSize: '0.85rem' }}>{layer.name}</span>
                                        <span className="layer-desc" style={{ fontSize: '0.72rem' }}>{layer.description}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <p style={{ marginBottom: '8px', opacity: 0.8 }}>
                        Data from NASA, ESA, JAXA, World Bank, ReliefWeb, Open-Meteo, and Binance.
                    </p>
                    <p style={{ opacity: 0.9 }}>
                        <strong>Contact Dr. Non Arkara:</strong><br />
                        Email: <a href="mailto:non.ar@depa.or.th" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>non.ar@depa.or.th</a><br />
                        LinkedIn: <a href="https://www.linkedin.com/in/drnon/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>linkedin.com/in/drnon/</a>
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

