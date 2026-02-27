import React from 'react';

const regions = [
    {
        id: 'global',
        name: 'Global',
        viewState: { longitude: 0, latitude: 20, zoom: 1.5 }
    },
    {
        id: 'asia',
        name: 'Asia',
        viewState: { longitude: 100, latitude: 35, zoom: 3 }
    },
    {
        id: 'asean',
        name: 'ASEAN',
        viewState: { longitude: 105, latitude: 10, zoom: 4 }
    },
    {
        id: 'thailand',
        name: 'Thailand',
        viewState: { longitude: 100.9925, latitude: 15.8700, zoom: 5.5 }
    }
];

const RegionSelector = ({ activeRegion, onSelectRegion }) => {
    return (
        <div className="region-selector">
            {regions.map((region) => (
                <button
                    key={region.id}
                    className={`region-btn ${activeRegion === region.id ? 'active' : ''}`}
                    onClick={() => onSelectRegion(region.id, region.viewState)}
                >
                    {region.name}
                </button>
            ))}
        </div>
    );
};

export default RegionSelector;
