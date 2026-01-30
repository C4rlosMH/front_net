import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import { toast } from "sonner";
import { Plus } from "lucide-react"; 
import styles from "./styles/Equipos.module.css";

function Equipos() {
    const [equipos, setEquipos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS"); 
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
            // CORRECCIÓN: Preparamos los datos como los pide la Base de Datos
            const payload = {
                ...data,
                mac_address: data.mac,  // Renombramos mac a mac_address
                estado: "ALMACEN"       // Estado por defecto
            };
            
            // Borramos la propiedad 'mac' antigua para no enviar basura
            delete payload.mac; 

            await client.post("/equipos", payload);
            toast.success("Equipo registrado exitosamente");
            setShowModal(false);
            reset();
            cargarEquipos();
        } catch (error) {
            console.error(error);
            // Mostrar mensaje real del error si viene del backend
            toast.error(error.response?.data?.message || "Error al guardar equipo");
        }
    };

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

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${filtro === 'TODOS' ? styles.tabActive : ''}`} onClick={() => setFiltro("TODOS")}>Todos</button>
                <button className={`${styles.tab} ${filtro === 'ANTENA' ? styles.tabActive : ''}`} onClick={() => setFiltro("ANTENA")}>📡 Antenas</button>
                <button className={`${styles.tab} ${filtro === 'ROUTER' ? styles.tabActive : ''}`} onClick={() => setFiltro("ROUTER")}>📶 Routers</button>
                <button className={`${styles.tab} ${filtro === 'MODEM' ? styles.tabActive : ''}`} onClick={() => setFiltro("MODEM")}>🔌 Módems/ONUs</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Marca / Modelo</th>
                            <th>Tipo</th>
                            <th>MAC</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equiposFiltrados.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center'}}>No hay equipos</td></tr>
                        ) : (
                            equiposFiltrados.map(e => (
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
                                    <td style={{fontFamily:'monospace'}}>{e.mac_address}</td>
                                    <td>
                                        <span className={styles.badge} style={{
                                            background: e.estado === 'ALMACEN' ? '#dcfce7' : '#f3f4f6',
                                            color: e.estado === 'ALMACEN' ? '#166534' : '#4b5563'
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

            {/* MODAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Registrar Equipo</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* CAMPO MARCA (Nuevo) */}
                            <div className={styles.formGroup}>
                                <label>Marca</label>
                                <input {...register("marca", { required: true })} className={styles.input} placeholder="Ej: Huawei, TP-Link..." />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Modelo</label>
                                <input {...register("modelo", { required: true })} className={styles.input} placeholder="Ej: HG8145V5" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tipo de Equipo</label>
                                <select {...register("tipo")} className={styles.select}>
                                    <option value="ANTENA">Antena</option>
                                    <option value="ROUTER">Router</option>
                                    <option value="MODEM">Módem</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Dirección MAC</label>
                                <input {...register("mac", { required: true })} className={styles.input} placeholder="AA:BB:CC:DD:EE:FF" />
                            </div>

                            {/* Nombre opcional o autogenerado, lo quitamos para simplificar si no es clave */}
                            
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