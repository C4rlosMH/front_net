import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Plus, Search, Filter, ArrowUpRight, 
    Wallet, Landmark, Banknote, FileText, Printer
} from "lucide-react";
import TablePagination from "../components/TablePagination";
import PagoModal from "../components/PagoModal";
import styles from "./styles/Pagos.module.css";
import { APP_CONFIG } from "../config/appConfig";

function Pagos() {
    const [movimientos, setMovimientos] = useState([]);
    const [totalItems, setTotalItems] = useState(0); 
    const [ingresosHoy, setIngresosHoy] = useState(0); // Nuevo estado
    const [loading, setLoading] = useState(true);
    
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [filtroMetodo, setFiltroMetodo] = useState("TODOS");

    const [modalPagoOpen, setModalPagoOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Generar un delay para la busqueda (Debounce) para no saturar el backend mientras escribes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            cargarDatos();
        }, 300); // Espera 300ms despues de dejar de escribir

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, busqueda, filtroTipo, filtroMetodo]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/pagos", {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    tipo: filtroTipo,
                    metodo: filtroMetodo,
                    search: busqueda
                }
            });

            const movsArray = Array.isArray(res.data.movimientos) ? res.data.movimientos : (Array.isArray(res.data) ? res.data : []);
            setMovimientos(movsArray);
            setTotalItems(res.data.total ?? movsArray.length);
            
            // Recibimos el calculo total del dia desde el backend
            setIngresosHoy(res.data.ingresosHoy ?? 0);

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el historial financiero");
        } finally {
            setLoading(false);
        }
    };

    const getMetodoIcon = (metodo) => {
        switch(metodo) {
            case 'EFECTIVO': return <Banknote size={14} />;
            case 'TRANSFERENCIA': return <Landmark size={14} />;
            case 'DEPOSITO': return <Wallet size={14} />;
            default: return <FileText size={14} />;
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Auditoria Financiera</h1>
                    <p className={styles.subtitle}>Registro historico de pagos, abonos y cargos</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnPrint} onClick={handlePrint} title="Imprimir Reporte">
                        <Printer size={18} /> Imprimir
                    </button>
                    <button className={styles.addButton} onClick={() => setModalPagoOpen(true)}>
                        <Plus size={20} /> Registrar Ingreso
                    </button>
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxIngreso}><ArrowUpRight size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Ingresos de Hoy</span>
                        <h3 className={styles.statValue}>{APP_CONFIG.currencySymbol}{ingresosHoy.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxTransacciones}><FileText size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Operaciones</span>
                        <h3 className={styles.statValue}>{totalItems} <small className={styles.smallText}>historicas</small></h3>
                    </div>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente o nota..." 
                        value={busqueda}
                        onChange={(e) => {setBusqueda(e.target.value); setCurrentPage(1);}}
                        className={styles.searchInput}
                    />
                </div>
                
                <div className={styles.filtersWrapper}>
                    <div className={styles.selectGroup}>
                        <Filter size={16} className={styles.selectIcon}/>
                        <select value={filtroTipo} onChange={(e) => {setFiltroTipo(e.target.value); setCurrentPage(1);}} className={styles.selectFilter}>
                            <option value="TODOS">Todos los tipos</option>
                            <option value="ABONO">Abonos (Ingresos)</option>
                            <option value="CARGO_MENSUAL">Cargos Mensuales</option>
                            <option value="AJUSTE_FAVOR">Ajustes a Favor</option>
                        </select>
                    </div>

                    <div className={styles.selectGroup}>
                        <Wallet size={16} className={styles.selectIcon}/>
                        <select value={filtroMetodo} onChange={(e) => {setFiltroMetodo(e.target.value); setCurrentPage(1);}} className={styles.selectFilter}>
                            <option value="TODOS">Cualquier Metodo</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="DEPOSITO">Deposito</option>
                            <option value="SISTEMA">Sistema (Cargos)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.emptyState}>Cargando registros financieros...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.colFecha}>Fecha y Hora</th>
                                    <th>Cliente</th>
                                    <th className={styles.colConcepto}>Concepto / Notas</th>
                                    <th>Metodo</th>
                                    <th className={styles.colMontoRight}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.length === 0 ? (
                                    <tr><td colSpan="5" className={styles.emptyState}>No hay movimientos que coincidan con la busqueda.</td></tr>
                                ) : (
                                    movimientos.map(m => (
                                        <tr key={m.id}>
                                            <td className={styles.colFecha}>
                                                <div className={styles.fechaHora}>
                                                    <span className={styles.dateText}>{new Date(m.fecha).toLocaleDateString()}</span>
                                                    <span className={styles.timeText}>{new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.bold}>
                                                    {m.cliente ? m.cliente.nombre_completo : "General"}
                                                </div>
                                            </td>
                                            <td className={styles.colConcepto}>
                                                <div className={styles.descText}>{m.descripcion}</div>
                                                <div className={styles.responsableText}>Por: {m.usuario_responsable || 'Sistema'}</div>
                                            </td>
                                            <td>
                                                {m.metodo_pago && (
                                                    <span className={`${styles.methodBadge} ${styles[`badge${m.metodo_pago}`]}`}>
                                                        {getMetodoIcon(m.metodo_pago)} {m.metodo_pago}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={styles.colMontoRight}>
                                                <div className={styles.montoWrap}>
                                                    <span className={`${styles.amount} ${m.tipo === 'ABONO' || m.tipo === 'AJUSTE_FAVOR' ? styles.textGreen : styles.textRed}`}>
                                                        {m.tipo === 'ABONO' || m.tipo === 'AJUSTE_FAVOR' ? '+' : '-'}{APP_CONFIG.currencySymbol}{parseFloat(m.monto).toFixed(2)}
                                                    </span>
                                                    <span className={styles.tinyType}>{m.tipo.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        <div className={styles.noPrint}>
                            <TablePagination 
                                totalItems={totalItems} 
                                itemsPerPage={itemsPerPage} 
                                currentPage={currentPage} 
                                onPageChange={setCurrentPage} 
                            />
                        </div>
                    </>
                )}
            </div>

            <PagoModal 
                isOpen={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                clienteIdPreseleccionado={null} 
                onSuccess={cargarDatos}
            />
        </div>
    );
}

export default Pagos;