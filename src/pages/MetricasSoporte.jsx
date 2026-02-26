import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { ArrowLeft, Award, PieChart, Star, Clock, Activity } from "lucide-react";
import styles from "./styles/MetricasSoporte.module.css";

function MetricasSoporte() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rendimiento, setRendimiento] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [totalTicketsCat, setTotalTicketsCat] = useState(0);
    const [kpisExtra, setKpisExtra] = useState({ tiempo_promedio_resolucion: "0", carga_ultimos_7_dias: 0 });

    useEffect(() => {
        const cargarMetricas = async () => {
            try {
                const res = await client.get("/tickets/metricas");
                setRendimiento(res.data.rendimiento || []);
                
                const cats = res.data.categorias || [];
                setCategorias(cats);
                
                // Calcular el total de tickets para hacer los porcentajes de las barras
                const total = cats.reduce((acc, cat) => acc + parseInt(cat.total), 0);
                setTotalTicketsCat(total);

                if (res.data.kpis_extra) {
                    setKpisExtra(res.data.kpis_extra);
                }
            } catch (error) {
                toast.error("Error al cargar las metricas");
            } finally {
                setLoading(false);
            }
        };

        cargarMetricas();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando metricas...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <button onClick={() => navigate(-1)} className={styles.btnBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={styles.title}>Rendimiento de Soporte</h1>
                        <p className={styles.subtitle}>Metricas de atencion y problemas frecuentes</p>
                    </div>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN DE KPIs EXTRA --- */}
            <div className={styles.kpiGridTop}>
                <div className={styles.kpiCardMini}>
                    <div className={`${styles.kpiIconMini} ${styles.blue}`}>
                        <Clock size={22} />
                    </div>
                    <div className={styles.kpiDataMini}>
                        <span className={styles.kpiValueMini}>{kpisExtra.tiempo_promedio_resolucion}</span>
                        <span className={styles.kpiLabelMini}>Tiempo Promedio de Resolucion</span>
                    </div>
                </div>
                <div className={styles.kpiCardMini}>
                    <div className={`${styles.kpiIconMini} ${styles.purple}`}>
                        <Activity size={22} />
                    </div>
                    <div className={styles.kpiDataMini}>
                        <span className={styles.kpiValueMini}>{kpisExtra.carga_ultimos_7_dias} Tickets</span>
                        <span className={styles.kpiLabelMini}>Reportados en ultimos 7 dias</span>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {/* TARJETA 1: LEADERBOARD DE TÉCNICOS */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <Award size={24} color="#3b82f6" /> Desempeño del Equipo
                    </h2>
                    
                    {rendimiento.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No hay tickets cerrados aun para medir el rendimiento.</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Tecnico</th>
                                    <th>Resueltos</th>
                                    <th>Calificacion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rendimiento.map((item, index) => (
                                    <tr key={index}>
                                        <td className={styles.tecnicoName}>{item.tecnico}</td>
                                        <td className={styles.ticketsCount}>{item.tickets_resueltos}</td>
                                        <td>
                                            {item.promedio_calificacion === "Sin calificar" ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
                                            ) : (
                                                <div className={styles.ratingBadge}>
                                                    <Star size={14} fill="currentColor" />
                                                    {item.promedio_calificacion}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* TARJETA 2: DISTRIBUCIÓN POR CATEGORÍAS */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <PieChart size={24} color="#10b981" /> Tickets por Categoria
                    </h2>
                    
                    {categorias.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No hay datos de categorias registrados.</p>
                    ) : (
                        <div className={styles.categoryList}>
                            {categorias.map((cat, index) => {
                                const porcentaje = totalTicketsCat > 0 
                                    ? Math.round((parseInt(cat.total) / totalTicketsCat) * 100) 
                                    : 0;
                                
                                return (
                                    <div key={index} className={styles.categoryItem}>
                                        <div className={styles.categoryInfo}>
                                            <span>{cat.categoria}</span>
                                            <span className={styles.categoryCount}>
                                                {cat.total} ({porcentaje}%)
                                            </span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div 
                                                className={styles.progressFill} 
                                                style={{ width: `${porcentaje}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MetricasSoporte;