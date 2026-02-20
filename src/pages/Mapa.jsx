import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"; 
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css";
import { User, Server, Building2, Map as MapIcon, Satellite, Wifi } from "lucide-react"; 
import ReactDOMServer from "react-dom/server";

const UBICACION_NEGOCIO = [17.6852292,-91.0269451];
const Sede = [17.687171, -91.029577];

const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div className={styles.iconMarker} style={{ backgroundColor: bgColor }}>
            {iconComponent}
        </div>
    );
    return new L.DivIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

// --- ICONOS DINÁMICOS ---
const iconFibra = createCustomIcon(<User size={16} />, '#2563eb'); // Azul
const iconRadio = createCustomIcon(<Wifi size={16} />, '#10b981'); // Verde
const iconCaja = createCustomIcon(<Server size={16} />, '#f97316'); // Naranja
const iconSede = createCustomIcon(<Building2 size={16} />, '#dc2626'); // Rojo

function Mapa() {
    const [clientes, setClientes] = useState([]);
    const [cajas, setCajas] = useState([]);
    
    const [tipoMapa, setTipoMapa] = useState(() => {
        return localStorage.getItem('vistaMapaPreferencia') || 'calle';
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resClientes, resCajas] = await Promise.all([
                    // Agregamos un limit alto para que traiga todos los clientes al mapa
                    client.get("/clientes?limit=1000"), 
                    client.get("/cajas").catch(() => ({ data: [] }))
                ]);
                
                // Extraemos específicamente el arreglo .clientes de la respuesta
                setClientes(resClientes.data.clientes || []); 
                setCajas(resCajas.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos del mapa");
            }
        };
        cargarDatos();
    }, []);

    const cambiarVista = (vista) => {
        setTipoMapa(vista);
        localStorage.setItem('vistaMapaPreferencia', vista);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mapa de Red</h1>
            </div>

            <div className={styles.mapWrapper} style={{ position: 'relative' }}>
                
                {/* SELECTOR DE VISTAS FLOTANTE */}
                <div className={styles.layerSwitcher}>
                    <button 
                        className={`${styles.layerBtn} ${tipoMapa === 'calle' ? styles.layerBtnActive : ''}`}
                        onClick={() => cambiarVista('calle')}
                    >
                        <MapIcon size={16} /> Calle
                    </button>
                    <button 
                        className={`${styles.layerBtn} ${tipoMapa === 'satelite' ? styles.layerBtnActive : ''}`}
                        onClick={() => cambiarVista('satelite')}
                    >
                        <Satellite size={16} /> Satélite
                    </button>
                </div>

                {/* SIMBOLOGÍA FLOTANTE (LEYENDA) */}
                <div className={styles.legendBox}>
                    <h4 className={styles.legendTitle}>Simbología</h4>
                    <div className={styles.legendItem}>
                        <div className={styles.legendIcon} style={{background: '#dc2626'}}><Building2 size={14} color="#fff"/></div>
                        <span>Base Central</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendIcon} style={{background: '#f97316'}}><Server size={14} color="#fff"/></div>
                        <span>Caja NAP (Fibra)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendIcon} style={{background: '#2563eb'}}><User size={14} color="#fff"/></div>
                        <span>Cliente Fibra</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendIcon} style={{background: '#10b981'}}><Wifi size={14} color="#fff"/></div>
                        <span>Cliente Radio</span>
                    </div>
                </div>

                <MapContainer center={UBICACION_NEGOCIO} zoom={16} scrollWheelZoom={true} className={styles.mapInstance}>
                    
                    {tipoMapa === 'calle' ? (
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                    ) : (
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='Tiles &copy; Esri'
                        />
                    )}

                    <Marker position={Sede} icon={iconSede}>
                        <Popup>
                            <div className={styles.popupCenter}>
                                <strong className={styles.popupTitleRed}>Base Central</strong><br/>Oficina Principal
                            </div>
                        </Popup>
                    </Marker>

                    {/* DIBUJO DE LÍNEAS DE CONEXIÓN */}
                    {clientes.map(c => {
                        if (c.latitud && c.longitud && c.caja && c.caja.latitud && c.caja.longitud) {
                            // Aplicamos la misma regla inteligente aquí por si acaso
                            const isRadio = c.tipo_conexion?.toLowerCase() === 'radio' || !c.caja;
                            const lineColor = isRadio ? '#10b981' : '#3b82f6';

                            return (
                                <Polyline
                                    key={`line-${c.id}`}
                                    positions={[[c.latitud, c.longitud], [c.caja.latitud, c.caja.longitud]]}
                                    pathOptions={{ color: lineColor, weight: 2, opacity: 0.6, dashArray: '5, 5' }}
                                >
                                    <Popup><small>Conexión {isRadio ? 'Radio' : 'Fibra'}: {c.nombre_completo} ↔ {c.caja.nombre}</small></Popup>
                                </Polyline>
                            );
                        }
                        return null;
                    })}

                    {/* DIBUJO DE CAJAS/NODOS */}
                    {cajas.map(caja => (
                        caja.latitud && caja.longitud ? (
                            <Marker key={`caja-${caja.id}`} position={[caja.latitud, caja.longitud]} icon={iconCaja}>
                                <Popup><strong>NAP / Nodo: {caja.nombre}</strong><br/><small>Capacidad: {caja.capacidad_total} puertos</small></Popup>
                            </Marker>
                        ) : null
                    ))}

                    {/* DIBUJO DE CLIENTES */}
                    {clientes.map(c => {
                        if (c.latitud && c.longitud) {
                            // Lógica infalible: Es radio si la BD dice radio o si NO tiene caja NAP asignada
                            const isRadio = c.tipo_conexion?.toLowerCase() === 'radio' || !c.caja;
                            
                            return (
                                <Marker key={`cli-${c.id}`} position={[c.latitud, c.longitud]} icon={isRadio ? iconRadio : iconFibra}>
                                    <Popup>
                                        <strong>{isRadio ? '📡' : '👤'} {c.nombre_completo}</strong>
                                        <span className={styles.popupAddress}>{c.direccion}</span>
                                        <span className={styles.popupPlan}>Plan: {c.plan?.nombre || "Sin Plan"}</span>
                                        {c.caja && (
                                            <div className={styles.popupConnectionBox}>
                                                <small className={styles.popupConnectionText}>🔌 Conectado a: {c.caja.nombre}</small>
                                            </div>
                                        )}
                                    </Popup>
                                </Marker>
                            );
                        }
                        return null;
                    })}
                </MapContainer>
            </div>
        </div>
    );
}

export default Mapa;