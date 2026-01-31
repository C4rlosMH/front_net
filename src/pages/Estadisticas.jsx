import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from "lucide-react";
import styles from "./styles/Estadisticas.module.css";

function Estadisticas() {
    // Inicializamos con arrays vacíos por seguridad
    const [data, setData] = useState({
        graficaIngresos: [],
        graficaPlanes: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await client.get("/dashboard/stats");
                // Fusionamos la respuesta con el estado por defecto para evitar undefined
                setData(prev => ({ ...prev, ...res.data }));
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos estadísticos");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div style={{padding:20}}>Cargando estadísticas...</div>;

    // Validación de seguridad antes de renderizar
    const safeIngresos = data.graficaIngresos || [];
    const safePlanes = data.graficaPlanes || [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Análisis y Estadísticas</h1>
                <p className={styles.subtitle}>Comportamiento financiero y distribución de servicios</p>
            </div>

            <div className={styles.chartsGrid}>
                
                {/* GRÁFICA 1: INGRESOS */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <BarChart3 size={20} className={styles.icon} />
                        <h3>Evolución de Ingresos</h3>
                    </div>
                    <div style={{ width: '100%', height: 350, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safeIngresos}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#6b7280', fontSize: 12}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(val) => `$${val}`} 
                                    tick={{fill: '#6b7280', fontSize: 12}} 
                                />
                                <Tooltip 
                                    formatter={(value) => [`$${value}`, 'Ingresos']}
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRÁFICA 2: PLANES */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <PieIcon size={20} className={styles.icon} />
                        <h3>Distribución por Plan</h3>
                    </div>
                    <div style={{ width: '100%', height: 350, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={safePlanes}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {/* AQUÍ ESTABA EL ERROR: Usamos safePlanes y .map seguro */}
                                    {safePlanes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Estadisticas;