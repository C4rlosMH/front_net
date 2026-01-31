import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import client from "../api/axios";
import LocationPicker from "../components/LocationPicker";
import TablePagination from "../components/TablePagination";
import { toast } from "sonner";
import { Plus, Wallet, Eye, Pencil } from "lucide-react";
import styles from "./styles/Clientes.module.css";

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [equiposLibres, setEquiposLibres] = useState([]);
    const [cajasList, setCajasList] = useState([]);
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Estados Modales
    const [showModal, setShowModal] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [clienteAPagar, setClienteAPagar] = useState(null);
    const [montoAbono, setMontoAbono] = useState("");

    const { register, handleSubmit, setValue, reset } = useForm();

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [resClientes, resPlanes, resEquipos, resCajas] = await Promise.all([
                client.get("/clientes"),
                client.get("/planes"),
                client.get("/equipos"),
                client.get("/cajas").catch(() => ({ data: [] })) 
            ]);

            setClientes(resClientes.data);
            setPlanes(resPlanes.data);
            setEquiposLibres(resEquipos.data.filter(e => e.estado === 'ALMACEN'));
            setCajasList(resCajas.data);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            toast.error("Error al cargar datos de clientes. Revisa la consola.");
        }
    };

    const openModal = (cliente = null) => {
        setClienteEditar(cliente);
        if (cliente) {
            setValue("nombre_completo", cliente.nombre_completo);
            setValue("telefono", cliente.telefono);
            setValue("ip_asignada", cliente.ip_asignada);
            setValue("direccion", cliente.direccion);
            setValue("planId", cliente.plan?.id);
            setValue("dia_pago", cliente.dia_pago);
            setValue("fecha_instalacion", cliente.fecha_instalacion ? cliente.fecha_instalacion.split('T')[0] : "");
            setValue("latitud", cliente.latitud);
            setValue("longitud", cliente.longitud);
            setValue("cajaId", cliente.caja?.id);
        } else {
            reset();
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (!data.latitud || !data.longitud) {
                return toast.warning("Por favor selecciona la ubicación en el mapa");
            }

            const payload = {
                ...data,
                latitud: parseFloat(data.latitud),
                longitud: parseFloat(data.longitud),
                planId: data.planId ? parseInt(data.planId) : null,
                equipoId: data.equipoId ? parseInt(data.equipoId) : null,
                dia_pago: parseInt(data.dia_pago),
                cajaId: data.cajaId ? parseInt(data.cajaId) : null
            };

            if (clienteEditar) {
                await client.put(`/clientes/${clienteEditar.id}`, payload);
                toast.success("Cliente actualizado");
            } else {
                await client.post("/clientes", payload);
                toast.success("Cliente registrado");
            }

            setShowModal(false);
            reset();
            setClienteEditar(null);
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar cliente");
        }
    };

    // Paginación lógica
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);

    const abrirModalPago = (c) => { 
        setClienteAPagar(c); 
        setMontoAbono(c.saldo_actual > 0 ? c.saldo_actual : (c.plan?.precio_mensual || ""));
        setShowPagoModal(true);
    };
    
    const handleRegistrarPago = async (e) => {
        // ... (misma lógica de antes)
        e.preventDefault();
        try {
            await client.post("/pagos/abono", {
                clienteId: clienteAPagar.id,
                monto: parseFloat(montoAbono),
                descripcion: "Cobro manual desde clientes"
            });
            toast.success("Pago registrado");
            setShowPagoModal(false);
            cargarDatos();
        } catch (error) { 
            toast.error("Error al registrar pago"); 
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Cartera de Clientes</h1>
                <button className={styles.addButton} onClick={() => openModal(null)}>
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>IP / Dirección</th>
                            <th>Plan & Conexión</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentClientes.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding: 20}}>No hay clientes registrados o error de carga.</td></tr>
                        ) : (
                            currentClientes.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <b>{c.nombre_completo}</b><br/>
                                        <small style={{color:'gray'}}>{c.telefono}</small>
                                    </td>
                                    <td>
                                        {c.ip_asignada || "DHCP"}
                                        <br/>
                                        <small>{c.direccion}</small>
                                    </td>
                                    <td>
                                        <div style={{fontWeight:500}}>{c.plan ? c.plan.nombre : "Sin Plan"}</div>
                                        {c.caja && (
                                            <div className={styles.cajaBadge}>
                                                🔌 {c.caja.nombre}
                                            </div>
                                        )}
                                        <div style={{fontSize:'0.75rem', color:'gray', marginTop:2}}>
                                            Corte: Día {c.dia_pago || 15}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.statusBadge} style={{
                                            backgroundColor: c.estado === 'ACTIVO' ? '#dcfce7' : '#fee2e2',
                                            color: c.estado === 'ACTIVO' ? '#166534' : '#991b1b'
                                        }}>
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{display:'flex'}}>
                                            <button className={`${styles.actionBtn} ${styles.btnPay}`} onClick={() => abrirModalPago(c)} title="Registrar Pago">
                                                <Wallet size={18} />
                                            </button>
                                            <Link to={`/pagos/cliente/${c.id}`}>
                                                <button className={`${styles.actionBtn} ${styles.btnProfile}`} title="Ver Historial">
                                                    <Eye size={18} />
                                                </button>
                                            </Link>
                                            <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => openModal(c)} title="Editar">
                                                <Pencil size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <TablePagination 
                    totalItems={clientes.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            {/* MODALES */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGrid}>
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label>Nombre Completo</label>
                                    <input {...register("nombre_completo", { required: true })} className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Teléfono</label>
                                    <input {...register("telefono")} className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>IP Asignada</label>
                                    <input {...register("ip_asignada")} className={styles.input} />
                                </div>
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label>Dirección</label>
                                    <input {...register("direccion")} className={styles.input} />
                                </div>
                                
                                <div className={styles.inputGroup}>
                                    <label>Plan</label>
                                    <select {...register("planId")} className={styles.select}>
                                        <option value="">-- Seleccionar --</option>
                                        {planes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Caja (NAP)</label>
                                    <select {...register("cajaId")} className={styles.select}>
                                        <option value="">-- Sin Conexión --</option>
                                        {cajasList.map(caja => (
                                            <option key={caja.id} value={caja.id}>{caja.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Día de Pago</label>
                                    <select {...register("dia_pago")} className={styles.select}>
                                        <option value="15">Día 15</option>
                                        <option value="30">Día 30</option>
                                    </select>
                                </div>
                                
                                {!clienteEditar && (
                                    <div className={styles.inputGroup}>
                                        <label>Asignar Equipo</label>
                                        <select {...register("equipoId")} className={styles.select}>
                                            <option value="">-- Ninguno --</option>
                                            {equiposLibres.map(e => (
                                                <option key={e.id} value={e.id}>{e.modelo}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className={styles.inputGroup}>
                                    <label>Fecha Instalación</label>
                                    <input type="date" {...register("fecha_instalacion")} className={styles.input} />
                                </div>

                                <div className={`${styles.fullWidth} ${styles.inputGroup}`}>
                                    <label>Ubicación</label>
                                    <LocationPicker 
                                        initialLat={clienteEditar?.latitud} 
                                        initialLng={clienteEditar?.longitud}
                                        onLocationChange={(c) => { setValue("latitud", c.lat); setValue("longitud", c.lng); }} 
                                    />
                                    <input type="hidden" {...register("latitud")} />
                                    <input type="hidden" {...register("longitud")} />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Pago Rápido (Simplificado en estilos, usa la misma clase modal) */}
            {showPagoModal && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{width: 400}}>
                        <div className={styles.modalHeader}>
                            <h3>Registrar Pago</h3>
                            <button onClick={()=>setShowPagoModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Monto a abonar ($)</label>
                            <input 
                                type="number" 
                                value={montoAbono} 
                                onChange={e=>setMontoAbono(e.target.value)} 
                                className={styles.input} 
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={()=>setShowPagoModal(false)} className={styles.btnCancel}>Cancelar</button>
                            <button onClick={handleRegistrarPago} className={styles.btnSubmit}>Confirmar</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}

export default Clientes;