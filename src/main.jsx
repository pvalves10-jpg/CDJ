import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './services/instalar' // captura o evento de instalação do PWA cedo
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Só em produção: em dev o SW serviria assets antigos e atrapalharia o HMR.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch((erro) => {
        console.warn('Service worker não registrado:', erro)
      })
  })
}
