import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import useSWR from "swr"; 
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, AlertCircle, Wallet, Download, Calendar, Users, 
    ArrowRight, History, TrendingDown, DollarSign
} from "lucide-react";
import styles from "./styles/Estadisticas.module.css";
import { APP_CONFIG } from "../config/appConfig";
import { useTheme } from "../context/ThemeContext";

const fetcher = (url) => client.get(url).then(res => res.data);

function Estadisticas() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const { data, error, isLoading } = useSWR("/dashboard/stats", fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000, 
    });

    const { data: gastosData } = useSWR("/gastos", fetcher, {
        revalidateOnFocus: false
    });

    if (error) {
        toast.error("Error al cargar datos financieros");
    }

    const exportarPendientes = () => {
        if (!data?.pendientes_pago?.lista?.length) return toast.info("No hay deudores pendientes");
        
        const lista = data.pendientes_pago.lista;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Nombre,Telefono,Direccion,Deuda,Confiabilidad\n";
        
        lista.forEach(c => {
            const deudaTotal = Number(c.saldo_actual || 0) + Number(c.saldo_aplazado || 0);
            const row = `"${c.nombre_completo}","${c.telefono || ''}","${c.direccion || ''}","${deudaTotal}","${c.confiabilidad || 100}%"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_pendientes_pago.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || !data) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <div className={`${styles.skeletonPulse} ${styles.skeletonTitle}`}></div>
                        <div className={`${styles.skeletonPulse} ${styles.skeletonSubtitle}`}></div>
                    </div>
                </div>
                <div className={styles.kpiGrid}>
                    {[1,2,3,4,5,6].map(i => <div key={i} className={`${styles.kpiCard} ${styles.skeletonPulse} ${styles.skeletonKpi}`}></div>)}
                </div>
                <div className={styles.chartsGrid}>
                    <div className={`${styles.chartCard} ${styles.span2} ${styles.skeletonPulse} ${styles.skeletonChart}`}></div>
                    <div className={`${styles.chartCard} ${styles.skeletonPulse} ${styles.skeletonChart}`}></div>
                </div>
                <div className={styles.bottomGrid}>
                    <div className={`${styles.chartCard} ${styles.skeletonPulse} ${styles.skeletonBottom}`}></div>
                    <div className={`${styles.chartCard} ${styles.skeletonPulse} ${styles.skeletonBottom}`}></div>
                </div>
            </div>
        );
    }

    const metas = data.financiero?.metas || { q1: { estimada: 0, a_tiempo: 0, recuperado: 0 }, q2: { estimada: 0, a_tiempo: 0, recuperado: 0 } };
    const ingresosTotalesMes = data.financiero?.recaudado_total || 0;
    
    // Aprovechamos el nuevo resumen que manda el backend
    const gastosDelMes = gastosData?.resumen?.totalMes || 0;
    const gananciaNeta = ingresosTotalesMes - gastosDelMes;

    const totalQ1 = metas.q1.a_tiempo + metas.q1.recuperado;
    const metaQ1 = metas.q1.estimada > 0 ? metas.q1.estimada : 1; 
    const pctTiempoQ1 = Math.min(100, (metas.q1.a_tiempo / metaQ1) * 100);
    const pctRecupQ1 = Math.min(100 - pctTiempoQ1, (metas.q1.recuperado / metaQ1) * 100);

    const totalQ2 = metas.q2.a_tiempo + metas.q2.recuperado;
    const metaQ2 = metas.q2.estimada > 0 ? metas.q2.estimada : 1;
    const pctTiempoQ2 = Math.min(100, (metas.q2.a_tiempo / metaQ2) * 100);
    const pctRecupQ2 = Math.min(100 - pctTiempoQ2, (metas.q2.recuperado / metaQ2) * 100);

    const totalDeuda = data.pendientes_pago?.total_deuda || 0;
    const proyeccion = data.financiero?.proyeccion_proximo_mes || 0;
    const clientesActivos = data.clientes?.resumen?.activos || 0;
    const topDeudores = data.pendientes_pago?.lista?.slice(0, 5) || [];

    const COLORS_ARQUEO = ['#10b981', '#8b5cf6']; 
    const arqueoData = [
        { name: 'Efectivo', value: data.financiero?.arqueo?.efectivo || 0 },
        { name: 'Digital / Banco', value: data.financiero?.arqueo?.banco || 0 }
    ].filter(i => i.value > 0);

    const tooltipStyle = {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e5e7eb',
        color: isDark ? '#f1f5f9' : '#0f172a',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Estadísticas y Proyecciones</h1>
                    <p className={styles.subtitle}>Visión general a corto y mediano plazo del negocio</p>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/estadisticas-anuales" style={{ textDecoration: 'none' }}>
                        <button className={styles.btnOutline}>
                            <Calendar size={18} /> Comparativa Anual
                        </button>
                    </Link>
                    <button className={styles.exportButton} onClick={exportarPendientes}>
                        <Download size={18} /> Exportar Reporte de Deudores
                    </button>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIconWrapper} ${styles.kpiIconBlue}`}><Wallet size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Ingresos Brutos</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{ingresosTotalesMes.toFixed(2)}</span>
                    </div>
                </div>

                <Link to="/gastos" className={styles.kpiLink}>
                    <div className={`${styles.kpiCard} ${styles.kpiCardHover}`}>
                        <div className={`${styles.kpiIconWrapper} ${styles.kpiIconOrange}`}><TrendingDown size={24} /></div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiLabel}>Egresos del Mes</span>
                            <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{gastosDelMes.toFixed(2)}</span>
                            <span className={styles.kpiSubText}>Ver detalles →</span>
                        </div>
                    </div>
                </Link>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIconWrapper} ${styles.kpiIconTeal}`}><DollarSign size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Ganancia Neta</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{gananciaNeta.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}><TrendingUp size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Proyección Mes</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{proyeccion.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIconWrapper} ${styles.kpiIconRed}`}><AlertCircle size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Cartera Vencida</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{totalDeuda.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIconWrapper} ${styles.kpiIconPurple}`}><Users size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Clientes Activos</span>
                        <span className={styles.kpiValue}>{clientesActivos}</span>
                    </div>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                <div className={`${styles.chartCard} ${styles.span2}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3>Tendencia de Ingresos</h3>
                            <span className={styles.cardSubtitle}>Histórico de recaudación de los últimos 6 meses</span>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.graficaIngresos}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e5e7eb'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `${APP_CONFIG.currencySymbol}${value}`} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${APP_CONFIG.currencySymbol}${value}`, 'Ingresos']} />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3>Flujo de Ingresos</h3>
                            <span className={styles.cardSubtitle}>Distribución por método de pago mensual</span>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        {arqueoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={arqueoData}
                                        cx="50%" cy="50%"
                                        innerRadius={70} outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke={isDark ? '#1e293b' : '#fff'}
                                        strokeWidth={2}
                                    >
                                        {arqueoData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_ARQUEO[index % COLORS_ARQUEO.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${APP_CONFIG.currencySymbol}${parseFloat(value).toFixed(2)}`, 'Monto']} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                                Sin ingresos registrados este mes.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.bottomGrid}>
                <div className={styles.chartCard}>
                    <div className={`${styles.cardHeaderSmall} ${styles.headerSpaceBetween}`}>
                        <div className={styles.titleGroup}>
                            <Calendar size={20} className={styles.iconBlue} />
                            <h3>Desglose de Ciclos de Facturación</h3>
                        </div>
                        <Link to="/cierres" className={styles.linkClean}>
                            <button className={`${styles.viewAllBtn} ${styles.btnSmall}`}>
                                Ver Historial <History size={14} />
                            </button>
                        </Link>
                    </div>
                    <div className={styles.quincenaContainer}>
                        <div className={styles.qBlock}>
                            <div className={styles.qTitleRow}>
                                <span className={styles.qTitle}>Ciclo 1 - 15 (Meta: {APP_CONFIG.currencySymbol}{metas.q1.estimada.toFixed(2)})</span>
                                <span className={styles.qPercent}>{((totalQ1 / metaQ1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className={styles.progressWrapper} title="Progreso del ciclo">
                                <div className={styles.progressOntimeQ1} style={{ width: `${pctTiempoQ1}%` }} title={`A tiempo: $${metas.q1.a_tiempo}`} />
                                <div className={styles.progressLate} style={{ width: `${pctRecupQ1}%` }} title={`Recuperado: $${metas.q1.recuperado}`} />
                            </div>
                            <div className={styles.progressDetails}>
                                <span><span className={styles.textBlue}>{APP_CONFIG.currencySymbol}{metas.q1.a_tiempo.toFixed(2)}</span> a tiempo</span>
                                <span><span className={styles.textOrange}>{APP_CONFIG.currencySymbol}{metas.q1.recuperado.toFixed(2)}</span> atrasado</span>
                            </div>
                        </div>
                        <div className={`${styles.qBlock} ${styles.qBlockMargin}`}>
                            <div className={styles.qTitleRow}>
                                <span className={styles.qTitle}>Ciclo 16 - 30 (Meta: {APP_CONFIG.currencySymbol}{metas.q2.estimada.toFixed(2)})</span>
                                <span className={styles.qPercent}>{((totalQ2 / metaQ2) * 100).toFixed(0)}%</span>
                            </div>
                            <div className={styles.progressWrapper} title="Progreso del ciclo">
                                <div className={styles.progressOntimeQ2} style={{ width: `${pctTiempoQ2}%` }} title={`A tiempo: $${metas.q2.a_tiempo}`} />
                                <div className={styles.progressLate} style={{ width: `${pctRecupQ2}%` }} title={`Recuperado: $${metas.q2.recuperado}`} />
                            </div>
                            <div className={styles.progressDetails}>
                                <span><span className={styles.textPurple}>{APP_CONFIG.currencySymbol}{metas.q2.a_tiempo.toFixed(2)}</span> a tiempo</span>
                                <span><span className={styles.textOrange}>{APP_CONFIG.currencySymbol}{metas.q2.recuperado.toFixed(2)}</span> atrasado</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <div className={styles.cardHeaderSmall}>
                        <AlertCircle size={20} className={styles.iconRed} />
                        <h3>Foco de Atención: Morosidad</h3>
                    </div>
                    <div className={styles.morosidadContainer}>
                        <div className={styles.morosidadTotal}>
                            <span>Deuda Pendiente Total</span>
                            <strong className={styles.textRed}>{APP_CONFIG.currencySymbol}{totalDeuda.toFixed(2)}</strong>
                        </div>
                        <p className={styles.morosidadDesc}>
                            Impacto de <strong>{data.pendientes_pago?.lista?.length || 0} clientes</strong> con atrasos activos.
                        </p>
                        <div className={styles.deudoresList}>
                            {topDeudores.length > 0 ? (
                                topDeudores.map((deudor, idx) => (
                                    <div key={idx} className={styles.deudorItem}>
                                        <div className={styles.deudorInfo}>
                                            <span className={styles.deudorName}>{deudor.nombre_completo}</span>
                                            <span className={styles.deudorAddress}>{deudor.direccion || 'Sin dirección'}</span>
                                        </div>
                                        <span className={styles.deudorDeuda}>
                                            {APP_CONFIG.currencySymbol}{Number(deudor.saldo_actual || 0) + Number(deudor.saldo_aplazado || 0)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noDeudores}>Todos los clientes están al corriente.</div>
                            )}
                        </div>
                        {data.pendientes_pago?.lista?.length > 5 && (
                            <button className={styles.viewAllBtn} onClick={exportarPendientes}>
                                Ver lista completa y exportar <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Estadisticas;