import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import client from "../api/axios";
import LocationPicker from "../components/LocationPicker";
import TablePagination from "../components/TablePagination";
import { toast } from "sonner";
import { Plus, Wallet, Eye, Pencil, Wifi, Cable } from "lucide-react";
import styles from "./styles/Clientes.module.css";

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [antenasLibres, setAntenasLibres] = useState([]);
    const [routersLibres, setRoutersLibres] = useState([]);
    const [cajasList, setCajasList] = useState([]);
    
    const [tipoInstalacion, setTipoInstalacion] = useState("FIBRA");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [showModal, setShowModal] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [clienteAPagar, setClienteAPagar] = useState(null);
    const [montoAbono, setMontoAbono] = useState("");

    const { register, handleSubmit, setValue, reset, watch } = useForm();
    
    // Validación visual
    const watchAntena = watch("antenaId");
    const watchRouter = watch("routerId");

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
            setCajasList(resCajas.data);

            const libres = resEquipos.data.filter(e => e.estado === 'ALMACEN');
            setAntenasLibres(libres.filter(e => e.tipo === 'ANTENA'));
            setRoutersLibres(libres.filter(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM'));
        } catch (error) {
            console.error(error);
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
            
            if (cliente.caja) {
                setTipoInstalacion("FIBRA");
                setValue("cajaId", cliente.caja.id);
                const routerAsignado = cliente.equipos?.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                setValue("routerId", routerAsignado?.id || "");
                setValue("antenaId", "");
            } else {
                setTipoInstalacion("RADIO");
                setValue("cajaId", "");
                const antenaAsignada = cliente.equipos?.find(e => e.tipo === 'ANTENA');
                const routerAsignado = cliente.equipos?.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                setValue("antenaId", antenaAsignada?.id || "");
                setValue("routerId", routerAsignado?.id || "");
            }
        } else {
            reset();
            setTipoInstalacion("FIBRA");
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (!data.latitud || !data.longitud) {
                return toast.warning("La ubicación en el mapa es requerida");
            }

            let equiposIds = [];

            if (tipoInstalacion === 'RADIO') {
                if (!clienteEditar && (!data.antenaId || !data.routerId)) {
                   return toast.error("En Radio debes seleccionar Antena Y Router");
                }
                if (data.antenaId) equiposIds.push(parseInt(data.antenaId));
                if (data.routerId) equiposIds.push(parseInt(data.routerId));
            } else {
                if (data.routerId) equiposIds.push(parseInt(data.routerId));
            }

            const payload = {
                ...data,
                latitud: parseFloat(data.latitud),
                longitud: parseFloat(data.longitud),
                planId: data.planId ? parseInt(data.planId) : null,
                dia_pago: parseInt(data.dia_pago),
                cajaId: tipoInstalacion === 'FIBRA' && data.cajaId ? parseInt(data.cajaId) : null,
                equiposIds: equiposIds 
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
                            <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No hay clientes registrados.</td></tr>
                        ) : (
                            currentClientes.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div className={styles.bold}>{c.nombre_completo}</div>
                                        <div className={styles.muted}>{c.telefono}</div>
                                    </td>
                                    <td>
                                        {c.ip_asignada || "DHCP"} <br/>
                                        <div className={styles.muted}>{c.direccion}</div>
                                    </td>
                                    <td>
                                        <div className={styles.medium}>{c.plan?.nombre || "Sin Plan"}</div>
                                        
                                        <div className={styles.smallMuted}>
                                            {c.equipos && c.equipos.map(e => (
                                                <div key={e.id}>• {e.tipo}: {e.modelo}</div>
                                            ))}
                                        </div>

                                        {c.caja ? (
                                            <span className={`${styles.cajaBadge} ${styles.badgeFibra}`}>
                                                <Cable size={12} /> NAP: {c.caja.nombre}
                                            </span>
                                        ) : (
                                            <span className={`${styles.cajaBadge} ${styles.badgeRadio}`}>
                                                <Wifi size={12} /> Antena / Radio
                                            </span>
                                        )}
                                        
                                        <div className={styles.smallMuted}>Corte: Día {c.dia_pago || 15}</div>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${c.estado === 'ACTIVO' ? styles.statusActive : styles.statusInactive}`}>
                                            {c.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.flexActions}>
                                            <button className={`${styles.actionBtn} ${styles.btnPay}`} onClick={() => abrirModalPago(c)} title="Pagar">
                                                <Wallet size={18} />
                                            </button>
                                            <Link to={`/pagos/cliente/${c.id}`}>
                                                <button className={`${styles.actionBtn} ${styles.btnProfile}`} title="Historial">
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

            {/* MODAL CLIENTE */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            
                            <div className={styles.formGroup}>
                                <label>Tipo de Instalación</label>
                                <div className={styles.typeSelector}>
                                    <button 
                                        type="button" 
                                        onClick={() => setTipoInstalacion("FIBRA")}
                                        className={`${styles.typeButton} ${tipoInstalacion === 'FIBRA' ? styles.typeActive : styles.typeInactive}`}
                                    >
                                        <Cable size={18}/> Fibra Óptica
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setTipoInstalacion("RADIO")}
                                        className={`${styles.typeButton} ${tipoInstalacion === 'RADIO' ? styles.typeActive : styles.typeInactive}`}
                                    >
                                        <Wifi size={18}/> Radio / Antena
                                    </button>
                                </div>
                            </div>

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

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>IP Asignada</label>
                                    <input {...register("ip_asignada")} className={styles.input} placeholder="192.168..." />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Plan</label>
                                    <select {...register("planId")} className={styles.select}>
                                        <option value="">-- Seleccionar --</option>
                                        {planes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Dirección</label>
                                    <input {...register("direccion")} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Día Pago</label>
                                    <select {...register("dia_pago")} className={styles.select}>
                                        <option value="15">Día 15</option>
                                        <option value="30">Día 30</option>
                                    </select>
                                </div>
                            </div>

                            {/* SECCIÓN DE CONEXIÓN */}
                            <div className={styles.specificSection}>
                                <h4 className={styles.sectionTitle}>
                                    {tipoInstalacion === 'FIBRA' ? 'Conexión de Fibra Óptica' : 'Equipos de Radio Enlace'}
                                </h4>
                                
                                {tipoInstalacion === 'FIBRA' ? (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label>Caja NAP</label>
                                            <select {...register("cajaId")} className={styles.select}>
                                                <option value="">-- Seleccionar NAP --</option>
                                                {cajasList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Router / ONU (Opcional)</label>
                                            <select {...register("routerId")} className={styles.select}>
                                                <option value="">-- Seleccionar --</option>
                                                {routersLibres.map(e => <option key={e.id} value={e.id}>{e.modelo} ({e.mac_address})</option>)}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Antena <span className={styles.required}>*</span></label>
                                            <select 
                                                {...register("antenaId")} 
                                                className={`${styles.select} ${(!clienteEditar && !watchAntena) ? styles.selectError : ''}`}
                                            >
                                                <option value="">-- Seleccionar Antena --</option>
                                                {antenasLibres.map(e => <option key={e.id} value={e.id}>{e.modelo} ({e.mac_address})</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Router Wi-Fi <span className={styles.required}>*</span></label>
                                            <select 
                                                {...register("routerId")} 
                                                className={`${styles.select} ${(!clienteEditar && !watchRouter) ? styles.selectError : ''}`}
                                            >
                                                <option value="">-- Seleccionar Router --</option>
                                                {routersLibres.map(e => <option key={e.id} value={e.id}>{e.modelo} ({e.mac_address})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`${styles.formGroup} ${styles.noMargin}`}>
                                     <label>Fecha Instalación</label>
                                     <input type="date" {...register("fecha_instalacion")} className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ubicación</label>
                                <div style={{height: 250, borderRadius: 8, overflow:'hidden', border:'1px solid var(--border)'}}>
                                    <LocationPicker 
                                        initialLat={clienteEditar?.latitud} 
                                        initialLng={clienteEditar?.longitud}
                                        onLocationChange={(c) => { setValue("latitud", c.lat); setValue("longitud", c.lng); }} 
                                    />
                                </div>
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
            
            {showPagoModal && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{width: 400}}>
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