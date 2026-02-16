import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, AlertCircle, Wallet, Download, Calendar, Users, DollarSign, ArrowRight
} from "lucide-react";
import styles from "./styles/Estadisticas.module.css";
import { useTheme } from "../context/ThemeContext";

function Estadisticas() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await client.get("/dashboard/stats");
                setData(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const exportarPendientes = () => {
        if (!data?.pendientes_pago?.lista?.length) return toast.info("No hay deudores pendientes");
        
        const lista = data.pendientes_pago.lista;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Nombre,Telefono,Direccion,Deuda\n";
        
        lista.forEach(c => {
            const row = `"${c.nombre_completo}","${c.telefono || ''}","${c.direccion || ''}","${c.saldo_actual}"`;
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

    if (loading) return <div className={styles.loading}>Cargando análisis financiero...</div>;
    if (!data) return <div className={styles.loading}>Sin datos para mostrar</div>;

    // --- CÁLCULOS RÁPIDOS ---
    const q1 = data.financiero?.recaudado_q1 || 0;
    const q2 = data.financiero?.recaudado_q2 || 0;
    const ingresosTotalesMes = q1 + q2;
    const porcentajeQ1 = ingresosTotalesMes > 0 ? ((q1 / ingresosTotalesMes) * 100).toFixed(0) : 0;
    const porcentajeQ2 = ingresosTotalesMes > 0 ? ((q2 / ingresosTotalesMes) * 100).toFixed(0) : 0;

    const totalDeuda = data.pendientes_pago?.total_deuda || 0;
    const proyeccion = data.financiero?.proyeccion_proximo_mes || 0;
    const clientesActivos = data.clientes?.resumen?.activos || 0;
    const topDeudores = data.pendientes_pago?.lista?.slice(0, 5) || []; // Solo los primeros 5

    // --- CONFIGURACIÓN GRÁFICAS ---
    const COLORS_CLIENTES = ['#10b981', '#f59e0b', '#ef4444'];
    const clientesData = [
        { name: 'Activos', value: clientesActivos },
        { name: 'Suspendidos', value: data.clientes?.resumen?.suspendidos || 0 },
        { name: 'Cortados', value: data.clientes?.resumen?.cortados || 0 },
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
                    <p className={styles.subtitle}>Visión general a largo plazo del negocio</p>
                </div>
                <button className={styles.exportButton} onClick={exportarPendientes}>
                    <Download size={18} /> Exportar Reporte de Deudores
                </button>
            </div>

            {/* --- 1. TARJETAS DE KPI (Métricas Principales) --- */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper} style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                        <Wallet size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Ingresos Acumulados (Mes)</span>
                        <span className={styles.kpiValue}>${ingresosTotalesMes.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper} style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Proyección Próximo Mes</span>
                        <span className={styles.kpiValue}>${proyeccion.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper} style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>
                        <AlertCircle size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Cartera Vencida Activa</span>
                        <span className={styles.kpiValue}>${totalDeuda.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper} style={{background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'}}>
                        <Users size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Total Clientes Activos</span>
                        <span className={styles.kpiValue}>{clientesActivos}</span>
                    </div>
                </div>
            </div>

            {/* --- 2. GRÁFICAS PRINCIPALES --- */}
            <div className={styles.chartsGrid}>
                {/* Tendencia Ingresos */}
                <div className={`${styles.chartCard} ${styles.span2}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3>Tendencia de Ingresos</h3>
                            <span className={styles.cardSubtitle}>Histórico de recaudación mensual</span>
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
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `$${value}`} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`$${value}`, 'Ingresos']} />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Estado Cartera */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3>Estado de Cartera</h3>
                            <span className={styles.cardSubtitle}>Distribución de base de clientes</span>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientesData}
                                    cx="50%" cy="50%"
                                    innerRadius={70} outerRadius={90} /* Diseño tipo Donut Moderno */
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke={isDark ? '#1e293b' : '#fff'}
                                    strokeWidth={2}
                                >
                                    {clientesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_CLIENTES[index % COLORS_CLIENTES.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- 3. DETALLES OPERATIVOS --- */}
            <div className={styles.bottomGrid}>
                {/* Rendimiento Quincenal */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeaderSmall}>
                        <Calendar size={20} className={styles.iconBlue} />
                        <h3>Desglose Quincenal</h3>
                    </div>
                    <div className={styles.quincenaContainer}>
                        <div className={styles.qBlock}>
                            <div className={styles.qTitleRow}>
                                <span className={styles.qTitle}>1ª Quincena (Días 1-15)</span>
                                <span className={styles.qPercent}>{porcentajeQ1}%</span>
                            </div>
                            <span className={styles.qAmount}>${q1.toFixed(2)}</span>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{width: `${porcentajeQ1}%`, background: '#3b82f6'}}></div>
                            </div>
                        </div>
                        
                        <div className={styles.qBlock}>
                            <div className={styles.qTitleRow}>
                                <span className={styles.qTitle}>2ª Quincena (Días 16-30)</span>
                                <span className={styles.qPercent}>{porcentajeQ2}%</span>
                            </div>
                            <span className={styles.qAmount}>${q2.toFixed(2)}</span>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{width: `${porcentajeQ2}%`, background: '#8b5cf6'}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen de Morosidad */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeaderSmall}>
                        <AlertCircle size={20} className={styles.iconRed} />
                        <h3>Foco de Atención: Morosidad</h3>
                    </div>
                    <div className={styles.morosidadContainer}>
                        <div className={styles.morosidadTotal}>
                            <span>Deuda Pendiente Total</span>
                            <strong className={styles.textRed}>${totalDeuda.toFixed(2)}</strong>
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
                                        <span className={styles.deudorDeuda}>${deudor.saldo_actual}</span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noDeudores}>¡Excelente! Todos los clientes están al corriente.</div>
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