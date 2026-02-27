import React, { useEffect, useState } from 'react';
import { fetchLiveNews } from '../services/liveNews';
import { Radio, RefreshCw } from 'lucide-react';

const LiveIntelligenceFeed = ({ activeUrls }) => {
    const [news, setNews] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadNews = () => {
        setIsRefreshing(true);
        fetchLiveNews(activeUrls)
            .then(setNews)
            .finally(() => setIsRefreshing(false));
    };

    useEffect(() => {
        loadNews();

        // Refresh news every 5 minutes
        const interval = setInterval(loadNews, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [activeUrls]);

    if (news.length === 0) return null;

    return (
        <div className="news-ticker-wrapper">
            <div className="news-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--accent-blue)' }}>LIVE INTEL</span>
                <button
                    onClick={loadNews}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                    title="Force Refresh Data"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
                </button>
            </div>
            <div className="news-marquee-container">
                <div className="news-marquee">
                    {/* Duplicate for infinite scroll illusion */}
                    {[...news, ...news].map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-item"
                        >
                            <span className="source">{item.source}:</span> {item.title}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveIntelligenceFeed;
