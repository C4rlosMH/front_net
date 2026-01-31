import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Users, Wifi, AlertTriangle, DollarSign, Activity } from "lucide-react";
import styles from "./styles/Dashboard.module.css";

function Dashboard() {
    // Inicializamos con la estructura PLANA que devuelve el backend actual
    const [stats, setStats] = useState({
        totalClientes: 0,
        clientesActivos: 0,
        clientesCortados: 0,
        totalIngresos: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Asegúrate de que esta ruta coincida con tu backend (usamos /dashboard/stats)
                const res = await client.get("/dashboard/stats");
                setStats(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar el resumen");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Formateador de moneda
    const formatoDinero = (num) => `$${parseFloat(num || 0).toFixed(2)}`;

    if (loading) return <div style={{padding: 20}}>Cargando resumen...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Resumen Operativo</h1>
                <p className={styles.subtitle}>Estado actual de la red y facturación</p>
            </div>

            {/* GRID DE KPIs */}
            <div className={styles.grid}> {/* Usamos .grid si es lo que tienes en tu CSS, o .kpiGrid */}
                
                {/* 1. Clientes Totales */}
                <div className={styles.card}> {/* Usamos .card para aprovechar tus estilos existentes */}
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Cartera Total</h3>
                        <div style={{color: '#3b82f6', background: '#dbeafe', padding: '8px', borderRadius: '50%'}}>
                            <Users size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>{stats.totalClientes}</p>
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
                    <p className={styles.cardValue}>{stats.clientesActivos}</p>
                    <div className={styles.details}>
                        <span style={{color: '#16a34a'}}>Servicio activo</span>
                    </div>
                </div>

                {/* 3. Clientes Suspendidos */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Suspendidos</h3>
                        <div style={{color: '#ea580c', background: '#ffedd5', padding: '8px', borderRadius: '50%'}}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className={`${styles.cardValue}`} style={{color: '#ea580c'}}>
                        {stats.clientesCortados}
                    </p>
                    <div className={styles.details}>
                        <span>Por falta de pago</span>
                    </div>
                </div>

                {/* 4. Ingresos Totales */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Ingresos Históricos</h3>
                        <div style={{color: '#9333ea', background: '#f3e8ff', padding: '8px', borderRadius: '50%'}}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>
                        {formatoDinero(stats.totalIngresos)}
                    </p>
                    <div className={styles.details}>
                        <span>Total recaudado</span>
                    </div>
                </div>
            </div>

            <div style={{marginTop: 40, textAlign:'center', color:'gray', fontStyle:'italic'}}>
                <Activity size={48} style={{opacity:0.1, marginBottom:10}} />
                <p>Sistema funcionando correctamente.</p>
            </div>
        </div>
    );
}

export default Dashboard;