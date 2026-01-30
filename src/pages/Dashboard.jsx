import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/Dashboard.module.css"; // Recuerda la ruta correcta

// Iconos
import { DollarSign, Users, TrendingDown, Package, Wifi, Radio, Server } from "lucide-react";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await client.get("/dashboard");
                setStats(res.data);
            } catch (error) {
                console.error(error);
                toast.error("No se pudo cargar la información");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className={styles.loading}>Cargando...</div>;
    if (!stats) return <div className={styles.loading}>No hay datos</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Resumen General</h1>

            <div className={styles.grid}>
                {/* --- FINANZAS --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Recaudado (Mes)</h3>
                        <div style={{color: '#10b981', background: '#d1fae5', padding: '8px', borderRadius: '50%'}}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className={`${styles.cardValue} ${styles.money}`}>
                        ${stats.financiero.recaudado_actual}
                    </p>
                    <div className={styles.details}>
                         <span>Meta: ${stats.financiero.proyeccion_mensual}</span>
                    </div>
                </div>

                {/* --- CLIENTES --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Total Clientes</h3>
                        <div style={{color: '#3b82f6', background: '#dbeafe', padding: '8px', borderRadius: '50%'}}>
                            <Users size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>{stats.clientes.total}</p>
                    <div className={styles.details}>
                         <span style={{color: '#16a34a'}}>Activos: {stats.clientes.resumen.activos}</span>
                         <span style={{color: '#dc2626'}}>Cortados: {stats.clientes.resumen.cortados}</span>
                    </div>
                </div>

                {/* --- DEUDA --- */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Deuda Total</h3>
                        <div style={{color: '#ef4444', background: '#fee2e2', padding: '8px', borderRadius: '50%'}}>
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <p className={`${styles.cardValue} ${styles.danger}`}>
                        ${stats.financiero.deuda_total_clientes}
                    </p>
                    <div className={styles.details}>
                         <span>Pendiente de cobro</span>
                    </div>
                </div>
                
                 {/* --- INVENTARIO --- */}
                 <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Almacén</h3>
                        <div style={{color: '#f59e0b', background: '#fef3c7', padding: '8px', borderRadius: '50%'}}>
                            <Package size={24} />
                        </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Radio size={16} /> Antenas: <b>{stats.inventario_disponible.antenas}</b>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Wifi size={16} /> Routers: <b>{stats.inventario_disponible.routers}</b>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Server size={16} /> ONUs: <b>{stats.inventario_disponible.onus}</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;