import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Para leer el ID de la URL
import client from "../api/axios";
import { toast } from "sonner";
import { ArrowLeft, User, DollarSign, Calendar } from "lucide-react";
import styles from "./styles/Pagos.module.css"; // Reutilizamos estilos

function HistorialPagos() {
    const { id } = useParams(); // Obtenemos el ID del cliente de la URL
    const navigate = useNavigate();
    
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Endpoint que creamos antes que devuelve { cliente, saldo_actual, historial }
                const res = await client.get(`/pagos/historial/${id}`);
                setDatos(res.data);
            } catch (error) {
                toast.error("Error al cargar historial");
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [id]);

    if (loading) return <div style={{padding:20}}>Cargando historial...</div>;
    if (!datos) return <div style={{padding:20}}>No se encontró información</div>;

    // Calculamos si hay deuda
    const historial = datos.historial || [];

    return (
        <div className={styles.container}>
            <button onClick={() => navigate(-1)} style={{display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', marginBottom:20, color:'var(--text-muted)'}}>
                <ArrowLeft size={18} /> Volver a lista
            </button>

            {/* HEADER DEL CLIENTE */}
            <div className={styles.clientCard} style={{flexDirection:'column', alignItems:'flex-start', gap:15}}>
                <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
                    <div style={{display:'flex', gap:15, alignItems:'center'}}>
                        <div style={{background:'#eff6ff', padding:15, borderRadius:'50%', color:'#2563eb'}}>
                            <User size={32} />
                        </div>
                        <div>
                            <h1 style={{margin:0, fontSize:'1.5rem'}}>{datos.cliente}</h1>
                            <span style={{color:'gray'}}>Historial Financiero Completo</span>
                        </div>
                    </div>

                    <div style={{textAlign:'right'}}>
                        <span style={{display:'block', color:'gray'}}>Saldo Actual</span>
                        <span style={{fontSize:'2rem', fontWeight:'bold', color: datos.saldo_actual > 0 ? '#ef4444' : '#10b981'}}>
                            ${datos.saldo_actual}
                        </span>
                    </div>
                </div>
            </div>

            {/* TIMELINE DE PAGOS */}
            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <Calendar size={18} style={{verticalAlign:'middle', marginRight:8}} /> 
                    Movimientos Registrados
                </div>
                <ul className={styles.historyList}>
                    {historial.map(mov => (
                        <li key={mov.id} className={styles.historyItem}>
                            <div style={{display:'flex', gap:15}}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 8, 
                                    background: mov.tipo === 'ABONO' ? '#dcfce7' : '#fee2e2',
                                    color: mov.tipo === 'ABONO' ? '#166534' : '#991b1b',
                                    display:'flex', alignItems:'center', justifyContent:'center'
                                }}>
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <span style={{fontWeight:'bold', display:'block'}}>
                                        {mov.tipo === 'ABONO' ? 'Pago Recibido' : 'Cargo / Mensualidad'}
                                    </span>
                                    <span style={{fontSize:'0.85rem', color:'gray'}}>
                                        {new Date(mov.fecha).toLocaleDateString()} • {new Date(mov.fecha).toLocaleTimeString()}
                                    </span>
                                    <div style={{fontSize:'0.85rem', color:'var(--text-muted)', marginTop:2}}>
                                        {mov.descripcion}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{fontSize:'1.2rem', fontWeight:'bold', color: mov.tipo === 'ABONO' ? '#166534' : '#991b1b'}}>
                                {mov.tipo === 'ABONO' ? '+' : '-'}${mov.monto}
                            </div>
                        </li>
                    ))}
                    {historial.length === 0 && (
                        <li style={{padding:30, textAlign:'center', color:'gray'}}>Este cliente no tiene movimientos aún.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default HistorialPagos;