import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    ArrowLeft, User, DollarSign, Calendar, 
    CreditCard, TrendingUp, History, CheckCircle2, AlertCircle,
    MapPin, Phone, CalendarDays, Wifi, Cable
} from "lucide-react";
import styles from "./styles/HistorialPagos.module.css"; 

function HistorialPagos() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [datosHistorial, setDatosHistorial] = useState(null);
    const [datosCliente, setDatosCliente] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resHistorial, resClientes] = await Promise.all([
                    client.get(`/pagos/historial/${id}`),
                    client.get(`/clientes`) 
                ]);
                
                setDatosHistorial(resHistorial.data);
                const clienteInfo = resClientes.data.find(c => c.id === parseInt(id));
                setDatosCliente(clienteInfo);

            } catch (error) {
                toast.error("Error al cargar la información del cliente");
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [id]);

    if (loading) return <div style={{padding: 20, color: 'var(--text-main)'}}>Cargando perfil del cliente...</div>;
    if (!datosHistorial || !datosCliente) return <div style={{padding: 20, color: 'var(--text-main)'}}>No se encontró información del cliente.</div>;

    const historial = datosHistorial.historial || [];
    const deuda = parseFloat(datosHistorial.saldo_actual || 0);

    // Cálculos Generales
    const totalAbonado = historial
        .filter(mov => mov.tipo === 'ABONO')
        .reduce((sum, mov) => sum + parseFloat(mov.monto), 0);
        
    const totalCargado = historial
        .filter(mov => mov.tipo === 'CARGO')
        .reduce((sum, mov) => sum + parseFloat(mov.monto), 0);

    const ultimoAbono = historial.find(mov => mov.tipo === 'ABONO');
    const fechaUltimoPago = ultimoAbono 
        ? new Date(ultimoAbono.fecha).toLocaleDateString() 
        : "Sin pagos aún";

    const esFibra = !!datosCliente.caja;

    // --- LÓGICA DE SCORE UNIFICADA (Fuente de la verdad: Base de datos) ---
    let scoreColor = "#94a3b8"; // Gris neutro para "Sin historial"
    let scoreText = "Sin historial";
    let scoreDisplay = "--";

    const confiabilidadBD = datosCliente.confiabilidad;
    // Consideramos que tiene historial si el valor no es nulo y tiene al menos un movimiento
    const tieneHistorial = confiabilidadBD !== null && confiabilidadBD !== undefined && historial.length > 0;

    if (tieneHistorial) {
        scoreDisplay = `${confiabilidadBD}%`;
        
        if (confiabilidadBD >= 90) {
            scoreColor = "#10b981"; // Verde
            scoreText = "Excelente";
        } else if (confiabilidadBD >= 70) {
            scoreColor = "#f59e0b"; // Naranja
            scoreText = "Regular";
        } else {
            scoreColor = "#ef4444"; // Rojo
            scoreText = "Riesgo";
        }
    }

    // --- MAPA DE CALOR: AHORA A 10 MESES ---
    const ultimos10Meses = [];
    const hoy = new Date();
    // Bucle de 9 a 0 genera exactamente 10 meses
    for (let i = 9; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        ultimos10Meses.push({
            month: d.getMonth(),
            year: d.getFullYear(),
            name: d.toLocaleString('es-ES', { month: 'short' })
        });
    }

    const heatmapData = ultimos10Meses.map(mes => {
        const abonosMes = historial.filter(m => m.tipo === 'ABONO' && new Date(m.fecha).getMonth() === mes.month && new Date(m.fecha).getFullYear() === mes.year);
        const cargosMes = historial.filter(m => m.tipo === 'CARGO' && new Date(m.fecha).getMonth() === mes.month && new Date(m.fecha).getFullYear() === mes.year);

        if (abonosMes.length > 0) return { ...mes, status: 'pagado' };
        if (cargosMes.length > 0 && abonosMes.length === 0) return { ...mes, status: 'deuda' };
        return { ...mes, status: 'inactivo' }; 
    });

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <ArrowLeft size={18} /> Volver a Cartera de Clientes
                </button>
            </div>

            {/* TARJETA DE PERFIL COMPLETO */}
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.clientInfo}>
                        <div className={styles.avatar}>
                            <User size={36} />
                        </div>
                        <div>
                            <h1 className={styles.clientName}>{datosCliente.nombre_completo}</h1>
                            <div className={styles.clientSubtitle}>
                                {deuda > 0 ? (
                                    <><AlertCircle size={16} className={styles.textRed}/> Con saldo pendiente</>
                                ) : (
                                    <><CheckCircle2 size={16} className={styles.textGreen}/> Al corriente</>
                                )}
                                <span className={styles.separator}>•</span>
                                <span className={`${styles.statusBadge} ${datosCliente.estado === 'ACTIVO' ? styles.statusActive : styles.statusInactive}`}>
                                    {datosCliente.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.balanceBox}>
                        <span className={styles.balanceLabel}>Saldo Actual</span>
                        <span className={`${styles.balanceAmount} ${deuda > 0 ? styles.textRed : styles.textGreen}`}>
                            ${deuda.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* PANEL DE DETALLES DEL CLIENTE */}
                <div className={styles.clientDetailsPanel}>
                    <div className={styles.detailItem}>
                        <MapPin size={18} className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Dirección e IP</span>
                            <span className={styles.detailValue}>{datosCliente.direccion || 'Sin dirección registrada'}</span>
                            <span className={styles.detailSubValue}>IP: {datosCliente.ip_asignada || '192.168.1.254'}</span>
                        </div>
                    </div>

                    <div className={styles.detailItem}>
                        <Phone size={18} className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Contacto</span>
                            <span className={styles.detailValue}>{datosCliente.telefono || 'Sin teléfono'}</span>
                        </div>
                    </div>

                    <div className={styles.detailItem}>
                        <CalendarDays size={18} className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Plan y Facturación</span>
                            <span className={styles.detailValue}>{datosCliente.plan?.nombre || 'Sin Plan Asignado'}</span>
                            <span className={styles.detailSubValue}>Paga los días {datosCliente.dia_pago} de cada mes</span>
                        </div>
                    </div>

                    <div className={styles.detailItem}>
                        {esFibra ? <Cable size={18} className={styles.detailIcon} /> : <Wifi size={18} className={styles.detailIcon} />}
                        <div className={styles.detailContent}>
                            <span className={styles.detailLabel}>Infraestructura ({esFibra ? 'Fibra' : 'Radio'})</span>
                            {esFibra ? (
                                <span className={styles.detailValue}>NAP: {datosCliente.caja?.nombre}</span>
                            ) : (
                                <span className={styles.detailValue}>Conexión Inalámbrica</span>
                            )}
                            <span className={styles.detailSubValue}>
                                Equipos: {datosCliente.equipos?.length > 0 
                                    ? datosCliente.equipos.map(e => e.modelo || e.nombre).join(', ') 
                                    : 'Ninguno registrado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TARJETAS DE ESTADÍSTICAS */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.blue}`}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.statDetails}>
                        <span className={styles.statTitle}>Total Pagado (Histórico)</span>
                        <span className={styles.statValue}>${totalAbonado.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.green}`}>
                        <Calendar size={24} />
                    </div>
                    <div className={styles.statDetails}>
                        <span className={styles.statTitle}>Último Pago</span>
                        <span className={styles.statValue}>{fechaUltimoPago}</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.purple}`}>
                        <History size={24} />
                    </div>
                    <div className={styles.statDetails}>
                        <span className={styles.statTitle}>Movimientos Registrados</span>
                        <span className={styles.statValue}>{historial.length}</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE COMPORTAMIENTO (SCORE Y HEATMAP) */}
            <div className={styles.behaviorSection}>
                <div className={styles.scoreContainer}>
                    <div className={styles.scoreCircle} style={{ borderColor: scoreColor }}>
                        <span className={styles.scoreValue} style={{ color: scoreColor }}>{scoreDisplay}</span>
                    </div>
                    <div className={styles.scoreInfo}>
                        <span className={styles.scoreLabel}>Confiabilidad</span>
                        <span className={styles.scoreText} style={{ color: scoreColor }}>{scoreText}</span>
                    </div>
                </div>

                <div className={styles.heatmapContainer}>
                    <span className={styles.heatmapTitle}>Actividad de Pagos (Últimos 10 Meses)</span>
                    <div className={styles.heatBlocks}>
                        {heatmapData.map((data, index) => (
                            <div key={index} className={styles.heatBlockWrapper}>
                                <div 
                                    className={`${styles.heatBlock} ${styles[data.status]}`} 
                                    title={data.status === 'pagado' ? 'Abono realizado' : data.status === 'deuda' ? 'Cargo sin pagar' : 'Sin actividad'}
                                ></div>
                                <span className={styles.heatMonth}>{data.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* LÍNEA DE TIEMPO (TIMELINE) */}
            <div className={styles.timelineSection}>
                <div className={styles.timelineHeader}>
                    <CreditCard size={22} /> Estado de Cuenta Detallado
                </div>
                
                {historial.length === 0 ? (
                    <div className={styles.emptyState}>
                        Este cliente aún no tiene movimientos financieros registrados.
                    </div>
                ) : (
                    <div className={styles.timeline}>
                        {historial.map(mov => (
                            <div key={mov.id} className={styles.timelineItem}>
                                <div className={`${styles.timelineIcon} ${mov.tipo === 'ABONO' ? styles.iconAbono : styles.iconCargo}`}>
                                    <DollarSign size={14} />
                                </div>
                                
                                <div className={styles.timelineContent}>
                                    <div className={styles.movementInfo}>
                                        <span className={styles.movementTitle}>
                                            {mov.tipo === 'ABONO' ? 'Pago Recibido' : 'Cargo Registrado'}
                                        </span>
                                        <span className={styles.movementDate}>
                                            {new Date(mov.fecha).toLocaleDateString()} a las {new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        <span className={styles.movementDesc}>
                                            {mov.descripcion || (mov.tipo === 'ABONO' ? 'Abono a cuenta' : 'Generación de mensualidad')}
                                        </span>
                                    </div>
                                    
                                    <div className={`${styles.movementAmount} ${mov.tipo === 'ABONO' ? styles.amountAbono : styles.amountCargo}`}>
                                        {mov.tipo === 'ABONO' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistorialPagos;