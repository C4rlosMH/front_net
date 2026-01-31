import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css"; // Importamos los estilos
import { User, Server, Building2 } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// COORDENADAS DE TU NEGOCIO
const UBICACION_NEGOCIO = [17.6852292,-91.0269451];
const Sede = [17.687171, -91.029577]

// Función auxiliar para crear iconos HTML
const createCustomIcon = (iconComponent, bgColor) => {
    // Usamos la clase del CSS Module. Nota: bgColor sigue inline porque es dinámico.
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
        className: 'custom-marker', // Clase vacía de Leaflet para no interferir
        iconSize: [32, 32],
        iconAnchor: [16, 32],
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
        // [CORREGIDO] Usamos styles.container en lugar de styles.mapContainer
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mapa de Red</h1>
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer 
                    center={UBICACION_NEGOCIO} 
                    zoom={16} 
                    scrollWheelZoom={true} 
                    className={styles.mapInstance} // Clase CSS reemplaza style inline
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {/* 1. MARCADOR SEDE/NEGOCIO */}
                    <Marker position={Sede} icon={iconSede}>
                        <Popup>
                            <div className={styles.popupCenter}>
                                <strong className={styles.popupTitleRed}>Base Central</strong><br/>
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