import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Wifi, Activity, AlertTriangle, 
    Banknote, Landmark, DollarSign, Bell, 
    Clock, CheckCircle, ArrowRight
} from "lucide-react";
import styles from "./styles/Dashboard.module.css";
import PagoModal from "../components/PagoModal";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [clienteCobrar, setClienteCobrar] = useState(null);

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

    // Calculadora de Días de Gracia
    const calcularDiasGracia = (diaPago) => {
        const hoy = new Date();
        const diaActual = hoy.getDate();
        let dias = diaActual - diaPago;
        
        if (dias < 0 && diaActual <= 7) {
            const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
            dias = diaActual + (ultimoDiaMesAnterior - diaPago);
        }
        return dias;
    };

    if (loading) return <div className={styles.loading}>Cargando centro de operaciones...</div>;

    const totalClientes = stats?.clientes?.total || 0;
    const activos = stats?.clientes?.resumen?.activos || 0;
    
    // NUEVA VARIABLE: Extraemos los clientes en riesgo (Confiabilidad < 60)
    const clientesEnRiesgo = stats?.clientes?.resumen?.en_riesgo || 0;
    
    const recaudadoTotal = stats?.financiero?.recaudado_total || 0;
    const enEfectivo = stats?.financiero?.arqueo?.efectivo || 0;
    const enBanco = stats?.financiero?.arqueo?.banco || 0;
    const vencimientosHoy = stats?.alertas?.vencimientos_hoy || [];
    const logsRecientes = stats?.alertas?.actividad_reciente || [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Panel Principal</h1>
                    <p className={styles.subtitle}>Arqueo de caja, tareas pendientes y actividad reciente</p>
                </div>
            </div>

            {/* 1. ARQUEO DE CAJA */}
            <div className={styles.cashRegisterBox}>
                <div className={styles.cashHeader}>
                    <h2><DollarSign size={22} /> Arqueo de Caja</h2>
                    <span className={styles.dateBadge}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                
                <div className={styles.gridMoney}>
                    <div className={styles.moneyCard}>
                        <div className={styles.moneyIcon} style={{color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)'}}>
                            <DollarSign size={24} />
                        </div>
                        <div className={styles.moneyInfo}>
                            <span className={styles.moneyLabel}>Ingreso Total Acumulado</span>
                            <div className={styles.moneyValue} style={{color: '#16a34a'}}>{formatoDinero(recaudadoTotal)}</div>
                        </div>
                    </div>
                    
                    <div className={styles.moneyCard}>
                        <div className={styles.moneyIcon} style={{color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)'}}>
                            <Banknote size={24} />
                        </div>
                        <div className={styles.moneyInfo}>
                            <span className={styles.moneyLabel}>Efectivo</span>
                            <div className={styles.moneyValue} style={{color: '#2563eb'}}>{formatoDinero(enEfectivo)}</div>
                        </div>
                    </div>
                    
                    <div className={styles.moneyCard}>
                        <div className={styles.moneyIcon} style={{color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)'}}>
                            <Landmark size={24} />
                        </div>
                        <div className={styles.moneyInfo}>
                            <span className={styles.moneyLabel}>Banco</span>
                            <div className={styles.moneyValue} style={{color: '#8b5cf6'}}>{formatoDinero(enBanco)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ALERTAS RÁPIDAS */}
            <div className={styles.grid}>
                {/* VENCIMIENTOS */}
                <div className={`${styles.card} ${vencimientosHoy.length > 0 ? styles.cardWarning : styles.cardSuccess}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Pendientes de Pago</h3>
                        <div className={styles.cardIconBox}>
                            {vencimientosHoy.length > 0 ? <Bell size={24} /> : <CheckCircle size={24} />}
                        </div>
                    </div>
                    <p className={styles.cardValue}>{vencimientosHoy.length}</p>
                    <div className={styles.details}>
                        {vencimientosHoy.length > 0 ? <span>Clientes pendientes de cobro</span> : <span>Todos al corriente hoy</span>}
                    </div>
                </div>

                {/* CLIENTES EN RIESGO (Reemplaza a los deudores o requeridos de corte) */}
                <div className={`${styles.card} ${clientesEnRiesgo > 0 ? styles.cardDanger : styles.cardSuccess}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Clientes en Riesgo</h3>
                        <div className={styles.cardIconBox}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>{clientesEnRiesgo}</p>
                    <div className={styles.details} style={{padding: '10px 0 0 0'}}>
                        <span style={{display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)'}}>Confiabilidad menor al 60%</span>
                        <Link to="/clientes" className={styles.fullWidthLink}>
                            <button className={styles.actionBtn}>Revisar Cartera <ArrowRight size={14} /></button>
                        </Link>
                    </div>
                </div>

                {/* ACTIVOS */}
                <div className={`${styles.card} ${styles.cardInfo}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Estado de Red</h3>
                        <div className={styles.cardIconBox}><Wifi size={24} /></div>
                    </div>
                    <p className={styles.cardValue}>{activos}</p>
                    <div className={styles.details}>
                        <span>Clientes con servicio activo (De {totalClientes})</span>
                    </div>
                </div>
            </div>

            {/* 3. PANELES DE DETALLE */}
            <div className={styles.panelsGrid}>
                {/* Panel Izquierdo: Lista de a quién cobrarle hoy */}
                <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>    
                        <h3><Clock size={18} /> Vencimientos y Periodos de Gracia</h3>
                    </div>
                    <div className={styles.listContainer}>
                        {vencimientosHoy.length > 0 ? (
                            vencimientosHoy.map((cliente, index) => {
                                const diasGracia = calcularDiasGracia(cliente.dia_pago);
                                
                                return (
                                    <div key={index} className={styles.listItem}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemNameWrapper}>
                                                <strong>{cliente.nombre_completo || 'Cliente'}</strong>
                                                {diasGracia > 0 && (
                                                    <span className={styles.graceBadge}>
                                                        Día {diasGracia} de gracia
                                                    </span>
                                                )}
                                            </div>
                                            <span>{cliente.direccion || 'Sin dirección'}</span>
                                        </div>
                                        <button 
                                            className={styles.itemAction}
                                            style={{cursor: 'pointer'}}
                                            onClick={() => {
                                                setClienteCobrar(cliente); 
                                                setModalPagoOpen(true);
                                            }}
                                        >
                                            Cobrar
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} color="#10b981" style={{marginBottom: 10}}/>
                                <p>No hay deudores en periodo de gracia.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Feed de actividad */}
                <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>
                        <h3><Activity size={18} /> Actividad Reciente</h3>
                        <Link to="/logs" className={styles.viewAllLink}>Ver historial</Link>
                    </div>
                    <div className={styles.listContainer}>
                        {logsRecientes.length > 0 ? (
                            logsRecientes.slice(0, 5).map((log, index) => (
                                <div key={index} className={styles.logItem}>
                                    <div className={styles.logBullet}></div>
                                    <div className={styles.logContent}>
                                        <p className={styles.logDesc}>
                                            <strong>{log.usuario || 'Sistema'}</strong> {log.detalle}
                                        </p>
                                        <span className={styles.logTime}>
                                            {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Sin actividad reciente hoy.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <PagoModal 
                isOpen={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                cliente={clienteCobrar} 
                onSuccess={() => {
                    client.get("/dashboard/stats").then(res => setStats(res.data));
                }}
            />
        </div>
    );
}

export default Dashboard;