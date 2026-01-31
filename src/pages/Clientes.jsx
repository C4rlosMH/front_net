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

    const { register, handleSubmit, setValue, reset, watch } = useForm();
    
    // Para ver si seleccionó un equipo nuevo
    const watchEquipo = watch("equipoId");

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
            toast.error("Error al cargar datos.");
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
            setValue("equipoId", ""); 
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

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);

    const abrirModalPago = (c) => { 
        setClienteAPagar(c); 
        setMontoAbono(c.saldo_actual > 0 ? c.saldo_actual : (c.plan?.precio_mensual || ""));
        setShowPagoModal(true);
    };
    
    const handleRegistrarPago = async (e) => {
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
                            <tr><td colSpan="5" style={{textAlign:'center', padding: 20}}>No hay clientes registrados.</td></tr>
                        ) : (
                            currentClientes.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{c.nombre_completo}</div>
                                        <small style={{color:'var(--text-muted)'}}>{c.telefono}</small>
                                    </td>
                                    <td>
                                        {c.ip_asignada || "DHCP"}
                                        <br/>
                                        <small style={{color:'var(--text-muted)'}}>{c.direccion}</small>
                                    </td>
                                    <td>
                                        <div style={{fontWeight:500}}>{c.plan ? c.plan.nombre : "Sin Plan"}</div>
                                        {c.caja && (
                                            <span className={styles.cajaBadge}>
                                                NAP: {c.caja.nombre}
                                            </span>
                                        )}
                                        <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2}}>
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

            {/* MODAL PRINCIPAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Fila 1 */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Nombre Completo</label>
                                    <input {...register("nombre_completo", { required: true })} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Teléfono</label>
                                    <input {...register("telefono")} className={styles.input} />
                                </div>
                            </div>
                            
                            {/* Fila 2 */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>IP Asignada</label>
                                    <input {...register("ip_asignada")} className={styles.input} placeholder="Ej: 192.168.1.XX" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Dirección</label>
                                    <input {...register("direccion")} className={styles.input} />
                                </div>
                            </div>
                            
                            {/* Fila 3 */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Plan</label>
                                    <select {...register("planId")} className={styles.select}>
                                        <option value="">-- Seleccionar --</option>
                                        {planes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Día de Pago</label>
                                    <select {...register("dia_pago")} className={styles.select}>
                                        <option value="15">Día 15</option>
                                        <option value="30">Día 30</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fila 4: Caja y Fecha */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Caja (NAP)</label>
                                    <select {...register("cajaId")} className={styles.select}>
                                        <option value="">-- Sin Conexión --</option>
                                        {cajasList.map(caja => (
                                            <option key={caja.id} value={caja.id}>{caja.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fecha Instalación</label>
                                    <input type="date" {...register("fecha_instalacion")} className={styles.input} />
                                </div>
                            </div>

                            {/* SECCIÓN EQUIPO (Ancho completo) */}
                            <div className={styles.formGroup}>
                                <label>Equipo (Router/Antena)</label>
                                {clienteEditar && clienteEditar.equipo && !watchEquipo && (
                                    <div className={styles.infoBox}>
                                        <strong>Actual:</strong> {clienteEditar.equipo.modelo} ({clienteEditar.equipo.mac_address})
                                    </div>
                                )}
                                <select {...register("equipoId")} className={styles.select} style={{marginTop:5}}>
                                    <option value="">
                                        {clienteEditar ? "-- Cambiar Equipo (Opcional) --" : "-- Seleccionar Equipo --"}
                                    </option>
                                    {equiposLibres.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.modelo} - {e.mac_address}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* UBICACIÓN */}
                            <div className={styles.formGroup}>
                                <label>Ubicación</label>
                                <LocationPicker 
                                    initialLat={clienteEditar?.latitud} 
                                    initialLng={clienteEditar?.longitud}
                                    onLocationChange={(c) => { setValue("latitud", c.lat); setValue("longitud", c.lng); }} 
                                />
                                <input type="hidden" {...register("latitud")} />
                                <input type="hidden" {...register("longitud")} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Pago Rápido (Simplificado) */}
            {showPagoModal && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{width: 400, overflow:'hidden'}}>
                        <div className={styles.modalHeader}>
                            <h3>Registrar Pago</h3>
                            <button onClick={()=>setShowPagoModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <div className={styles.formGroup}>
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