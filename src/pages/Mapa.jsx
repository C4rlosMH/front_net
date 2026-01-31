import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Estilos del mapa
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Mapa.module.css";

// Solución para iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const UBICACION_NEGOCIO = [17.6852292,-91.0269451];

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function Mapa() {
    const [clientes, setClientes] = useState([]);
    

    useEffect(() => {
        const cargarPuntos = async () => {
            try {
                const res = await client.get("/clientes");
                // Filtramos solo los que tienen coordenadas válidas
                const clientesConUbicacion = res.data.filter(c => c.latitud && c.longitud);
                setClientes(clientesConUbicacion);
                toast.success(`${clientesConUbicacion.length} puntos cargados en el mapa`);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar el mapa de red");
            }
        };
        cargarPuntos();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mapa de Red</h1>
                <span className={styles.badge}>
                    {clientes.length} Puntos Activos
                </span>
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer center={UBICACION_NEGOCIO} zoom={17} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {clientes.map((cliente) => (
                        <Marker 
                            key={cliente.id} 
                            position={[cliente.latitud, cliente.longitud]}
                        >
                            <Popup>
                                <div className={styles.popupContent}>
                                    <strong>{cliente.nombre_completo}</strong>
                                    <br />
                                    IP: {cliente.ip_asignada || "Sin IP"}
                                    <br />
                                    <span 
                                        style={{
                                            color: cliente.estado === 'ACTIVO' ? 'green' : 'red',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {cliente.estado}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default Mapa;