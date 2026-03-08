import React from 'react';
import { Eye, EyeOff, RefreshCw, Satellite } from 'lucide-react';

const MODES = [
    { id: 'true-color', label: 'Optical' },
    { id: 'ndvi', label: 'Vegetation' }
];

const formatDate = (value) => {
    if (!value) return '--';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
    });
};

const getStatusLabel = ({ runtimeSource, preview, isStale, error }) => {
    if (runtimeSource === 'public') return 'PUBLIC';
    if (isStale) return 'STALE';
    if (preview?.available) return 'LIVE';
    if (error) return 'OFFLINE';
    return 'SYNC';
};

const getEmptyStateCopy = ({ runtimeSource, preview, isLoading, error, showOverlay }) => {
    if (runtimeSource === 'public') {
        return {
            title: showOverlay ? 'Public satellite layer is active on the map' : 'Public satellite layer is ready',
            body: preview?.configured === false
                ? 'Using the no-auth fallback now. Add Copernicus credentials later and this control will upgrade to live Sentinel-2 automatically.'
                : 'Using the public fallback while Copernicus is unavailable. Toggle Overlay On to project it onto the map.'
        };
    }

    if (isLoading) {
        return {
            title: 'Pulling latest Sentinel scene',
            body: 'Looking for the most recent cloud-filtered image inside the active theater.'
        };
    }

    if (error) {
        return {
            title: 'Sentinel preview unavailable',
            body: 'The imagery request failed on the latest attempt. The rest of the dashboard remains usable while the feed retries.'
        };
    }

    return {
        title: 'Waiting for imagery',
        body: 'This panel will show the latest processed Sentinel-2 scene for the current theater.'
    };
};

const CopernicusPreviewPanel = ({
    viewMode,
    preset,
    onPresetChange,
    runtimeSource,
    showOverlay,
    onToggleOverlay,
    previewResource
}) => {
    const {
        data: preview,
        lastUpdated,
        isLoading,
        isRefreshing,
        isStale,
        error,
        refresh
    } = previewResource;

    const statusLabel = getStatusLabel({ runtimeSource, preview, isStale, error });
    const emptyState = getEmptyStateCopy({ runtimeSource, preview, isLoading, error, showOverlay });
    const canOverlay = runtimeSource === 'public' || Boolean(preview?.available && preview?.imageDataUrl);
    const modeLabel = MODES.find((item) => item.id === preset)?.label || 'Optical';
    const theaterLabel = preview?.theaterLabel || (viewMode === 'depa' ? 'Bangkok Metro' : 'Strait of Hormuz');
    const sourceLabel = runtimeSource === 'public' ? 'public satellite' : 'sentinel-2-l2a';
    const statusClassName = statusLabel === 'PUBLIC'
        ? 'live-pill live-pill-public'
        : `live-pill ${statusLabel !== 'LIVE' ? 'live-pill-muted' : ''}`;

    return (
        <div className="eo-preview-card">
            <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Satellite size={14} /> SENTINEL INSIGHT
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={refresh}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                        title="Refresh Sentinel preview"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
                    </button>
                    <span className={statusClassName}>{statusLabel}</span>
                </div>
            </div>

            <div className="panel-content eo-preview-content">
                <div className="eo-preview-toolbar">
                    <div className="eo-preview-toggle-row">
                        {MODES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`eo-preview-toggle ${preset === item.id ? 'active' : ''}`}
                                onClick={() => onPresetChange(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={`eo-overlay-toggle ${showOverlay && canOverlay ? 'active' : ''}`}
                        onClick={onToggleOverlay}
                        disabled={!canOverlay}
                        title={canOverlay ? 'Toggle map overlay' : 'Overlay becomes available after a live image is loaded'}
                    >
                        {showOverlay && canOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
                        {showOverlay && canOverlay ? 'Overlay On' : 'Overlay Off'}
                    </button>
                </div>

                <div className="eo-preview-frame">
                    {runtimeSource === 'copernicus' && preview?.available && preview?.imageDataUrl ? (
                        <img
                            src={preview.imageDataUrl}
                            alt={`${preview.theaterLabel} ${preview.presetLabel} preview`}
                            className="eo-preview-image"
                        />
                    ) : (
                        <div className="eo-preview-empty">
                            <strong>{emptyState.title}</strong>
                            <span>{emptyState.body}</span>
                        </div>
                    )}
                </div>

                <div className="eo-chip-row">
                    <span className="eo-chip">{theaterLabel}</span>
                    <span className="eo-chip">{preview?.presetLabel || modeLabel}</span>
                    <span className="eo-chip">{sourceLabel}</span>
                </div>

                <div className="eo-insight-card">
                    <span className="eo-insight-kicker">What You Learn</span>
                    <p>{preview?.insight || 'Switch between optical and vegetation modes to read change, cover, and land-water contrast in the active theater.'}</p>
                </div>

                <div className="eo-preview-caption">
                    {runtimeSource === 'copernicus' ? (
                        <>
                            <strong>
                                {preview?.timeRange
                                    ? `${formatDate(preview.timeRange.from)} - ${formatDate(preview.timeRange.to)}`
                                    : 'Recent search window'}
                            </strong>
                            <span>
                                {preview?.available
                                    ? ` Most recent scene in the last ${preview.lookbackDays} days with max ${preview.maxCloudCoverage}% cloud cover.`
                                    : ' Scenes depend on acquisition timing and cloud conditions.'}
                            </span>
                        </>
                    ) : (
                        <>
                            <strong>{showOverlay ? 'Public fallback is visible on the map.' : 'Public fallback is ready.'}</strong>
                            <span> Optical and vegetation modes reuse the app&apos;s existing public EO layers, then auto-upgrade to Copernicus when credentials exist.</span>
                        </>
                    )}
                </div>

                {runtimeSource === 'copernicus' && preview?.available && lastUpdated && (
                    <div className="eo-preview-note">
                        Last sync {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CopernicusPreviewPanel;
