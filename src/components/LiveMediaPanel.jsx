import React, { useState } from 'react';
import { ExternalLink, PlayCircle, Radio, Webcam } from 'lucide-react';

const LIVE_FEEDS = [
    {
        id: 'thaipbs',
        label: 'Thai PBS Live',
        kind: 'Official public TV',
        embedUrl: 'https://www.thaipbs.or.th/live',
        openUrl: 'https://www.thaipbs.or.th/live',
        note: 'Best option for live public coverage. Audio usually requires a tap inside the player.',
        badge: 'Official',
        icon: Radio
    },
    {
        id: 'petchaburi',
        label: 'Petchaburi Road Cam',
        kind: 'Bangkok street cam',
        embedUrl: 'https://www.webcamtaxi.com/en/thailand/bangkok/petchaburi-road-traffic-cam.html',
        openUrl: 'https://www.webcamtaxi.com/en/thailand/bangkok/petchaburi-road-traffic-cam.html',
        note: 'A live Bangkok traffic view. More playful, but third-party and less predictable than Thai PBS.',
        badge: '3rd-party',
        icon: Webcam
    }
];

const LiveMediaPanel = () => {
    const [activeFeedId, setActiveFeedId] = useState(LIVE_FEEDS[0].id);
    const activeFeed = LIVE_FEEDS.find((feed) => feed.id === activeFeedId) || LIVE_FEEDS[0];
    const ActiveIcon = activeFeed.icon;

    return (
        <section className="grid-panel live-media-panel">
            <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlayCircle size={14} /> LIVE WINDOW
                </span>
                <span className="live-pill">LIVE</span>
            </div>

            <div className="live-media-tabs">
                {LIVE_FEEDS.map((feed) => (
                    <button
                        key={feed.id}
                        type="button"
                        className={`live-media-tab ${feed.id === activeFeed.id ? 'active' : ''}`}
                        onClick={() => setActiveFeedId(feed.id)}
                    >
                        {feed.label}
                    </button>
                ))}
            </div>

            <div className="live-media-body">
                <div className="live-media-preview">
                    <iframe
                        key={activeFeed.id}
                        src={activeFeed.embedUrl}
                        title={activeFeed.label}
                        loading="lazy"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                    <div className="live-media-fallback">
                        <span>If the preview is blocked by the source, open the live feed directly.</span>
                        <a href={activeFeed.openUrl} target="_blank" rel="noopener noreferrer">
                            Open Live <ExternalLink size={12} />
                        </a>
                    </div>
                </div>

                <div className="live-media-meta">
                    <div className="live-media-heading">
                        <span className="live-media-badge">{activeFeed.badge}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ActiveIcon size={14} />
                            {activeFeed.kind}
                        </span>
                    </div>
                    <div className="live-media-title">{activeFeed.label}</div>
                    <div className="live-media-note">{activeFeed.note}</div>
                </div>
            </div>
        </section>
    );
};

export default LiveMediaPanel;
