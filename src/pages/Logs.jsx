import { useEffect, useState } from "react";
import client from "../api/axios";
import { Activity, User, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import styles from "./styles/Logs.module.css"; // <--- Importamos los estilos

function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await client.get("/logs"); // Asegúrate de haber creado esta ruta en el back
                setLogs(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar la actividad");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{background: '#dbeafe', padding: 10, borderRadius: 12, color: '#2563eb'}}>
                    <Activity size={28} />
                </div>
                <h1 className={styles.title}>Registro de Actividad</h1>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>Cargando registros...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{width: '180px'}}>Fecha / Hora</th>
                                <th style={{width: '200px'}}>Acción</th>
                                <th style={{width: '150px'}}>Usuario</th>
                                <th>Detalle del Evento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <div className={styles.dateText} style={{display:'flex', alignItems:'center', gap:6}}>
                                            <Calendar size={14}/>
                                            {new Date(log.fecha).toLocaleDateString()}
                                        </div>
                                        <div className={styles.dateText} style={{marginLeft: 20}}>
                                            {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.badge}>{log.accion}</span>
                                    </td>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                                            <User size={14} className={styles.dateText}/>
                                            <span className={styles.userText}>{log.usuario || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                                            <FileText size={16} style={{marginTop:3, color:'var(--text-muted)'}}/>
                                            {log.detalle}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" style={{textAlign:'center', padding: 30, color: 'var(--text-muted)'}}>
                                        No hay actividad registrada recientemente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Logs;