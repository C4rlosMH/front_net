import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Pencil, Gauge, Zap } from "lucide-react";
import PlanModal from "../components/PlanModal";
import styles from "./styles/Planes.module.css";

function Planes() {
    const [planes, setPlanes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [planEditar, setPlanEditar] = useState(null);

    useEffect(() => { cargarPlanes(); }, []);

    const cargarPlanes = async () => {
        try {
            const res = await client.get("/planes");
            setPlanes(res.data);
        } catch (error) { toast.error("Error al cargar planes"); }
    };

    const togglePlan = async (id) => {
        try {
            await client.put(`/planes/${id}/toggle`);
            setPlanes(planes.map(p => {
                if (p.id === id) return { ...p, activo: !p.activo };
                return p;
            }));
            toast.success("Estado del plan actualizado");
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    const abrirModal = (plan = null) => {
        setPlanEditar(plan);
        setModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Planes de Internet</h1>
                <button className={styles.addButton} onClick={() => abrirModal(null)}>
                    <Plus size={20} /> Nuevo Plan
                </button>
            </div>

            <div className={styles.grid}>
                {planes.map(p => (
                    <div key={p.id} className={styles.card} style={{opacity: p.activo ? 1 : 0.6, filter: p.activo ? 'none' : 'grayscale(100%)'}}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.planName}>{p.nombre}</h3>
                            <label className={styles.switch} title={p.activo ? "Desactivar Plan" : "Activar Plan"}>
                                <input type="checkbox" checked={p.activo} onChange={() => togglePlan(p.id)} />
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
                            <button className={styles.btnEdit} onClick={() => abrirModal(p)}>
                                <Pencil size={14} /> Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <PlanModal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                planEditar={planEditar} 
                onSuccess={cargarPlanes} 
            />
        </div>
    );
}
export default Planes;