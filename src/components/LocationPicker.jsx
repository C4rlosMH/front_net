import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix para los iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componente para detectar clics en el mapa
function ClickHandler({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
}

const LocationPicker = ({ onLocationChange, initialLat, initialLng }) => {
    // Coordenadas iniciales (Por defecto CDMX, ajusta a tu ciudad)
    const defaultCenter = [19.4326, -99.1332]; 
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const handleSelect = (latlng) => {
        setPosition(latlng);
        onLocationChange(latlng); // Avisar al formulario
    };

    return (
        <div style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
            <MapContainer 
                center={initialLat ? [initialLat, initialLng] : defaultCenter} 
                zoom={13} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <ClickHandler onLocationSelect={handleSelect} />
                {position && <Marker position={position} />}
            </MapContainer>
            <div style={{ background: '#f8fafc', padding: '5px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                📍 Haz clic en el mapa para fijar la ubicación del cliente
            </div>
        </div>
    );
};

export default LocationPicker;