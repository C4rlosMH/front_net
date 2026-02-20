import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { Download, CalendarCheck, AlertCircle, ArrowLeft, TrendingUp, Wallet } from "lucide-react";
import styles from "./styles/Cierres.module.css"; 

function Cierres() {
    const [cierres, setCierres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ultimoCierre, setUltimoCierre] = useState(null);

    useEffect(() => {
        const fetchCierres = async () => {
            try {
                const res = await client.get("/cierres");
                setCierres(res.data);
                if (res.data.length > 0) {
                    setUltimoCierre(res.data[0]); 
                }
            } catch (error) {
                toast.error("Error al cargar el historial de cierres");
            } finally {
                setLoading(false);
            }
        };
        fetchCierres();
    }, []);

    const exportarCSV = () => {
        if (cierres.length === 0) return toast.info("No hay registros para exportar");
        
        let csv = "ID,Periodo,Meta Estimada,Cobrado a Tiempo,Cobrado Recuperado,Total Recaudado,Faltante,Fecha de Cierre\n";
        
        cierres.forEach(c => {
            const totalRecaudado = parseFloat(c.cobrado_a_tiempo) + parseFloat(c.cobrado_recuperado);
            const fechaStr = new Date(c.createdAt).toLocaleDateString();
            csv += `"${c.id}","${c.periodo}","${c.meta_estimada}","${c.cobrado_a_tiempo}","${c.cobrado_recuperado}","${totalRecaudado}","${c.faltante}","${fechaStr}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_Cierres_Quincenales.csv`;
        link.click();
        toast.success("Reporte descargado correctamente");
    };

    // Funciones auxiliares
    const formatMoney = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;
    const calculateTotal = (c) => parseFloat(c.cobrado_a_tiempo) + parseFloat(c.cobrado_recuperado);
    const calculatePercent = (c) => {
        const total = calculateTotal(c);
        const meta = parseFloat(c.meta_estimada) || 1;
        return Math.min(100, (total / meta) * 100);
    };
    const getColor = (pct) => pct >= 95 ? '#10b981' : (pct >= 80 ? '#f59e0b' : '#ef4444');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Link to="/estadisticas" className={styles.backLink} title="Regresar a Estadísticas">
                        <div className={styles.backButton}>
                            <ArrowLeft size={20} />
                        </div>
                    </Link>
                    
                    <div>
                        <h1 className={styles.title}>
                            <CalendarCheck size={24} className={styles.titleIcon} /> 
                            Historial de Cierres
                        </h1>
                        <span className={styles.subtitle}>Registro consolidado del progreso quincenal y cumplimiento de metas</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnExport} onClick={exportarCSV}>
                        <Download size={18} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPIs ESTÁNDAR (Estilo Cortes.jsx) */}
            {!loading && ultimoCierre && (
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)'}}>
                            <TrendingUp size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Último Periodo ({ultimoCierre.periodo})</span>
                            <strong>{formatMoney(ultimoCierre.meta_estimada)} <small style={{fontSize:'0.8rem', fontWeight:'normal', color:'var(--text-muted)'}}>Meta</small></strong>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{color: '#10b981', background: 'rgba(16, 185, 129, 0.1)'}}>
                            <Wallet size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Recaudación Total</span>
                            <strong>{formatMoney(calculateTotal(ultimoCierre))}</strong>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{color: parseFloat(ultimoCierre.faltante) > 0 ? '#ef4444' : '#10b981', background: parseFloat(ultimoCierre.faltante) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}}>
                            <AlertCircle size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Déficit / Faltante</span>
                            <strong>{formatMoney(ultimoCierre.faltante)}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA ESTÁNDAR */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Periodo</th>
                            <th>Meta Estimada</th>
                            <th>Desglose de Cobro</th>
                            <th>Total Recaudado</th>
                            <th>Estado</th>
                            <th>Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className={styles.emptyState}>Cargando historial...</td></tr>
                        ) : cierres.length === 0 ? (
                            <tr><td colSpan="6" className={styles.emptyState}>No hay cierres registrados. El sistema generará el primero automáticamente al finalizar la quincena.</td></tr>
                        ) : (
                            cierres.map(c => {
                                const total = calculateTotal(c);
                                const porcentaje = calculatePercent(c);
                                const faltante = parseFloat(c.faltante);
                                const colorProgreso = getColor(porcentaje);
                                const fechaRegistro = new Date(c.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <div className={styles.textMainBold}>{c.periodo}</div>
                                            <div className={styles.textMutedSmall}>Registro: {fechaRegistro}</div>
                                        </td>
                                        <td>
                                            <div className={styles.textMainBold}>{formatMoney(c.meta_estimada)}</div>
                                        </td>
                                        <td>
                                            <div className={styles.amountGroup}>
                                                <div className={styles.textMutedSmall}>A Tiempo: <span style={{color: '#10b981', fontWeight: 600}}>{formatMoney(c.cobrado_a_tiempo)}</span></div>
                                                <div className={styles.textMutedSmall}>Recuperado: <span style={{color: '#f59e0b', fontWeight: 600}}>{formatMoney(c.cobrado_recuperado)}</span></div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.textMainBold}>{formatMoney(total)}</div>
                                        </td>
                                        <td>
                                            {faltante > 1 ? (
                                                <span className={`${styles.statusBadge} ${styles.badgeDanger}`}>
                                                    DÉFICIT: {formatMoney(faltante)}
                                                </span>
                                            ) : (
                                                <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>
                                                    CUMPLIDA
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressTrack}>
                                                    <div 
                                                        className={styles.progressFill} 
                                                        style={{ width: `${porcentaje}%`, backgroundColor: colorProgreso }}
                                                    ></div>
                                                </div>
                                                <span className={styles.progressText} style={{color: colorProgreso}}>{porcentaje.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Cierres;