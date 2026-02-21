import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, Legend
} from 'recharts';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./styles/EstadisticasAnuales.module.css";
import { APP_CONFIG } from "../config/appConfig";
import { useTheme } from "../context/ThemeContext";

function EstadisticasAnuales() {
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
                toast.error("Error al cargar datos anuales");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className={styles.loading}>Cargando comparativa anual...</div>;
    if (!data) return <div className={styles.loading}>Sin datos para mostrar</div>;

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

            <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3>Comparativa Anual de Ingresos</h3>
                        <span className={styles.cardSubtitle}>Evolución mes a mes contrastada por años</span>
                    </div>
                </div>
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.comparativaAnual?.datos || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e5e7eb'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} tickFormatter={(val) => `$${val}`} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${APP_CONFIG.currencySymbol}${value.toFixed(2)}`, `Año ${name}`]} />
                            <Legend verticalAlign="top" height={36} />
                            {data.comparativaAnual?.anios?.map((anio, index) => {
                                const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];
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