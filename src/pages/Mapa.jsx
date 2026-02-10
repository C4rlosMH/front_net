import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"; // <--- 1. IMPORTAMOS POLYLINE
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css";
import { User, Server, Building2 } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// COORDENADAS DE TU NEGOCIO
const UBICACION_NEGOCIO = [17.6852292,-91.0269451];
const Sede = [17.687171, -91.029577]

const createCustomIcon = (iconComponent, bgColor) => {
    const iconHtml = ReactDOMServer.renderToString(
        <div 
            className={styles.iconMarker} 
            style={{ backgroundColor: bgColor }}
        >
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

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // El endpoint /clientes ya trae la relación "caja" gracias a tu controlador
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mapa de Red</h1>
                {/* Leyenda opcional para entender las líneas */}
                <div style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'flex', gap:15}}>
                   <span style={{display:'flex', alignItems:'center', gap:5}}>
                       <span style={{width:20, height:2, background:'#3b82f6', display:'inline-block'}}></span> Conexión Fibra
                   </span>
                </div>
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer 
                    center={UBICACION_NEGOCIO} 
                    zoom={16} 
                    scrollWheelZoom={true} 
                    className={styles.mapInstance}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {/* 1. MARCADOR SEDE */}
                    <Marker position={Sede} icon={iconSede}>
                        <Popup>
                            <div className={styles.popupCenter}>
                                <strong className={styles.popupTitleRed}>Base Central</strong><br/>
                                Oficina Principal
                            </div>
                        </Popup>
                    </Marker>

                    {/* 2. CONEXIONES (LÍNEAS) - SE DIBUJAN PRIMERO PARA QUEDAR DETRÁS DE LOS MARCADORES */}
                    {clientes.map(c => {
                        // Verificamos que el cliente tenga caja asignada y coordenadas validas en ambos puntos
                        if (c.latitud && c.longitud && c.caja && c.caja.latitud && c.caja.longitud) {
                            return (
                                <Polyline
                                    key={`line-${c.id}`}
                                    positions={[
                                        [c.latitud, c.longitud],       // Desde: Cliente
                                        [c.caja.latitud, c.caja.longitud]  // Hasta: Caja
                                    ]}
                                    pathOptions={{ 
                                        color: '#3b82f6', // Azul fibra
                                        weight: 2,        // Grosor fino
                                        opacity: 0.6,     // Un poco transparente para no saturar
                                        dashArray: '5, 5' // Línea punteada (estético)
                                    }}
                                >
                                    <Popup>
                                        <small>Conexión: {c.nombre_completo} ↔ {c.caja.nombre}</small>
                                    </Popup>
                                </Polyline>
                            );
                        }
                        return null;
                    })}

                    {/* 3. MARCADORES DE CAJAS */}
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

                    {/* 4. MARCADORES DE CLIENTES */}
                    {clientes.map(c => (
                        c.latitud && c.longitud ? (
                            <Marker 
                                key={`cli-${c.id}`} 
                                position={[c.latitud, c.longitud]} 
                                icon={iconCliente}
                            >
                                <Popup>
                                    <strong>👤 {c.nombre_completo}</strong>
                                    <span className={styles.popupAddress}>{c.direccion}</span>
                                    <span className={styles.popupPlan}>
                                        Plan: {c.plan?.nombre || "Sin Plan"}
                                    </span>
                                    {c.caja && (
                                        <div className={styles.popupConnectionBox}>
                                            <small className={styles.popupConnectionText}>
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
        </div>
    );
}

export default Mapa;