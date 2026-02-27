import React, { useEffect, useState, useCallback } from 'react';
import { fetchLiveNews } from '../services/liveNews';
import { Rss, RefreshCw } from 'lucide-react';

const RegionalNewsPanel = ({ regionName, title, activeUrls }) => {
    const [news, setNews] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchNews = useCallback(() => {
        setIsRefreshing(true);
        if (regionName === 'DEPA') {
            // Social Listening via Google News RSS for DEPA
            const depaSearchUrl = 'https://news.google.com/rss/search?q="Digital+Economy+Promotion+Agency"+OR+"สำนักงานส่งเสริมเศรษฐกิจดิจิทัล"&hl=th&gl=TH&ceid=TH:th';
            const freshUrl = depaSearchUrl + '&cb=' + Date.now();
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(freshUrl)}`;

            fetch(proxyUrl)
                .then(res => res.json())
                .then(data => {
                    if (data && data.contents) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                        const items = xmlDoc.querySelectorAll("item");

                        const newsItems = [];
                        Array.from(items).slice(0, 5).forEach(item => {
                            const title = item.querySelector("title")?.textContent;
                            const link = item.querySelector("link")?.textContent;
                            const pubDateStr = item.querySelector("pubDate")?.textContent;
                            const source = item.querySelector("source")?.textContent || 'Google News';

                            if (title && link) {
                                newsItems.push({
                                    title,
                                    link,
                                    pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
                                    source
                                });
                            }
                        });
                        setNews(newsItems);
                    }
                })
                .catch(err => console.error("DEPA Social Listening failed:", err))
                .finally(() => setIsRefreshing(false));
            return;
        }

        // In a real V3 implementation, this would filter by the specific region tags
        // For now, we fetch the live news and simulate a regional slice
        fetchLiveNews(activeUrls).then(data => {
            // Pseudo-randomizing or slicing to make the panels look distinct
            let sliceStart = 0;
            if (regionName === 'Global') sliceStart = 5;
            if (regionName === 'Thailand') sliceStart = 10;

            setNews(data.slice(sliceStart, sliceStart + 5));
        }).finally(() => setIsRefreshing(false));
    }, [regionName, activeUrls]);

    useEffect(() => {
        fetchNews();

        // Refresh regional news every 5 minutes
        const interval = setInterval(fetchNews, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchNews]);

    return (
        <div className="bottom-card flex-column">
            <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rss size={14} /> {title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={fetchNews}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                        title="Force Refresh Data"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--bg-dark)', fontWeight: 'bold', background: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                </div>
            </div>
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {news.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 'bold' }}>{item.source}</span>
                            <span>{item.pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                            {item.title}
                        </div>
                    </a>
                ))}
                {news.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading streams...</span>}
            </div>
        </div>
    );
};

export default RegionalNewsPanel;
