import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Plus, Search, Filter, ArrowUpRight, ArrowDownRight, 
    Calendar, Wallet, Landmark, Banknote, FileText, Printer
} from "lucide-react";
import TablePagination from "../components/TablePagination";
import PagoModal from "../components/PagoModal";
import styles from "./styles/Pagos.module.css";

function Pagos() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros y Búsqueda
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [filtroMetodo, setFiltroMetodo] = useState("TODOS");

    // Modal Global
    const [modalPagoOpen, setModalPagoOpen] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        cargarDatos();
    }, []);

    // Resetear a página 1 cuando se usan los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [busqueda, filtroTipo, filtroMetodo]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/pagos");
            setMovimientos(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el historial financiero");
        } finally {
            setLoading(false);
        }
    };

    // --- KPIs y Cálculos ---
    const hoy = new Date().toDateString();
    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    const ingresosHoy = movimientos
        .filter(m => m.tipo === 'ABONO' && new Date(m.fecha).toDateString() === hoy)
        .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

    const ingresosMes = movimientos
        .filter(m => {
            const fechaMov = new Date(m.fecha);
            return m.tipo === 'ABONO' && fechaMov.getMonth() === mesActual && fechaMov.getFullYear() === añoActual;
        })
        .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

    // --- Filtrado Dinámico ---
    const movimientosFiltrados = movimientos.filter(m => {
        // Filtro por Búsqueda (Nombre de cliente o Descripción/Nota)
        let coincideBusqueda = true;
        if (busqueda) {
            const term = busqueda.toLowerCase();
            const clienteStr = m.cliente?.nombre_completo?.toLowerCase() || "";
            const descStr = m.descripcion?.toLowerCase() || "";
            coincideBusqueda = clienteStr.includes(term) || descStr.includes(term);
        }

        // Filtro por Tipo de Movimiento
        let coincideTipo = filtroTipo === "TODOS" || m.tipo === filtroTipo;

        // Filtro por Método de Pago
        let coincideMetodo = filtroMetodo === "TODOS" || m.metodo_pago === filtroMetodo;

        return coincideBusqueda && coincideTipo && coincideMetodo;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = movimientosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    // Helpers Visuales
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
                    <h1 className={styles.title}>Auditoría Financiera</h1>
                    <p className={styles.subtitle}>Registro histórico de pagos, abonos y cargos</p>
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

            {/* --- TARJETAS DE RESUMEN (KPIs) --- */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxIngreso}><ArrowUpRight size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Ingresos de Hoy</span>
                        <h3 className={styles.statValue}>${ingresosHoy.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxMes}><Calendar size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Ingresos del Mes</span>
                        <h3 className={styles.statValue}>${ingresosMes.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxTransacciones}><FileText size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Operaciones</span>
                        <h3 className={styles.statValue}>{movimientosFiltrados.length} <small style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>filtradas</small></h3>
                    </div>
                </div>
            </div>

            {/* --- BARRA DE FILTROS --- */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente o nota (Ej: abono parcial)..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                
                <div className={styles.filtersWrapper}>
                    <div className={styles.selectGroup}>
                        <Filter size={16} className={styles.selectIcon}/>
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={styles.selectFilter}>
                            <option value="TODOS">Todos los tipos</option>
                            <option value="ABONO">Abonos (Ingresos)</option>
                            <option value="CARGO_MENSUAL">Cargos Mensuales</option>
                            <option value="AJUSTE_FAVOR">Ajustes a Favor</option>
                        </select>
                    </div>

                    <div className={styles.selectGroup}>
                        <Wallet size={16} className={styles.selectIcon}/>
                        <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={styles.selectFilter}>
                            <option value="TODOS">Cualquier Método</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="DEPOSITO">Depósito</option>
                            <option value="SISTEMA">Sistema (Cargos)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABLA --- */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.emptyState}>Cargando registros financieros...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha y Hora</th>
                                    <th>Cliente</th>
                                    <th>Concepto / Notas</th>
                                    <th>Método</th>
                                    <th style={{textAlign: 'right'}}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr><td colSpan="5" className={styles.emptyState}>No hay movimientos que coincidan con la búsqueda.</td></tr>
                                ) : (
                                    currentItems.map(m => (
                                        <tr key={m.id}>
                                            <td style={{width: '180px'}}>
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
                                            <td style={{maxWidth: '300px'}}>
                                                {/* Aquí se muestra la Descripción y la Nota personalizada */}
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
                                            <td style={{textAlign: 'right'}}>
                                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                                    <span className={`${styles.amount} ${m.tipo === 'ABONO' || m.tipo === 'AJUSTE_FAVOR' ? styles.textGreen : styles.textRed}`}>
                                                        {m.tipo === 'ABONO' || m.tipo === 'AJUSTE_FAVOR' ? '+' : '-'}${parseFloat(m.monto).toFixed(2)}
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
                                totalItems={movimientosFiltrados.length} 
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