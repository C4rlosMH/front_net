import { useEffect, useState } from "react";
import client from "../api/axios";
import TablePagination from "../components/TablePagination"; 
import EquipoModal from "../components/EquipoModal";
import { toast } from "sonner";
import { 
    Plus, Pencil, Trash2, Search, Download, 
    ArrowUpDown, ArrowUp, ArrowDown, Package, Server, DollarSign
} from "lucide-react"; 
import styles from "./styles/Equipos.module.css";

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros y Búsqueda
    const [filtro, setFiltro] = useState("TODOS"); 
    const [busqueda, setBusqueda] = useState("");
    
    // Ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Estados del Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [equipoEditar, setEquipoEditar] = useState(null);

    useEffect(() => { cargarEquipos(); }, []);
    useEffect(() => { setCurrentPage(1); }, [filtro, busqueda]);

    const cargarEquipos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/equipos");
            setEquipos(res.data);
        } catch (error) {
            toast.error("Error al cargar inventario");
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = (equipo = null) => {
        setEquipoEditar(equipo);
        setModalOpen(true);
    };

    const eliminarEquipo = async (id) => {
        const confirmar = window.confirm("¿Estás seguro de que deseas ELIMINAR permanentemente este equipo del inventario?");
        if (confirmar) {
            try {
                await client.delete(`/equipos/${id}`);
                toast.success("Equipo eliminado del sistema");
                cargarEquipos();
            } catch (error) {
                toast.error(error.response?.data?.message || "Error al eliminar el equipo");
            }
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // --- CÁLCULOS Y KPIs ---
    const totalEquipos = equipos.length;
    const enAlmacen = equipos.filter(e => e.estado === 'ALMACEN').length;
    const inversionTotal = equipos.reduce((acc, e) => acc + parseFloat(e.precio_compra || 0), 0);
    const inversionAlmacen = equipos.filter(e => e.estado === 'ALMACEN').reduce((acc, e) => acc + parseFloat(e.precio_compra || 0), 0);

    // --- FILTRADO ---
    const equiposFiltrados = equipos.filter(e => {
        const matchTipo = filtro === "TODOS" || e.tipo === filtro;
        const term = busqueda.toLowerCase();
        const matchBusqueda = !term || 
            (e.marca && e.marca.toLowerCase().includes(term)) ||
            (e.modelo && e.modelo.toLowerCase().includes(term)) ||
            (e.mac_address && e.mac_address.toLowerCase().includes(term)) ||
            (e.serie && e.serie.toLowerCase().includes(term)) ||
            (e.nombre && e.nombre.toLowerCase().includes(term));
        
        return matchTipo && matchBusqueda;
    });

    // --- ORDENAMIENTO ---
    const equiposOrdenados = [...equiposFiltrados].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        if (sortConfig.key === 'precio_compra') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // --- PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEquipos = equiposOrdenados.slice(indexOfFirstItem, indexOfLastItem);

    // --- EXPORTAR CSV ---
    const exportarCSV = () => {
        if (equiposFiltrados.length === 0) return toast.warning("No hay datos para exportar");
        
        let csv = "Identificador,Marca,Modelo,Tipo,MAC Address,Numero Serie,Estado,Precio Compra,Fecha Compra\n";
        equiposFiltrados.forEach(e => {
            const fechaStr = e.fecha_compra ? new Date(e.fecha_compra).toLocaleDateString() : "";
            csv += `"${e.nombre || ''}","${e.marca}","${e.modelo}","${e.tipo}","${e.mac_address}","${e.serie || ''}","${e.estado}","${e.precio_compra || 0}","${fechaStr}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Inventario_Equipos_${filtro}.csv`;
        link.click();
        toast.success("Inventario exportado");
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className={styles.sortIconIdle} />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className={styles.sortIconActive} /> : <ArrowDown size={14} className={styles.sortIconActive} />;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Inventario de Equipos</h1>
                    <span className={styles.subtitle}>Gestión de activos de red, MACs y existencias</span>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnExport} onClick={exportarCSV}>
                        <Download size={18} /> Exportar CSV
                    </button>
                    <button className={styles.addButton} onClick={() => abrirModal(null)}>
                        <Plus size={20} /> Nuevo Equipo
                    </button>
                </div>
            </div>

            {/* --- KPIs --- */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxPrimary}><Server size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Registrados</span>
                        <h3 className={styles.statValue}>{totalEquipos} <small>Unidades</small></h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxSuccess}><Package size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Stock en Almacén</span>
                        <h3 className={styles.statValue}>{enAlmacen} <small>Disponibles</small></h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxWarning}><DollarSign size={24}/></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Capital Detenido (Almacén)</span>
                        <h3 className={styles.statValue}>${inversionAlmacen.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
            </div>

            {/* --- FILTROS Y BUSCADOR --- */}
            <div className={styles.filterBar}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${filtro === 'TODOS' ? styles.tabActive : ''}`} onClick={() => setFiltro("TODOS")}>Todos</button>
                    <button className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`} onClick={() => setFiltro("ANTENA")}>Antenas</button>
                    <button className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`} onClick={() => setFiltro("ROUTER")}>Routers</button>
                    <button className={`${styles.tab} ${filtro === 'MODEM' ? styles.tabActive : ''}`} onClick={() => setFiltro("MODEM")}>Modems/ONUs</button>
                </div>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar MAC, serie, modelo..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)} 
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* --- TABLA --- */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('marca')} className={styles.sortableHeader}>
                                Equipo / Modelo {renderSortIcon('marca')}
                            </th>
                            <th>Tipo</th>
                            <th onClick={() => handleSort('mac_address')} className={styles.sortableHeader}>
                                Identificación {renderSortIcon('mac_address')}
                            </th>
                            <th onClick={() => handleSort('precio_compra')} className={styles.sortableHeader}>
                                Adquisición {renderSortIcon('precio_compra')}
                            </th>
                            <th onClick={() => handleSort('estado')} className={styles.sortableHeader}>
                                Estado {renderSortIcon('estado')}
                            </th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className={styles.skeletonRow}>
                                    <td><div className={styles.skeletonBlock} style={{width: '80%', height: '16px'}}></div></td>
                                    <td><div className={styles.skeletonBlock} style={{width: '60px', height: '24px', borderRadius: '12px'}}></div></td>
                                    <td><div className={styles.skeletonBlock} style={{width: '120px', height: '16px'}}></div></td>
                                    <td><div className={styles.skeletonBlock} style={{width: '70px', height: '16px'}}></div></td>
                                    <td><div className={styles.skeletonBlock} style={{width: '90px', height: '24px', borderRadius: '12px'}}></div></td>
                                    <td><div className={styles.skeletonBlock} style={{width: '80px', height: '32px', borderRadius: '8px'}}></div></td>
                                </tr>
                            ))
                        ) : currentEquipos.length === 0 ? (
                            <tr><td colSpan="6" className={styles.emptyState}>No se encontraron equipos en el inventario.</td></tr>
                        ) : (
                            currentEquipos.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div className={e.nombre ? styles.textMainBold : styles.textMutedBold}>{e.nombre || e.marca}</div>
                                        <div className={styles.textMutedSmall}>{e.nombre ? `${e.marca} ${e.modelo}` : e.modelo}</div>
                                    </td>
                                    <td>
                                        {e.tipo === 'ANTENA' && <span className={`${styles.typeBadge} ${styles.badgeAntena}`}>Antena</span>}
                                        {e.tipo === 'ROUTER' && <span className={`${styles.typeBadge} ${styles.badgeRouter}`}>Router</span>}
                                        {e.tipo === 'MODEM' && <span className={`${styles.typeBadge} ${styles.badgeModem}`}>Modem</span>}
                                    </td>
                                    <td>
                                        <div className={styles.fontMono}>MAC: {e.mac_address}</div>
                                        {e.serie && <div className={styles.fontMonoGray}>SN: {e.serie}</div>}
                                    </td>
                                    <td>
                                        <div className={styles.priceText}>{e.precio_compra ? `$${parseFloat(e.precio_compra).toFixed(2)}` : '-'}</div>
                                        <div className={styles.textGraySmall}>{e.fecha_compra ? new Date(e.fecha_compra).toLocaleDateString() : ''}</div>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${e.estado === 'ALMACEN' ? styles.statusAlmacen : styles.statusDefault}`}>
                                            {e.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.flexActions}>
                                            <button onClick={() => abrirModal(e)} className={styles.btnEdit} title="Editar Equipo"><Pencil size={18} /></button>
                                            <button onClick={() => eliminarEquipo(e.id)} className={styles.btnDelete} title="Eliminar Equipo"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <TablePagination totalItems={equiposFiltrados.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            <EquipoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} equipoEditar={equipoEditar} onSuccess={cargarEquipos} />
        </div>
    );
}

export default Equipos;