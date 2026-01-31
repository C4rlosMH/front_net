import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Importante para el enlace a Cortes
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Users, 
    Wifi, 
    AlertTriangle, 
    DollarSign, 
    Activity, 
    Scissors // Icono para Cortes
} from "lucide-react";
import styles from "./styles/Dashboard.module.css";

function Dashboard() {
    // Inicializamos estado
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await client.get("/dashboard/stats");
                console.log("Datos Dashboard:", res.data); // Para depuración
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

    if (loading) return <div className={styles.loading}>Cargando resumen...</div>;

    // --- LÓGICA DE DATOS SEGURA ---
    // Detectamos si el backend envía la estructura "Nueva" (anidada) o "Vieja" (plana)
    // para que el dashboard funcione en ambos casos.
    
    // 1. Clientes
    const totalClientes = stats?.clientes?.total || stats?.totalClientes || 0;
    const activos = stats?.clientes?.resumen?.activos || stats?.clientesActivos || 0;
    
    // 2. Cortes y Suspendidos
    const cortados = stats?.clientes?.resumen?.cortados || stats?.clientesCortados || 0;
    const suspendidos = stats?.clientes?.resumen?.suspendidos || 0;
    // Si tienes estructura plana, 'clientesCortados' suele incluir a todos los morosos
    const pendientesCorte = suspendidos + cortados; 

    // 3. Finanzas
    // En la estructura nueva es 'financiero.recaudado_actual', en la vieja 'totalIngresos'
    const ingresos = stats?.financiero?.recaudado_actual || stats?.totalIngresos || 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Resumen Operativo</h1>
                <p className={styles.subtitle}>Estado actual de la red y facturación</p>
            </div>

            <div className={styles.grid}>
                
                {/* --- NUEVA TARJETA: ACCESO A CORTES --- */}
                {/* La ponemos primero o en posición destacada porque es operativa diaria */}
                <div className={styles.card} style={{borderColor: '#fca5a5', backgroundColor: '#fef2f2'}}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle} style={{color: '#b91c1c'}}>Reporte Cortes</h3>
                        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '8px', borderRadius: '50%'}}>
                            <Scissors size={24} />
                        </div>
                    </div>
                    
                    <p className={styles.cardValue} style={{color: '#b91c1c'}}>
                        {pendientesCorte} <span style={{fontSize:'1rem', fontWeight:'normal'}}>Pendientes</span>
                    </p>
                    
                    <div className={styles.details} style={{borderTop:'1px solid #fecaca'}}>
                        <Link to="/cortes" style={{textDecoration:'none', width:'100%'}}>
                            <button style={{
                                width: '100%',
                                padding: '8px',
                                marginTop: '5px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <Scissors size={16} /> Ver Lista de Corte
                            </button>
                        </Link>
                    </div>
                </div>

                {/* 1. Clientes Totales */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Cartera Total</h3>
                        <div style={{color: '#3b82f6', background: '#dbeafe', padding: '8px', borderRadius: '50%'}}>
                            <Users size={24} />
                        </div>
                    </div>
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
                    <p className={styles.cardValue}>{activos}</p>
                    <div className={styles.details}>
                        <span style={{color: '#16a34a'}}>Servicio activo</span>
                    </div>
                </div>

                {/* 3. Recaudado (Mes / Total) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Recaudado</h3>
                        <div style={{color: '#9333ea', background: '#f3e8ff', padding: '8px', borderRadius: '50%'}}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className={styles.cardValue}>
                        {formatoDinero(ingresos)}
                    </p>
                    <div className={styles.details}>
                        <span>Ingresos registrados</span>
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