import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Pencil, Gauge, Zap } from "lucide-react";
import styles from "./styles/Planes.module.css";

function Planes() {
    const [planes, setPlanes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [planEditar, setPlanEditar] = useState(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => { cargarPlanes(); }, []);

    const cargarPlanes = async () => {
        try {
            // Ruta: /api/planes
            const res = await client.get("/planes");
            setPlanes(res.data);
        } catch (error) { toast.error("Error al cargar planes"); }
    };

    // --- CORRECCIÓN: TOGGLE ---
    const togglePlan = async (id) => {
        try {
            // El backend pide PUT a /api/planes/:id/toggle
            await client.put(`/planes/${id}/toggle`);
            
            setPlanes(planes.map(p => {
                if (p.id === id) return { ...p, activo: !p.activo };
                return p;
            }));
            
            toast.success("Estado del plan actualizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al cambiar estado");
        }
    };

    const openModal = (plan = null) => {
        setPlanEditar(plan);
        if (plan) {
            setValue("nombre", plan.nombre);
            setValue("velocidad_mb", plan.velocidad_mb);
            setValue("precio_mensual", plan.precio_mensual);
            setValue("descripcion", plan.descripcion);
        } else {
            reset();
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                velocidad_mb: parseInt(data.velocidad_mb),
                precio_mensual: parseFloat(data.precio_mensual),
            };

            if (planEditar) {
                // --- CORRECCIÓN: EDITAR ---
                // Tu backend define la ruta como: router.put("/planes/:id") dentro de "/api/planes"
                // Por lo tanto, la URL final es: /api/planes/planes/:id
                await client.put(`/planes/planes/${planEditar.id}`, payload);
                toast.success("Plan actualizado");
            } else {
                // Ruta: /api/planes
                await client.post("/planes", payload);
                toast.success("Plan creado");
            }
            setShowModal(false); reset(); setPlanEditar(null); cargarPlanes();
        } catch (error) { 
            console.error(error);
            toast.error("Error al guardar plan"); 
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Planes de Internet</h1>
                <button className={styles.addButton} onClick={() => openModal(null)}>
                    <Plus size={20} /> Nuevo Plan
                </button>
            </div>

            <div className={styles.grid}>
                {planes.map(p => (
                    <div key={p.id} className={styles.card} style={{opacity: p.activo ? 1 : 0.6, filter: p.activo ? 'none' : 'grayscale(100%)'}}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.planName}>{p.nombre}</h3>
                            {/* SWITCH DE ESTADO */}
                            <label className={styles.switch} title={p.activo ? "Desactivar Plan" : "Activar Plan"}>
                                <input 
                                    type="checkbox" 
                                    checked={p.activo} 
                                    onChange={() => togglePlan(p.id)} 
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                        
                        <div className={styles.priceTag}>
                            ${p.precio_mensual} <span>/mes</span>
                        </div>
                        
                        <div className={styles.details}>
                            <div className={styles.detailRow}>
                                <Gauge size={18} style={{color:'var(--primary)'}}/> 
                                <b>{p.velocidad_mb} MB</b> de Velocidad
                            </div>
                            {p.descripcion && (
                                <div className={styles.detailRow}>
                                    <Zap size={18} style={{color:'var(--primary)'}}/> 
                                    {p.descripcion}
                                </div>
                            )}
                        </div>

                        <div className={styles.cardActions}>
                            <button className={styles.btnEdit} onClick={() => openModal(p)}>
                                <Pencil size={14} /> Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{planEditar ? "Editar Plan" : "Nuevo Plan"}</h2>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <input {...register("nombre", { required: true })} className={styles.input} placeholder="Nombre (Ej: Básico)" />
                            <div style={{display:'flex', gap:10}}>
                                <input type="number" {...register("velocidad_mb")} className={styles.input} placeholder="Velocidad (MB)" />
                                <input type="number" step="0.01" {...register("precio_mensual")} className={styles.input} placeholder="Precio ($)" />
                            </div>
                            <textarea {...register("descripcion")} className={styles.textarea} rows="3" placeholder="Descripción opcional..." />
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
export default Planes;