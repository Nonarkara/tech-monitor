// Modular Sentinel-2 evalscript library
// Each evalscript outputs 4 bands (RGBA) for PNG rendering via Processing API

export const EVALSCRIPTS = {
    'true-color': {
        id: 'true-color',
        label: 'True Color',
        description: 'Natural RGB composite (B04/B03/B02)',
        bands: ['B04', 'B03', 'B02'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B04", "B03", "B02", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    return [
        Math.min(sample.B04 * 2.7, 1),
        Math.min(sample.B03 * 2.7, 1),
        Math.min(sample.B02 * 2.7, 1),
        sample.dataMask
    ];
}`
    },

    ndvi: {
        id: 'ndvi',
        label: 'NDVI',
        description: 'Normalized Difference Vegetation Index (B08-B04)/(B08+B04)',
        bands: ['B04', 'B08'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B04", "B08", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    const ndvi = index(sample.B08, sample.B04);
    if (ndvi < 0) return [0.22, 0.17, 0.12, 1];
    if (ndvi < 0.2) return [0.63, 0.48, 0.22, 1];
    if (ndvi < 0.4) return [0.83, 0.74, 0.31, 1];
    if (ndvi < 0.6) return [0.32, 0.67, 0.28, 1];
    return [0.07, 0.35, 0.1, 1];
}`
    },

    moisture: {
        id: 'moisture',
        label: 'Moisture Index',
        description: 'NDMI = (B08-B11)/(B08+B11) — soil and vegetation moisture',
        bands: ['B08', 'B11'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B08", "B11", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    const ndmi = index(sample.B08, sample.B11);
    // Dry → Wet color ramp: brown → yellow → green → blue
    if (ndmi < -0.2) return [0.55, 0.32, 0.14, 1];
    if (ndmi < 0.0)  return [0.82, 0.71, 0.26, 1];
    if (ndmi < 0.2)  return [0.50, 0.78, 0.32, 1];
    if (ndmi < 0.4)  return [0.20, 0.55, 0.72, 1];
    return [0.10, 0.30, 0.65, 1];
}`
    },

    'urban-heat': {
        id: 'urban-heat',
        label: 'Urban Heat',
        description: 'SWIR composite (B12/B11/B04) highlighting urban heat islands',
        bands: ['B04', 'B11', 'B12'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B12", "B11", "B04", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    return [
        Math.min(sample.B12 * 3.0, 1),
        Math.min(sample.B11 * 2.5, 1),
        Math.min(sample.B04 * 3.0, 1),
        1
    ];
}`
    },

    'burn-severity': {
        id: 'burn-severity',
        label: 'Burn Severity',
        description: 'NBR = (B08-B12)/(B08+B12) — post-fire burn assessment',
        bands: ['B08', 'B12'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B08", "B12", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    const nbr = index(sample.B08, sample.B12);
    // Severely burned → unburned: dark red → orange → yellow → green
    if (nbr < -0.25) return [0.40, 0.00, 0.05, 1];
    if (nbr < -0.1)  return [0.75, 0.15, 0.05, 1];
    if (nbr < 0.1)   return [0.90, 0.60, 0.10, 1];
    if (nbr < 0.27)  return [0.85, 0.85, 0.25, 1];
    if (nbr < 0.44)  return [0.50, 0.78, 0.30, 1];
    return [0.10, 0.48, 0.20, 1];
}`
    },

    'water-bodies': {
        id: 'water-bodies',
        label: 'Water Bodies',
        description: 'NDWI = (B03-B08)/(B03+B08) — surface water detection',
        bands: ['B03', 'B08'],
        evalscript: `//VERSION=3
function setup() {
    return {
        input: ["B03", "B08", "dataMask"],
        output: { bands: 4 }
    };
}

function evaluatePixel(sample) {
    if (sample.dataMask === 0) return [0, 0, 0, 0];
    const ndwi = index(sample.B03, sample.B08);
    // Water → land: deep blue → light blue → beige → brown
    if (ndwi > 0.3)  return [0.05, 0.20, 0.55, 1];
    if (ndwi > 0.1)  return [0.15, 0.45, 0.75, 1];
    if (ndwi > 0.0)  return [0.55, 0.75, 0.85, 1];
    if (ndwi > -0.2) return [0.80, 0.75, 0.55, 1];
    return [0.55, 0.42, 0.25, 1];
}`
    }
};

export const getEvalscript = (presetId) => {
    const preset = EVALSCRIPTS[presetId];
    if (!preset) return null;
    return preset;
};

export const listPresets = () =>
    Object.values(EVALSCRIPTS).map(({ id, label, description, bands }) => ({
        id, label, description, bands
    }));
