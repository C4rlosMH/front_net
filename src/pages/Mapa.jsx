import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css";
import { User, Server, Building2 } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// COORDENADAS DE TU NEGOCIO
const UBICACION_NEGOCIO = [17.6852292,-91.0269451];

// Función auxiliar para crear iconos HTML
const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div style={{
            backgroundColor: bgColor,
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
            {iconComponent}
        </div>
    );

    return new L.DivIcon({
        html: iconHtml,
        className: 'custom-marker', // Clase vacía para limpiar estilos default
        iconSize: [32, 32],
        iconAnchor: [16, 32], // La "punta" del pin (centro abajo)
        popupAnchor: [0, -32]
    });
};

const iconCliente = createCustomIcon(<User size={18} />, '#2563eb'); // Azul
const iconCaja = createCustomIcon(<Server size={18} />, '#f97316'); // Naranja
const iconSede = createCustomIcon(<Building2 size={18} />, '#dc2626'); // Rojo

function Mapa() {
    const [clientes, setClientes] = useState([]);
    const [cajas, setCajas] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Intentamos cargar clientes y cajas
                // Si aún no tienes cajas en BD, el array estará vacío pero no fallará
                const [resClientes, resCajas] = await Promise.all([
                    client.get("/clientes"),
                    client.get("/cajas").catch(() => ({ data: [] })) // Fallback si falla
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

    return (
        <div className={styles.mapContainer}>
            <MapContainer 
                center={UBICACION_NEGOCIO} 
                zoom={16} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {/* 1. MARCADOR SEDE/NEGOCIO */}
                <Marker position={UBICACION_NEGOCIO} icon={iconSede}>
                    <Popup>
                        <div style={{textAlign:'center'}}>
                            <strong style={{color:'#dc2626'}}>Base Central</strong><br/>
                            Oficina Principal
                        </div>
                    </Popup>
                </Marker>

                {/* 2. MARCADORES DE CAJAS (NAPs) */}
                {cajas.map(caja => (
                    caja.latitud && caja.longitud ? (
                        <Marker 
                            key={`caja-${caja.id}`} 
                            position={[caja.latitud, caja.longitud]} 
                            icon={iconCaja}
                        >
                            <Popup>
                                <strong>NAP: {caja.nombre}</strong><br/>
                                <small>Capacidad: {caja.puertos_totales} puertos</small>
                            </Popup>
                        </Marker>
                    ) : null
                ))}

                {/* 3. MARCADORES DE CLIENTES */}
                {clientes.map(c => (
                    c.latitud && c.longitud ? (
                        <Marker 
                            key={`cli-${c.id}`} 
                            position={[c.latitud, c.longitud]} 
                            icon={iconCliente}
                        >
                            <Popup>
                                <strong>👤 {c.nombre_completo}</strong><br/>
                                <span style={{fontSize:'0.85rem'}}>{c.direccion}</span><br/>
                                <span style={{fontSize:'0.8rem', color:'gray'}}>
                                    Plan: {c.plan?.nombre || "Sin Plan"}
                                </span>
                                {c.caja && (
                                    <div style={{marginTop:5, borderTop:'1px solid #eee', paddingTop:3}}>
                                        <small style={{color:'#f97316', fontWeight:'bold'}}>
                                            🔌 Conectado a: {c.caja.nombre}
                                        </small>
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    ) : null
                ))}
            </MapContainer>
        </div>
    );
}

export default Mapa;