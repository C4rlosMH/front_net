import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import client from "../api/axios";
import LocationPicker from "./LocationPicker";
import { toast } from "sonner";
import { Cable, Wifi } from "lucide-react";
import styles from "./styles/ClienteModal.module.css";

function ClienteModal({ isOpen, onClose, clienteEditar, clientesContext, onSuccess }) {
    const [planes, setPlanes] = useState([]);
    const [antenasLibres, setAntenasLibres] = useState([]);
    const [routersLibres, setRoutersLibres] = useState([]);
    const [cajasList, setCajasList] = useState([]);
    const [clientesMapa, setClientesMapa] = useState([]); // NUEVO ESTADO PARA EL MAPA
    const [tipoInstalacion, setTipoInstalacion] = useState("FIBRA");

    const { register, handleSubmit, setValue, reset } = useForm();

    useEffect(() => {
        if (isOpen) {
            cargarDependencias();
            
            if (clienteEditar) {
                setValue("nombre_completo", clienteEditar.nombre_completo);
                setValue("telefono", clienteEditar.telefono);
                setValue("ip_asignada", clienteEditar.ip_asignada);
                setValue("direccion", clienteEditar.direccion);
                setValue("planId", clienteEditar.plan?.id);
                setValue("dia_pago", clienteEditar.dia_pago);
                setValue("fecha_instalacion", clienteEditar.fecha_instalacion ? clienteEditar.fecha_instalacion.split('T')[0] : "");
                setValue("estado", clienteEditar.estado); 
                setValue("latitud", clienteEditar.latitud);
                setValue("longitud", clienteEditar.longitud);
                
                const tipoReal = clienteEditar.tipo_conexion ? clienteEditar.tipo_conexion.toUpperCase() : (clienteEditar.caja ? "FIBRA" : "RADIO");
                setTipoInstalacion(tipoReal);

                if (tipoReal === "FIBRA") {
                    if (clienteEditar.caja) setValue("cajaId", clienteEditar.caja.id);
                    const routerAsignado = clienteEditar.equipos?.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                    setValue("routerId", routerAsignado?.id || "");
                } else {
                    setValue("cajaId", "");
                    const antenaAsignada = clienteEditar.equipos?.find(e => e.tipo === 'ANTENA');
                    const routerAsignado = clienteEditar.equipos?.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                    if (antenaAsignada) setValue("antenaId", antenaAsignada.id);
                    if (routerAsignado) setValue("routerId", routerAsignado.id);
                }
            } else {
                reset();
                setTipoInstalacion("FIBRA");
                setValue("estado", "ACTIVO");
            }
        }
    }, [isOpen, clienteEditar]);

    const cargarDependencias = async () => {
        try {
            // Añadimos la petición de clientes al Promise.all
            const [resPlanes, resEquipos, resCajas, resClientes] = await Promise.all([
                client.get("/planes"),
                client.get("/equipos?limit=1000"), 
                client.get("/cajas").catch(() => ({ data: [] })),
                client.get("/clientes?limit=1000").catch(() => ({ data: { clientes: [] } }))
            ]);

            setPlanes(resPlanes.data);
            setCajasList(resCajas.data);
            
            // Guardamos los clientes extraídos de la respuesta
            setClientesMapa(resClientes.data.clientes || []);

            const arrayEquipos = resEquipos.data.equipos || []; 
            const libres = arrayEquipos.filter(e => e.estado === 'ALMACEN');
            
            let libresAntenas = libres.filter(e => e.tipo === 'ANTENA');
            let libresRouters = libres.filter(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');

            if (clienteEditar && clienteEditar.equipos) {
                const antenaActual = clienteEditar.equipos.find(e => e.tipo === 'ANTENA');
                const routerActual = clienteEditar.equipos.find(e => e.tipo === 'ROUTER' || e.tipo === 'MODEM');
                if (antenaActual) libresAntenas = [antenaActual, ...libresAntenas];
                if (routerActual) libresRouters = [routerActual, ...libresRouters];
            }

            setAntenasLibres(libresAntenas);
            setRoutersLibres(libresRouters);
        } catch (error) {
            console.error("Error cargando dependencias:", error);
            toast.error("Error al cargar opciones de formulario");
        }
    };

    const onSubmit = async (data) => {
        try {
            if (!data.latitud || !data.longitud) return toast.warning("Ubicación en el mapa requerida");

            let equiposIds = [];
            if (tipoInstalacion === 'RADIO') {
                if (!clienteEditar && (!data.antenaId || !data.routerId)) return toast.error("Conexión Radio requiere Antena y Router");
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
                equiposIds,
                tipo_conexion: tipoInstalacion.toLowerCase(),
            };

            delete payload.confiabilidad;
            delete payload.deuda_historica;

            if (clienteEditar) {
                await client.put(`/clientes/${clienteEditar.id}`, payload);
                toast.success("Cliente actualizado correctamente");
            } else {
                await client.post("/clientes", payload);
                toast.success("Cliente registrado correctamente");
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error("Error al guardar cliente");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
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
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Plan Asignado</label><select {...register("planId")} className={styles.select}><option value="">-- Seleccionar --</option>{planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                        <div className={styles.formGroup}>
                            <label>Estado del Servicio</label>
                            <select {...register("estado")} className={`${styles.select} ${styles.selectBold}`}>
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="SUSPENDIDO">SUSPENDIDO</option>
                                <option value="CORTADO">CORTADO</option>
                                <option value="BAJA">BAJA DEFINITIVA</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>IP Asignada</label>
                            <input {...register("ip_asignada")} className={styles.input} placeholder="Ej: 192.168..."/>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Día de Pago</label>
                            <select {...register("dia_pago")} className={styles.select}>
                                <option value="15">Día 15</option>
                                <option value="30">Día 30</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className={styles.formGroup}><label>Dirección Física</label><input {...register("direccion")} className={styles.input}/></div>

                    <div className={styles.specificSection}>
                        <h4 className={styles.sectionTitle}>{tipoInstalacion==='FIBRA'?'Conexión por Fibra':'Conexión Inalámbrica (Radio)'}</h4>
                        {tipoInstalacion==='FIBRA' ? (
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Caja NAP</label><select {...register("cajaId")} className={styles.select}><option value="">-- Seleccionar --</option>{cajasList.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                                <div className={styles.formGroup}><label>Router (Opcional)</label><select {...register("routerId")} className={styles.select}><option value="">-- Seleccionar --</option>{routersLibres.map(e=><option key={e.id} value={e.id}>{e.nombre ? e.nombre : `${e.modelo} (${e.mac_address})`}</option>)}</select></div>
                            </div>
                        ) : (
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Antena Receptora *</label><select {...register("antenaId")} className={styles.select}><option value="">-- Seleccionar --</option>{antenasLibres.map(e=><option key={e.id} value={e.id}>{e.modelo}</option>)}</select></div>
                                <div className={styles.formGroup}><label>Router WiFi *</label><select {...register("routerId")} className={styles.select}><option value="">-- Seleccionar --</option>{routersLibres.map(e=><option key={e.id} value={e.id}>{e.modelo}</option>)}</select></div>
                            </div>
                        )}
                        <div className={styles.formGroup}><label>Fecha de Instalación</label><input type="date" {...register("fecha_instalacion")} className={styles.input}/></div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ubicación Geográfica</label>
                        <div className={styles.mapWrapper}>
                            <LocationPicker 
                                initialLat={clienteEditar?.latitud} 
                                initialLng={clienteEditar?.longitud} 
                                onLocationChange={(c)=>{setValue("latitud",c.lat);setValue("longitud",c.lng)}} 
                                clients={clientesMapa} 
                                cajas={cajasList}
                            />
                        </div>
                        <input type="hidden" {...register("latitud")} />
                        <input type="hidden" {...register("longitud")} />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit}>Guardar Cliente</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClienteModal;