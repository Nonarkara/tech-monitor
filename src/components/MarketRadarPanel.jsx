import React, { useEffect, useState } from 'react';
import { fetchMarketRadar } from '../services/marketData';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

const MarketRadarPanel = () => {
    const [markets, setMarkets] = useState([]);

    useEffect(() => {
        fetchMarketRadar().then(setMarkets);

        // Refresh every 15 seconds for live feel
        const interval = setInterval(() => {
            fetchMarketRadar().then(setMarkets);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bottom-card flex-column">
            <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> MARKET RADAR
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--bg-dark)', fontWeight: 'bold', background: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ul className="radar-list">
                    {markets.map((item, index) => (
                        <li key={index} className="radar-item" style={{ cursor: 'default' }}>
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
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Loading markets...</span>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default MarketRadarPanel;
