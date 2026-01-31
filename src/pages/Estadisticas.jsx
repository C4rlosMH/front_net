import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    BarChart3, PieChart as PieIcon, DollarSign, TrendingUp, AlertCircle, Package 
} from "lucide-react";
import styles from "./styles/Estadisticas.module.css";
import { useTheme } from "../context/ThemeContext";

function Estadisticas() {
    const [data, setData] = useState(null); // Iniciamos en null para esperar la carga
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
                toast.error("Error al cargar datos estadísticos");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className={styles.loading}>Cargando panel de control...</div>;
    if (!data) return <div className={styles.loading}>No hay datos disponibles</div>;

    // --- PREPARACIÓN DE DATOS (Con seguridad anti-fallos) ---
    
    // 1. Gráfica Inventario
    const inventarioData = [
        { name: 'Routers', cantidad: data.inventario_disponible?.routers || 0 },
        { name: 'Antenas', cantidad: data.inventario_disponible?.antenas || 0 },
        { name: 'ONUs', cantidad: data.inventario_disponible?.onus || 0 },
    ];

    // 2. Gráfica Clientes
    const clientesData = [
        { name: 'Activos', value: data.clientes?.resumen?.activos || 0 },
        { name: 'Suspendidos', value: data.clientes?.resumen?.suspendidos || 0 },
        { name: 'Cortados', value: data.clientes?.resumen?.cortados || 0 },
    ].filter(i => i.value > 0);

    const COLORS_CLIENTES = ['#22c55e', '#f59e0b', '#ef4444'];

    // Estilos
    const tooltipStyle = {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e5e7eb',
        color: isDark ? '#f1f5f9' : '#0f172a',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    };
    const axisColor = isDark ? '#94a3b8' : '#6b7280';
    const gridColor = isDark ? '#334155' : '#e5e7eb';
    const cursorFill = isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard Operativo</h1>
                <p className={styles.subtitle}>Resumen financiero y estado de la red</p>
            </div>

            {/* --- SECCIÓN 1: KPIs --- */}
            <div className={styles.kpiGrid}>
                {/* Recaudado */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox} style={{background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a'}}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className={styles.kpiLabel}>Recaudado este Mes</span>
                        <h3 className={styles.kpiValue}>${data.financiero?.recaudado_actual || 0}</h3>
                        <small className={styles.kpiSub}>Meta: {data.financiero?.porcentaje_recuperacion || "0%"}</small>
                    </div>
                </div>

                {/* Proyección */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox} style={{background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb'}}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className={styles.kpiLabel}>Proyección Mensual</span>
                        <h3 className={styles.kpiValue}>${data.financiero?.proyeccion_mensual || 0}</h3>
                        <small className={styles.kpiSub}>Facturación estimada</small>
                    </div>
                </div>

                {/* Deuda */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox} style={{background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626'}}>
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <span className={styles.kpiLabel}>Cartera Vencida</span>
                        <h3 className={styles.kpiValue}>${data.financiero?.deuda_total_clientes || 0}</h3>
                        <small className={styles.kpiSub}>Saldo pendiente total</small>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GRÁFICAS --- */}
            <div className={styles.chartsGrid}>
                
                {/* Gráfica 1: Inventario */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <Package size={20} className={styles.icon} />
                        <h3>Stock en Almacén</h3>
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventarioData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: axisColor, fontSize: 12}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: axisColor, fontSize: 12}} 
                                />
                                <Tooltip 
                                    cursor={{ fill: cursorFill }}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ color: isDark ? '#fff' : '#000' }}
                                />
                                <Bar dataKey="cantidad" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfica 2: Clientes */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <PieIcon size={20} className={styles.icon} />
                        <h3>Estado de Cartera ({data.clientes?.total || 0})</h3>
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke={isDark ? '#1e293b' : '#fff'}
                                >
                                    {clientesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_CLIENTES[index % COLORS_CLIENTES.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#fff' : '#000' }} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    wrapperStyle={{ color: axisColor }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Estadisticas;