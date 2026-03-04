# Tech Monitor

A React + Vite dashboard for urban operations monitoring, with a lightweight Node API cache layer for the most time-sensitive panels.

It combines map layers, market context, and structured intelligence briefings so planners can read transport, climate, conflict, and policy signals as one operating picture.

## What It Tracks

- Natural disasters via NASA EONET
- Conflict and humanitarian hotspots via curated signals plus ReliefWeb fallback
- Weather and air quality via Open-Meteo
- Macro growth baselines via the World Bank API
- Crypto, FX, and reference commodities
- Topic-based intelligence briefings for:
  - Iran flight and conflict disruption
  - Thailand digital and city programs
  - Urban systems and mobility
  - Urban politics and governance

## Run Locally

```bash
npm install
npm run dev:stack
```

This starts:

- the frontend on `http://127.0.0.1:5173`
- the API cache layer on `http://127.0.0.1:4000`

If you want to run them separately:

```bash
npm run api
npm run dev
```

Build for production:

```bash
npm run build
```

## Current Architecture Notes

- Key live panels now prefer the backend API at `/api/*`, which adds caching and returns live or stale payloads explicitly.
- The frontend still has browser-side fallbacks, so the dashboard keeps working while the backend is unavailable.
- For production-grade flight and traffic monitoring, add dedicated APIs such as OpenSky, FlightAware, GTFS Realtime, and TomTom instead of relying only on media feeds.
