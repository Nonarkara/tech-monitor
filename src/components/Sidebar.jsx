import React from 'react';
import { Layers, Activity, CloudRain, Flame, AlertTriangle, Wind } from 'lucide-react';

const Sidebar = ({ activeLayers, toggleLayer }) => {
    const layerConfigs = [
        {
            id: 'economy',
            title: 'Macro Economy',
            desc: 'GDP, Inflation, Growth (World Bank)',
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
            title: 'Conflicts & Hotspots',
            desc: 'Humanitarian crises (ReliefWeb)',
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
                            {/* Secondary logos slightly smaller */}
                            <img src="/thailand-logo.png" alt="Smart City Thailand" style={{ height: '32px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                            <img src="/mdes.png" alt="MDES" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    </div>
                    <div className="brand" style={{ fontSize: '1.2rem', lineHeight: '1.4', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Dr Non's Digital Economy Dashboard</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>by depa.</span>
                    </div>
                </div>
            </div>
            <div className="sidebar-content">
                <div>
                    <h3 className="section-title">Data Layers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <p style={{ marginBottom: '12px', opacity: 0.9 }}>
                        Your dashboard is created by <strong>Dr. Non</strong>, who is a senior expert at depa.
                        He's using Anti-Gravity to build this and deploy it on Render.
                    </p>
                    <p style={{ marginBottom: '12px', opacity: 0.8 }}>
                        This is an experimental project that he's been working on with wide coding and part of the
                        <em> In-Progress City Lab</em> at depa, which is a lab where we invented this innovation as a service.
                    </p>
                    <p style={{ marginBottom: '12px', opacity: 0.8 }}>
                        It's a fascinating thing and make sure to keep tuning in for our development because it's going to be quite interesting!
                    </p>
                    <p style={{ opacity: 0.9 }}>
                        Make sure to follow and if you want to contact Dr. Non, this is his LinkedIn: <br />
                        <a href="https://www.linkedin.com/in/drnon" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 'bold' }}>
                            linkedin.com/in/drnon
                        </a>
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
