import React from 'react';
import { APAC_SOURCES } from '../services/liveNews';
import { X, Check } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, activeSources, toggleSource, setAllSources }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="grid-panel" style={{ width: '800px', maxWidth: '90vw', maxHeight: '85vh', backgroundColor: '#111', padding: 0 }}>

                {/* Header */}
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 600 }}>SETTINGS</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs Area Placeholder */}
                <div style={{ padding: '0 24px', display: 'flex', gap: '32px', borderBottom: '1px solid #333' }}>
                    <div style={{ padding: '16px 0', color: '#666', fontSize: '0.85rem', letterSpacing: '1px', cursor: 'pointer' }}>GENERAL</div>
                    <div style={{ padding: '16px 0', color: '#666', fontSize: '0.85rem', letterSpacing: '1px', cursor: 'pointer' }}>PANELS</div>
                    <div style={{ padding: '16px 0', color: '#fff', fontSize: '0.85rem', letterSpacing: '1px', borderBottom: '2px solid #fff', fontWeight: 'bold' }}>SOURCES</div>
                </div>

                {/* Sub-Filters Placeholder */}
                <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', borderBottom: '1px solid #222' }}>
                    <span style={{ fontSize: '0.75rem', padding: '6px 16px', borderRadius: '20px', border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>ASIA-PACIFIC</span>
                    <span style={{ fontSize: '0.75rem', padding: '6px 16px', borderRadius: '20px', border: '1px solid #333', color: '#888' }}>MIDDLE EAST</span>
                    <span style={{ fontSize: '0.75rem', padding: '6px 16px', borderRadius: '20px', border: '1px solid #333', color: '#888' }}>GLOBAL</span>
                </div>

                {/* Grid of Sources */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {APAC_SOURCES.map(source => {
                        const isActive = activeSources.includes(source.id);
                        return (
                            <div
                                key={source.id}
                                onClick={() => toggleSource(source.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    border: `1px solid ${isActive ? '#10b981' : '#333'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '16px', height: '16px',
                                    backgroundColor: isActive ? '#10b981' : 'transparent',
                                    border: `1px solid ${isActive ? '#10b981' : '#555'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '2px'
                                }}>
                                    {isActive && <Check size={12} color="#000" strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: '0.85rem', color: isActive ? '#fff' : '#888', fontWeight: isActive ? 500 : 400 }}>
                                    {source.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>{activeSources.length}/{APAC_SOURCES.length} enabled</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setAllSources(true)}
                            style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '1px' }}>
                            SELECT ALL
                        </button>
                        <button
                            onClick={() => setAllSources(false)}
                            style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '1px' }}>
                            SELECT NONE
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
