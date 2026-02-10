import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Server } from "lucide-react";
import LocationPicker from "../components/LocationPicker";
import styles from "./styles/Cajas.module.css";

function Cajas() {
    const [cajas, setCajas] = useState([]);
    const [clientes, setClientes] = useState([]); // <--- Estado nuevo para clientes
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
            // Cargamos Cajas Y Clientes en paralelo
            const [resCajas, resClientes] = await Promise.all([
                client.get("/cajas"),
                client.get("/clientes").catch(() => ({ data: [] }))
            ]);
            setCajas(resCajas.data);
            setClientes(resClientes.data); // <--- Guardamos clientes
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

    // ... (onSubmit y handleDelete se mantienen igual) ...
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
                <h1 className={styles.title}>Cajas de Distribución (NAP)</h1>
                <button className={styles.addButton} onClick={() => openModal(null)}>
                    <Plus size={20} /> Nueva Caja
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre / Zona</th>
                            <th>Ubicación</th>
                            {/* CAMBIO 1: Nueva columna de Disponibilidad */}
                            <th style={{width: 200}}>Disponibilidad</th> 
                            <th>Capacidad Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cajas.map((c) => {
                            // CAMBIO 2: Lógica de cálculo por cada fila
                            const ocupados = c.clientes ? c.clientes.length : 0;
                            const capacidad = c.capacidad_total || 8;
                            const disponibles = capacidad - ocupados;
                            const porcentaje = (ocupados / capacidad) * 100;
                            
                            // Definimos color según saturación
                            let colorBarra = '#10b981'; // Verde (Libre)
                            if(porcentaje >= 50) colorBarra = '#f59e0b'; // Naranja (Medio)
                            if(porcentaje >= 90) colorBarra = '#ef4444'; // Rojo (Lleno)

                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                                            <Server size={18} color="var(--primary)"/>
                                            <strong>{c.nombre}</strong>
                                        </div>
                                        <small style={{color:'var(--text-muted)'}}>{c.zona || "Sin zona"}</small>
                                    </td>
                                    <td>
                                        {c.latitud && c.longitud ? (
                                            <span style={{fontSize:'0.85rem'}}>
                                                {c.latitud.toFixed(5)}, {c.longitud.toFixed(5)}
                                            </span>
                                        ) : (
                                            <span style={{color:'gray', fontStyle:'italic'}}>No definida</span>
                                        )}
                                    </td>
                                    
                                    {/* CAMBIO 3: Celda visual de disponibilidad */}
                                    <td>
                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom: 4}}>
                                            <span style={{fontWeight:600, color: disponibles === 0 ? '#ef4444' : 'var(--text-primary)'}}>
                                                {disponibles} Disp.
                                            </span>
                                            <span style={{color:'var(--text-muted)'}}>{ocupados} Uso</span>
                                        </div>
                                        
                                        {/* Barra de progreso */}
                                        <div style={{width:'100%', height:6, background:'var(--border)', borderRadius:4, overflow:'hidden'}}>
                                            <div style={{
                                                width: `${porcentaje}%`, 
                                                height:'100%', 
                                                background: colorBarra,
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                    </td>

                                    <td>
                                        <span style={{fontWeight:'bold'}}>{c.capacidad_total} Puertos</span>
                                    </td>
                                    <td>
                                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => openModal(c)}>
                                            <Pencil size={18} />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(c.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
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
                                        // --- PASAMOS TODOS LOS PUNTOS ---
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