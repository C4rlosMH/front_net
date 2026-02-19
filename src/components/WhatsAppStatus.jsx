import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import client from '../api/axios';
import { X, RefreshCw, LogOut, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import styles from './styles/WhatsAppStatus.module.css'; 

const WhatsAppStatus = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState('CHECKING');
    const [qr, setQr] = useState(null);
    const [loading, setLoading] = useState(false);

    // Función para consultar el estado al backend
    const checkStatus = async () => {
        try {
            const res = await client.get('/whatsapp/status');
            // Esperamos: { status: 'QR_READY' | 'READY' | 'DISCONNECTED', qr: '...' }
            setStatus(res.data.status);
            setQr(res.data.qr);
        } catch (error) {
            console.error("Error verificando estado WA", error);
            setStatus('DISCONNECTED');
        }
    };

    // Polling: Consultar cada 3 segundos mientras el modal esté abierto
    useEffect(() => {
        let interval;
        if (isOpen) {
            checkStatus(); // Primera verificación inmediata
            interval = setInterval(checkStatus, 3000); 
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const handleAction = async (action) => {
        setLoading(true);
        try {
            if (action === 'logout') await client.post('/whatsapp/logout');
            if (action === 'restart') await client.post('/whatsapp/restart');
            
            // Esperamos un poco para que el backend procese
            setTimeout(() => {
                checkStatus();
                setLoading(false);
            }, 2000);
        } catch (error) {
            console.error("Error en acción WA", error);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Estado de WhatsApp</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    
                    {/* ESTADO: CARGANDO / INICIALIZANDO */}
                    {(status === 'CHECKING' || status === 'INITIALIZING') && (
                        <div className={styles.stateContainer}>
                            <Loader2 className={styles.spin} size={40} color="#3b82f6" />
                            <p>Verificando conexión con el servidor...</p>
                        </div>
                    )}

                    {/* ESTADO: MOSTRAR QR */}
                    {status === 'QR_READY' && qr && (
                        <div className={styles.stateContainer}>
                            <div className={styles.qrWrapper}>
                                <QRCode 
                                    value={qr} 
                                    size={200} 
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                            <div className={styles.instructions}>
                                <p>1. Abre WhatsApp en tu celular</p>
                                <p>2. Ve a <strong>Menú &gt; Dispositivos vinculados</strong></p>
                                <p>3. Escanea este código</p>
                            </div>
                        </div>
                    )}

                    {/* ESTADO: CONECTADO */}
                    {status === 'READY' && (
                        <div className={styles.stateContainer}>
                            <div className={styles.successIcon}>
                                <CheckCircle size={64} color="#22c55e" />
                            </div>
                            <h4>¡Sistema Conectado!</h4>
                            <p>El bot está listo para enviar notificaciones automáticas.</p>
                            
                            <button 
                                onClick={() => handleAction('logout')} 
                                disabled={loading}
                                className={styles.btnDanger}
                            >
                                <LogOut size={16} /> 
                                {loading ? 'Procesando...' : 'Cerrar Sesión (Desvincular)'}
                            </button>
                        </div>
                    )}

                    {/* ESTADO: DESCONECTADO O FALLO */}
                    {(status === 'DISCONNECTED' || status === 'auth_failure') && (
                        <div className={styles.stateContainer}>
                            <AlertTriangle size={50} color="#f59e0b" />
                            <h4>Desconectado</h4>
                            <p>La sesión se ha cerrado o no se ha iniciado.</p>
                            <button 
                                onClick={() => handleAction('restart')} 
                                disabled={loading}
                                className={styles.btnPrimary}
                            >
                                <RefreshCw size={16} className={loading ? styles.spin : ''} />
                                {loading ? 'Reiniciando...' : 'Generar Nuevo QR'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default WhatsAppStatus;