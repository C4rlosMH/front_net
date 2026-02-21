import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingDown, Plus, Trash2, Calendar, Tag, Activity, Home, Package, ArrowLeft, Search } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import api from "../api/axios";
import TablePagination from "../components/TablePagination";
import styles from "./styles/Gastos.module.css";

function Gastos() {
    const [gastos, setGastos] = useState([]);
    const [resumen, setResumen] = useState({ totalMes: 0, fijo: 0, operativo: 0, inventario: 0, otros: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", monto: "", categoria: "Otros" });
    
    // Estados para los filtros y paginación
    const [filtroCategoria, setFiltroCategoria] = useState("TODOS");
    const [busqueda, setBusqueda] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    // Recargar datos cuando cambia la página, el filtro o la búsqueda
    useEffect(() => { 
        fetchGastos(); 
    }, [currentPage, filtroCategoria, busqueda]);

    const fetchGastos = async () => {
        try {
            setLoading(true);
            // Petición al backend enviando los parámetros
            const response = await api.get("/gastos", {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    categoria: filtroCategoria,
                    search: busqueda
                }
            });
            
            setGastos(response.data.gastos);
            setTotalItems(response.data.total);
            setResumen(response.data.resumen);
            
        } catch (error) {
            toast.error("Error al obtener los gastos");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nuevoGasto.concepto.trim() || !nuevoGasto.monto) return toast.warning("Concepto y monto obligatorios");

        try {
            await api.post("/gastos", {
                concepto: nuevoGasto.concepto, monto: parseFloat(nuevoGasto.monto), categoria: nuevoGasto.categoria
            });
            toast.success("Gasto registrado");
            setNuevoGasto({ concepto: "", monto: "", categoria: "Otros" });
            fetchGastos(); // Recargar la tabla y los KPIs
        } catch (error) {
            toast.error("Error al registrar");
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este registro?")) return;
        try {
            await api.delete(`/gastos/${id}`);
            toast.success("Gasto eliminado");
            // Si eliminamos el único elemento de la última página, retrocedemos una página
            if (gastos.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchGastos();
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    // Datos procesados para la gráfica (alimentados directamente del backend)
    const dataCategorias = [
        { name: 'Fijos', value: resumen.fijo, color: '#3b82f6' },      
        { name: 'Operativos', value: resumen.operativo, color: '#f59e0b' }, 
        { name: 'Inventario', value: resumen.inventario, color: '#a855f7' },   
        { name: 'Otros', value: resumen.otros, color: '#64748b' }       
    ].filter(d => d.value > 0); 

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)} title="Regresar">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.titleContainer}>
                        <TrendingDown className={styles.titleIcon} size={28} />
                        <h1 className={styles.title}>Control de Egresos</h1>
                    </div>
                </div>
                <p className={styles.subtitle}>
                    Registra los gastos operativos, pagos a proveedores y compras de insumos.
                </p>
            </header>

            <main className={styles.content}>
                {/* KPIs */}
                <div className={styles.kpiGrid}>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px' }}><Activity size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gasto Total (Mes)</p><h3 style={{ margin: 0 }}>${resumen.totalMes.toFixed(2)}</h3></div>
                    </div>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '10px' }}><Home size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costos Fijos</p><h3 style={{ margin: 0 }}>${resumen.fijo.toFixed(2)}</h3></div>
                    </div>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '10px' }}><Package size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Inventario / Compras</p><h3 style={{ margin: 0 }}>${resumen.inventario.toFixed(2)}</h3></div>
                    </div>
                </div>

                {/* Grid para Formulario + Gráfica */}
                <div className={styles.actionGrid}>
                    <div className={styles.formCard}>
                        <h3 className={styles.cardTitle}>Registrar Gasto</h3>
                        <form className={styles.gastoForm} onSubmit={handleSubmit}>
                            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                <label>Concepto</label>
                                <input type="text" value={nuevoGasto.concepto} onChange={e => setNuevoGasto({...nuevoGasto, concepto: e.target.value})} className={styles.inputField} placeholder="Ej. Pago de luz antena" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Monto ($)</label>
                                <input type="number" step="0.01" value={nuevoGasto.monto} onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})} className={styles.inputField} placeholder="0.00" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Categoría</label>
                                <select value={nuevoGasto.categoria} onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})} className={styles.inputField}>
                                    <option value="Fijo">Gasto Fijo</option><option value="Operativo">Operativo</option><option value="Inventario">Inventario</option><option value="Otros">Otros</option>
                                </select>
                            </div>
                            <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`}><Plus size={18} /> Guardar Gasto</button>
                        </form>
                    </div>

                    <div className={`${styles.formCard} ${styles.chartCard}`}>
                        <h3 className={styles.cardTitle}>Distribución Mensual</h3>
                        <div className={styles.chartWrapper}>
                            {dataCategorias.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataCategorias}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {dataCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.emptyChart}>No hay gastos este mes</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla y Filtros */}
                <div className={styles.historySection}>
                    <h3 className={styles.cardTitle}>Historial de Egresos</h3>
                    
                    <div className={styles.filterBar}>
                        <div className={styles.tabs}>
                            <button className={`${styles.tab} ${filtroCategoria === 'TODOS' ? styles.tabActive : ''}`} onClick={() => {setFiltroCategoria("TODOS"); setCurrentPage(1);}}>Todos</button>
                            <button className={`${styles.tab} ${filtroCategoria === 'Fijo' ? styles.tabActive : ''}`} onClick={() => {setFiltroCategoria("Fijo"); setCurrentPage(1);}}>Fijos</button>
                            <button className={`${styles.tab} ${filtroCategoria === 'Operativo' ? styles.tabActive : ''}`} onClick={() => {setFiltroCategoria("Operativo"); setCurrentPage(1);}}>Operativos</button>
                            <button className={`${styles.tab} ${filtroCategoria === 'Inventario' ? styles.tabActive : ''}`} onClick={() => {setFiltroCategoria("Inventario"); setCurrentPage(1);}}>Inventario</button>
                            <button className={`${styles.tab} ${filtroCategoria === 'Otros' ? styles.tabActive : ''}`} onClick={() => {setFiltroCategoria("Otros"); setCurrentPage(1);}}>Otros</button>
                        </div>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon}/>
                            <input 
                                type="text" 
                                placeholder="Buscar concepto..." 
                                value={busqueda} 
                                onChange={(e) => {setBusqueda(e.target.value); setCurrentPage(1);}} 
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className={styles.loading}>Cargando registros...</td></tr>
                                ) : gastos.length === 0 ? (
                                    <tr><td colSpan="5" className={styles.emptyState}>No se encontraron gastos.</td></tr>
                                ) : (
                                    gastos.map(g => (
                                        <tr key={g.id}>
                                            <td><div className={styles.cellWithIcon}><Calendar size={14} className={styles.cellIcon} /> {new Date(g.fecha).toLocaleDateString()}</div></td>
                                            <td className={styles.conceptoCell}>{g.concepto}</td>
                                            <td><div className={styles.cellWithIcon}><Tag size={14} className={styles.cellIcon} /> {g.categoria}</div></td>
                                            <td className={styles.montoCell}>${parseFloat(g.monto).toFixed(2)}</td>
                                            <td><button className={styles.deleteBtn} onClick={() => handleEliminar(g.id)} title="Eliminar gasto"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        {totalItems > 0 && (
                            <TablePagination 
                                totalItems={totalItems} 
                                itemsPerPage={itemsPerPage} 
                                currentPage={currentPage} 
                                onPageChange={setCurrentPage} 
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Gastos;