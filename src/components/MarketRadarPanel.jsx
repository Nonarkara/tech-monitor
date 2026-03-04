import React, { useCallback } from 'react';
import { fetchMarketRadar } from '../services/marketData';
import { Activity, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useLiveResource } from '../hooks/useLiveResource';

const MarketRadarPanel = () => {
    const fetcher = useCallback(() => fetchMarketRadar(), []);
    const {
        data: markets = [],
        lastUpdated,
        isRefreshing,
        isLoading,
        isStale,
        error,
        refresh
    } = useLiveResource(fetcher, {
        cacheKey: 'market-radar',
        intervalMs: 60000,
        isUsable: (items) => Array.isArray(items) && items.length > 0
    });
    const statusLabel = isStale ? 'STALE' : (error && markets.length === 0 ? 'OFFLINE' : 'LIVE');

    return (
        <div className="bottom-card flex-column">
            <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> OIL, FX & MARKETS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={refresh}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                        title="Refresh market data"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
                    </button>
                    <span className={`live-pill ${statusLabel !== 'LIVE' ? 'live-pill-muted' : ''}`}>{statusLabel}</span>
                </div>
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="panel-lead" style={{ marginBottom: 0 }}>
                    {lastUpdated ? `Last live update ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for first live quote...'}
                </div>
                <ul className="radar-list">
                    {markets.map((item, index) => (
                        <li key={index} className="radar-item">
                            <div className="radar-token">
                                <strong>{item.symbol}</strong>
                            </div>
                            <div className="radar-price">
                                <span>{item.price}</span>
                                <span className={`change ${item.isPositive ? 'positive' : 'negative'}`}>
                                    {item.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {item.changePerc}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>

                {
                    markets.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                {isLoading ? 'Connecting to live markets...' : 'No live market data available right now.'}
                            </span>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default MarketRadarPanel;
