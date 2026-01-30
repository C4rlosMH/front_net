import { useEffect, useState } from "react";
import client from "../api/axios"; // Tu cliente configurado con el token
import { toast } from "sonner";
import styles from "./DashboardPage.module.css";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Petición GET al backend (El token se envía solo gracias a axios.js)
                const res = await client.get("/dashboard");
                setStats(res.data);
            } catch (error) {
                console.error(error);
                toast.error("No se pudo cargar la información del dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <div className={styles.loading}>Cargando estadísticas... 📡</div>;
    if (!stats) return <div className={styles.loading}>No hay datos disponibles</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Resumen General</h1>

            <div className={styles.grid}>
                {/* --- TARJETA DE FINANZAS --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Recaudado (Mes)</h3>
                        <span style={{fontSize: '1.5rem'}}>💰</span>
                    </div>
                    <p className={`${styles.cardValue} ${styles.money}`}>
                        ${stats.financiero.recaudado_actual}
                    </p>
                    <div className={styles.details}>
                         <span>Meta: ${stats.financiero.proyeccion_mensual}</span>
                         <span>({stats.financiero.porcentaje_recuperacion})</span>
                    </div>
                </div>

                {/* --- TARJETA DE CLIENTES --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Total Clientes</h3>
                        <span style={{fontSize: '1.5rem'}}>👥</span>
                    </div>
                    <p className={styles.cardValue}>{stats.clientes.total}</p>
                    <div className={styles.details}>
                         <span style={{color: '#16a34a'}}>Activos: {stats.clientes.resumen.activos}</span>
                         <span style={{color: '#dc2626'}}>Cortados: {stats.clientes.resumen.cortados}</span>
                    </div>
                </div>

                {/* --- TARJETA DE CARTERA VENCIDA --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Deuda Total</h3>
                        <span style={{fontSize: '1.5rem'}}>📉</span>
                    </div>
                    <p className={`${styles.cardValue} ${styles.danger}`}>
                        ${stats.financiero.deuda_total_clientes}
                    </p>
                    <div className={styles.details}>
                         <span>Dinero pendiente de cobro</span>
                    </div>
                </div>
                
                 {/* --- TARJETA DE INVENTARIO --- */}
                 <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Inventario (Almacén)</h3>
                        <span style={{fontSize: '1.5rem'}}>📦</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px'}}>
                        <div>📡 Antenas: <b>{stats.inventario_disponible.antenas}</b></div>
                        <div>Rn Routers: <b>{stats.inventario_disponible.routers}</b></div>
                        <div>F. Optica (ONUs): <b>{stats.inventario_disponible.onus}</b></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;