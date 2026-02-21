import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { Download, CalendarCheck, AlertCircle, ArrowLeft, TrendingUp, Wallet, Award } from "lucide-react";
import styles from "./styles/Cierres.module.css"; 
import { APP_CONFIG } from "../config/appConfig";

function Cierres() {
    const [cierres, setCierres] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCierres = async () => {
            try {
                const res = await client.get("/cierres");
                setCierres(res.data);
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

    // --- FUNCIONES AUXILIARES ---
    const formatMoney = (amount) => `${APP_CONFIG.currencySymbol}${parseFloat(amount || 0).toFixed(2)}`;
    const calculateTotal = (c) => parseFloat(c.cobrado_a_tiempo) + parseFloat(c.cobrado_recuperado);
    const calculatePercent = (c) => {
        const total = calculateTotal(c);
        const meta = parseFloat(c.meta_estimada) || 1;
        return Math.min(100, (total / meta) * 100);
    };
    const getColor = (pct) => pct >= 95 ? '#16a34a' : (pct >= 80 ? '#d97706' : '#ef4444');

    // --- CÁLCULOS PARA KPIs GLOBALES ---
    const totalHistorico = cierres.reduce((acc, c) => acc + calculateTotal(c), 0);
    const metaHistorica = cierres.reduce((acc, c) => acc + (parseFloat(c.meta_estimada) || 0), 0);
    const efectividadGlobal = metaHistorica > 0 ? (totalHistorico / metaHistorica) * 100 : 0;
    
    const quincenasDeficit = cierres.filter(c => parseFloat(c.faltante) > 1).length;
    
    let mejorPeriodo = null;
    let maxRecaudacion = 0;
    cierres.forEach(c => {
        const total = calculateTotal(c);
        if (total > maxRecaudacion) {
            maxRecaudacion = total;
            mejorPeriodo = c;
        }
    });

    return (
        <div className={styles.container}>
            {/* CABECERA */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Link to="/estadisticas" title="Regresar a Estadísticas">
                        <div className={styles.backButton}>
                            <ArrowLeft size={20} />
                        </div>
                    </Link>
                    
                    <div className={styles.titleWrapper}>
                        <h1 className={styles.title}>
                            <CalendarCheck size={26} /> 
                            Historial de Cierres
                        </h1>
                        <p className={styles.subtitle}>Registro consolidado del progreso quincenal y cumplimiento de metas</p>
                    </div>
                </div>
                
                <div className={styles.actions}>
                    <button className={styles.btnExport} onClick={exportarCSV}>
                        <Download size={18} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPIs GLOBALES HISTÓRICOS */}
            {!loading && cierres.length > 0 && (
                <div className={styles.kpiGrid}>
                    
                    {/* KPI 1: Efectividad */}
                    <div className={styles.kpiCard}>
                        <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
                            <TrendingUp size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Efectividad Histórica</span>
                            <strong>{efectividadGlobal.toFixed(1)}% <small className={styles.kpiLabelSmall}>Promedio</small></strong>
                        </div>
                    </div>

                    {/* KPI 2: Total Recaudado */}
                    <div className={styles.kpiCard}>
                        <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
                            <Wallet size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Total Histórico Recaudado</span>
                            <strong>{formatMoney(totalHistorico)}</strong>
                        </div>
                    </div>

                    {/* KPI 3: Cierres con Déficit */}
                    <div className={styles.kpiCard}>
                        <div className={`${styles.kpiIcon} ${quincenasDeficit > 0 ? styles.iconRed : styles.iconGreen}`}>
                            <AlertCircle size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Cierres con Déficit</span>
                            <strong>{quincenasDeficit} <small className={styles.kpiLabelSmall}>Quincenas</small></strong>
                        </div>
                    </div>

                    {/* KPI 4: Récord de Recaudación */}
                    <div className={styles.kpiCard}>
                        <div className={`${styles.kpiIcon} ${styles.iconOrange}`}>
                            <Award size={24} />
                        </div>
                        <div className={styles.kpiInfo}>
                            <span>Récord de Recaudación</span>
                            <strong className={styles.recordValue}>{mejorPeriodo ? mejorPeriodo.periodo : 'N/A'}</strong>
                            <span className={styles.recordAmount}>{mejorPeriodo ? formatMoney(maxRecaudacion) : `${APP_CONFIG.currencySymbol}0.00`}</span>
                        </div>
                    </div>

                </div>
            )}

            {/* TABLA DE REGISTROS */}
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
                                                <div className={styles.textMutedSmall}>A Tiempo: <span className={styles.textGreenBold}>{formatMoney(c.cobrado_a_tiempo)}</span></div>
                                                <div className={styles.textMutedSmall}>Recuperado: <span className={styles.textOrangeBold}>{formatMoney(c.cobrado_recuperado)}</span></div>
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