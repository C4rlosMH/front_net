import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { User, Server, Building2, Map as MapIcon, Satellite, Wifi, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import styles from "./styles/LocationPicker.module.css";

const Sede = [17.687171, -91.029577];

// Creador de iconos personalizados
const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div className={styles.iconMarker} style={{ backgroundColor: bgColor }}>
            {iconComponent}
        </div>
    );
    return new L.DivIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26]
    });
};

// Iconos de contexto (ligeramente más pequeños que el principal)
const iconFibra = createCustomIcon(<User size={14} />, '#2563eb'); 
const iconRadio = createCustomIcon(<Wifi size={14} />, '#10b981'); 
const iconCaja = createCustomIcon(<Server size={14} />, '#f97316'); 
const iconSede = createCustomIcon(<Building2 size={14} />, '#dc2626'); 

// Icono destacado para el punto que el usuario está seleccionando/arrastrando
const iconSeleccion = createCustomIcon(<MapPin size={18} />, '#ef4444');

function LocationMarker({ position, setPosition, onLocationChange }) {
    const markerRef = useRef(null);
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationChange(e.latlng);
        },
    });

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const latlng = marker.getLatLng();
                setPosition(latlng);
                onLocationChange(latlng);
            }
        },
    };

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={iconSeleccion}
            zIndexOffset={1000} // Asegura que quede siempre por encima de los demás
        >
            <Popup minWidth={90}>Ubicación seleccionada.</Popup>
        </Marker>
    );
}

function LocationPicker({ initialLat, initialLng, onLocationChange, clients = [], cajas = [] }) {
    const [position, setPosition] = useState(null);
    
    // Leemos la preferencia guardada para que coincida con el mapa principal
    const [tipoMapa, setTipoMapa] = useState(() => {
        return localStorage.getItem('vistaMapaPreferencia') || 'calle';
    });

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: parseFloat(initialLat), lng: parseFloat(initialLng) });
        }
    }, [initialLat, initialLng]);

    const center = position ? [position.lat, position.lng] : Sede;

    const cambiarVista = (vista) => {
        setTipoMapa(vista);
        localStorage.setItem('vistaMapaPreferencia', vista);
    };

    return (
        <div className={styles.mapWrapper}>
            
            {/* CONTROL DE VISTAS FLOTANTE */}
            <div className={styles.layerSwitcher}>
                <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); cambiarVista('calle'); }} 
                    className={`${styles.layerBtn} ${tipoMapa === 'calle' ? styles.layerBtnActive : ''}`}
                >
                    <MapIcon size={14} /> Calle
                </button>
                <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); cambiarVista('satelite'); }} 
                    className={`${styles.layerBtn} ${tipoMapa === 'satelite' ? styles.layerBtnActive : ''}`}
                >
                    <Satellite size={14} /> Satélite
                </button>
            </div>

            {/* CONTENEDOR DEL MAPA */}
            <MapContainer center={center} zoom={16} className={styles.mapInstance} scrollWheelZoom={true}>
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

                <Marker position={Sede} icon={iconSede} opacity={0.7} />

                {/* CONTEXTO: CAJAS NAP */}
                {cajas.map(caja => (
                    caja.latitud && caja.longitud ? (
                        <Marker key={`caja-${caja.id}`} position={[caja.latitud, caja.longitud]} icon={iconCaja} opacity={0.5}>
                            <Popup>Caja NAP: {caja.nombre}</Popup>
                        </Marker>
                    ) : null
                ))}

                {/* CONTEXTO: CLIENTES EXISTENTES */}
                {clients.map(c => {
                    // Evitar dibujar al cliente que estamos editando para no duplicar el marcador
                    if (position && c.latitud === position.lat && c.longitud === position.lng) return null;

                    if (c.latitud && c.longitud) {
                        const isRadio = c.tipo_conexion?.toLowerCase() === 'radio' || !c.caja;
                        return (
                            <Marker key={`cli-${c.id}`} position={[c.latitud, c.longitud]} icon={isRadio ? iconRadio : iconFibra} opacity={0.5}>
                                <Popup>{c.nombre_completo} ({isRadio ? 'Radio' : 'Fibra'})</Popup>
                            </Marker>
                        );
                    }
                    return null;
                })}

                <LocationMarker position={position} setPosition={setPosition} onLocationChange={onLocationChange} />
            </MapContainer>
        </div>
    );
}

export default LocationPicker;