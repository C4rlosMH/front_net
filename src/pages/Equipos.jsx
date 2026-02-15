import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import TablePagination from "../components/TablePagination"; 
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react"; 
import styles from "./styles/Equipos.module.css";

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS"); 
    const [showModal, setShowModal] = useState(false);
    const [equipoEditar, setEquipoEditar] = useState(null);

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
            setValue("nombre", equipo.nombre);
            setValue("marca", equipo.marca);
            setValue("modelo", equipo.modelo);
            setValue("tipo", equipo.tipo);
            setValue("mac", equipo.mac_address); 
            setValue("serie", equipo.serie);
            setValue("precio_compra", equipo.precio_compra);
            setValue("estado", equipo.estado);
            
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
                nombre: data.nombre, 
                tipo: data.tipo,
                marca: data.marca,
                modelo: data.modelo,
                mac_address: data.mac,
                serie: data.serie || null,
                precio_compra: data.precio_compra ? parseFloat(data.precio_compra) : null,
                fecha_compra: data.fecha_compra || null,
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

    const eliminarEquipo = async (id) => {
        const confirmar = window.confirm("¿Estas seguro de que deseas ELIMINAR permanentemente este equipo del inventario?");
        
        if (confirmar) {
            try {
                await client.delete(`/equipos/${id}`);
                toast.success("Equipo eliminado del sistema");
                cargarEquipos();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || "Error al eliminar el equipo");
            }
        }
    };

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
                <button className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("ANTENA")}>Antenas</button>
                <button className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("ROUTER")}>Routers</button>
                <button className={`${styles.tab} ${filtro === 'MODEM' ? styles.tabActive : ''}`} onClick={() => handleFiltroChange("MODEM")}>Modems/ONUs</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre / Equipo</th>
                            <th>Tipo</th>
                            <th>Serie / MAC</th>
                            <th>Compra</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentEquipos.length === 0 ? (
                            <tr><td colSpan="6" className={styles.emptyState}>No hay equipos en esta vista</td></tr>
                        ) : (
                            currentEquipos.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div className={e.nombre ? styles.textMainBold : styles.textMutedBold}>
                                            {e.nombre || e.marca}
                                        </div>
                                        <small className={styles.textMutedSmall}>
                                            {e.nombre ? `${e.marca} ${e.modelo}` : e.modelo}
                                        </small>
                                    </td>
                                    <td>
                                        {e.tipo === 'ANTENA' && <span className={`${styles.badge} ${styles.badgeAntena}`}>Antena</span>}
                                        {e.tipo === 'ROUTER' && <span className={`${styles.badge} ${styles.badgeRouter}`}>Router</span>}
                                        {e.tipo === 'MODEM' && <span className={`${styles.badge} ${styles.badgeModem}`}>Modem</span>}
                                    </td>
                                    <td>
                                        <div className={styles.fontMono}>MAC: {e.mac_address}</div>
                                        {e.serie && <div className={styles.fontMonoGray}>SN: {e.serie}</div>}
                                    </td>
                                    <td>
                                        {e.precio_compra ? `$${e.precio_compra}` : '-'}
                                        <br/>
                                        <small className={styles.textGraySmall}>{e.fecha_compra ? new Date(e.fecha_compra).toLocaleDateString() : ''}</small>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${e.estado === 'ALMACEN' ? styles.badgeAlmacen : styles.badgeDefault}`}>
                                            {e.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.flexActions}>
                                            <button 
                                                onClick={() => openModal(e)} 
                                                className={styles.btnEdit}
                                                title="Editar Equipo"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => eliminarEquipo(e.id)} 
                                                className={styles.btnDelete}
                                                title="Eliminar Equipo"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
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

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{equipoEditar ? "Editar Equipo" : "Registrar Equipo"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGroup}>
                                <label>Nombre Identificador (Opcional)</label>
                                <input 
                                    {...register("nombre")} 
                                    className={styles.input} 
                                    placeholder="Ej: Router Principal, Antena Sector 1..." 
                                    autoFocus 
                                />
                            </div>

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
                                    <option value="MODEM">Modem / ONU</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Direccion MAC *</label>
                                <input {...register("mac", { required: true })} className={styles.input} placeholder="AA:BB:CC:DD:EE:FF" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Numero de Serie (Opcional)</label>
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

                            {equipoEditar && (
                                <div className={styles.estadoEditContainer}>
                                    <label className={styles.estadoEditLabel}>Estado del Equipo</label>
                                    <select {...register("estado")} className={`${styles.select} ${styles.estadoEditSelect}`}>
                                        <option value="ALMACEN">En Almacen (Disponible)</option>
                                        <option value="INSTALADO">Instalado (En cliente)</option>
                                        <option value="RETIRADO">Retirado (Revision)</option>
                                        <option value="OBSOLETO">Obsoleto / Danado</option>
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