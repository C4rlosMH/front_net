import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Users, Wifi, Activity, Scissors, 
    Banknote, Landmark, DollarSign 
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

    // Datos Operativos
    const totalClientes = stats?.clientes?.total || 0;
    const activos = stats?.clientes?.resumen?.activos || 0;
    const pendientesCorte = (stats?.clientes?.resumen?.cortados || 0) + (stats?.clientes?.resumen?.suspendidos || 0);
    
    // Datos Financieros (Arqueo)
    const recaudadoTotal = stats?.financiero?.recaudado_total || 0;
    const enEfectivo = stats?.financiero?.arqueo?.efectivo || 0;
    const enBanco = stats?.financiero?.arqueo?.banco || 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Resumen Operativo</h1>
                <p className={styles.subtitle}>Estado diario de caja y red</p>
            </div>

            {/* --- SECCIÓN 1: ESTADO RED Y CORTES --- */}
            <div className={styles.grid}>
                {/* Reporte Cortes (Prioritario) */}
                <div className={styles.card} style={{borderColor: '#fca5a5', backgroundColor: '#fef2f2'}}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle} style={{color: '#b91c1c'}}>Cortes Pendientes</h3>
                        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '8px', borderRadius: '50%'}}>
                            <Scissors size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue} style={{color: '#b91c1c'}}>
                        {pendientesCorte} <span style={{fontSize:'1rem', fontWeight:'normal'}}>Clientes</span>
                    </p>
                    <div className={styles.details} style={{borderTop:'1px solid #fecaca'}}>
                        <Link to="/cortes" style={{textDecoration:'none', width:'100%'}}>
                            <button className={styles.actionBtn}>
                                <Scissors size={16} /> Ver Lista
                            </button>
                        </Link>
                    </div>
                </div>

                {/* KPI: CLIENTES ACTIVOS (ACTUALIZADO) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Clientes Activos</h3>
                        <div style={{color: '#16a34a', background: '#dcfce7', padding: '8px', borderRadius: '50%'}}>
                            <Wifi size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>{activos}</p>
                    <div className={styles.details}>
                        <span style={{color: '#16a34a'}}>Servicio en línea</span>
                        <span style={{color: 'var(--text-muted)', marginLeft:'10px'}}>
                            (Total Cartera: {totalClientes})
                        </span>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: ARQUEO DE CAJA (DINERO REAL) --- */}
            <h3 className={styles.sectionTitle}>Arqueo de Caja (Hoy)</h3>
            <div className={styles.gridMoney}>
                {/* Total */}
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #16a34a'}}>
                    <div className={styles.moneyIcon} style={{color: '#16a34a', background: '#dcfce7'}}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className={styles.moneyLabel}>Recaudado Total</span>
                        <div className={styles.moneyValue} style={{color: '#16a34a'}}>{formatoDinero(recaudadoTotal)}</div>
                    </div>
                </div>

                {/* Efectivo */}
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #2563eb'}}>
                    <div className={styles.moneyIcon} style={{color: '#2563eb', background: '#dbeafe'}}>
                        <Banknote size={20} />
                    </div>
                    <div>
                        <span className={styles.moneyLabel}>En Efectivo</span>
                        <div className={styles.moneyValue} style={{color: '#2563eb'}}>{formatoDinero(enEfectivo)}</div>
                        <small className={styles.moneySub}>Dinero en mano</small>
                    </div>
                </div>

                {/* Banco */}
                <div className={styles.moneyCard} style={{borderLeft: '4px solid #4f46e5'}}>
                    <div className={styles.moneyIcon} style={{color: '#4f46e5', background: '#e0e7ff'}}>
                        <Landmark size={20} />
                    </div>
                    <div>
                        <span className={styles.moneyLabel}>En Banco</span>
                        <div className={styles.moneyValue} style={{color: '#4f46e5'}}>{formatoDinero(enBanco)}</div>
                        <small className={styles.moneySub}>Transferencias</small>
                    </div>
                </div>
            </div>

            <div style={{marginTop: 40, textAlign:'center', color:'var(--text-muted)', fontStyle:'italic'}}>
                <Activity size={48} style={{opacity:0.2, marginBottom:10}} />
                <p>Sistema operativo.</p>
            </div>
        </div>
    );
}

export default Dashboard;