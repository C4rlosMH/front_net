import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import TablePagination from "../components/TablePagination";
import PagoModal from "../components/PagoModal";
import ClienteModal from "../components/ClienteModal";
import { toast } from "sonner";
import { 
    Plus, Wallet, Eye, Pencil, Wifi, Cable, 
    CheckCircle2, Search, Users, AlertTriangle, 
    Ban, Scissors, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import styles from "./styles/Clientes.module.css";

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [totalItems, setTotalItems] = useState(0); 
    const [loading, setLoading] = useState(true);
    
    // Estado de filtros y paginación sincronizados con Backend
    const [tabActual, setTabActual] = useState("TODOS"); 
    const [busqueda, setBusqueda] = useState("");
    const [filtroConexion, setFiltroConexion] = useState("TODAS"); // <-- Nuevo estado para el filtro
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });

    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [clienteCobrar, setClienteCobrar] = useState(null); 

    // Carga de datos al cambiar cualquier parámetro de filtro o página
    useEffect(() => { 
        cargarDatos(); 
    }, [currentPage, tabActual, busqueda, sortConfig, filtroConexion]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/clientes", {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    tab: tabActual,
                    search: busqueda,
                    sortKey: sortConfig.key,
                    sortDir: sortConfig.direction,
                    conexion: filtroConexion // <-- Se envía el filtro al backend
                }
            });
            
            setClientes(res.data.clientes || []);
            setTotalItems(res.data.total || 0);
        } catch (error) {
            toast.error("Error al cargar la cartera de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (nuevoTab) => {
        setTabActual(nuevoTab);
        setCurrentPage(1); 
    };

    const handleSearchChange = (e) => {
        setBusqueda(e.target.value);
        setCurrentPage(1); 
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const eliminarCliente = async (id) => {
        const confirmar = window.confirm("¿Estás seguro de ELIMINAR permanentemente este cliente?");
        if (confirmar) {
            try {
                await client.delete(`/clientes/${id}`);
                toast.success("Cliente eliminado definitivamente");
                cargarDatos();
            } catch (error) {
                toast.error("Error al eliminar el cliente");
            }
        }
    };

    const getEstadoBadgeClass = (estado) => {
        switch (estado) {
            case 'CORTADO': return styles.badgeCortado;
            case 'SUSPENDIDO': return styles.badgeSuspendido;
            case 'BAJA': return styles.badgeBaja;
            default: return '';
        }
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className={styles.sortIconIdle} />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className={styles.sortIconActive} /> : <ArrowDown size={14} className={styles.sortIconActive} />;
    };

    const mostrarDeudaHistorica = clientes.some(c => parseFloat(c.deuda_historica || 0) > 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Cartera de Clientes</h1>
                    <span className={styles.subtitle}>Gestión y control de suscriptores</span>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.addButton} onClick={() => {setClienteEditar(null); setModalClienteOpen(true);}}>
                        <Plus size={20} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tabActual === 'TODOS' ? styles.tabActive : ''}`} onClick={() => handleTabChange("TODOS")}><Users size={16}/> Todos</button>
                    <button className={`${styles.tab} ${tabActual === 'ACTIVO' ? `${styles.tabActive} ${styles.textGreen}` : ''}`} onClick={() => handleTabChange("ACTIVO")}><CheckCircle2 size={16}/> Activos</button>
                    <button className={`${styles.tab} ${tabActual === 'SUSPENDIDO' ? `${styles.tabActive} ${styles.textOrange}` : ''}`} onClick={() => handleTabChange("SUSPENDIDO")}><AlertTriangle size={16}/> Suspendidos</button>
                    <button className={`${styles.tab} ${tabActual === 'CORTADO' ? `${styles.tabActive} ${styles.textRed}` : ''}`} onClick={() => handleTabChange("CORTADO")}><Scissors size={16}/> Cortados</button>
                    <button className={`${styles.tab} ${tabActual === 'BAJA' ? `${styles.tabActive} ${styles.textSlate}` : ''}`} onClick={() => handleTabChange("BAJA")}><Ban size={16}/> Bajas</button>
                </div>
                
                {/* --- NUEVA ZONA DE BÚSQUEDA Y FILTRO --- */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={filtroConexion} 
                        onChange={(e) => {setFiltroConexion(e.target.value); setCurrentPage(1);}} 
                        className={styles.searchInput}
                        style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--body-bg)', color: 'var(--text-main)' }}
                    >
                        <option value="TODAS">Toda la Red</option>
                        <option value="FIBRA">Solo Fibra</option>
                        <option value="RADIO">Solo Radio</option>
                    </select>

                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon}/>
                        <input type="text" placeholder="Buscar nombre, IP, tel..." value={busqueda} onChange={handleSearchChange} className={styles.searchInput}/>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('nombre_completo')} className={styles.sortableHeader}>Cliente {renderSortIcon('nombre_completo')}</th>
                            <th onClick={() => handleSort('tipo_conexion')} className={styles.sortableHeader}>Conexión {renderSortIcon('tipo_conexion')}</th>
                            <th onClick={() => handleSort('ip_asignada')} className={styles.sortableHeader}>Red / Ubicación {renderSortIcon('ip_asignada')}</th>
                            <th>Plan & Equipo</th>
                            <th onClick={() => handleSort('estado')} className={styles.sortableHeader}>Estado {renderSortIcon('estado')}</th>
                            <th onClick={() => handleSort('saldo_actual')} className={styles.sortableHeader}>Deuda Mes / A Favor {renderSortIcon('saldo_actual')}</th>
                            {mostrarDeudaHistorica && <th>Deuda Histórica</th>}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className={styles.skeletonRow}>
                                    <td colSpan={mostrarDeudaHistorica ? "8" : "7"}><div className={`${styles.skeletonBlock} ${styles.skeletonFull}`}></div></td>
                                </tr>
                            ))
                        ) : (
                            clientes.map(c => {
                                const deudaCorriente = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
                                const aFavor = parseFloat(c.saldo_a_favor) || 0;
                                const esRadio = c.tipo_conexion?.toLowerCase() === 'radio' || !c.caja;
                                
                                return (
                                <tr key={c.id}>
                                    <td>
                                        <div className={styles.bold}>{c.nombre_completo}</div>
                                        <div className={styles.muted}>{c.telefono || "Sin teléfono"}</div>
                                    </td>
                                    <td>
                                        {esRadio ? 
                                            <span className={`${styles.tipoBadge} ${styles.badgeRadio}`}><Wifi size={14} /> Radio</span> : 
                                            <span className={`${styles.tipoBadge} ${styles.badgeFibra}`}><Cable size={14} /> Fibra</span>
                                        }
                                    </td>
                                    <td>
                                        <div className={styles.fontMono}>{c.ip_asignada}</div>
                                        <div className={styles.muted}>{c.direccion}</div>
                                    </td>
                                    <td>
                                        <div className={styles.medium}>{c.plan?.nombre || "Sin Plan"}</div>
                                        {c.caja && <div className={styles.muted}>NAP: {c.caja.nombre}</div>}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${c.estado === 'ACTIVO' ? styles.statusActive : styles.statusInactive} ${getEstadoBadgeClass(c.estado)}`}>
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {aFavor > 0 ? (
                                            <div className={styles.saldoCell}>
                                                <span className={styles.textAdelantado}>+ ${aFavor.toFixed(2)}</span>
                                                <span className={styles.lblAdelantado}>Adelantado</span>
                                            </div>
                                        ) : deudaCorriente > 0 ? (
                                            <div className={styles.saldoCell}>
                                                <span className={styles.debtWarning}>${deudaCorriente.toFixed(2)}</span>
                                                {parseFloat(c.saldo_aplazado) > 0 && <span className={styles.lblAtrasado}>Atrasado</span>}
                                            </div>
                                        ) : <span className={styles.debtOk}>$0.00</span>}
                                    </td>
                                    {mostrarDeudaHistorica && (
                                        <td>
                                            <span className={styles.textHistorica}>${parseFloat(c.deuda_historica).toFixed(2)}</span>
                                        </td>
                                    )}
                                    <td>
                                        <div className={styles.flexActions}>
                                            <button className={`${styles.actionBtn} ${styles.btnPay}`} onClick={() => {setClienteCobrar(c); setModalPagoOpen(true);}} title="Cobrar"><Wallet size={18} /></button>
                                            <Link to={`/pagos/cliente/${c.id}`}>
                                                <button className={`${styles.actionBtn} ${styles.btnProfile}`} title="Historial"><Eye size={18} /></button>
                                            </Link>
                                            <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => {setClienteEditar(c); setModalClienteOpen(true);}} title="Editar"><Pencil size={18} /></button>
                                            <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => eliminarCliente(c.id)} title="Eliminar"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <TablePagination 
                    totalItems={totalItems} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <ClienteModal isOpen={modalClienteOpen} onClose={() => setModalClienteOpen(false)} clienteEditar={clienteEditar} onSuccess={cargarDatos} />
            <PagoModal isOpen={modalPagoOpen} onClose={() => setModalPagoOpen(false)} cliente={clienteCobrar} onSuccess={cargarDatos} />
        </div>
    );
}

export default Clientes;