import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'

// Auto-reload on chunk load failure due to new deployment
window.addEventListener('vite:preloadError', () => {
  console.warn('Vite preload chunk error detected, reloading...');
  window.location.reload();
});

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

