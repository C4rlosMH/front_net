import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { APP_CONFIG } from './config/appConfig.js';

// --- AGREGA ESTA LÍNEA OBLIGATORIA PARA EL MAPA ---
import 'leaflet/dist/leaflet.css'; 

document.title = `${APP_CONFIG.appName}`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)