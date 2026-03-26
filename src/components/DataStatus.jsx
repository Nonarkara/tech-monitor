import React from 'react';

const STATUS_STYLES = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 8px',
        gap: '6px',
        minHeight: 60,
        textAlign: 'center'
    },
    icon: { fontSize: '18px', opacity: 0.6 },
    label: { fontSize: '10px', color: '#aaa', letterSpacing: '0.5px' },
    retryBtn: {
        marginTop: '4px',
        padding: '3px 10px',
        fontSize: '9px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '4px',
        color: '#ccc',
        cursor: 'pointer',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    staleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '9px',
        color: '#f0ad4e',
        padding: '2px 6px',
        borderRadius: '3px',
        background: 'rgba(240,173,78,0.12)',
        letterSpacing: '0.3px'
    },
    spinner: {
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: 'rgba(255,255,255,0.5)',
        borderRadius: '50%',
        animation: 'dngws-spin 0.8s linear infinite'
    }
};

const spinnerKeyframes = `@keyframes dngws-spin { to { transform: rotate(360deg); } }`;

const DataStatus = ({
    isLoading,
    isRefreshing,
    isStale,
    error,
    retryCount,
    data,
    isEmpty,
    emptyMessage = 'No data available',
    refresh,
    children
}) => {
    // First load — no data yet
    if (!data && isLoading) {
        return (
            <div style={STATUS_STYLES.container}>
                <style>{spinnerKeyframes}</style>
                <div style={STATUS_STYLES.spinner} />
                <span style={STATUS_STYLES.label}>LOADING</span>
            </div>
        );
    }

    // Error with no data at all
    if (!data && error) {
        return (
            <div style={STATUS_STYLES.container}>
                <span style={STATUS_STYLES.icon}>⚠</span>
                <span style={STATUS_STYLES.label}>
                    UNAVAILABLE{retryCount > 0 ? ` (${retryCount} ${retryCount === 1 ? 'retry' : 'retries'})` : ''}
                </span>
                {refresh && (
                    <button style={STATUS_STYLES.retryBtn} onClick={refresh}>
                        TAP TO RETRY
                    </button>
                )}
            </div>
        );
    }

    // Data exists but is empty
    if (isEmpty) {
        return (
            <div style={STATUS_STYLES.container}>
                <span style={STATUS_STYLES.label}>{emptyMessage}</span>
            </div>
        );
    }

    // Has data — render children with optional stale/refreshing indicators
    return (
        <>
            {(isStale || isRefreshing) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 8px 0' }}>
                    {isStale && !isRefreshing && (
                        <span style={STATUS_STYLES.staleBadge}>⏳ STALE</span>
                    )}
                    {isRefreshing && (
                        <span style={{ ...STATUS_STYLES.staleBadge, color: '#5bc0de', background: 'rgba(91,192,222,0.12)' }}>
                            ↻ REFRESHING
                        </span>
                    )}
                </div>
            )}
            {children}
        </>
    );
};

export default DataStatus;
