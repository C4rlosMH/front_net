import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Users, Wifi, AlertTriangle, DollarSign, Activity } from "lucide-react";
import styles from "./styles/Dashboard.module.css";

function Dashboard() {
    // 1. Inicializamos con la NUEVA estructura anidada para evitar errores
    const [stats, setStats] = useState({
        financiero: { recaudado_actual: 0 },
        clientes: {
            total: 0,
            resumen: { activos: 0, suspendidos: 0, cortados: 0 }
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await client.get("/dashboard/stats");
                console.log("Datos Dashboard:", res.data); // Para verificar en consola
                
                // Verificamos si vienen datos antes de setear
                if (res.data) {
                    setStats(res.data);
                }
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

    if (loading) return <div className={styles.loading}>Cargando resumen...</div>;

    // Accesos seguros a los datos anidados
    const totalClientes = stats.clientes?.total || 0;
    const activos = stats.clientes?.resumen?.activos || 0;
    const suspendidos = stats.clientes?.resumen?.suspendidos || 0;
    const cortados = stats.clientes?.resumen?.cortados || 0;
    
    // Sumamos suspendidos y cortados para mostrar alertas, o solo cortados según prefieras
    const clientesConProblemas = suspendidos + cortados;
    const recaudadoMes = stats.financiero?.recaudado_actual || 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Resumen Operativo</h1>
                <p className={styles.subtitle}>Estado actual de la red y facturación</p>
            </div>

            <div className={styles.grid}>
                
                {/* 1. Clientes Totales */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Cartera Total</h3>
                        <div style={{color: '#3b82f6', background: '#dbeafe', padding: '8px', borderRadius: '50%'}}>
                            <Users size={24} />
                        </div>
                    </div>
                    {/* [CORREGIDO] Acceso a la nueva estructura */}
                    <p className={styles.cardValue}>{totalClientes}</p>
                    <div className={styles.details}>
                        <span>Clientes registrados</span>
                    </div>
                </div>

                {/* 2. Clientes Activos */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>En Línea</h3>
                        <div style={{color: '#16a34a', background: '#dcfce7', padding: '8px', borderRadius: '50%'}}>
                            <Wifi size={24} />
                        </div>
                    </div>
                    {/* [CORREGIDO] Acceso a la nueva estructura */}
                    <p className={styles.cardValue}>{activos}</p>
                    <div className={styles.details}>
                        <span style={{color: '#16a34a'}}>Servicio activo</span>
                    </div>
                </div>

                {/* 3. Clientes con Problemas (Suspendidos/Cortados) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Suspendidos/Corte</h3>
                        <div style={{color: '#ea580c', background: '#ffedd5', padding: '8px', borderRadius: '50%'}}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className={`${styles.cardValue}`} style={{color: '#ea580c'}}>
                        {clientesConProblemas}
                    </p>
                    <div className={styles.details}>
                        <span>Requieren atención</span>
                    </div>
                </div>

                {/* 4. Ingresos del Mes (Actualizado desde Histórico a Mes Actual) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Recaudado (Mes)</h3>
                        <div style={{color: '#9333ea', background: '#f3e8ff', padding: '8px', borderRadius: '50%'}}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    {/* [CORREGIDO] Acceso a la nueva estructura */}
                    <p className={styles.cardValue}>
                        {formatoDinero(recaudadoMes)}
                    </p>
                    <div className={styles.details}>
                        <span>Cobrado este mes</span>
                    </div>
                </div>
            </div>

            <div style={{marginTop: 40, textAlign:'center', color:'var(--text-muted)', fontStyle:'italic'}}>
                <Activity size={48} style={{opacity:0.2, marginBottom:10}} />
                <p>Sistema sincronizado.</p>
            </div>
        </div>
    );
}

export default Dashboard;