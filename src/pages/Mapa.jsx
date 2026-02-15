import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"; 
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css";
// Importamos los nuevos iconos para los botones
import { User, Server, Building2, Map as MapIcon, Satellite } from "lucide-react"; 
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

const iconCliente = createCustomIcon(<User size={18} />, '#2563eb');
const iconCaja = createCustomIcon(<Server size={18} />, '#f97316');
const iconSede = createCustomIcon(<Building2 size={18} />, '#dc2626');

function Mapa() {
    const [clientes, setClientes] = useState([]);
    const [cajas, setCajas] = useState([]);
    
    // ESTADO PARA LA VISTA (Recuerda la opción guardada o usa 'calle' por defecto)
    const [tipoMapa, setTipoMapa] = useState(() => {
        return localStorage.getItem('vistaMapaPreferencia') || 'calle';
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resClientes, resCajas] = await Promise.all([
                    client.get("/clientes"),
                    client.get("/cajas").catch(() => ({ data: [] }))
                ]);
                setClientes(resClientes.data);
                setCajas(resCajas.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos del mapa");
            }
        };
        cargarDatos();
    }, []);

    // Función para cambiar vista y guardar en memoria
    const cambiarVista = (vista) => {
        setTipoMapa(vista);
        localStorage.setItem('vistaMapaPreferencia', vista);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mapa de Red</h1>
                <div style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'flex', gap:15}}>
                   <span style={{display:'flex', alignItems:'center', gap:5}}>
                       <span style={{width:20, height:2, background:'#3b82f6', display:'inline-block'}}></span> Conexión Fibra
                   </span>
                </div>
            </div>

            <div className={styles.mapWrapper} style={{ position: 'relative' }}>
                
                {/* NUEVO SELECTOR DE VISTAS FLOTANTE */}
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

                <MapContainer center={UBICACION_NEGOCIO} zoom={16} scrollWheelZoom={true} className={styles.mapInstance}>
                    
                    {/* RENDERIZADO CONDICIONAL DE LA CAPA */}
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

                    {clientes.map(c => {
                        if (c.latitud && c.longitud && c.caja && c.caja.latitud && c.caja.longitud) {
                            return (
                                <Polyline
                                    key={`line-${c.id}`}
                                    positions={[[c.latitud, c.longitud], [c.caja.latitud, c.caja.longitud]]}
                                    pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.6, dashArray: '5, 5' }}
                                >
                                    <Popup><small>Conexión: {c.nombre_completo} ↔ {c.caja.nombre}</small></Popup>
                                </Polyline>
                            );
                        }
                        return null;
                    })}

                    {cajas.map(caja => (
                        caja.latitud && caja.longitud ? (
                            <Marker key={`caja-${caja.id}`} position={[caja.latitud, caja.longitud]} icon={iconCaja}>
                                <Popup><strong>NAP: {caja.nombre}</strong><br/><small>Capacidad: {caja.puertos_totales} puertos</small></Popup>
                            </Marker>
                        ) : null
                    ))}

                    {clientes.map(c => (
                        c.latitud && c.longitud ? (
                            <Marker key={`cli-${c.id}`} position={[c.latitud, c.longitud]} icon={iconCliente}>
                                <Popup>
                                    <strong>👤 {c.nombre_completo}</strong>
                                    <span className={styles.popupAddress}>{c.direccion}</span>
                                    <span className={styles.popupPlan}>Plan: {c.plan?.nombre || "Sin Plan"}</span>
                                    {c.caja && (
                                        <div className={styles.popupConnectionBox}>
                                            <small className={styles.popupConnectionText}>🔌 Conectado a: {c.caja.nombre}</small>
                                        </div>
                                    )}
                                </Popup>
                            </Marker>
                        ) : null
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default Mapa;