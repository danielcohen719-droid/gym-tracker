import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

registerSW({
  immediate: true,
  onOfflineReady() {
    try {
      localStorage.setItem('offlineReady', '1')
    } catch {
      /* ignore */
    }
  },
})

// Ask the browser to keep our data even when the device is low on storage.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
