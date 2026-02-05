import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, AlertCircle, Package, 
    PieChart as PieIcon, Wallet, Download, Calendar
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

    if (loading) return <div className={styles.loading}>Cargando análisis...</div>;
    if (!data) return <div className={styles.loading}>Sin datos</div>;

    // Datos Gráficas
    const COLORS_CLIENTES = ['#22c55e', '#f59e0b', '#ef4444'];
    const clientesData = [
        { name: 'Activos', value: data.clientes?.resumen?.activos || 0 },
        { name: 'Suspendidos', value: data.clientes?.resumen?.suspendidos || 0 },
        { name: 'Cortados', value: data.clientes?.resumen?.cortados || 0 },
    ].filter(i => i.value > 0);

    const tooltipStyle = {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e5e7eb',
        color: isDark ? '#f1f5f9' : '#0f172a',
        borderRadius: '8px'
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Análisis Financiero</h1>
                    <p className={styles.subtitle}>Proyecciones y rendimiento mensual</p>
                </div>
                <button className={styles.exportButton} onClick={exportarPendientes}>
                    <Download size={18} /> Exportar Deudores
                </button>
            </div>

            {/* --- SECCIÓN 1: ANÁLISIS DE TIEMPO (Quincenas y Proyección) --- */}
            <div className={styles.gridSplit}>
                {/* Comparativa Quincenal */}
                <div className={styles.splitCard}>
                    <h3><Calendar size={18}/> Rendimiento Quincenal</h3>
                    <div className={styles.quincenaRow}>
                        <div className={styles.qItem}>
                            <span>1ª Quincena (1-15)</span>
                            <strong>${data.financiero?.recaudado_q1 || 0}</strong>
                        </div>
                        <div className={styles.qDivider}></div>
                        <div className={styles.qItem}>
                            <span>2ª Quincena (16-30)</span>
                            <strong>${data.financiero?.recaudado_q2 || 0}</strong>
                        </div>
                    </div>
                </div>

                {/* Proyección */}
                <div className={styles.splitCard}>
                    <h3><TrendingUp size={18}/> Proyección Mes Próximo</h3>
                    <div className={styles.projValue}>
                        ${data.financiero?.proyeccion_proximo_mes || 0}
                    </div>
                    <div className={styles.projDetails}>
                        <span style={{color:'var(--text-muted)'}}>
                            Planes Activos + {data.financiero?.aplazados_count} Promesas de Pago
                        </span>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: ALERTA DE MOROSIDAD --- */}
            <div className={styles.alertBanner}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <AlertCircle size={24} />
                    <div>
                        <strong>Cartera Vencida Activa: ${data.pendientes_pago?.total_deuda || 0}</strong>
                        <div style={{fontSize:'0.9rem'}}>
                            Correspondiente a {data.pendientes_pago?.lista?.length || 0} clientes (Excluyendo acuerdos de pago aplazado).
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: GRÁFICAS --- */}
            <div className={styles.chartsGrid}>
                {/* Tendencia */}
                <div className={styles.chartCard} style={{gridColumn: 'span 2'}}>
                    <div className={styles.cardHeader}>
                        <Wallet size={20} className={styles.icon} />
                        <h3>Tendencia de Ingresos</h3>
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
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIngresos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <PieIcon size={20} className={styles.icon} />
                        <h3>Estado Cartera</h3>
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientesData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke={isDark ? '#1e293b' : '#fff'}
                                >
                                    {clientesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_CLIENTES[index % COLORS_CLIENTES.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Estadisticas;