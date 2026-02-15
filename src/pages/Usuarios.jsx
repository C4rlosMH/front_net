import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Power, ShieldCheck, UserCheck, CheckCircle2, XCircle, UserPlus, AlertTriangle, Key } from "lucide-react";
import styles from "./styles/Usuarios.module.css";

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // Estados para el Modal de Restablecer Contraseña
    const [showPassModal, setShowPassModal] = useState(false);
    const [userToReset, setUserToReset] = useState(null);
    const [newPass, setNewPass] = useState("");
    
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const selectedRole = watch("rol", "TECNICO");

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await client.get("/users");
            setUsuarios(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los usuarios");
        }
    };

    const openModal = () => {
        reset();
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            await client.post("/users", data);
            toast.success("Usuario creado correctamente");
            setShowModal(false);
            cargarUsuarios();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al crear usuario");
        }
    };

    const toggleStatus = async (id) => {
        const confirmar = window.confirm("¿Seguro que deseas cambiar el estado de acceso de este usuario?");
        if (confirmar) {
            try {
                const res = await client.patch(`/users/${id}/status`);
                toast.success(res.data.message);
                cargarUsuarios();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || "Error al cambiar estado");
            }
        }
    };

    // Funciones para el restablecimiento de contraseña
    const openPassModal = (user) => {
        setUserToReset(user);
        setNewPass("");
        setShowPassModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPass.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres");
        
        try {
            await client.patch(`/users/${userToReset.id}/password`, { newPassword: newPass });
            toast.success(`Contraseña de ${userToReset.username} actualizada`);
            setShowPassModal(false);
            setNewPass("");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al restablecer contraseña");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Usuarios del Sistema</h1>
                <button className={styles.addButton} onClick={openModal}>
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre de Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.length === 0 ? (
                            <tr><td colSpan="4" className={styles.emptyState}>No hay usuarios registrados.</td></tr>
                        ) : (
                            usuarios.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className={styles.textMainBold}>{u.nombre}</div>
                                        <div className={styles.textMuted}>@{u.username}</div>
                                    </td>
                                    <td>
                                        {u.rol === 'ADMIN' ? (
                                            <span className={styles.badgeAdmin}><ShieldCheck size={14}/> Administrador</span>
                                        ) : (
                                            <span className={styles.badgeTecnico}><UserCheck size={14}/> Tecnico</span>
                                        )}
                                    </td>
                                    <td>
                                        {u.activo ? (
                                            <span className={styles.statusActive}><CheckCircle2 size={16}/> Activo</span>
                                        ) : (
                                            <span className={styles.statusInactive}><XCircle size={16}/> Inactivo</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => toggleStatus(u.id)}
                                                className={`${styles.btnToggle} ${u.activo ? styles.btnToggleActive : styles.btnToggleInactive}`}
                                                title={u.activo ? "Desactivar acceso" : "Activar acceso"}
                                            >
                                                <Power size={20} />
                                            </button>
                                            
                                            {/* NUEVO BOTON DE CAMBIO DE CONTRASEÑA */}
                                            <button 
                                                onClick={() => openPassModal(u)}
                                                className={`${styles.btnToggle} ${styles.btnKey}`}
                                                title="Cambiar Contraseña"
                                            >
                                                <Key size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR USUARIO */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalHeaderTitle}><UserPlus size={22} /> Registrar Nuevo Usuario</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
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
                                        <label>Contrasena</label>
                                        <input 
                                            type="password" 
                                            {...register("password", { 
                                                required: "La contrasena es obligatoria",
                                                minLength: { value: 6, message: "Minimo 6 caracteres" }
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
                                        <option value="TECNICO">TECNICO (Acceso limitado)</option>
                                        <option value="ADMIN">ADMIN (Acceso total)</option>
                                    </select>
                                    
                                    {selectedRole === 'ADMIN' && (
                                        <div className={styles.roleWarning}>
                                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <strong>Atencion:</strong> Un Administrador tiene control total sobre el sistema. Puede eliminar registros financieros, modificar el inventario y gestionar el acceso de otros usuarios.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.modalActions}>
                                    <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                    <button type="submit" className={styles.btnSubmit}>
                                        <UserPlus size={18} /> Crear Usuario
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* NUEVO MODAL: RESTABLECER CONTRASEÑA */}
            {showPassModal && userToReset && (
                <div className={styles.modalOverlay} onClick={() => setShowPassModal(false)}>
                    <div className={styles.modal} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalHeaderTitle}><Key size={22} /> Nueva Contrasena</h2>
                            <button onClick={() => setShowPassModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <div className={styles.modalBody} style={{ padding: '30px' }}>
                            
                            <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                Estas cambiando la contrasena de acceso para el usuario: <strong style={{color: 'var(--text-main)'}}>@{userToReset.username}</strong>
                            </p>

                            <form onSubmit={handleResetPassword}>
                                <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
                                    <label>Escribe la Nueva Contrasena</label>
                                    <input
                                        type="password"
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                        className={styles.input}
                                        placeholder="Minimo 6 caracteres"
                                        autoFocus
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className={styles.modalActions} style={{ marginTop: '25px', paddingTop: '20px' }}>
                                    <button type="button" onClick={() => setShowPassModal(false)} className={styles.btnCancel}>Cancelar</button>
                                    <button type="submit" className={styles.btnSubmit}>Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Usuarios;