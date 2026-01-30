import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus, Router, Radio, Server } from "lucide-react";
import styles from "./styles/Equipos.module.css";

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS"); // TODOS, ANTENA, ROUTER, ONU
    const [showModal, setShowModal] = useState(false);
    
    const { register, handleSubmit, reset } = useForm();

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

    const onSubmit = async (data) => {
        try {
            await client.post("/equipos", data);
            toast.success("Equipo registrado exitosamente");
            setShowModal(false);
            reset();
            cargarEquipos();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar equipo");
        }
    };

    // Filtrar la lista según la pestaña seleccionada
    const equiposFiltrados = filtro === "TODOS" 
        ? equipos 
        : equipos.filter(e => e.tipo === filtro);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inventario de Equipos</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nuevo Equipo
                </button>
            </div>

            {/* PESTAÑAS DE FILTRO */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${filtro === 'TODOS' ? styles.tabActive : ''}`}
                    onClick={() => setFiltro("TODOS")}
                >
                    Todos
                </button>
                <button 
                    className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`}
                    onClick={() => setFiltro("ANTENA")}
                >
                    📡 Antenas
                </button>
                <button 
                    className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`}
                    onClick={() => setFiltro("ROUTER")}
                >
                    📶 Routers
                </button>
                <button 
                    className={`${styles.tab} ${filtro === 'ONU' ? styles.tabActive : ''}`}
                    onClick={() => setFiltro("ONU")}
                >
                    🔌 ONUs
                </button>
            </div>

            {/* TABLA */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre / Modelo</th>
                            <th>Tipo</th>
                            <th>MAC</th>
                            <th>IP Asignada</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equiposFiltrados.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center'}}>No hay equipos en esta categoría</td></tr>
                        ) : (
                            equiposFiltrados.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{e.nombre}</div>
                                        <small style={{color:'var(--text-muted)'}}>{e.modelo}</small>
                                    </td>
                                    <td>
                                        {e.tipo === 'ANTENA' && <span className={styles.badge} style={{background:'#dbeafe', color:'#1e40af'}}>Antena</span>}
                                        {e.tipo === 'ROUTER' && <span className={styles.badge} style={{background:'#fae8ff', color:'#86198f'}}>Router</span>}
                                        {e.tipo === 'ONU' && <span className={styles.badge} style={{background:'#ffedd5', color:'#9a3412'}}>ONU</span>}
                                    </td>
                                    <td style={{fontFamily:'monospace'}}>{e.mac}</td>
                                    <td>{e.ip_asignada || "-"}</td>
                                    <td>
                                        <span className={styles.badge} style={{
                                            background: e.estado === 'DISPONIBLE' ? '#dcfce7' : '#f3f4f6',
                                            color: e.estado === 'DISPONIBLE' ? '#166534' : '#4b5563'
                                        }}>
                                            {e.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE REGISTRO */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Registrar Equipo</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGroup}>
                                <label>Nombre del Equipo</label>
                                <input {...register("nombre", { required: true })} className={styles.input} placeholder="Ej: MikroTik SXT" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Modelo</label>
                                <input {...register("modelo")} className={styles.input} placeholder="RBSXTsqG-5acD" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tipo de Equipo</label>
                                <select {...register("tipo")} className={styles.select}>
                                    <option value="ANTENA">Antena</option>
                                    <option value="ROUTER">Router</option>
                                    <option value="ONU">ONU (Fibra)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Dirección MAC</label>
                                <input {...register("mac", { required: true })} className={styles.input} placeholder="AA:BB:CC:DD:EE:FF" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>IP de Gestión (Opcional)</label>
                                <input {...register("ip")} className={styles.input} placeholder="192.168.88.1" />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Equipos;