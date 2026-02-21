import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Plus, Trash2, Search, Save, Minus, Activity, Wifi, Plug, Link2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "../api/axios";
import TablePagination from "../components/TablePagination";
import styles from "./styles/Insumos.module.css";

function Insumos() {
    const [insumos, setInsumos] = useState([]);
    const [catalogoCompleto, setCatalogoCompleto] = useState([]);
    // <-- Actualizamos el estado inicial para los 4 KPIs
    const [kpis, setKpis] = useState({ fibra: 0, utp: 0, conectoresRJ45: 0, conectoresFibra: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const [busqueda, setBusqueda] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    const [modoRegistro, setModoRegistro] = useState('existente'); 
    const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
    
    const [nuevoInsumo, setNuevoInsumo] = useState({
        nombre: "", cantidad: "", unidad_medida: "Metros", costo: ""
    });
    
    const [cantidadesEditadas, setCantidadesEditadas] = useState({});

    useEffect(() => { fetchInsumos(); }, [currentPage, busqueda]);

    useEffect(() => {
        if (modoRegistro === 'existente' && insumoSeleccionado) {
            const material = catalogoCompleto.find(i => String(i.id) === String(insumoSeleccionado));
            if (material) {
                setNuevoInsumo(prev => ({ ...prev, unidad_medida: material.unidad_medida }));
            }
        }
    }, [insumoSeleccionado, modoRegistro, catalogoCompleto]);

    const fetchInsumos = async () => {
        try {
            setLoading(true);
            const response = await api.get("/insumos", {
                params: { page: currentPage, limit: itemsPerPage, search: busqueda }
            });
            
            setInsumos(response.data.insumos);
            setTotalItems(response.data.total);
            setKpis(response.data.kpis);
            setCatalogoCompleto(response.data.catalogo || []);

            if (response.data.catalogo?.length === 0) setModoRegistro('nuevo');

            const iniciales = {};
            response.data.insumos.forEach(insumo => { iniciales[insumo.id] = insumo.cantidad; });
            setCantidadesEditadas(iniciales);
        } catch (error) {
            toast.error("Error al cargar inventario");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (modoRegistro === 'nuevo' && !nuevoInsumo.nombre.trim()) return toast.warning("Ingresa el nombre del material");
        if (modoRegistro === 'existente' && !insumoSeleccionado) return toast.warning("Selecciona un material de la lista");
        if (!nuevoInsumo.cantidad || parseFloat(nuevoInsumo.cantidad) <= 0) return toast.warning("Ingresa una cantidad válida mayor a 0");

        try {
            let nombreGasto = "";

            if (modoRegistro === 'existente') {
                const materialExistente = catalogoCompleto.find(i => String(i.id) === String(insumoSeleccionado));
                const nuevaCantidad = parseFloat(materialExistente.cantidad) + parseFloat(nuevoInsumo.cantidad);
                
                await api.put(`/insumos/${materialExistente.id}`, { cantidad: nuevaCantidad });
                nombreGasto = materialExistente.nombre;
            } else {
                await api.post("/insumos", {
                    nombre: nuevoInsumo.nombre,
                    cantidad: parseFloat(nuevoInsumo.cantidad),
                    unidad_medida: nuevoInsumo.unidad_medida
                });
                nombreGasto = nuevoInsumo.nombre;
            }
            
            if (nuevoInsumo.costo && parseFloat(nuevoInsumo.costo) > 0) {
                await api.post("/gastos", {
                    concepto: `Compra inventario: ${nombreGasto}`,
                    monto: parseFloat(nuevoInsumo.costo),
                    categoria: "Inventario"
                });
                toast.success("Inventario actualizado y gasto registrado");
            } else {
                toast.success("Inventario actualizado (sin costo)");
            }

            setNuevoInsumo({ nombre: "", cantidad: "", unidad_medida: "Metros", costo: "" });
            setInsumoSeleccionado("");
            if (catalogoCompleto.length > 0) setModoRegistro('existente');
            
            fetchInsumos();
        } catch (error) {
            toast.error("Error al registrar la compra");
        }
    };

    const handleActualizar = async (id, nuevaCant) => {
        if (nuevaCant < 0) return toast.warning("Cantidad no válida");
        try {
            await api.put(`/insumos/${id}`, { cantidad: parseFloat(nuevaCant) });
            toast.success("Stock actualizado");
            fetchInsumos();
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este material?")) return;
        try {
            await api.delete(`/insumos/${id}`);
            toast.success("Material eliminado");
            if (insumos.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
            else fetchInsumos();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)} title="Regresar">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.titleContainer}>
                        <Layers className={styles.titleIcon} size={28} />
                        <h1 className={styles.title}>Materiales e Insumos</h1>
                    </div>
                </div>
                <p className={styles.subtitle}>
                    Gestiona el inventario de consumibles: cable, conectores, herrajes y otros suministros.
                </p>
            </header>

            <main className={styles.content}>
                {/* <-- LOS 4 KPIs ACTUALIZADOS --> */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '10px' }}><Activity size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bobinas Fibra Óptica</p><h3 style={{ margin: 0 }}>{kpis.fibra} <small>m</small></h3></div>
                    </div>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px' }}><Wifi size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bobinas UTP</p><h3 style={{ margin: 0 }}>{kpis.utp} <small>m</small></h3></div>
                    </div>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '10px' }}><Plug size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conectores RJ45</p><h3 style={{ margin: 0 }}>{kpis.conectoresRJ45} <small>pzas</small></h3></div>
                    </div>
                    <div className={styles.formCard} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '10px' }}><Link2 size={24}/></div>
                        <div><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conectores Fibra (Fast)</p><h3 style={{ margin: 0 }}>{kpis.conectoresFibra} <small>pzas</small></h3></div>
                    </div>
                </div>

                <div className={styles.formCard}>
                    <h3 className={styles.cardTitle}>Registrar Compra / Ingreso</h3>
                    <form className={styles.insumoForm} onSubmit={handleSubmit} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                        
                        <div className={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Material</label>
                                {catalogoCompleto.length > 0 && (
                                    <button 
                                        type="button" 
                                        onClick={() => setModoRegistro(modoRegistro === 'existente' ? 'nuevo' : 'existente')}
                                        className={styles.toggleTextBtn}
                                    >
                                        {modoRegistro === 'existente' ? '+ Crear material nuevo' : 'Usar existente'}
                                    </button>
                                )}
                            </div>
                            
                            {modoRegistro === 'existente' ? (
                                <select 
                                    value={insumoSeleccionado} 
                                    onChange={e => setInsumoSeleccionado(e.target.value)} 
                                    className={styles.inputField}
                                >
                                    <option value="">-- Selecciona del inventario --</option>
                                    {catalogoCompleto.map(mat => (
                                        <option key={mat.id} value={mat.id}>{mat.nombre}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    type="text" 
                                    placeholder="Ej. Conectores Fast SC/APC" 
                                    value={nuevoInsumo.nombre} 
                                    onChange={e => setNuevoInsumo({...nuevoInsumo, nombre: e.target.value})} 
                                    className={styles.inputField} 
                                />
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Cantidad a sumar</label>
                            <input type="number" step="0.01" value={nuevoInsumo.cantidad} onChange={e => setNuevoInsumo({...nuevoInsumo, cantidad: e.target.value})} className={styles.inputField} />
                        </div>
                        
                        <div className={styles.inputGroup}>
                            <label>Unidad</label>
                            <select 
                                value={nuevoInsumo.unidad_medida} 
                                onChange={e => setNuevoInsumo({...nuevoInsumo, unidad_medida: e.target.value})} 
                                className={styles.inputField}
                                disabled={modoRegistro === 'existente'}
                                style={modoRegistro === 'existente' ? { backgroundColor: 'var(--body-bg)', opacity: 0.7 } : {}}
                            >
                                <option>Metros</option><option>Piezas</option><option>Rollos</option>
                            </select>
                        </div>
                        
                        <div className={styles.inputGroup}>
                            <label>Costo Total ($)</label>
                            <input type="number" step="0.01" placeholder="Opcional" value={nuevoInsumo.costo} onChange={e => setNuevoInsumo({...nuevoInsumo, costo: e.target.value})} className={styles.inputField} />
                        </div>
                        <button type="submit" className={styles.submitBtn}><Plus size={18} /> Registrar</button>
                    </form>
                    <small style={{ color: 'var(--text-muted)', marginTop: '10px', display: 'block' }}>* Si ingresas un costo, se agregará automáticamente al Control de Egresos en la categoría "Inventario".</small>
                </div>

                <div className={styles.inventorySection}>
                    <div className={styles.inventoryHeader}>
                        <h3 className={styles.cardTitle}>Inventario Actual</h3>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon}/>
                            <input 
                                type="text" 
                                placeholder="Buscar material..." 
                                value={busqueda} 
                                onChange={(e) => {setBusqueda(e.target.value); setCurrentPage(1);}} 
                                className={styles.searchInput}
                            />
                        </div>
                    </div>
                    
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Material</th><th>Unidad</th><th>Stock Actual</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className={styles.loading}>Cargando registros...</td></tr>
                                ) : insumos.length === 0 ? (
                                    <tr><td colSpan="4" className={styles.emptyState}>No se encontró material registrado.</td></tr>
                                ) : (
                                    insumos.map(insumo => (
                                        <tr key={insumo.id}>
                                            <td className={styles.nombreCell}>{insumo.nombre}</td>
                                            <td><span className={styles.unidadBadge}>{insumo.unidad_medida}</span></td>
                                            <td>
                                                <div className={styles.stockControl}>
                                                    <button className={styles.stockBtn} onClick={() => handleActualizar(insumo.id, Number(insumo.cantidad) - 1)}><Minus size={14} /></button>
                                                    <input type="number" className={styles.stockInput} value={cantidadesEditadas[insumo.id] !== undefined ? cantidadesEditadas[insumo.id] : insumo.cantidad} onChange={(e) => setCantidadesEditadas({...cantidadesEditadas, [insumo.id]: e.target.value})}/>
                                                    <button className={styles.stockBtn} onClick={() => handleActualizar(insumo.id, Number(insumo.cantidad) + 1)}><Plus size={14} /></button>
                                                    {Number(cantidadesEditadas[insumo.id]) !== Number(insumo.cantidad) && (
                                                        <button className={styles.saveBtn} onClick={() => handleActualizar(insumo.id, cantidadesEditadas[insumo.id])}><Save size={16} /></button>
                                                    )}
                                                </div>
                                            </td>
                                            <td><button className={styles.deleteBtn} onClick={() => handleEliminar(insumo.id)}><Trash2 size={16} /></button></td>
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
export default Insumos;