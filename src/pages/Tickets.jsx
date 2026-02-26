import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    MessageSquare, Trash2, Search, Filter, 
    AlertCircle, Clock 
} from "lucide-react";
import ModalMensajeTicket from "../components/ModalMensajeTicket";
import TablePagination from "../components/TablePagination";
import styles from "./styles/Tickets.module.css";

function Tickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [kpis, setKpis] = useState({ abiertos: 0, en_progreso: 0, esperando: 0 });
    const [loading, setLoading] = useState(true);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const cargarTickets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await client.get("/tickets", {
                params: {
                    page,
                    limit: 10,
                    estado: estadoFiltro,
                    search: search
                }
            });
            
            if (Array.isArray(res.data)) {
                console.warn("El backend esta devolviendo el formato antiguo. Por favor, reinicia tu servidor.");
                setTickets(res.data);
                setTotalPages(1);
                return;
            }

            setTickets(res.data.tickets || []);
            setTotalPages(res.data.totalPages || 1);
            setKpis(res.data.kpis || { abiertos: 0, en_progreso: 0, esperando: 0 });
            
        } catch (error) {
            toast.error("Error al cargar los tickets");
        } finally {
            setLoading(false);
        }
    }, [page, estadoFiltro, search]);

    useEffect(() => {
        cargarTickets();
    }, [cargarTickets]);

    const handleDelete = async (id) => {
        if (!window.confirm("Estas seguro de eliminar este ticket?")) return;
        try {
            await client.delete(`/tickets/${id}`);
            toast.success("Ticket eliminado");
            cargarTickets(); 
        } catch (error) {
            toast.error("Error al eliminar el ticket");
        }
    };

    const abrirTicket = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 className={styles.title}>Bandeja de Soporte</h1>
                    <p className={styles.subtitle}>Gestiona y responde las solicitudes de atencion activa</p>
                </div>
                <button 
                    onClick={() => navigate('/soporte/metricas')}
                    style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.target.style.background = '#334155'}
                    onMouseOut={(e) => e.target.style.background = '#1e293b'}
                >
                    Ver Rendimiento
                </button>
            </div>

            <div className={styles.kpiGridReduced}>
                <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
                    <div className={styles.kpiIcon}><AlertCircle size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiValue}>{kpis?.abiertos || 0}</span>
                        <span className={styles.kpiLabel}>Tickets Abiertos</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiWarning}`}>
                    <div className={styles.kpiIcon}><Clock size={24} /></div>
                    <div className={styles.kpiInfo}>
                        <span className={styles.kpiValue}>
                            {(kpis?.en_progreso || 0) + (kpis?.esperando || 0)}
                        </span>
                        <span className={styles.kpiLabel}>En Progreso / Esperando</span>
                    </div>
                </div>
            </div>

            <div className={styles.filtersBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente, asunto o ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterBox}>
                    <Filter size={18} className={styles.filterIcon} />
                    <select 
                        value={estadoFiltro} 
                        onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }}
                        className={styles.filterSelect}
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="ABIERTO">Abiertos</option>
                        <option value="EN_PROGRESO">En Progreso</option>
                        <option value="ESPERANDO">Esperando Cliente</option>
                        <option value="CERRADO">Cerrados</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>Cliente</th>
                                <th>Responsable</th>
                                <th>Categoria</th>
                                <th>Asunto</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={{textAlign: 'center', padding: '30px'}}>Cargando tickets...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan="8" style={{textAlign: 'center', padding: '30px'}}>No hay solicitudes pendientes.</td></tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className={ticket.tiene_mensajes_nuevos ? styles.rowUnread : ''}>
                                        <td style={{fontWeight: 'bold', color: 'var(--text-muted)'}}>#{ticket.id}</td>
                                        <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                            {ticket.cliente?.nombre_completo || 'Cliente Eliminado'}
                                        </td>
                                        <td>
                                            {ticket.responsable ? (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                                    {ticket.responsable.nombre}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '600' }}>Sin asignar</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.tagCategory}>{ticket.categoria}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {ticket.tiene_mensajes_nuevos && <span className={styles.dotNew} title="Mensaje nuevo"></span>}
                                                <span className={styles.asuntoText}>
                                                    {ticket.asunto}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles['badge' + ticket.estado]}`}>
                                                {ticket.estado.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => abrirTicket(ticket)} className={styles.btnView} title="Atender">
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(ticket.id)} className={styles.btnDelete} title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {!loading && totalPages > 1 && (
                    <TablePagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                    />
                )}
            </div>

            {modalOpen && (
                <ModalMensajeTicket 
                    ticket={ticketSeleccionado} 
                    onClose={() => { setModalOpen(false); cargarTickets(); }} 
                />
            )}
        </div>
    );
}

export default Tickets;