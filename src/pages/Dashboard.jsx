import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Users, Wifi, Activity, Scissors, 
    Banknote, Landmark, DollarSign, Bell 
} from "lucide-react";
import styles from "./styles/Dashboard.module.css";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await client.get("/dashboard/stats");
                setStats(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar el resumen");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatoDinero = (num) => `$${parseFloat(num || 0).toFixed(2)}`;

    if (loading) return <div className={styles.loading}>Cargando resumen...</div>;

    const totalClientes = stats?.clientes?.total || 0;
    const activos = stats?.clientes?.resumen?.activos || 0;
    const pendientesCorte = (stats?.clientes?.resumen?.cortados || 0) + (stats?.clientes?.resumen?.suspendidos || 0);
    const recaudadoTotal = stats?.financiero?.recaudado_total || 0;
    const enEfectivo = stats?.financiero?.arqueo?.efectivo || 0;
    const enBanco = stats?.financiero?.arqueo?.banco || 0;
    const vencimientosHoy = stats?.alertas?.vencimientos_hoy || [];
    const logsRecientes = stats?.alertas?.actividad_reciente || [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Resumen Operativo</h1>
                <p className={styles.subtitle}>Estado diario de caja y red</p>
            </div>

            <div className={styles.grid}>
                {/* ALERTAS */}
                <div className={styles.card} style={{borderColor: vencimientosHoy.length > 0 ? '#fbbf24' : 'var(--border)'}}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Vencimientos Hoy</h3>
                        <div style={{color: '#d97706', background: '#fef3c7', padding: '8px', borderRadius: '50%'}}><Bell size={24} /></div>
                    </div>
                    <p className={styles.cardValue} style={{color: '#d97706'}}>{vencimientosHoy.length}</p>
                    <div className={styles.details}>
                        {vencimientosHoy.length > 0 ? <span>Clientes por pagar</span> : <span style={{color:'green'}}>Al día</span>}
                    </div>
                </div>

                {/* CORTES */}
                <div className={styles.card} style={{borderColor: '#fca5a5', backgroundColor: '#fef2f2'}}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle} style={{color: '#b91c1c'}}>Cortes Pendientes</h3>
                        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '8px', borderRadius: '50%'}}><Scissors size={24} /></div>
                    </div>
                    <p className={styles.cardValue} style={{color: '#b91c1c'}}>{pendientesCorte}</p>
                    <div className={styles.details} style={{borderTop:'1px solid #fecaca'}}>
                        <Link to="/cortes" style={{textDecoration:'none', width:'100%'}}>
                            <button className={styles.actionBtn}><Scissors size={16} /> Ver Lista</button>
                        </Link>
                    </div>
                </div>

                {/* ACTIVOS */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Clientes Activos</h3>
                        <div style={{color: '#16a34a', background: '#dcfce7', padding: '8px', borderRadius: '50%'}}><Wifi size={24} /></div>
                    </div>
                    <p className={styles.cardValue}>{activos}</p>
                    <div className={styles.details}><span>De {totalClientes} Totales</span></div>
                </div>
            </div>

            {/* ARQUEO */}
            <h3 className={styles.sectionTitle}>Arqueo de Caja (Hoy)</h3>
            <div className={styles.gridMoney}>
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #16a34a'}}>
                    <div className={styles.moneyIcon} style={{color: '#16a34a', background: '#dcfce7'}}><DollarSign size={20} /></div>
                    <div><span className={styles.moneyLabel}>Total</span><div className={styles.moneyValue} style={{color: '#16a34a'}}>{formatoDinero(recaudadoTotal)}</div></div>
                </div>
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #2563eb'}}>
                    <div className={styles.moneyIcon} style={{color: '#2563eb', background: '#dbeafe'}}><Banknote size={20} /></div>
                    <div><span className={styles.moneyLabel}>Efectivo</span><div className={styles.moneyValue} style={{color: '#2563eb'}}>{formatoDinero(enEfectivo)}</div></div>
                </div>
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #4f46e5'}}>
                    <div className={styles.moneyIcon} style={{color: '#4f46e5', background: '#e0e7ff'}}><Landmark size={20} /></div>
                    <div><span className={styles.moneyLabel}>Banco</span><div className={styles.moneyValue} style={{color: '#4f46e5'}}>{formatoDinero(enBanco)}</div></div>
                </div>
            </div>

            {/* LOGS */}
            <div style={{marginTop: 30}}>
                <h3 className={styles.sectionTitle}>Actividad Reciente</h3>
                <div style={{background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', padding: '15px 20px'}}>
                    {logsRecientes.length === 0 ? (
                        <div style={{textAlign:'center', color:'var(--text-muted)', padding: 10}}><Activity size={32} style={{opacity:0.2}} /><p>Sin actividad reciente.</p></div>
                    ) : (
                        <ul style={{listStyle:'none', padding:0, margin:0}}>
                            {logsRecientes.map(log => (
                                <li key={log.id} style={{borderBottom:'1px solid var(--border)', padding:'10px 0', display:'flex', justifyContent:'space-between'}}>
                                    <div><div style={{fontWeight:600}}>{log.accion}</div><div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{log.detalle}</div></div>
                                    <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{new Date(log.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
export default Dashboard;