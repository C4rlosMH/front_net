import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Power, ShieldCheck, UserCheck, CheckCircle2, XCircle, Key } from "lucide-react";
import UsuarioModal from "../components/UsuarioModal";
import PasswordModal from "../components/PasswordModal";
import styles from "./styles/Usuarios.module.css";

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
    const [modalPassOpen, setModalPassOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    useEffect(() => { cargarUsuarios(); }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await client.get("/users");
            setUsuarios(res.data);
        } catch (error) {
            toast.error("Error al cargar los usuarios");
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
                toast.error(error.response?.data?.message || "Error al cambiar estado");
            }
        }
    };

    const openPassModal = (user) => {
        setUserToReset(user);
        setModalPassOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Usuarios del Sistema</h1>
                <button className={styles.addButton} onClick={() => setModalUsuarioOpen(true)}>
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
                                            <span className={styles.badgeTecnico}><UserCheck size={14}/> Técnico</span>
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

            <UsuarioModal isOpen={modalUsuarioOpen} onClose={() => setModalUsuarioOpen(false)} onSuccess={cargarUsuarios} />
            <PasswordModal isOpen={modalPassOpen} onClose={() => setModalPassOpen(false)} userToReset={userToReset} />
        </div>
    );
}

export default Usuarios;