import { useState, useEffect } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Key } from "lucide-react";
import styles from "./styles/PasswordModal.module.css";

function PasswordModal({ isOpen, onClose, userToReset }) {
    const [newPass, setNewPass] = useState("");

    useEffect(() => {
        if (isOpen) setNewPass("");
    }, [isOpen]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPass.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres");
        
        try {
            await client.patch(`/users/${userToReset.id}/password`, { newPassword: newPass });
            toast.success(`Contraseña de ${userToReset.username} actualizada`);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error al restablecer contraseña");
        }
    };

    if (!isOpen || !userToReset) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalHeaderTitle}><Key size={22} /> Nueva Contraseña</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.subtitle}>
                        Estás cambiando la contraseña de acceso para el usuario: <strong>@{userToReset.username}</strong>
                    </p>

                    <form onSubmit={handleResetPassword}>
                        <div className={styles.formGroup}>
                            <label>Escribe la Nueva Contraseña</label>
                            <input
                                type="password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                className={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                autoFocus
                                required
                                minLength={6}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                            <button type="submit" className={styles.btnSubmit}>Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PasswordModal;