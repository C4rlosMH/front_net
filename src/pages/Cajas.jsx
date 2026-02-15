import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Server, Activity } from "lucide-react";
import LocationPicker from "../components/LocationPicker";
import styles from "./styles/Cajas.module.css";

function Cajas() {
    const [cajas, setCajas] = useState([]);
    const [clientes, setClientes] = useState([]); 
    const [showModal, setShowModal] = useState(false);
    const [cajaEditar, setCajaEditar] = useState(null);

    const { register, handleSubmit, setValue, reset, watch } = useForm();
    const lat = watch("latitud");
    const lng = watch("longitud");

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resCajas, resClientes] = await Promise.all([
                client.get("/cajas"),
                client.get("/clientes").catch(() => ({ data: [] }))
            ]);
            setCajas(resCajas.data);
            setClientes(resClientes.data); 
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos");
        }
    };

    const openModal = (caja = null) => {
        setCajaEditar(caja);
        if (caja) {
            setValue("nombre", caja.nombre);
            setValue("zona", caja.zona);
            setValue("capacidad_total", caja.capacidad_total);
            setValue("latitud", caja.latitud);
            setValue("longitud", caja.longitud);
        } else {
            reset({ capacidad_total: 8, latitud: 0, longitud: 0 });
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                capacidad_total: parseInt(data.capacidad_total),
                latitud: parseFloat(data.latitud),
                longitud: parseFloat(data.longitud)
            };

            if (cajaEditar) {
                await client.put(`/cajas/${cajaEditar.id}`, payload);
                toast.success("Caja actualizada");
            } else {
                await client.post("/cajas", payload);
                toast.success("Caja registrada");
            }
            setShowModal(false);
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar caja");
        }
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
                <button className={styles.addButton} onClick={() => openModal(null)}>
                    <Plus size={20} /> Nueva Caja
                </button>
            </div>

            {/* NUEVO DISEÑO EN GRID DE TARJETAS */}
            <div className={styles.cardsGrid}>
                {cajas.length === 0 ? (
                    <div className={styles.emptyState}>No hay cajas NAP registradas.</div>
                ) : (
                    cajas.map((c) => {
                        const ocupados = c.clientes ? c.clientes.length : 0;
                        const capacidad = c.capacidad_total || 8;
                        const disponibles = capacidad - ocupados;
                        const porcentaje = (ocupados / capacidad) * 100;
                        
                        let colorBarra = '#10b981'; // Verde
                        let estadoTexto = 'Óptimo';
                        if(porcentaje >= 50) { colorBarra = '#f59e0b'; estadoTexto = 'Medio'; } // Naranja
                        if(porcentaje >= 90) { colorBarra = '#ef4444'; estadoTexto = 'Saturado'; } // Rojo

                        return (
                            <div key={c.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleBox}>
                                        <div className={styles.iconBox}>
                                            <Server size={20} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <h3 className={styles.cardTitle}>{c.nombre}</h3>
                                            <span className={styles.cardZona}>{c.zona || "Zona no asignada"}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => openModal(c)} title="Editar">
                                            <Pencil size={16} />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(c.id)} title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoRow}>
                                        <MapPin size={16} className={styles.infoIcon} />
                                        <span className={styles.infoText}>
                                            {c.latitud && c.longitud 
                                                ? `${c.latitud.toFixed(5)}, ${c.longitud.toFixed(5)}` 
                                                : "Ubicación no definida"}
                                        </span>
                                    </div>
                                    
                                    <div className={styles.divider}></div>

                                    <div className={styles.statsContainer}>
                                        <div className={styles.statsHeader}>
                                            <span className={styles.statsLabel}>
                                                <Activity size={14} style={{display: 'inline', marginRight: 4, verticalAlign: 'middle'}}/>
                                                Ocupación
                                            </span>
                                            <span className={styles.statsStatus} style={{color: colorBarra}}>
                                                {estadoTexto}
                                            </span>
                                        </div>
                                        
                                        <div className={styles.progressTrack}>
                                            <div 
                                                className={styles.progressFill} 
                                                style={{ width: `${porcentaje}%`, backgroundColor: colorBarra }}
                                            ></div>
                                        </div>

                                        <div className={styles.statsFooter}>
                                            <span className={styles.statDetail}>
                                                <strong>{ocupados}</strong> en uso
                                            </span>
                                            <span className={styles.statDetail}>
                                                <strong>{disponibles}</strong> libres
                                            </span>
                                            <span className={styles.statDetail}>
                                                <strong>{capacidad}</strong> total
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{cajaEditar ? "Editar Caja" : "Nueva Caja NAP"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGroup}>
                                <label>Nombre Identificador</label>
                                <input {...register("nombre", { required: true })} className={styles.input} placeholder="Ej: NAP-05 Sector Norte" autoFocus />
                            </div>

                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
                                <div className={styles.formGroup}>
                                    <label>Zona / Barrio</label>
                                    <input {...register("zona")} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Capacidad (Puertos)</label>
                                    <select {...register("capacidad_total")} className={styles.select}>
                                        <option value="8">8 Puertos</option>
                                        <option value="16">16 Puertos</option>
                                        <option value="24">24 Puertos</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label style={{display:'flex', justifyContent:'space-between'}}>
                                    Ubicación Geográfica
                                    <small style={{fontWeight:'normal', color:'var(--primary)'}}>
                                        {lat ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : "Seleccionar en mapa"}
                                    </small>
                                </label>
                                <div style={{height: 300, borderRadius: 8, overflow:'hidden', border:'1px solid var(--border)'}}>
                                    <LocationPicker 
                                        initialLat={cajaEditar?.latitud}
                                        initialLng={cajaEditar?.longitud}
                                        onLocationChange={(loc) => {
                                            setValue("latitud", loc.lat);
                                            setValue("longitud", loc.lng);
                                        }}
                                        cajas={cajas}
                                        clients={clientes}
                                    />
                                </div>
                                <input type="hidden" {...register("latitud")} />
                                <input type="hidden" {...register("longitud")} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cajas;