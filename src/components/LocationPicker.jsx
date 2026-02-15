import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { User, Server, Building2, Map as MapIcon, Satellite } from "lucide-react";
import styles from "./styles/LocationPicker.module.css";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const UBICACION_NEGOCIO = [17.6852292,-91.0269451];
const SEDE_POS = [17.687171, -91.029577];

const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div className={styles.customIcon} style={{ backgroundColor: bgColor }}>
            {iconComponent}
        </div>
    );

    return new L.DivIcon({
        html: iconHtml, className: 'custom-marker',
        iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28]
    });
};

const iconCliente = createCustomIcon(<User size={16} />, '#2563eb'); 
const iconCaja = createCustomIcon(<Server size={16} />, '#f97316'); 
const iconSede = createCustomIcon(<Building2 size={16} />, '#dc2626');

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
    
    const [tipoMapa, setTipoMapa] = useState(() => {
        return localStorage.getItem('vistaMapaPreferencia') || 'calle';
    });

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const handleSelect = (latlng) => {
        setPosition(latlng);
        onLocationChange(latlng);
    };

    const cambiarVista = (vista) => {
        setTipoMapa(vista);
        localStorage.setItem('vistaMapaPreferencia', vista);
    };

    return (
        <div className={styles.container}>
            
            <div className={styles.layerSwitcher}>
                <button 
                    type="button" 
                    onClick={() => cambiarVista('calle')}
                    className={`${styles.layerBtn} ${tipoMapa === 'calle' ? styles.layerBtnActive : ''}`}
                >
                    <MapIcon size={14} /> Calle
                </button>
                <button 
                    type="button" 
                    onClick={() => cambiarVista('satelite')}
                    className={`${styles.layerBtn} ${tipoMapa === 'satelite' ? styles.layerBtnActive : ''}`}
                >
                    <Satellite size={14} /> Satélite
                </button>
            </div>

            <MapContainer 
                center={initialLat ? [initialLat, initialLng] : UBICACION_NEGOCIO} 
                zoom={16} 
                className={styles.map}
            >
                {tipoMapa === 'calle' ? (
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                ) : (
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri'
                    />
                )}
                
                <Marker position={SEDE_POS} icon={iconSede} />

                {cajas.map(c => (
                    c.latitud && c.longitud ? (
                        <Marker key={`caja-${c.id}`} position={[c.latitud, c.longitud]} icon={iconCaja}>
                            <Popup>NAP: {c.nombre}</Popup>
                        </Marker>
                    ) : null
                ))}

                {clients.map(c => (
                    c.latitud && c.longitud ? (
                        <Marker key={`cli-${c.id}`} position={[c.latitud, c.longitud]} icon={iconCliente}>
                            <Popup>{c.nombre_completo}</Popup>
                        </Marker>
                    ) : null
                ))}

                <ClickHandler onLocationSelect={handleSelect} />
                {position && <Marker position={position} />}
            </MapContainer>
            
            <div className={styles.legend}>
                <span>Clic para ubicar</span>
                <span className={styles.legendSeparator}>|</span>
                <span><span className={`${styles.dot} ${styles.dotBlue}`}></span> Clientes</span>
                <span className={styles.legendSeparator}>|</span>
                <span><span className={`${styles.dot} ${styles.dotOrange}`}></span> Cajas</span>
            </div>
        </div>
    );
};

export default LocationPicker;