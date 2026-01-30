import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import TablePagination from "../components/TablePagination"; 
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react"; 
import styles from "./styles/Equipos.module.css";

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS"); 
    const [showModal, setShowModal] = useState(false);
    const [equipoEditar, setEquipoEditar] = useState(null);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        cargarEquipos();
    }, []);

    const cargarEquipos = async () => {
        try {
            const res = await client.get("/equipos");
            setEquipos(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar inventario");
        }
    };

    const openModal = (equipo = null) => {
        setEquipoEditar(equipo);
        if (equipo) {
            // Cargar datos existentes
            setValue("marca", equipo.marca);
            setValue("modelo", equipo.modelo);
            setValue("tipo", equipo.tipo);
            setValue("mac", equipo.mac_address); 
            setValue("serie", equipo.serie);
            setValue("precio_compra", equipo.precio_compra);
            setValue("estado", equipo.estado); // <--- IMPORTANTE: Cargar el estado actual
            
            if (equipo.fecha_compra) {
                setValue("fecha_compra", new Date(equipo.fecha_compra).toISOString().split('T')[0]);
            } else {
                setValue("fecha_compra", "");
            }
        } else {
            reset();
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                tipo: data.tipo,
                marca: data.marca,
                modelo: data.modelo,
                mac_address: data.mac,
                serie: data.serie || null,
                precio_compra: data.precio_compra ? parseFloat(data.precio_compra) : null,
                fecha_compra: data.fecha_compra || null,
                // Si editamos, usamos el estado que el usuario elija. Si es nuevo, forzamos ALMACEN.
                estado: equipoEditar ? data.estado : "ALMACEN"
            };

            if (equipoEditar) {
                await client.put(`/equipos/${equipoEditar.id}`, payload);
                toast.success("Equipo actualizado correctamente");
            } else {
                await client.post("/equipos", payload);
                toast.success("Equipo registrado correctamente");
            }
            
            setShowModal(false);
            reset();
            setEquipoEditar(null);
            cargarEquipos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al guardar equipo");
        }
    };

    // Filtros y Paginación
    const equiposFiltrados = filtro === "TODOS" 
        ? equipos 
        : equipos.filter(e => e.tipo === filtro);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEquipos = equiposFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    const handleFiltroChange = (nuevoFiltro) => {
        setFiltro(nuevoFiltro);
        setCurrentPage(1);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inventario de Equipos</h1>
                <button className={styles.addButton} onClick={() => openModal(null)}>
                    <Plus size={20} /> Nuevo Equipo
                </button>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${filtro === 'TODOS' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("TODOS")}>Todos</button>
                <button className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("ANTENA")}>📡 Antenas</button>
                <button className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("ROUTER")}>📶 Routers</button>
                <button className={`${styles.tab} ${filtro === 'MODEM' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("MODEM")}>🔌 Módems/ONUs</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Marca / Modelo</th>
                            <th>Tipo</th>
                            <th>Serie / MAC</th>
                            <th>Compra</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentEquipos.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign:'center'}}>No hay equipos en esta vista</td></tr>
                        ) : (
                            currentEquipos.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{e.marca}</div>
                                        <small style={{color:'var(--text-muted)'}}>{e.modelo}</small>
                                    </td>
                                    <td>
                                        {e.tipo === 'ANTENA' && <span className={styles.badge} style={{background:'#dbeafe', color:'#1e40af'}}>Antena</span>}
                                        {e.tipo === 'ROUTER' && <span className={styles.badge} style={{background:'#fae8ff', color:'#86198f'}}>Router</span>}
                                        {e.tipo === 'MODEM' && <span className={styles.badge} style={{background:'#ffedd5', color:'#9a3412'}}>Módem</span>}
                                    </td>
                                    <td>
                                        <div style={{fontFamily:'monospace', fontSize:'0.85rem'}}>MAC: {e.mac_address}</div>
                                        {e.serie && <div style={{fontFamily:'monospace', fontSize:'0.85rem', color:'gray'}}>SN: {e.serie}</div>}
                                    </td>
                                    <td>
                                        {e.precio_compra ? `$${e.precio_compra}` : '-'}
                                        <br/>
                                        <small style={{color:'gray'}}>{e.fecha_compra ? new Date(e.fecha_compra).toLocaleDateString() : ''}</small>
                                    </td>
                                    <td>
                                        <span className={styles.badge} style={{
                                            background: e.estado === 'ALMACEN' ? '#dcfce7' : '#f3f4f6',
                                            color: e.estado === 'ALMACEN' ? '#166534' : '#4b5563'
                                        }}>
                                            {e.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => openModal(e)} 
                                            className={styles.btnEdit}
                                            title="Editar Equipo"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                <TablePagination 
                    totalItems={equiposFiltrados.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            {/* MODAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{equipoEditar ? "Editar Equipo" : "Registrar Equipo"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Marca *</label>
                                    <input {...register("marca", { required: true })} className={styles.input} placeholder="Ej: TP-Link" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Modelo *</label>
                                    <input {...register("modelo", { required: true })} className={styles.input} placeholder="Ej: Archer C6" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tipo de Equipo *</label>
                                <select {...register("tipo")} className={styles.select}>
                                    <option value="ANTENA">Antena</option>
                                    <option value="ROUTER">Router</option>
                                    <option value="MODEM">Módem / ONU</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Dirección MAC *</label>
                                <input {...register("mac", { required: true })} className={styles.input} placeholder="AA:BB:CC:DD:EE:FF" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Número de Serie (Opcional)</label>
                                <input {...register("serie")} className={styles.input} placeholder="SN123456789" />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Costo ($)</label>
                                    <input type="number" step="0.01" {...register("precio_compra")} className={styles.input} placeholder="0.00" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fecha Compra</label>
                                    <input type="date" {...register("fecha_compra")} className={styles.input} />
                                </div>
                            </div>

                            {/* --- CAMPO ESTADO (Solo visible al Editar) --- */}
                            {equipoEditar && (
                                <div className={styles.formGroup} style={{marginTop: '15px', padding: '10px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa'}}>
                                    <label style={{color: '#c2410c', fontWeight: 'bold'}}>Estado del Equipo</label>
                                    <select {...register("estado")} className={styles.select} style={{borderColor: '#fb923c'}}>
                                        <option value="ALMACEN">🟢 En Almacén (Disponible)</option>
                                        <option value="INSTALADO">🔵 Instalado (En cliente)</option>
                                        <option value="RETIRADO">🟠 Retirado (Revisión)</option>
                                        <option value="OBSOLETO">⚫ Obsoleto / Dañado</option>
                                    </select>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>
                                    {equipoEditar ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Equipos;