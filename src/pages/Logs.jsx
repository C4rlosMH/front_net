import { useEffect, useState } from "react";
import client from "../api/axios";
import { Activity, User, Calendar, FileText, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import TablePagination from "../components/TablePagination";
import styles from "./styles/Logs.module.css";

function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para filtros y paginación
    const [busqueda, setBusqueda] = useState("");
    const [filtroAccion, setFiltroAccion] = useState("TODOS");
    const [filtroUsuario, setFiltroUsuario] = useState("TODOS");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await client.get("/logs"); 
                setLogs(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar la actividad");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // Resetear a la página 1 cuando se cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [busqueda, filtroAccion, filtroUsuario]);

    // Extraer usuarios únicos de los logs para el menú desplegable
    const usuariosUnicos = Array.from(new Set(logs.map(log => log.usuario || 'Sistema'))).sort();

    // DICCIONARIO AMPLIADO DE COLORES
    const getBadgeStyle = (accion) => {
        if (!accion) return styles.badgeGray;
        const acc = accion.toUpperCase();
        
        if (acc.includes('ELIMINAR') || acc.includes('DELETE') || acc.includes('BORRAR')) return styles.badgeRed;
        if (acc.includes('CREAR') || acc.includes('NUEVO') || acc.includes('REGISTRAR') || acc.includes('AGREGAR')) return styles.badgeGreen;
        if (acc.includes('PAGO') || acc.includes('CARGO') || acc.includes('FINANCIERO') || acc.includes('ABONO')) return styles.badgePurple;
        
        // Accesos y Seguridad (Se agregaron Password, Clave, Reset)
        if (acc.includes('LOGIN') || acc.includes('LOGOUT') || acc.includes('AUTH') || acc.includes('PASSWORD') || acc.includes('CLAVE') || acc.includes('RESET')) return styles.badgeBlue;
        
        // Modificaciones y Estados (Se agregaron suspender, reactivar, corte)
        if (acc.includes('EDITAR') || acc.includes('ACTUALIZAR') || acc.includes('MODIFICAR') || acc.includes('ESTADO') || acc.includes('SUSPENDER') || acc.includes('REACTIVAR') || acc.includes('CORTE') || acc.includes('CAMBIO')) return styles.badgeOrange;
        
        return styles.badgeGray;
    };

    // Filtrado de datos
    const logsFiltrados = logs.filter(log => {
        // Filtro por tipo de acción (Diccionario ampliado)
        let coincideAccion = true;
        if (filtroAccion !== "TODOS" && log.accion) {
            const acc = log.accion.toUpperCase();
            if (filtroAccion === "CREAR") coincideAccion = acc.includes('CREAR') || acc.includes('REGISTRAR') || acc.includes('AGREGAR') || acc.includes('NUEVO');
            if (filtroAccion === "EDITAR") coincideAccion = acc.includes('EDITAR') || acc.includes('ACTUALIZAR') || acc.includes('MODIFICAR') || acc.includes('ESTADO') || acc.includes('SUSPENDER') || acc.includes('REACTIVAR') || acc.includes('CORTE') || acc.includes('CAMBIO');
            if (filtroAccion === "ELIMINAR") coincideAccion = acc.includes('ELIMINAR') || acc.includes('DELETE') || acc.includes('BORRAR');
            if (filtroAccion === "PAGOS") coincideAccion = acc.includes('PAGO') || acc.includes('CARGO') || acc.includes('ABONO') || acc.includes('FINANCIERO');
            if (filtroAccion === "SISTEMA") coincideAccion = acc.includes('LOGIN') || acc.includes('LOGOUT') || acc.includes('AUTH') || acc.includes('PASSWORD') || acc.includes('RESET') || acc.includes('CLAVE');
        }

        // Filtro por Usuario
        let coincideUsuario = true;
        if (filtroUsuario !== "TODOS") {
            const userName = log.usuario || 'Sistema';
            coincideUsuario = userName === filtroUsuario;
        }

        // Filtro por texto (Buscador general)
        const term = busqueda.toLowerCase();
        const coincideBusqueda = 
            (log.usuario && log.usuario.toLowerCase().includes(term)) ||
            (log.detalle && log.detalle.toLowerCase().includes(term)) ||
            (log.accion && log.accion.toLowerCase().includes(term));

        return coincideAccion && coincideUsuario && coincideBusqueda;
    });

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = logsFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{background: '#dbeafe', padding: 10, borderRadius: 12, color: '#2563eb'}}>
                        <Activity size={28} />
                    </div>
                    <h1 className={styles.title}>Registro de Actividad</h1>
                </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar palabra clave o detalle..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                
                <div className={styles.filterBox}>
                    <User size={18} className={styles.filterIcon}/>
                    <select 
                        value={filtroUsuario} 
                        onChange={(e) => setFiltroUsuario(e.target.value)}
                        className={styles.selectFilter}
                    >
                        <option value="TODOS">Todos los usuarios</option>
                        {usuariosUnicos.map(user => (
                            <option key={user} value={user}>{user}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterBox}>
                    <Filter size={18} className={styles.filterIcon}/>
                    <select 
                        value={filtroAccion} 
                        onChange={(e) => setFiltroAccion(e.target.value)}
                        className={styles.selectFilter}
                    >
                        <option value="TODOS">Todas las acciones</option>
                        <option value="CREAR">Creaciones / Registros</option>
                        <option value="EDITAR">Modificaciones / Estados</option>
                        <option value="ELIMINAR">Eliminaciones</option>
                        <option value="PAGOS">Finanzas (Pagos/Cargos)</option>
                        <option value="SISTEMA">Accesos y Seguridad</option>
                    </select>
                </div>
            </div>

            {/* TABLA DE LOGS */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>Cargando registros del sistema...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{width: '180px'}}>Fecha / Hora</th>
                                    <th style={{width: '200px'}}>Acción</th>
                                    <th style={{width: '150px'}}>Usuario</th>
                                    <th>Detalle del Evento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div className={styles.dateText} style={{display:'flex', alignItems:'center', gap:6}}>
                                                <Calendar size={14}/>
                                                {new Date(log.fecha).toLocaleDateString()}
                                            </div>
                                            <div className={styles.dateText} style={{marginLeft: 20}}>
                                                {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getBadgeStyle(log.accion)}`}>
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                                                <User size={14} className={styles.dateText}/>
                                                <span className={styles.userText}>{log.usuario || 'Sistema'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                                                <FileText size={16} style={{marginTop:3, color:'var(--text-muted)'}}/>
                                                {log.detalle}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentLogs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className={styles.emptyState}>
                                            No se encontraron registros que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {logsFiltrados.length > 0 && (
                            <TablePagination 
                                totalItems={logsFiltrados.length} 
                                itemsPerPage={itemsPerPage} 
                                currentPage={currentPage} 
                                onPageChange={setCurrentPage} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Logs;