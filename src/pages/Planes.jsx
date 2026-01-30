import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Wifi, Power } from "lucide-react";
import styles from "./styles/Planes.module.css";

function Planes() {
    const [planes, setPlanes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            const res = await client.get("/planes");
            setPlanes(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar planes");
        }
    };

    const onSubmit = async (data) => {
        try {
            await client.post("/planes", data);
            toast.success("Plan creado exitosamente");
            setShowModal(false);
            reset();
            cargarPlanes();
        } catch (error) {
            console.error(error);
            toast.error("Error al crear plan");
        }
    };

    const toggleEstado = async (id, estadoActual) => {
        try {
            await client.put(`/planes/${id}/toggle`);
            toast.success(estadoActual ? "Plan desactivado" : "Plan reactivado");
            cargarPlanes();
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Planes de Internet</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nuevo Plan
                </button>
            </div>

            <div className={styles.grid}>
                {planes.map(plan => (
                    <div key={plan.id} className={`${styles.card} ${!plan.activo ? styles.inactiveCard : ''}`}>
                        <h3 className={styles.planName}>{plan.nombre}</h3>
                        <div className={styles.planSpeed}>
                            <Wifi size={16} style={{marginRight:5, verticalAlign:'middle'}}/>
                            {plan.velocidad_mb} Megas
                        </div>
                        <div className={styles.planPrice}>
                            ${plan.precio_mensual}<span>/mes</span>
                        </div>
                        
                        <button 
                            className={styles.switchBtn}
                            onClick={() => toggleEstado(plan.id, plan.activo)}
                        >
                            <Power size={14} style={{marginRight:5, verticalAlign:'middle'}}/>
                            {plan.activo ? "Desactivar Plan" : "Reactivar Plan"}
                        </button>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                            <h2>Nuevo Plan</h2>
                            <button onClick={()=>setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.5rem'}}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGroup}>
                                <label>Nombre del Plan</label>
                                <input {...register("nombre", {required:true})} className={styles.input} placeholder="Ej: Básico Familiar" />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Velocidad (Megas)</label>
                                <input type="number" {...register("velocidad_mb", {required:true})} className={styles.input} placeholder="Ej: 20" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Precio Mensual ($)</label>
                                <input type="number" step="0.01" {...register("precio_mensual", {required:true})} className={styles.input} placeholder="Ej: 350.00" />
                            </div>

                            <button type="submit" className={styles.btnSubmit}>Crear Plan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Planes;