import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- AGREGA ESTA LÍNEA OBLIGATORIA PARA EL MAPA ---
import 'leaflet/dist/leaflet.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)