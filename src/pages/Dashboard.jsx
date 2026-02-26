import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import useSWR from "swr"; 
import { 
    Wifi, Activity, AlertTriangle, AlertCircle, Flame,
    Banknote, Landmark, DollarSign, Bell, 
    Clock, CheckCircle, ArrowRight, LifeBuoy
} from "lucide-react";
import styles from "./styles/Dashboard.module.css";
import PagoModal from "../components/PagoModal";

import { APP_CONFIG } from "../config/appConfig";

const fetcher = (url) => client.get(url).then(res => res.data);

function Dashboard() {
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [clienteCobrar, setClienteCobrar] = useState(null);
    const [konamiTriggered, setKonamiTriggered] = useState(false);
    
    // Estado para los KPIs de los tickets
    const [kpisTickets, setKpisTickets] = useState({ abiertos: 0, criticos: 0 });

    const { data: stats, error, isLoading, mutate } = useSWR("/dashboard/stats", fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000, 
    });

    useEffect(() => {
        const konamiCode = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
        let keySequence = [];

        const handleKeyDown = (e) => {
            keySequence.push(e.key.toLowerCase());
            
            if (keySequence.length > konamiCode.length) {
                keySequence.shift();
            }
            
            if (keySequence.join(',') === konamiCode.join(',')) {
                setKonamiTriggered(true);
                toast.success("Secuencia secreta aceptada.");
                setTimeout(() => setKonamiTriggered(false), 1500);
                keySequence = [];
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Llamada a la API para cargar los KPIs de tickets
    useEffect(() => {
        const fetchTicketKpis = async () => {
            try {
                const res = await client.get("/tickets/dashboard-kpis");
                setKpisTickets(res.data);
            } catch (error) {
                console.error("Error al cargar KPIs de tickets", error);
            }
        };
        fetchTicketKpis();
    }, []);

    if (error) {
        toast.error("Error al cargar el resumen");
    }

    const formatoDinero = (num) => `${APP_CONFIG.currencySymbol}${parseFloat(num || 0).toFixed(2)}`;

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

    if (isLoading || !stats) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <div className={`${styles.skeletonPulse} ${styles.skeletonTitle}`}></div>
                        <div className={`${styles.skeletonPulse} ${styles.skeletonSubtitle}`}></div>
                    </div>
                </div>
                <div className={`${styles.skeletonPulse} ${styles.skeletonBox}`}></div>
                <div className={styles.grid}>
                    {[1,2,3].map(i => <div key={i} className={`${styles.skeletonPulse} ${styles.skeletonCard}`}></div>)}
                </div>
                <div className={styles.panelsGrid}>
                    <div className={`${styles.skeletonPulse} ${styles.skeletonPanel}`}></div>
                    <div className={`${styles.skeletonPulse} ${styles.skeletonPanel}`}></div>
                </div>
            </div>
        );
    }

    const totalClientes = stats?.clientes?.total || 0;
    const activos = stats?.clientes?.resumen?.activos || 0;
    const clientesEnRiesgo = stats?.clientes?.resumen?.en_riesgo || 0;
    const recaudadoTotal = stats?.financiero?.recaudado_total || 0;
    const enEfectivo = stats?.financiero?.arqueo?.efectivo || 0;
    const enBanco = stats?.financiero?.arqueo?.banco || 0;
    const vencimientosHoy = stats?.alertas?.vencimientos_hoy || [];
    const ticketsActivos = stats?.alertas?.tickets_activos || [];

    return (
        <div className={`${styles.container} ${konamiTriggered ? styles.barrelRoll : ''}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Panel Principal</h1>
                    <p className={styles.subtitle}>Arqueo de caja, tareas pendientes y actividad reciente</p>
                </div>
            </div>

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

            <div className={styles.grid}>
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

            {/* --- SECCIÓN DE ALERTAS DE SOPORTE --- */}
            <div className={styles.kpiTicketsGrid}>
                {/* Tarjeta de Tickets Abiertos */}
                <div className={styles.kpiTicketCard}>
                    <div className={`${styles.kpiTicketIcon} ${styles.kpiIconBlue}`}>
                        <AlertCircle size={24} />
                    </div>
                    <div className={styles.kpiTicketInfo}>
                        <span className={styles.kpiTicketValue}>{kpisTickets.abiertos}</span>
                        <span className={styles.kpiTicketLabel}>Tickets Abiertos</span>
                    </div>
                </div>

                {/* Tarjeta de Emergencias */}
                <div className={styles.kpiTicketCard}>
                    <div className={`${styles.kpiTicketIcon} ${styles.kpiIconRed}`}>
                        <Flame size={24} />
                    </div>
                    <div className={styles.kpiTicketInfo}>
                        <span className={styles.kpiTicketValue}>{kpisTickets.criticos}</span>
                        <span className={styles.kpiTicketLabel}>Emergencias Activas</span>
                    </div>
                </div>
            </div>

            <div className={styles.panelsGrid}>
                {/* PANEL IZQUIERDO: VENCIMIENTOS */}
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

                {/* PANEL DERECHO: TICKETS ACTIVOS */}
                <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>
                        <h3><LifeBuoy size={18} /> Soporte Técnico Activo</h3>
                        <Link to="/tickets" className={styles.viewAllLink}>Ver todos</Link>
                    </div>
                    <div className={styles.listContainer}>
                        {ticketsActivos.length > 0 ? (
                            ticketsActivos.map((ticket, index) => (
                                <div key={index} className={styles.listItem}>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemNameWrapper}>
                                            <strong>{ticket.cliente?.nombre_completo || 'Cliente Eliminado'}</strong>
                                            <span className={`${styles.badge} ${styles['badge' + ticket.estado]}`}>
                                                {ticket.estado.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span>#{ticket.id} - {ticket.asunto}</span>
                                    </div>
                                    <Link 
                                        to="/tickets" 
                                        className={styles.itemAction}
                                        style={{ backgroundColor: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                    >
                                        Atender
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} color="#10b981" style={{marginBottom: 10}}/>
                                <p>No hay tickets pendientes de atención.</p>
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
                    mutate();
                }}
            />
        </div>
    );
}

export default Dashboard;