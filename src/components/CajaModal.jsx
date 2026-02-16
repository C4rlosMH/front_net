import { useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import LocationPicker from "./LocationPicker";
import styles from "./styles/CajaModal.module.css";

function CajaModal({ isOpen, onClose, cajaEditar, cajasContext, clientesContext, onSuccess }) {
    const { register, handleSubmit, setValue, reset, watch } = useForm();
    const lat = watch("latitud");
    const lng = watch("longitud");

    useEffect(() => {
        if (isOpen) {
            if (cajaEditar) {
                setValue("nombre", cajaEditar.nombre);
                setValue("zona", cajaEditar.zona);
                setValue("capacidad_total", cajaEditar.capacidad_total);
                setValue("latitud", cajaEditar.latitud);
                setValue("longitud", cajaEditar.longitud);
            } else {
                reset({ capacidad_total: 8, latitud: 0, longitud: 0 });
            }
        }
    }, [isOpen, cajaEditar, reset, setValue]);

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
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error("Error al guardar caja");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{cajaEditar ? "Editar Caja" : "Nueva Caja NAP"}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formGroup}>
                        <label>Nombre Identificador</label>
                        <input {...register("nombre", { required: true })} className={styles.input} placeholder="Ej: NAP-05 Sector Norte" autoFocus />
                    </div>

                    <div className={styles.formRow}>
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
                        <label className={styles.labelMap}>
                            Ubicación Geográfica
                            <small className={styles.mapCoords}>
                                {lat ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : "Seleccionar en mapa"}
                            </small>
                        </label>
                        <div className={styles.mapWrapper}>
                            <LocationPicker 
                                initialLat={cajaEditar?.latitud}
                                initialLng={cajaEditar?.longitud}
                                onLocationChange={(loc) => {
                                    setValue("latitud", loc.lat);
                                    setValue("longitud", loc.lng);
                                }}
                                cajas={cajasContext}
                                clients={clientesContext}
                            />
                        </div>
                        <input type="hidden" {...register("latitud")} />
                        <input type="hidden" {...register("longitud")} />
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

export default CajaModal;