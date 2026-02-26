import { useEffect, useState, useRef } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { X, Send, CheckCircle, UserCheck, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "./styles/ModalMensajeTicket.module.css";

function ModalMensajeTicket({ ticket, onClose }) {
    const { user } = useAuth();
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [estadoLocal, setEstadoLocal] = useState(ticket.estado);
    const [responsableLocal, setResponsableLocal] = useState(ticket.responsable || null);
    
    // Estados para la nota de resolución
    const [pidiendoSolucion, setPidiendoSolucion] = useState(false);
    const [textoSolucion, setTextoSolucion] = useState("");
    
    const mensajesEndRef = useRef(null);

    useEffect(() => {
        cargarMensajes();
    }, [ticket.id]);

    useEffect(() => {
        mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const cargarMensajes = async () => {
        try {
            const res = await client.get(`/tickets/${ticket.id}/mensajes`);
            setMensajes(res.data);
        } catch (error) {
            toast.error("Error al cargar la conversación");
        }
    };

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        try {
            const res = await client.post(`/tickets/${ticket.id}/mensajes`, { mensaje: nuevoMensaje });
            setMensajes([...mensajes, res.data]);
            setNuevoMensaje("");
            
            if (estadoLocal === "ABIERTO" || estadoLocal === "ESPERANDO") {
                setEstadoLocal("EN_PROGRESO");
            }
        } catch (error) {
            toast.error("Error al enviar mensaje");
        }
    };

    const cambiarEstado = async (nuevoEst, solucion = null) => {
        try {
            const payload = { estado: nuevoEst };
            if (solucion) payload.solucion = solucion;

            await client.put(`/tickets/${ticket.id}/estado`, payload);
            setEstadoLocal(nuevoEst);
            setPidiendoSolucion(false);
            toast.success(`Ticket marcado como ${nuevoEst.replace('_', ' ')}`);
        } catch (error) {
            toast.error("Error al cambiar el estado");
        }
    };

    const handleCerrarTicket = () => {
        if (!pidiendoSolucion) {
            setPidiendoSolucion(true);
        } else {
            if (!textoSolucion.trim()) {
                toast.error("Debes ingresar la solución antes de cerrar el ticket");
                return;
            }
            cambiarEstado("CERRADO", textoSolucion);
        }
    };

    const tomarTicket = async () => {
        try {
            const res = await client.put(`/tickets/${ticket.id}/asignar`);
            setResponsableLocal(res.data.responsable);
            toast.success("Te has asignado este ticket");
        } catch (error) {
            toast.error("Error al asignarse el ticket");
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className={styles.title}>#{ticket.id} - {ticket.asunto}</h2>
                                <span className={styles.subtitle}>Cliente: {ticket.cliente?.nombre_completo} | Categoría: {ticket.categoria}</span>
                            </div>
                            <button onClick={onClose} className={styles.btnClose}><X size={20} /></button>
                        </div>
                        
                        <div className={styles.responsableBar}>
                            <span>Responsable: <strong>{responsableLocal ? responsableLocal.nombre : "Sin asignar"}</strong></span>
                            {!responsableLocal && estadoLocal !== "CERRADO" && (
                                <button onClick={tomarTicket} className={styles.btnTomar}>
                                    <UserCheck size={14} /> Tomar Ticket
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.chatArea}>
                    <div className={`${styles.messageWrapper} ${styles.messageCliente}`}>
                        <div className={styles.messageBubble}>
                            <strong>Descripción inicial:</strong><br/>
                            {ticket.descripcion}
                            <span className={styles.messageTime}>{new Date(ticket.fecha_creacion).toLocaleString()}</span>
                        </div>
                    </div>

                    {mensajes.map(msg => (
                        <div key={msg.id} className={`${styles.messageWrapper} ${msg.remitente === 'ADMIN' ? styles.messageSoporte : styles.messageCliente}`}>
                            <div className={styles.messageBubble}>
                                {msg.mensaje}
                                <span className={styles.messageTime}>{new Date(msg.fecha_creacion).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    
                    {estadoLocal === "CERRADO" && (ticket.solucion || textoSolucion) && (
                        <div className={styles.solucionBox}>
                            <strong>Solución aplicada:</strong>
                            <p>{ticket.solucion || textoSolucion}</p>
                        </div>
                    )}
                    
                    <div ref={mensajesEndRef} />
                </div>

                <div className={styles.footer}>
                    {estadoLocal !== "CERRADO" && !pidiendoSolucion && (
                        <form onSubmit={handleEnviar} className={styles.inputForm}>
                            <input 
                                type="text" 
                                value={nuevoMensaje} 
                                onChange={(e) => setNuevoMensaje(e.target.value)} 
                                placeholder="Escribe tu respuesta al cliente..."
                                className={styles.inputField}
                            />
                            <button type="submit" className={styles.btnSend} disabled={!nuevoMensaje.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    )}

                    {pidiendoSolucion && (
                        <div className={styles.solucionInputArea}>
                            <label>Notas de Resolución (Visible para el equipo):</label>
                            <textarea 
                                value={textoSolucion}
                                onChange={(e) => setTextoSolucion(e.target.value)}
                                placeholder="Describe cómo se solucionó este problema..."
                                className={styles.textareaSolucion}
                                rows="3"
                            />
                            <div className={styles.solucionActions}>
                                <button onClick={() => setPidiendoSolucion(false)} className={styles.btnCancelarSolucion}>Cancelar</button>
                                <button onClick={handleCerrarTicket} className={styles.btnConfirmarCierre}>Guardar y Cerrar Ticket</button>
                            </div>
                        </div>
                    )}

                    {!pidiendoSolucion && (
                        <div className={styles.actionRow}>
                            <span className={`${styles.badge} ${styles['badge' + estadoLocal]}`}>
                                Estado actual: {estadoLocal.replace('_', ' ')}
                            </span>
                            
                            <div className={styles.actionButtons}>
                                {estadoLocal === "EN_PROGRESO" && (
                                    <button onClick={() => cambiarEstado("ESPERANDO")} className={styles.btnEsperando}>
                                        <Clock size={16} /> Esperar al Cliente
                                    </button>
                                )}
                                
                                {estadoLocal !== "CERRADO" ? (
                                    <button onClick={handleCerrarTicket} className={styles.btnCerrar}>
                                        <CheckCircle size={16} /> Cerrar Ticket
                                    </button>
                                ) : (
                                    <button onClick={() => cambiarEstado("EN_PROGRESO")} className={styles.btnReabrir}>
                                        Reabrir Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ModalMensajeTicket;