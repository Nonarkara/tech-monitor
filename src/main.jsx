import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { trackVisitor } from './services/visitorTracker.js'

trackVisitor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
