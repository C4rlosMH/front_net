import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { User, Server, Building2 } from "lucide-react";

// Fix para iconos default de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Constantes de ubicación (Mismas que en Mapa.jsx)
const UBICACION_NEGOCIO = [17.6852292,-91.0269451];
const SEDE_POS = [17.687171, -91.029577];

// Generador de iconos personalizados (Con estilos inline para no depender del CSS module)
const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div style={{
            backgroundColor: bgColor,
            width: '28px', height: '28px', // Un poco más pequeños para no estorbar al elegir
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            color: 'white'
        }}>
            {iconComponent}
        </div>
    );

    return new L.DivIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });
};

const iconCliente = createCustomIcon(<User size={16} />, '#2563eb'); 
const iconCaja = createCustomIcon(<Server size={16} />, '#f97316'); 
const iconSede = createCustomIcon(<Building2 size={16} />, '#dc2626');

// Detector de clics
function ClickHandler({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
}

const LocationPicker = ({ onLocationChange, initialLat, initialLng, clients = [], cajas = [] }) => {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const handleSelect = (latlng) => {
        setPosition(latlng);
        onLocationChange(latlng);
    };

    return (
        <div style={{ height: "100%", width: "100%", position: "relative" }}>
            <MapContainer 
                center={initialLat ? [initialLat, initialLng] : UBICACION_NEGOCIO} 
                zoom={15} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* --- MARCADORES DE CONTEXTO --- */}
                <Marker position={SEDE_POS} icon={iconSede} />

                {cajas.map(c => (
                    c.latitud && c.longitud ? (
                        <Marker 
                            key={`caja-${c.id}`} 
                            position={[c.latitud, c.longitud]} 
                            icon={iconCaja}
                        >
                            <Popup>NAP: {c.nombre}</Popup>
                        </Marker>
                    ) : null
                ))}

                {clients.map(c => (
                    c.latitud && c.longitud ? (
                        <Marker 
                            key={`cli-${c.id}`} 
                            position={[c.latitud, c.longitud]} 
                            icon={iconCliente}
                        >
                            <Popup>{c.nombre_completo}</Popup>
                        </Marker>
                    ) : null
                ))}

                {/* --- MARCADOR DE SELECCIÓN (El que mueve el usuario) --- */}
                <ClickHandler onLocationSelect={handleSelect} />
                
                {position && <Marker position={position} />}
            </MapContainer>
            
            <div style={{ 
                position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 1000,
                background: 'rgba(255,255,255,0.9)', padding: '5px 10px', 
                borderRadius: '6px', fontSize: '0.75rem', textAlign: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)', color:'#334155'
            }}>
                📍 Clic para ubicar | 🔵 Clientes | 🟠 Cajas
            </div>
        </div>
    );
};

export default LocationPicker;