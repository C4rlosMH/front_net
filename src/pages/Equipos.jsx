import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import TablePagination from "../components/TablePagination"; 
import EquipoModal from "../components/EquipoModal";
import { toast } from "sonner";
import { 
    Plus, Pencil, Trash2, Search, Download, 
    ArrowUpDown, ArrowUp, ArrowDown, Package, Server, DollarSign, Layers
} from "lucide-react"; 
import styles from "./styles/Equipos.module.css";

// Función normalizadora idéntica a la del backend
const normalizeStr = (str) => {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [insumosData, setInsumosData] = useState([]);
    const [totalItems, setTotalItems] = useState(0); 
    const [loading, setLoading] = useState(true);
    
    const [filtro, setFiltro] = useState("TODOS"); 
    const [busqueda, setBusqueda] = useState("");
    
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [modalOpen, setModalOpen] = useState(false);
    const [equipoEditar, setEquipoEditar] = useState(null);

    useEffect(() => { cargarEquipos(); }, [currentPage, filtro, busqueda]);

    const cargarEquipos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/equipos", {
                params: { page: currentPage, limit: itemsPerPage, estado: filtro, search: busqueda }
            });

            const eqArray = Array.isArray(res.data.equipos) ? res.data.equipos : (Array.isArray(res.data) ? res.data : []);
            setEquipos(eqArray);
            setTotalItems(res.data.total ?? eqArray.length);

            client.get("/insumos").then(res => setInsumosData(res.data)).catch(() => {});

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
        if (window.confirm("¿Estás seguro de que deseas ELIMINAR permanentemente este equipo?")) {
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

    const totalEquipos = totalItems || equipos.length;
    const enAlmacen = equipos.filter(e => e.estado === 'ALMACEN').length;
    const inversionAlmacen = equipos.filter(e => e.estado === 'ALMACEN').reduce((acc, e) => acc + parseFloat(e.precio_compra || 0), 0);

    // <-- Cálculos A PRUEBA DE ERRORES para el KPI de Cable en Equipos
    const metrosFibra = insumosData
        .filter(i => normalizeStr(i.nombre).includes('fibra') && i.unidad_medida === 'Metros')
        .reduce((acc, i) => acc + Number(i.cantidad), 0);
        
    const metrosUTP = insumosData
        .filter(i => (normalizeStr(i.nombre).includes('utp') || normalizeStr(i.nombre).includes('cat')) && i.unidad_medida === 'Metros')
        .reduce((acc, i) => acc + Number(i.cantidad), 0);
        
    const stockCable = metrosFibra + metrosUTP;

    const equiposOrdenados = [...equipos].sort((a, b) => {
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

    const exportarCSV = () => {
        if (equiposOrdenados.length === 0) return toast.warning("No hay datos para exportar");
        
        let csv = "Identificador,Marca,Modelo,Tipo,MAC Address,Numero Serie,Estado,Precio Compra,Fecha Compra\n";
        equiposOrdenados.forEach(e => {
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
                        <span className={styles.statLabel}>Capital Detenido</span>
                        <h3 className={styles.statValue}>${inversionAlmacen.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
                
                <Link to="/insumos" className={styles.kpiLink}>
                    <div className={`${styles.statCard} ${styles.statCardHover}`}>
                        <div className={styles.iconBoxPurple}><Layers size={24}/></div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Reserva de Cableado</span>
                            <h3 className={styles.statValue}>{stockCable.toFixed(0)} <small>m totales</small></h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                    <span style={{ color: '#3b82f6' }}>Fibra:</span> {metrosFibra.toFixed(0)} m
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                    <span style={{ color: '#10b981' }}>UTP:</span> {metrosUTP.toFixed(0)} m
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${filtro === 'TODOS' ? styles.tabActive : ''}`} onClick={() => {setFiltro("TODOS"); setCurrentPage(1);}}>Todos</button>
                    <button className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`} onClick={() => {setFiltro("ANTENA"); setCurrentPage(1);}}>Antenas</button>
                    <button className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`} onClick={() => {setFiltro("ROUTER"); setCurrentPage(1);}}>Routers</button>
                    <button className={`${styles.tab} ${filtro === 'MODEM' ? styles.tabActive : ''}`} onClick={() => {setFiltro("MODEM"); setCurrentPage(1);}}>Modems/ONUs</button>
                </div>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input type="text" placeholder="Buscar MAC, serie, modelo..." value={busqueda} onChange={(e) => {setBusqueda(e.target.value); setCurrentPage(1);}} className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('marca')} className={styles.sortableHeader}>Equipo / Modelo {renderSortIcon('marca')}</th>
                            <th>Tipo</th>
                            <th onClick={() => handleSort('mac_address')} className={styles.sortableHeader}>Identificación {renderSortIcon('mac_address')}</th>
                            <th onClick={() => handleSort('precio_compra')} className={styles.sortableHeader}>Adquisición {renderSortIcon('precio_compra')}</th>
                            <th onClick={() => handleSort('estado')} className={styles.sortableHeader}>Estado {renderSortIcon('estado')}</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>Cargando...</td></tr>
                        ) : equiposOrdenados.length === 0 ? (
                            <tr><td colSpan="6" className={styles.emptyState}>No se encontraron equipos en el inventario.</td></tr>
                        ) : (
                            equiposOrdenados.map(e => (
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
                <TablePagination totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            <EquipoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} equipoEditar={equipoEditar} onSuccess={cargarEquipos} />
        </div>
    );
}

export default Equipos;