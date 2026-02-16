import { useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/EquipoModal.module.css";

function EquipoModal({ isOpen, onClose, equipoEditar, onSuccess }) {
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (equipoEditar) {
                setValue("nombre", equipoEditar.nombre);
                setValue("marca", equipoEditar.marca);
                setValue("modelo", equipoEditar.modelo);
                setValue("tipo", equipoEditar.tipo);
                setValue("mac", equipoEditar.mac_address); 
                setValue("serie", equipoEditar.serie);
                setValue("precio_compra", equipoEditar.precio_compra);
                setValue("estado", equipoEditar.estado);
                
                if (equipoEditar.fecha_compra) {
                    setValue("fecha_compra", new Date(equipoEditar.fecha_compra).toISOString().split('T')[0]);
                } else {
                    setValue("fecha_compra", "");
                }
            } else {
                reset();
            }
        }
    }, [isOpen, equipoEditar, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                nombre: data.nombre, 
                tipo: data.tipo,
                marca: data.marca,
                modelo: data.modelo,
                mac_address: data.mac,
                serie: data.serie || null,
                precio_compra: data.precio_compra ? parseFloat(data.precio_compra) : null,
                fecha_compra: data.fecha_compra || null,
                estado: equipoEditar ? data.estado : "ALMACEN"
            };

            if (equipoEditar) {
                await client.put(`/equipos/${equipoEditar.id}`, payload);
                toast.success("Equipo actualizado correctamente");
            } else {
                await client.post("/equipos", payload);
                toast.success("Equipo registrado correctamente");
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al guardar equipo");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{equipoEditar ? "Editar Equipo" : "Registrar Equipo"}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formGroup}>
                        <label>Nombre Identificador (Opcional)</label>
                        <input {...register("nombre")} className={styles.input} placeholder="Ej: Router Principal, Antena Sector 1..." autoFocus />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Marca *</label>
                            <input {...register("marca", { required: true })} className={styles.input} placeholder="Ej: TP-Link" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Modelo *</label>
                            <input {...register("modelo", { required: true })} className={styles.input} placeholder="Ej: Archer C6" />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tipo de Equipo *</label>
                        <select {...register("tipo")} className={styles.select}>
                            <option value="ANTENA">Antena</option>
                            <option value="ROUTER">Router</option>
                            <option value="MODEM">Modem / ONU</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dirección MAC *</label>
                        <input {...register("mac", { required: true })} className={styles.input} placeholder="AA:BB:CC:DD:EE:FF" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Número de Serie (Opcional)</label>
                        <input {...register("serie")} className={styles.input} placeholder="SN123456789" />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Costo ($)</label>
                            <input type="number" step="0.01" {...register("precio_compra")} className={styles.input} placeholder="0.00" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Fecha Compra</label>
                            <input type="date" {...register("fecha_compra")} className={styles.input} />
                        </div>
                    </div>

                    {equipoEditar && (
                        <div className={styles.estadoEditContainer}>
                            <label className={styles.estadoEditLabel}>Estado del Equipo</label>
                            <select {...register("estado")} className={`${styles.select} ${styles.estadoEditSelect}`}>
                                <option value="ALMACEN">En Almacén (Disponible)</option>
                                <option value="INSTALADO">Instalado (En cliente)</option>
                                <option value="RETIRADO">Retirado (Revisión)</option>
                                <option value="OBSOLETO">Obsoleto / Dañado</option>
                            </select>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit}>
                            {equipoEditar ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EquipoModal;