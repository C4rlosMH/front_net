import { useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { UserPlus, AlertTriangle } from "lucide-react";
import styles from "./styles/UsuarioModal.module.css";

function UsuarioModal({ isOpen, onClose, onSuccess }) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const selectedRole = watch("rol", "TECNICO");

    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            await client.post("/users", data);
            toast.success("Usuario creado correctamente");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al crear usuario");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalHeaderTitle}><UserPlus size={22} /> Registrar Nuevo Usuario</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <div className={styles.modalBody}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className={styles.formGroup}>
                            <label>Nombre Completo</label>
                            <input 
                                {...register("nombre", { required: "El nombre es obligatorio" })} 
                                className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`} 
                                placeholder="Ej: Juan Perez" 
                                autoFocus
                            />
                            {errors.nombre && <span className={styles.errorText}>{errors.nombre.message}</span>}
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Nombre de Usuario (Login)</label>
                                <input 
                                    {...register("username", { required: "El usuario es obligatorio" })} 
                                    className={`${styles.input} ${errors.username ? styles.inputError : ''}`} 
                                    placeholder="Ej: juan.perez" 
                                />
                                {errors.username && <span className={styles.errorText}>{errors.username.message}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Contraseña</label>
                                <input 
                                    type="password" 
                                    {...register("password", { 
                                        required: "La contraseña es obligatoria",
                                        minLength: { value: 6, message: "Mínimo 6 caracteres" }
                                    })} 
                                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`} 
                                    placeholder="******" 
                                />
                                {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Rol de Acceso</label>
                            <select {...register("rol")} className={styles.select}>
                                <option value="TECNICO">TÉCNICO (Acceso limitado)</option>
                                <option value="ADMIN">ADMIN (Acceso total)</option>
                            </select>
                            
                            {selectedRole === 'ADMIN' && (
                                <div className={styles.roleWarning}>
                                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <strong>Atención:</strong> Un Administrador tiene control total sobre el sistema. Puede eliminar registros financieros, modificar el inventario y gestionar el acceso de otros usuarios.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                            <button type="submit" className={styles.btnSubmit}>
                                <UserPlus size={18} /> Crear Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UsuarioModal;