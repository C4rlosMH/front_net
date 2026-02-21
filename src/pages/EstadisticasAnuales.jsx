import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import useSWR from "swr";
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, Legend
} from 'recharts';
import { 
    ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart 
} from "lucide-react";
import styles from "./styles/EstadisticasAnuales.module.css";
import { APP_CONFIG } from "../config/appConfig";
import { useTheme } from "../context/ThemeContext";

const fetcher = (url) => client.get(url).then(res => res.data);

function EstadisticasAnuales() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const { data, error, isLoading } = useSWR("/dashboard/stats", fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000,
    });

    if (error) {
        toast.error("Error al cargar datos anuales");
    }

    if (isLoading || !data) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={`${styles.skeletonPulse}`} style={{width: 200, height: 20, marginBottom: 15}}></div>
                    <div className={`${styles.skeletonPulse} ${styles.skeletonTitle}`}></div>
                    <div className={`${styles.skeletonPulse} ${styles.skeletonSubtitle}`}></div>
                </div>
                <div className={styles.kpiGrid}>
                    {[1,2,3,4].map(i => <div key={i} className={`${styles.kpiCard} ${styles.skeletonPulse} ${styles.skeletonKpi}`}></div>)}
                </div>
                <div className={`${styles.chartCard} ${styles.skeletonPulse} ${styles.skeletonChart}`}></div>
            </div>
        );
    }

    // --- LÓGICA DE KPIS ANUALES ---
    const anios = data.comparativaAnual?.anios || [];
    const datosMensuales = data.comparativaAnual?.datos || [];

    // Determinar cuál es el año actual en la base de datos
    let currentYear = new Date().getFullYear();
    if (anios.length > 0 && !anios.includes(currentYear)) {
        currentYear = Math.max(...anios);
    }
    const lastYear = currentYear - 1;

    let totalCurrentYear = 0;
    let totalLastYear = 0;
    let mesesConIngresoActual = 0;

    datosMensuales.forEach(mes => {
        if (mes[currentYear]) {
            totalCurrentYear += mes[currentYear];
            if (mes[currentYear] > 0) mesesConIngresoActual++;
        }
        if (mes[lastYear]) {
            totalLastYear += mes[lastYear];
        }
    });

    const crecimientoReal = totalCurrentYear - totalLastYear;
    const esCrecimientoPositivo = crecimientoReal >= 0;
    const porcentajeCrecimiento = totalLastYear > 0 
        ? ((crecimientoReal / totalLastYear) * 100).toFixed(1) 
        : 100;
        
    const promedioMensual = mesesConIngresoActual > 0 
        ? (totalCurrentYear / mesesConIngresoActual) 
        : 0;

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
                    <Link to="/estadisticas" className={styles.backLink}>
                        <ArrowLeft size={16} /> Volver a Estadísticas Mensuales
                    </Link>
                    <h1 className={styles.title}>Estadísticas Anuales</h1>
                    <p className={styles.subtitle}>Comparativa del rendimiento histórico de ingresos del negocio</p>
                </div>
            </div>

            {/* --- KPIS ANUALES --- */}
            <div className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                    <div className={styles.kpiIconWrapper}><DollarSign size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Total Año {currentYear}</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{totalCurrentYear.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                    <div className={styles.kpiIconWrapper}><Calendar size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Total Año {lastYear}</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{totalLastYear.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${esCrecimientoPositivo ? styles.kpiGreen : styles.kpiRed}`}>
                    <div className={styles.kpiIconWrapper}>
                        {esCrecimientoPositivo ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Crecimiento Anual (YoY)</span>
                        <span className={styles.kpiValue}>
                            {esCrecimientoPositivo ? '+' : ''}{APP_CONFIG.currencySymbol}{crecimientoReal.toFixed(2)}
                            <small style={{color: esCrecimientoPositivo ? '#10b981' : '#ef4444'}}>
                                ({esCrecimientoPositivo ? '+' : ''}{porcentajeCrecimiento}%)
                            </small>
                        </span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${styles.kpiOrange}`}>
                    <div className={styles.kpiIconWrapper}><BarChart size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiLabel}>Promedio Mensual ({currentYear})</span>
                        <span className={styles.kpiValue}>{APP_CONFIG.currencySymbol}{promedioMensual.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* --- GRÁFICA COMPARATIVA --- */}
            <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3>Comparativa Anual de Ingresos</h3>
                        <span className={styles.cardSubtitle}>Evolución mes a mes contrastada por años registrados</span>
                    </div>
                </div>
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={datosMensuales}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e5e7eb'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} tickFormatter={(val) => `$${val}`} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${APP_CONFIG.currencySymbol}${value.toFixed(2)}`, `Año ${name}`]} />
                            <Legend verticalAlign="top" height={36} />
                            {anios.map((anio, index) => {
                                const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                                return (
                                    <Line 
                                        key={anio} 
                                        type="monotone" 
                                        dataKey={anio} 
                                        name={anio.toString()} 
                                        stroke={colors[index % colors.length]} 
                                        strokeWidth={3}
                                        activeDot={{ r: 6 }}
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default EstadisticasAnuales;