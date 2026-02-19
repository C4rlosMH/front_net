import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Clock, CheckCircle, MessageSquare, PenTool, DollarSign } from 'lucide-react';
import client from '../api/axios';
import { toast } from 'sonner';
import styles from './styles/WhatsAppMessageModal.module.css';

const WhatsAppMessageModal = ({ isOpen, onClose, cliente }) => {
    const [loading, setLoading] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState('RECORDATORIO');
    const [mensajePersonalizado, setMensajePersonalizado] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTipoSeleccionado('RECORDATORIO');
            setMensajePersonalizado('');
        }
    }, [isOpen]);

    if (!isOpen || !cliente) return null;

    const handleSend = async () => {
        if (!cliente.telefono) {
            return toast.error("El cliente no tiene un número de teléfono registrado.");
        }

        if (tipoSeleccionado === 'CUSTOM' && mensajePersonalizado.trim() === '') {
            return toast.warning("Escribe el mensaje que deseas enviar.");
        }

        setLoading(true);
        try {
            await client.post('/whatsapp/send', { 
                clienteId: cliente.id, 
                tipo: tipoSeleccionado,
                mensaje: tipoSeleccionado === 'CUSTOM' ? mensajePersonalizado : undefined
            });
            toast.success("Mensaje procesado correctamente");
            onClose();
        } catch (error) {
            console.error("Error al enviar WA:", error);
            toast.error(error.response?.data?.message || "Error al enviar el mensaje. Verifica la conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitle}>
                        <MessageSquare size={20} color="#25D366" />
                        <h3>Notificar a {cliente.nombre_completo.split(" ")[0]}</h3>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.subtitle}>
                        Teléfono destino: <strong>{cliente.telefono || "No registrado"}</strong>
                    </p>

                    <div className={styles.optionsGrid}>
                        <div 
                            className={`${styles.optionCard} ${tipoSeleccionado === 'ANTICIPADO' ? styles.selected : ''}`}
                            onClick={() => setTipoSeleccionado('ANTICIPADO')}
                        >
                            <Clock size={20} className={styles.iconBlue} />
                            <div className={styles.optionText}>
                                <strong>Aviso Anticipado</strong>
                                <span>"Tu fecha de pago por $X.XX..."</span>
                            </div>
                        </div>

                        <div 
                            className={`${styles.optionCard} ${tipoSeleccionado === 'RECORDATORIO' ? styles.selected : ''}`}
                            onClick={() => setTipoSeleccionado('RECORDATORIO')}
                        >
                            <CheckCircle size={20} className={styles.iconGreen} />
                            <div className={styles.optionText}>
                                <strong>Día de Cobro</strong>
                                <span>"Hoy es tu día de pago por $X.XX..."</span>
                            </div>
                        </div>

                        <div 
                            className={`${styles.optionCard} ${tipoSeleccionado === 'SUSPENSION' ? styles.selected : ''}`}
                            onClick={() => setTipoSeleccionado('SUSPENSION')}
                        >
                            <AlertCircle size={20} className={styles.iconRed} />
                            <div className={styles.optionText}>
                                <strong>Advertencia de Corte</strong>
                                <span>"Tu pago de $X.XX está vencido..."</span>
                            </div>
                        </div>

                        {/* NUEVO BOTÓN: AVISO DE ADEUDO TOTAL */}
                        <div 
                            className={`${styles.optionCard} ${tipoSeleccionado === 'ADEUDO' ? styles.selected : ''}`}
                            onClick={() => setTipoSeleccionado('ADEUDO')}
                        >
                            <DollarSign size={20} className={styles.iconOrange} />
                            <div className={styles.optionText}>
                                <strong>Aviso de Adeudo Total</strong>
                                <span>"Usted cuenta con un adeudo total..."</span>
                            </div>
                        </div>

                        <div 
                            className={`${styles.optionCard} ${tipoSeleccionado === 'CUSTOM' ? styles.selected : ''}`}
                            onClick={() => setTipoSeleccionado('CUSTOM')}
                        >
                            <PenTool size={20} className={styles.iconGray} />
                            <div className={styles.optionText}>
                                <strong>Mensaje Personalizado</strong>
                                <span>Redactar un mensaje propio</span>
                            </div>
                        </div>
                    </div>

                    {tipoSeleccionado === 'CUSTOM' && (
                        <div className={styles.customTextContainer}>
                            <textarea 
                                value={mensajePersonalizado}
                                onChange={(e) => setMensajePersonalizado(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                className={styles.textarea}
                                rows="3"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button 
                        className={styles.btnSend} 
                        onClick={handleSend} 
                        disabled={loading || !cliente.telefono}
                    >
                        <Send size={16} />
                        {loading ? 'Enviando...' : 'Enviar Mensaje'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppMessageModal;