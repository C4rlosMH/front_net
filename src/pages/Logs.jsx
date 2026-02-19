import { useEffect, useState } from "react";
import client from "../api/axios";
import { Activity, User, Calendar, FileText, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import TablePagination from "../components/TablePagination";
import styles from "./styles/Logs.module.css";

function Logs() {
    const [logs, setLogs] = useState([]);
    const [totalItems, setTotalItems] = useState(0); 
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroAccion, setFiltroAccion] = useState("TODOS");
    const [filtroUsuario, setFiltroUsuario] = useState("TODOS");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        cargarLogs();
    }, [currentPage, busqueda, filtroAccion, filtroUsuario]);

    const cargarLogs = async () => {
        try {
            setLoading(true);
            const res = await client.get("/logs", {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    accion: filtroAccion,
                    usuario: filtroUsuario,
                    search: busqueda
                }
            }); 
            setLogs(res.data.logs || res.data || []);
            setTotalItems(res.data.total || (res.data ? res.data.length : 0));
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la actividad");
        } finally {
            setLoading(false);
        }
    };

    const getBadgeStyle = (accion) => {
        if (!accion) return styles.badgeGray;
        const acc = accion.toUpperCase();
        
        if (acc.includes('ELIMINAR') || acc.includes('DELETE') || acc.includes('BORRAR')) return styles.badgeRed;
        if (acc.includes('CREAR') || acc.includes('NUEVO') || acc.includes('REGISTRAR') || acc.includes('AGREGAR')) return styles.badgeGreen;
        if (acc.includes('PAGO') || acc.includes('CARGO') || acc.includes('FINANCIERO') || acc.includes('ABONO')) return styles.badgePurple;
        if (acc.includes('LOGIN') || acc.includes('LOGOUT') || acc.includes('AUTH') || acc.includes('PASSWORD') || acc.includes('CLAVE') || acc.includes('RESET')) return styles.badgeBlue;
        if (acc.includes('EDITAR') || acc.includes('ACTUALIZAR') || acc.includes('MODIFICAR') || acc.includes('ESTADO') || acc.includes('SUSPENDER') || acc.includes('REACTIVAR') || acc.includes('CORTE') || acc.includes('CAMBIO')) return styles.badgeOrange;
        
        return styles.badgeGray;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitleWrap}>
                    <div className={styles.headerIcon}>
                        <Activity size={28} />
                    </div>
                    <h1 className={styles.title}>Registro de Actividad</h1>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar palabra clave o detalle..." 
                        value={busqueda}
                        onChange={(e) => {setBusqueda(e.target.value); setCurrentPage(1);}}
                        className={styles.searchInput}
                    />
                </div>
                
                <div className={styles.filterBox}>
                    <User size={18} className={styles.filterIcon}/>
                    <select 
                        value={filtroUsuario} 
                        onChange={(e) => {setFiltroUsuario(e.target.value); setCurrentPage(1);}}
                        className={styles.selectFilter}
                    >
                        <option value="TODOS">Todos los usuarios</option>
                    </select>
                </div>

                <div className={styles.filterBox}>
                    <Filter size={18} className={styles.filterIcon}/>
                    <select 
                        value={filtroAccion} 
                        onChange={(e) => {setFiltroAccion(e.target.value); setCurrentPage(1);}}
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

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>Cargando registros del sistema...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.colFecha}>Fecha / Hora</th>
                                    <th className={styles.colAccion}>Acción</th>
                                    <th className={styles.colUsuario}>Usuario</th>
                                    <th>Detalle del Evento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div className={`${styles.dateText} ${styles.dateTextWrap}`}>
                                                <Calendar size={14}/>
                                                {new Date(log.fecha).toLocaleDateString()}
                                            </div>
                                            <div className={`${styles.dateText} ${styles.timeTextMargin}`}>
                                                {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getBadgeStyle(log.accion)}`}>
                                                {log.accion}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.userWrap}>
                                                <User size={14} className={styles.dateText}/>
                                                <span className={styles.userText}>{log.usuario || 'Sistema'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.detailWrap}>
                                                <FileText size={16} className={styles.detailIcon}/>
                                                {log.detalle}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className={styles.emptyState}>
                                            No se encontraron registros que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        <TablePagination 
                            totalItems={totalItems} 
                            itemsPerPage={itemsPerPage} 
                            currentPage={currentPage} 
                            onPageChange={setCurrentPage} 
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default Logs;