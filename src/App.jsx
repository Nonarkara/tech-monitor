import React, { useState, useCallback } from 'react';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';
import RegionSelector from './components/RegionSelector';
import EventDetailsPanel from './components/EventDetailsPanel';
import WorldClock from './components/WorldClock';
import LiveIntelligenceFeed from './components/LiveIntelligenceFeed';
import RegionalNewsPanel from './components/RegionalNewsPanel';
import MarketRadarPanel from './components/MarketRadarPanel';
import SettingsModal from './components/SettingsModal';
import { APAC_SOURCES } from './services/liveNews';
import { Settings } from 'lucide-react';

function App() {
  const [activeLayers, setActiveLayers] = useState(['disasters', 'weather', 'economy']);
  const [activeRegion, setActiveRegion] = useState('asean');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSources, setActiveSources] = useState(APAC_SOURCES.map(s => s.id));

  const [viewState, setViewState] = useState({
    longitude: 105,
    latitude: 10,
    zoom: 4,
    pitch: 0,
    bearing: 0
  });

  const toggleLayer = (layerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleRegionSelect = useCallback((regionId, targetViewState) => {
    setActiveRegion(regionId);
    setViewState(prev => ({
      ...prev,
      ...targetViewState,
      transitionDuration: 1500, // Smooth flyTo effect
    }));
  }, []);

  const toggleSource = (sourceId) => {
    setActiveSources(prev =>
      prev.includes(sourceId) ? prev.filter(id => id !== sourceId) : [...prev, sourceId]
    );
  };

  const setAllSources = (enable) => {
    setActiveSources(enable ? APAC_SOURCES.map(s => s.id) : []);
  };

  // Resolve source IDs to URLs for the fetcher
  const activeUrls = activeSources.map(id => APAC_SOURCES.find(s => s.id === id)?.url).filter(Boolean);

  return (
    <>
      <MapContainer
        viewState={viewState}
        onMove={setViewState}
        activeLayers={activeLayers}
        onMarkerClick={setSelectedEvent}
      />
      <div className="app-container">

        {/* Top Header Placeholder */}
        <div className="header-bar grid-panel" style={{ background: 'var(--surface-color)', padding: '0 24px' }}>
          <div style={{ fontWeight: 'bold', letterSpacing: '2px' }}>MONITOR</div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'transparent', border: '1px solid #444', color: '#fff', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
            <Settings size={14} /> Settings (Sources)
          </button>
        </div>

        <LiveIntelligenceFeed activeUrls={activeUrls} />

        <WorldClock />

        <div className="left-sidebar">
          <Sidebar activeLayers={activeLayers} toggleLayer={toggleLayer} />
        </div>

        <div className="right-sidebar">
          {selectedEvent && (
            <EventDetailsPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
          <RegionalNewsPanel regionName="Thailand" title="Thailand Tech Ecosystem" activeUrls={activeUrls} />
          <RegionalNewsPanel regionName="DEPA" title="depa & MDES Directives" activeUrls={activeUrls} />
        </div>

        <div className="bottom-bar flex-row">
          <MarketRadarPanel />
          <RegionalNewsPanel regionName="SEA" title="Global Technology News" activeUrls={activeUrls} />
          <RegionalNewsPanel regionName="Global" title="Global Macro & Policy" activeUrls={activeUrls} />
        </div>

        <RegionSelector
          activeRegion={activeRegion}
          onSelectRegion={handleRegionSelect}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          activeSources={activeSources}
          toggleSource={toggleSource}
          setAllSources={setAllSources}
        />
      </div>
    </>
  );
}

export default App;
