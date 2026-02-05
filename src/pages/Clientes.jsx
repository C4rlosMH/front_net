import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import client from "../api/axios";
import LocationPicker from "../components/LocationPicker";
import TablePagination from "../components/TablePagination";
import { toast } from "sonner";
import { 
    Plus, Wallet, Eye, Pencil, Wifi, Cable, 
    Calendar, CheckCircle2, Clock, DollarSign 
} from "lucide-react";
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
    const [tipoPago, setTipoPago] = useState("LIQUIDACION"); 
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [mesPago, setMesPago] = useState("");

    const { register, handleSubmit, setValue, reset, watch } = useForm();
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
            
            // --- NUEVO: Cargar estado actual ---
            setValue("estado", cliente.estado); 
            
            setValue("latitud", cliente.latitud);
            setValue("longitud", cliente.longitud);
            
            if (cliente.caja) {
                setTipoInstalacion("FIBRA");
                setValue("cajaId", cliente.caja.id);
                const routerAsignado = cliente.equipos?.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                setValue("routerId", routerAsignado?.id || "");
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
            setValue("estado", "ACTIVO"); // Estado por defecto
        }
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (!data.latitud || !data.longitud) return toast.warning("Ubicación requerida");

            let equiposIds = [];
            if (tipoInstalacion === 'RADIO') {
                if (!clienteEditar && (!data.antenaId || !data.routerId)) return toast.error("Radio requiere Antena y Router");
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
                equiposIds
            };

            if (clienteEditar) {
                await client.put(`/clientes/${clienteEditar.id}`, payload);
                toast.success("Cliente actualizado");
            } else {
                await client.post("/clientes", payload);
                toast.success("Cliente registrado");
            }
            setShowModal(false);
            cargarDatos();
        } catch (error) {
            toast.error("Error al guardar cliente");
        }
    };

    // ... (El resto de las funciones de pago y helpers se mantienen igual) ...
    const generarMeses = () => {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const hoy = new Date();
        const opciones = [];
        for (let i = -1; i <= 1; i++) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
            opciones.push(`${meses[d.getMonth()]} ${d.getFullYear()}`);
        }
        return opciones;
    };

    const abrirModalPago = (c) => { 
        setClienteAPagar(c);
        const deuda = parseFloat(c.saldo_actual || 0);
        const costoPlan = parseFloat(c.plan?.precio_mensual || 0);
        setTipoPago(deuda > 0 ? "LIQUIDACION" : "ABONO");
        setMontoAbono(deuda > 0 ? deuda : costoPlan);
        const meses = generarMeses();
        setMesPago(meses[1]);
        setMetodoPago("EFECTIVO");
        setShowPagoModal(true);
    };
    
    const handleRegistrarPago = async (e) => {
        e.preventDefault();
        try {
            await client.post("/pagos/abono", {
                clienteId: clienteAPagar.id,
                monto: parseFloat(montoAbono),
                tipo_pago: tipoPago,
                metodo_pago: metodoPago,
                mes_servicio: mesPago,
            });
            toast.success("Pago registrado correctamente");
            setShowPagoModal(false);
            cargarDatos();
        } catch (error) { 
            toast.error("Error al registrar pago"); 
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);
    const listaMeses = generarMeses();

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
                        {currentClientes.map(c => (
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
                                    {c.caja ? (
                                        <span className={`${styles.cajaBadge} ${styles.badgeFibra}`}>
                                            <Cable size={12} /> NAP: {c.caja.nombre}
                                        </span>
                                    ) : (
                                        <span className={`${styles.cajaBadge} ${styles.badgeRadio}`}>
                                            <Wifi size={12} /> Antena / Radio
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <span className={`${styles.statusBadge} ${c.estado === 'ACTIVO' ? styles.statusActive : styles.statusInactive}`}
                                          style={c.estado === 'CORTADO' ? {backgroundColor: '#fee2e2', color:'#991b1b'} : 
                                                 c.estado === 'SUSPENDIDO' ? {backgroundColor: '#fef3c7', color:'#b45309'} : {}}
                                    >
                                        {c.estado}
                                    </span>
                                    {c.saldo_actual > 0 && <div style={{color:'#ef4444', fontSize:'0.75rem', fontWeight:'bold', marginTop:4}}>Debe: ${c.saldo_actual}</div>}
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
                        ))}
                    </tbody>
                </table>
                <TablePagination totalItems={clientes.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* MODAL CLIENTE */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                             <div className={styles.formGroup}>
                                <label>Tipo de Instalación</label>
                                <div className={styles.typeSelector}>
                                    <button type="button" onClick={() => setTipoInstalacion("FIBRA")} className={`${styles.typeButton} ${tipoInstalacion === 'FIBRA' ? styles.typeActive : styles.typeInactive}`}><Cable size={18}/> Fibra Óptica</button>
                                    <button type="button" onClick={() => setTipoInstalacion("RADIO")} className={`${styles.typeButton} ${tipoInstalacion === 'RADIO' ? styles.typeActive : styles.typeInactive}`}><Wifi size={18}/> Radio / Antena</button>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Nombre Completo</label><input {...register("nombre_completo", {required:true})} className={styles.input}/></div>
                                <div className={styles.formGroup}><label>Teléfono</label><input {...register("telefono")} className={styles.input}/></div>
                            </div>
                            
                            {/* --- FILA NUEVA: PLAN Y ESTADO --- */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Plan</label><select {...register("planId")} className={styles.select}><option value="">-- Seleccionar --</option>{planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                                
                                <div className={styles.formGroup}>
                                    <label>Estado del Servicio</label>
                                    <select {...register("estado")} className={styles.select} style={{fontWeight:'bold'}}>
                                        <option value="ACTIVO" style={{color:'green'}}>ACTIVO</option>
                                        <option value="SUSPENDIDO" style={{color:'orange'}}>SUSPENDIDO</option>
                                        <option value="CORTADO" style={{color:'red'}}>CORTADO</option>
                                        <option value="BAJA" style={{color:'gray'}}>BAJA DEFINITIVA</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>IP Asignada</label><input {...register("ip_asignada")} className={styles.input}/></div>
                                <div className={styles.formGroup}><label>Día Pago</label><select {...register("dia_pago")} className={styles.select}><option value="15">Día 15</option><option value="30">Día 30</option></select></div>
                            </div>
                            <div className={styles.formGroup}><label>Dirección</label><input {...register("direccion")} className={styles.input}/></div>

                            {/* SECCIÓN CONEXIÓN */}
                            <div className={styles.specificSection}>
                                <h4 className={styles.sectionTitle}>{tipoInstalacion==='FIBRA'?'Conexión Fibra':'Conexión Radio'}</h4>
                                {tipoInstalacion==='FIBRA' ? (
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}><label>Caja NAP</label><select {...register("cajaId")} className={styles.select}><option value="">-- Seleccionar --</option>{cajasList.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                                        <div className={styles.formGroup}><label>Router (Opcional)</label><select {...register("routerId")} className={styles.select}><option value="">-- Seleccionar --</option>{routersLibres.map(e=><option key={e.id} value={e.id}>{e.nombre ? e.nombre : `${e.modelo} (${e.mac_address})`}</option>)}</select></div>
                                    </div>
                                ) : (
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}><label>Antena *</label><select {...register("antenaId")} className={styles.select}><option value="">-- Seleccionar --</option>{antenasLibres.map(e=><option key={e.id} value={e.id}>{e.nombre ? e.nombre : `${e.modelo} (${e.mac_address})`}</option>)}</select></div>
                                        <div className={styles.formGroup}><label>Router *</label><select {...register("routerId")} className={styles.select}><option value="">-- Seleccionar --</option>{routersLibres.map(e=><option key={e.id} value={e.id}>{e.nombre ? e.nombre : `${e.modelo} (${e.mac_address})`}</option>)}</select></div>
                                    </div>
                                )}
                                <div className={styles.formGroup}><label>Fecha Instalación</label><input type="date" {...register("fecha_instalacion")} className={styles.input}/></div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ubicación</label>
                                <div style={{height: 250, borderRadius: 8, overflow:'hidden', border:'1px solid var(--border)'}}>
                                    <LocationPicker initialLat={clienteEditar?.latitud} initialLng={clienteEditar?.longitud} onLocationChange={(c)=>{setValue("latitud",c.lat);setValue("longitud",c.lng)}} clients={clientes} cajas={cajasList}/>
                                </div>
                                <input type="hidden" {...register("latitud")} />
                                <input type="hidden" {...register("longitud")} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={()=>setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal Pago (Mismo código que antes) */}
            {showPagoModal && clienteAPagar && (
                 <div className={styles.modalOverlay} onClick={() => setShowPagoModal(false)}>
                    <div className={styles.modal} style={{width: 500}} onClick={(e) => e.stopPropagation()}>
                        {/* ... (Contenido del modal de pago igual al anterior) ... */}
                        <div className={styles.modalHeader}>
                            <h3>Registrar Pago</h3>
                            <button onClick={()=>setShowPagoModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        {/* Resumen Cliente */}
                        <div style={{background: 'var(--body-bg)', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)'}}>
                            <div className={styles.bold}>{clienteAPagar.nombre_completo}</div>
                            <div style={{display:'flex', justifyContent:'space-between', marginTop:5}}>
                                <span className={styles.muted}>Plan: {clienteAPagar.plan?.nombre}</span>
                                <span style={{color: clienteAPagar.saldo_actual > 0 ? '#ef4444' : '#16a34a', fontWeight:'bold'}}>
                                    Deuda: ${clienteAPagar.saldo_actual}
                                </span>
                            </div>
                        </div>
                        {/* Selector Tipo Pago */}
                        <div className={styles.typeSelector} style={{marginBottom: 15}}>
                            <button type="button" onClick={()=>{setTipoPago("LIQUIDACION"); setMontoAbono(clienteAPagar.saldo_actual || 0)}} className={`${styles.typeButton} ${tipoPago==='LIQUIDACION' ? styles.typeActive : styles.typeInactive}`}>
                                <CheckCircle2 size={16}/> Liquidar
                            </button>
                            <button type="button" onClick={()=>setTipoPago("ABONO")} className={`${styles.typeButton} ${tipoPago==='ABONO' ? styles.typeActive : styles.typeInactive}`}>
                                <DollarSign size={16}/> Abono
                            </button>
                            <button type="button" onClick={()=>{setTipoPago("APLAZADO"); setMontoAbono(0)}} className={`${styles.typeButton} ${tipoPago==='APLAZADO' ? styles.typeActive : styles.typeInactive}`}>
                                <Clock size={16}/> Aplazado
                            </button>
                        </div>
                        {/* Formulario Pago */}
                        <form onSubmit={handleRegistrarPago}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Mes Correspondiente</label>
                                    <select value={mesPago} onChange={e=>setMesPago(e.target.value)} className={styles.select}>{listaMeses.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Método de Pago</label>
                                    <select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className={styles.select} disabled={tipoPago === 'APLAZADO'}>
                                        <option value="EFECTIVO">Efectivo 💵</option>
                                        <option value="TRANSFERENCIA">Transferencia 🏦</option>
                                        <option value="DEPOSITO">Depósito 🏪</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Monto a Pagar ($)</label>
                                <div style={{position:'relative'}}>
                                    <input type="number" step="0.01" value={montoAbono} onChange={e=>setMontoAbono(e.target.value)} className={styles.input} style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', paddingLeft: 35}} disabled={tipoPago === 'APLAZADO'} autoFocus />
                                    <span style={{position:'absolute', left:12, top:12, color:'var(--text-muted)', fontWeight:'bold'}}>$</span>
                                </div>
                                {tipoPago === 'APLAZADO' && <small style={{color:'orange'}}>* Se registrará solo como nota, sin ingreso de dinero.</small>}
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={()=>setShowPagoModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Confirmar Pago</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
}

export default Clientes;