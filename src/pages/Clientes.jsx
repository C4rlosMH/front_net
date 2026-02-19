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
    const [loading, setLoading] = useState(true);
    
    // Filtros y Paginación
    const [tabActual, setTabActual] = useState("TODOS"); 
    const [busqueda, setBusqueda] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Modales
    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);
    
    // --- CORRECCIÓN AQUÍ: Usamos 'clienteCobrar' (Objeto) en lugar de ID ---
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [clienteCobrar, setClienteCobrar] = useState(null); 

    useEffect(() => { cargarDatos(); }, []);
    useEffect(() => { setCurrentPage(1); }, [tabActual, busqueda]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/clientes");
            setClientes(res.data);
        } catch (error) {
            toast.error("Error al cargar la cartera de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const abrirModalCliente = (cliente = null) => {
        setClienteEditar(cliente);
        setModalClienteOpen(true);
    };

    // --- FUNCIÓN CORREGIDA ---
    const abrirModalPago = (clienteObj) => {
        setClienteCobrar(clienteObj); // Guardamos todo el objeto
        setModalPagoOpen(true);
    };

    const eliminarCliente = async (id) => {
        const confirmar = window.confirm("¿Estás seguro de ELIMINAR permanentemente este cliente? Esta acción liberará sus equipos.");
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

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtros
    const clientesFiltrados = clientes.filter(c => {
        if (tabActual !== "TODOS" && c.estado !== tabActual) return false;
        if (busqueda) {
            const term = busqueda.toLowerCase();
            return (
                c.nombre_completo.toLowerCase().includes(term) ||
                (c.telefono && c.telefono.includes(term)) ||
                (c.ip_asignada && c.ip_asignada.includes(term)) ||
                (c.direccion && c.direccion.toLowerCase().includes(term))
            );
        }
        return true;
    });

    // Ordenamiento
    const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        // Lógica especial de ordenamiento
        if (sortConfig.key === 'saldo_actual') {
            aVal = (parseFloat(a.saldo_actual) || 0) + (parseFloat(a.saldo_aplazado) || 0);
            bVal = (parseFloat(b.saldo_actual) || 0) + (parseFloat(b.saldo_aplazado) || 0);
        }
        if (sortConfig.key === 'tipo_conexion') {
            aVal = (a.tipo_conexion?.toLowerCase() === 'radio' || !a.caja) ? 'radio' : 'fibra';
            bVal = (b.tipo_conexion?.toLowerCase() === 'radio' || !b.caja) ? 'radio' : 'fibra';
        }
        if (sortConfig.key === 'confiabilidad') {
            aVal = a.confiabilidad ?? -1; 
            bVal = b.confiabilidad ?? -1;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientesOrdenados.slice(indexOfFirstItem, indexOfLastItem);

    const exportarCSV = () => {
        if (clientesFiltrados.length === 0) return toast.warning("No hay datos para exportar");
        
        let csv = "Nombre Completo,Telefono,Tipo Conexion,IP,Direccion,Plan,Estado,Deuda Total,Confiabilidad\n";
        clientesFiltrados.forEach(c => {
            const planStr = c.plan?.nombre || "Sin plan";
            const dirStr = c.direccion ? c.direccion.replace(/,/g, '') : ""; 
            const tipoCon = (c.tipo_conexion?.toLowerCase() === 'radio' || !c.caja) ? 'Radio' : 'Fibra';
            const deudaTotal = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
            const confText = (c.confiabilidad !== null && c.confiabilidad !== undefined) ? `${c.confiabilidad}%` : 'Sin historial';
            
            csv += `"${c.nombre_completo}","${c.telefono || ''}","${tipoCon}","${c.ip_asignada || ''}","${dirStr}","${planStr}","${c.estado}","${deudaTotal}","${confText}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Clientes_NetAdmin_${tabActual}.csv`;
        link.click();
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Cartera de Clientes</h1>
                    <span className={styles.subtitle}>Gestión y control de suscriptores</span>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnExport} onClick={exportarCSV}>
                        <Download size={18} /> Exportar CSV
                    </button>
                    <button className={styles.addButton} onClick={() => abrirModalCliente(null)}>
                        <Plus size={20} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tabActual === 'TODOS' ? styles.tabActive : ''}`} onClick={() => setTabActual("TODOS")}><Users size={16}/> Todos</button>
                    <button className={`${styles.tab} ${tabActual === 'ACTIVO' ? `${styles.tabActive} ${styles.textGreen}` : ''}`} onClick={() => setTabActual("ACTIVO")}><CheckCircle2 size={16}/> Activos</button>
                    <button className={`${styles.tab} ${tabActual === 'SUSPENDIDO' ? `${styles.tabActive} ${styles.textOrange}` : ''}`} onClick={() => setTabActual("SUSPENDIDO")}><AlertTriangle size={16}/> Suspendidos</button>
                    <button className={`${styles.tab} ${tabActual === 'CORTADO' ? `${styles.tabActive} ${styles.textRed}` : ''}`} onClick={() => setTabActual("CORTADO")}><Scissors size={16}/> Cortados</button>
                    <button className={`${styles.tab} ${tabActual === 'BAJA' ? `${styles.tabActive} ${styles.textSlate}` : ''}`} onClick={() => setTabActual("BAJA")}><Ban size={16}/> Bajas</button>
                </div>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input type="text" placeholder="Buscar nombre, IP, tel..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={styles.searchInput}/>
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
                            <th onClick={() => handleSort('confiabilidad')} className={styles.sortableHeader}>Confiabilidad {renderSortIcon('confiabilidad')}</th>
                            <th onClick={() => handleSort('saldo_actual')} className={styles.sortableHeader}>Deuda {renderSortIcon('saldo_actual')}</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className={styles.skeletonRow}>
                                    <td colSpan="8"><div className={styles.skeletonBlock} style={{height: '40px', width: '100%'}}></div></td>
                                </tr>
                            ))
                        ) : currentClientes.length === 0 ? (
                            <tr><td colSpan="8" className={styles.emptyState}>No se encontraron clientes.</td></tr>
                        ) : (
                            currentClientes.map(c => {
                                const deudaTotal = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
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
                                        <span className={styles.confiabilidadText}>
                                            {c.confiabilidad != null ? `${c.confiabilidad}%` : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        {deudaTotal > 0 ? (
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <span className={styles.debtWarning}>${deudaTotal.toFixed(2)}</span>
                                                {parseFloat(c.saldo_aplazado) > 0 && <span className={styles.textOrange} style={{fontSize: '0.7rem'}}>Atrasado</span>}
                                            </div>
                                        ) : <span className={styles.debtOk}>$0.00</span>}
                                    </td>
                                    <td>
                                        <div className={styles.flexActions}>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnPay}`} 
                                                onClick={() => abrirModalPago(c)} // <--- ENVÍO OBJETO COMPLETO
                                                title="Cobrar"
                                            >
                                                <Wallet size={18} />
                                            </button>
                                            <Link to={`/pagos/cliente/${c.id}`}>
                                                <button className={`${styles.actionBtn} ${styles.btnProfile}`} title="Historial"><Eye size={18} /></button>
                                            </Link>
                                            <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => abrirModalCliente(c)} title="Editar"><Pencil size={18} /></button>
                                            <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => eliminarCliente(c.id)} title="Eliminar"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <TablePagination totalItems={clientesFiltrados.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            <ClienteModal 
                isOpen={modalClienteOpen}
                onClose={() => setModalClienteOpen(false)}
                clienteEditar={clienteEditar}
                clientesContext={clientes}
                onSuccess={cargarDatos}
            />
            
            {/* COMPONENTE MODAL DE PAGO */}
            <PagoModal 
                isOpen={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                cliente={clienteCobrar} // <--- Prop "cliente" correcta
                onSuccess={cargarDatos}
            />
        </div>
    );
}

export default Clientes;