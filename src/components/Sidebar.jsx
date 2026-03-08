import React, { useEffect, useRef } from 'react';
import { Layers, Activity, CloudRain, Flame, AlertTriangle, Wind } from 'lucide-react';
import CopernicusPreviewPanel from './CopernicusPreviewPanel';
import { EO_TILE_LAYERS } from '../services/eoTiles';

const Sidebar = ({
    activeLayers,
    toggleLayer,
    viewMode,
    copernicusMode,
    setCopernicusMode,
    copernicusRuntimeSource,
    showCopernicusOverlay,
    setShowCopernicusOverlay,
    showStrategicContext,
    setShowStrategicContext,
    copernicusResource
}) => {
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [viewMode]);

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
    const earthObservationLayers = EO_TILE_LAYERS.filter((layer) => !['eo-true-color', 'eo-vegetation'].includes(layer.id));

    return (
        <aside className="grid-panel" style={{ flex: 1 }}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Logo badge */}
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 12px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                        <img src="/Logo on White BG-01.jpg" alt="depa" style={{ height: '44px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.2px', color: '#0f172a', padding: '5px 10px', borderRadius: '999px', background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }}>
                                SMART CITY TH
                            </span>
                            <img src="/mdes.png" alt="MDES" style={{ height: '32px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    </div>
                    <div className="brand" style={{ fontSize: '1.15rem', lineHeight: '1.4', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                        <span style={{ letterSpacing: '-0.3px' }}>Iran Conflict Monitor</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', letterSpacing: '0.2px' }}>by Dr Non / depa.</span>
                    </div>
                </div>
            </div>
            <div ref={contentRef} className="sidebar-content">
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

                <div>
                    <h3 className="section-title">Sentinel Hub</h3>
                    <CopernicusPreviewPanel
                        viewMode={viewMode}
                        preset={copernicusMode}
                        onPresetChange={setCopernicusMode}
                        runtimeSource={copernicusRuntimeSource}
                        showOverlay={showCopernicusOverlay}
                        onToggleOverlay={() => setShowCopernicusOverlay((value) => !value)}
                        previewResource={copernicusResource}
                    />
                </div>

                <div>
                    <h3 className="section-title">Map Framing</h3>
                    <div
                        className={`layer-card ${showStrategicContext ? 'active' : ''}`}
                        onClick={() => setShowStrategicContext((value) => !value)}
                    >
                        <div className="layer-icon-wrapper">
                            <Layers size={20} />
                        </div>
                        <div className="layer-info">
                            <span className="layer-title">Strategic Context</span>
                            <span className="layer-desc">Optional reference corridors, zones, and city anchors</span>
                        </div>
                    </div>
                </div>

                {/* Earth Observation Satellite Layers */}
                <div>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🛰️</span> Earth Observation
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                        Additional public overlays from NASA GIBS, JAXA, and ESA. Sentinel optical and vegetation modes are controlled above.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {earthObservationLayers.map((layer) => {
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
