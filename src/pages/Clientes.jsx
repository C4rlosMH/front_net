import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom"; // <--- 1. IMPORTAR LINK
import client from "../api/axios";
import LocationPicker from "../components/LocationPicker";
import { toast } from "sonner";
import { Plus, Wallet, Eye } from "lucide-react"; // <--- 2. IMPORTAR EYE
import styles from "./styles/Clientes.module.css";

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [equiposLibres, setEquiposLibres] = useState([]);
    
    // Estados para Modales
    const [showModal, setShowModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    
    // Estados para el Modal de Pago
    const [clienteAPagar, setClienteAPagar] = useState(null);
    const [montoAbono, setMontoAbono] = useState("");

    const { register, handleSubmit, setValue, reset } = useForm();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resClientes, resPlanes, resEquipos] = await Promise.all([
                client.get("/clientes"),
                client.get("/planes"),
                client.get("/equipos")
            ]);

            setClientes(resClientes.data);
            setPlanes(resPlanes.data);
            setEquiposLibres(resEquipos.data.filter(e => e.estado === 'ALMACEN'));
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos del sistema");
        }
    };

    const onSubmit = async (data) => {
        try {
            if (!data.latitud || !data.longitud) {
                toast.warning("¡Debes seleccionar la ubicación en el mapa!");
                return;
            }

            const nuevoCliente = {
                ...data,
                latitud: parseFloat(data.latitud),
                longitud: parseFloat(data.longitud),
                planId: parseInt(data.planId),
                equipoId: data.equipoId ? parseInt(data.equipoId) : null,
                dia_pago: parseInt(data.dia_pago)
            };

            await client.post("/clientes", nuevoCliente);
            toast.success("Cliente registrado correctamente");
            setShowModal(false);
            reset(); 
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar cliente");
        }
    };

    const abrirModalPago = (cliente) => {
        setClienteAPagar(cliente);
        const sugerido = cliente.saldo_actual > 0 ? cliente.saldo_actual : (cliente.plan?.precio_mensual || "");
        setMontoAbono(sugerido);
        setShowPagoModal(true);
    };

    const handleRegistrarPago = async (e) => {
        e.preventDefault();
        if(!montoAbono || montoAbono <= 0) return toast.warning("Monto inválido");

        try {
            await client.post("/pagos/abono", {
                clienteId: clienteAPagar.id,
                monto: parseFloat(montoAbono),
                descripcion: "Cobro manual desde Lista de Clientes"
            });
            toast.success(`Pago de $${montoAbono} registrado exitosamente`);
            setShowPagoModal(false);
            setMontoAbono("");
            setClienteAPagar(null);
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar el pago");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Cartera de Clientes</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>IP / Dirección</th>
                            <th>Plan & Corte</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center'}}>No hay clientes registrados</td></tr>
                        ) : (
                            clientes.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <b>{c.nombre_completo}</b><br/>
                                        <small style={{color:'var(--text-muted)'}}>{c.telefono}</small>
                                    </td>
                                    <td>
                                        {c.ip_asignada || "DHCP"}<br/>
                                        <small>{c.direccion}</small>
                                    </td>
                                    <td>
                                        {c.plan ? (
                                            <>
                                                <span style={{fontWeight:'bold', color:'var(--primary)'}}>
                                                    {c.plan.nombre}
                                                </span>
                                                <div style={{fontSize:'0.8rem', color:'gray'}}>
                                                    Corte: Día {c.dia_pago || 15}
                                                </div>
                                            </>
                                        ) : "Sin Plan"}
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
                                        {/* --- BOTONES DE ACCIÓN --- */}
                                        <div style={{display:'flex'}}>
                                            {/* 1. Botón Pagar (Verde) */}
                                            <button 
                                                className={`${styles.actionBtn} ${styles.btnPay}`}
                                                onClick={() => abrirModalPago(c)}
                                                title="Registrar Abono"
                                            >
                                                <Wallet size={18} />
                                            </button>

                                            {/* 2. Botón Ver Perfil (Azul) */}
                                            <Link to={`/pagos/cliente/${c.id}`}>
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.btnProfile}`}
                                                    title="Ver Historial y Perfil"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALES (Sin cambios) */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Registrar Nuevo Cliente</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={styles.formGrid}>
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label>Nombre Completo</label>
                                    <input {...register("nombre_completo", { required: true })} className={styles.input} placeholder="Ej: Juan Pérez" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Teléfono</label>
                                    <input {...register("telefono")} className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>IP Asignada (Opcional)</label>
                                    <input {...register("ip_asignada")} className={styles.input} placeholder="192.168..." />
                                </div>
                                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                    <label>Dirección Física</label>
                                    <input {...register("direccion")} className={styles.input} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Plan de Internet</label>
                                    <select {...register("planId", { required: true })} className={styles.select}>
                                        <option value="">-- Seleccionar Plan --</option>
                                        {planes.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre} - ${p.precio_mensual} ({p.velocidad_mb}MB)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Día de Corte</label>
                                    <select {...register("dia_pago")} className={styles.select}>
                                        <option value="15">Día 15 de cada mes</option>
                                        <option value="30">Día 30 de cada mes</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Asignar Equipo</label>
                                    <select {...register("equipoId")} className={styles.select}>
                                        <option value="">-- Sin Equipo / Propio --</option>
                                        {equiposLibres.map(e => (
                                            <option key={e.id} value={e.id}>
                                                {e.tipo}: {e.modelo} ({e.mac_address})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Fecha Instalación</label>
                                    <input type="date" {...register("fecha_instalacion")} className={styles.input} defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className={`${styles.fullWidth} ${styles.inputGroup}`}>
                                    <label style={{fontWeight:'bold', color:'var(--primary)'}}>Ubicación Geográfica *</label>
                                    <LocationPicker onLocationChange={(coords) => {
                                        setValue("latitud", coords.lat);
                                        setValue("longitud", coords.lng);
                                    }} />
                                    <input type="hidden" {...register("latitud", { required: true })} />
                                    <input type="hidden" {...register("longitud", { required: true })} />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Guardar Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPagoModal && clienteAPagar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{width: '400px'}}>
                        <div className={styles.payModalHeader}>
                            <h2 style={{margin:0, color: '#15803d', textAlign:'center'}}>Registrar Abono</h2>
                        </div>
                        <div className={styles.payInfo}>
                            <p style={{margin:0, color:'gray'}}>Cliente:</p>
                            <h3 style={{margin: '5px 0 15px 0'}}>{clienteAPagar.nombre_completo}</h3>
                            <p style={{margin:0, color:'gray'}}>Plan Contratado:</p>
                            <b>{clienteAPagar.plan ? clienteAPagar.plan.nombre : "Sin Plan"}</b>
                        </div>
                        <form onSubmit={handleRegistrarPago}>
                            <label style={{display:'block', marginBottom:10, fontWeight:'bold'}}>Monto a Cobrar ($):</label>
                            <input 
                                type="number" 
                                className={styles.inputMonto}
                                value={montoAbono}
                                onChange={(e) => setMontoAbono(e.target.value)}
                                autoFocus
                                step="0.50"
                            />
                            <div className={styles.modalActions} style={{marginTop: 30}}>
                                <button type="button" onClick={() => setShowPagoModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit} style={{background: '#16a34a'}}>Confirmar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Clientes;