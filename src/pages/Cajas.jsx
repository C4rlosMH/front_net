import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Server, Activity } from "lucide-react";
import CajaModal from "../components/CajaModal"; // NUEVO
import styles from "./styles/Cajas.module.css";

function Cajas() {
    const [cajas, setCajas] = useState([]);
    const [clientes, setClientes] = useState([]); 
    
    const [modalOpen, setModalOpen] = useState(false);
    const [cajaEditar, setCajaEditar] = useState(null);

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [resCajas, resClientes] = await Promise.all([
                client.get("/cajas"),
                // Pedimos un límite alto para traer todos los clientes al mapa
                client.get("/clientes?limit=1000").catch(() => ({ data: { clientes: [] } }))
            ]);
            
            setCajas(resCajas.data);
            
            // CORRECCIÓN: Extraer específicamente el arreglo .clientes 
            // Si la estructura falla, aseguramos que siempre sea un array vacío []
            const arrayClientes = resClientes.data.clientes || [];
            setClientes(arrayClientes); 
            
        } catch (error) {
            toast.error("Error al cargar datos");
        }
    };

    const abrirModal = (caja = null) => {
        setCajaEditar(caja);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar esta caja?")) return;
        try {
            await client.delete(`/cajas/${id}`);
            toast.success("Caja eliminada");
            cargarDatos();
        } catch (error) {
            toast.error("No se puede eliminar, posiblemente tiene clientes conectados");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Cajas de Distribución (NAP)</h1>
                    <span className={styles.subtitle}>Gestiona la infraestructura de fibra óptica</span>
                </div>
                <button className={styles.addButton} onClick={() => abrirModal(null)}>
                    <Plus size={20} /> Nueva Caja
                </button>
            </div>

            <div className={styles.cardsGrid}>
                {cajas.length === 0 ? (
                    <div className={styles.emptyState}>No hay cajas NAP registradas.</div>
                ) : (
                    cajas.map((c) => {
                        const ocupados = c.clientes ? c.clientes.length : 0;
                        const capacidad = c.capacidad_total || 8;
                        const disponibles = capacidad - ocupados;
                        const porcentaje = (ocupados / capacidad) * 100;
                        
                        let colorBarra = '#10b981'; 
                        let estadoTexto = 'Óptimo';
                        if(porcentaje >= 50) { colorBarra = '#f59e0b'; estadoTexto = 'Medio'; } 
                        if(porcentaje >= 90) { colorBarra = '#ef4444'; estadoTexto = 'Saturado'; } 

                        return (
                            <div key={c.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleBox}>
                                        <div className={styles.iconBox}><Server size={20} color="var(--primary)" /></div>
                                        <div>
                                            <h3 className={styles.cardTitle}>{c.nombre}</h3>
                                            <span className={styles.cardZona}>{c.zona || "Zona no asignada"}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => abrirModal(c)} title="Editar"><Pencil size={16} /></button>
                                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(c.id)} title="Eliminar"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoRow}>
                                        <MapPin size={16} className={styles.infoIcon} />
                                        <span className={styles.infoText}>{c.latitud && c.longitud ? `${c.latitud.toFixed(5)}, ${c.longitud.toFixed(5)}` : "Ubicación no definida"}</span>
                                    </div>
                                    <div className={styles.divider}></div>
                                    <div className={styles.statsContainer}>
                                        <div className={styles.statsHeader}>
                                            <span className={styles.statsLabel}><Activity size={14} style={{display: 'inline', marginRight: 4, verticalAlign: 'middle'}}/> Ocupación</span>
                                            <span className={styles.statsStatus} style={{color: colorBarra}}>{estadoTexto}</span>
                                        </div>
                                        <div className={styles.progressTrack}>
                                            <div className={styles.progressFill} style={{ width: `${porcentaje}%`, backgroundColor: colorBarra }}></div>
                                        </div>
                                        <div className={styles.statsFooter}>
                                            <span className={styles.statDetail}><strong>{ocupados}</strong> en uso</span>
                                            <span className={styles.statDetail}><strong>{disponibles}</strong> libres</span>
                                            <span className={styles.statDetail}><strong>{capacidad}</strong> total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <CajaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} cajaEditar={cajaEditar} cajasContext={cajas} clientesContext={clientes} onSuccess={cargarDatos} />
        </div>
    );
}

export default Cajas;