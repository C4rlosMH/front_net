import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { User, Key, Save, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext"; 
import styles from "./styles/Perfil.module.css";

function Perfil() {
    // 1. Obtenemos el usuario directamente del contexto global
    const { user } = useAuth(); 
    
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

    const nuevaPassword = watch("newPassword", "");

    const onSubmitPassword = async (data) => {
        try {
            await client.post("/auth/change-password", {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            toast.success("Contrasena actualizada correctamente");
            reset(); // Limpia el formulario tras el exito
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al cambiar la contrasena");
        }
    };

    // Si por algun motivo el contexto aun esta cargando el usuario
    if (!user) return <div className={styles.loading}>Cargando perfil...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Mi Perfil</h1>

            <div className={styles.profileGrid}>
                {/* --- COLUMNA IZQUIERDA: INFO DEL USUARIO --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <User size={20} /> Informacion de la Cuenta
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.userInfoArea}>
                            {/* Letra inicial del nombre como Avatar */}
                            <div className={styles.avatar}>
                                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            
                            <h2 className={styles.userName}>{user.nombre}</h2>
                            <p className={styles.userUsername}>@{user.username}</p>
                            
                            <div style={{ marginTop: '10px' }}>
                                {user.rol === 'ADMIN' ? (
                                    <span className={styles.badgeAdmin}>
                                        <ShieldCheck size={18}/> Administrador
                                    </span>
                                ) : (
                                    <span className={styles.badgeTecnico}>
                                        <UserCheck size={18}/> Tecnico
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: CAMBIO DE CONTRASENA --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Key size={20} /> Seguridad y Acceso
                    </div>
                    <div className={styles.cardBody}>
                        <form onSubmit={handleSubmit(onSubmitPassword)} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Contrasena Actual</label>
                                <input 
                                    type="password" 
                                    {...register("currentPassword", { required: "Debes ingresar tu contrasena actual" })} 
                                    className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`} 
                                    placeholder="Ingresa tu contrasena actual"
                                />
                                {errors.currentPassword && <span className={styles.errorText}>{errors.currentPassword.message}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nueva Contrasena</label>
                                <input 
                                    type="password" 
                                    {...register("newPassword", { 
                                        required: "La nueva contrasena es obligatoria", 
                                        minLength: { value: 6, message: "Debe tener minimo 6 caracteres" } 
                                    })} 
                                    className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`} 
                                    placeholder="Minimo 6 caracteres"
                                />
                                {errors.newPassword && <span className={styles.errorText}>{errors.newPassword.message}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Confirmar Nueva Contrasena</label>
                                <input 
                                    type="password" 
                                    {...register("confirmPassword", { 
                                        required: "Debes confirmar tu nueva contrasena", 
                                        validate: value => value === nuevaPassword || "Las contrasenas no coinciden"
                                    })} 
                                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} 
                                    placeholder="Repite la nueva contrasena"
                                />
                                {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword.message}</span>}
                            </div>

                            <button type="submit" className={styles.btnSubmit}>
                                <Save size={20} /> Actualizar Contrasena
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Perfil;