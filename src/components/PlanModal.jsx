import { useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/PlanModal.module.css";

function PlanModal({ isOpen, onClose, planEditar, onSuccess }) {
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (planEditar) {
                setValue("nombre", planEditar.nombre);
                setValue("velocidad_mb", planEditar.velocidad_mb);
                setValue("precio_mensual", planEditar.precio_mensual);
                setValue("descripcion", planEditar.descripcion);
            } else {
                reset();
            }
        }
    }, [isOpen, planEditar, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                velocidad_mb: parseInt(data.velocidad_mb),
                precio_mensual: parseFloat(data.precio_mensual),
            };

            if (planEditar) {
                await client.put(`/planes/planes/${planEditar.id}`, payload);
                toast.success("Plan actualizado");
            } else {
                await client.post("/planes", payload);
                toast.success("Plan creado");
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) { 
            toast.error("Error al guardar plan"); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>{planEditar ? "Editar Plan" : "Nuevo Plan"}</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formGroup}>
                        <label>Nombre del Plan</label>
                        <input {...register("nombre", { required: true })} className={styles.input} placeholder="Ej: Básico" autoFocus />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Velocidad (MB)</label>
                            <input type="number" {...register("velocidad_mb")} className={styles.input} placeholder="Ej: 50" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Precio Mensual ($)</label>
                            <input type="number" step="0.01" {...register("precio_mensual")} className={styles.input} placeholder="Ej: 350.00" />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Descripción</label>
                        <textarea {...register("descripcion")} className={styles.textarea} rows="3" placeholder="Descripción opcional..." />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit}>Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PlanModal;