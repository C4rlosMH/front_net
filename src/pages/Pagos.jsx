import { useEffect, useState } from "react";
import client from "../api/axios";
import TablePagination from "../components/TablePagination";
import { toast } from "sonner";
import { 
    DollarSign, ArrowUpRight, Calendar, Plus, 
    CheckCircle2, Clock, User 
} from "lucide-react";
import styles from "./styles/Pagos.module.css";

function Pagos() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para el Modal de Pago
    const [showModal, setShowModal] = useState(false);
    const [clientes, setClientes] = useState([]); // Lista para el select
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
    
    // Campos del formulario
    const [montoAbono, setMontoAbono] = useState("");
    const [tipoPago, setTipoPago] = useState("LIQUIDACION");
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [mesPago, setMesPago] = useState("");

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const res = await client.get("/pagos");
            setMovimientos(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar finanzas");
        } finally {
            setLoading(false);
        }
    };

    // Cargar clientes solo cuando se abre el modal para no saturar al inicio
    const abrirModal = async () => {
        setShowModal(true);
        if (clientes.length === 0) {
            try {
                const res = await client.get("/clientes");
                // Ordenar alfabéticamente
                const lista = res.data.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
                setClientes(lista);
                
                // Configurar fecha por defecto
                const meses = generarMeses();
                setMesPago(meses[1]);
            } catch (error) {
                toast.error("Error al cargar lista de clientes");
            }
        }
    };

    // Cuando cambia el cliente en el select, actualizamos monto sugerido
    const handleClienteChange = (e) => {
        const id = e.target.value;
        setClienteSeleccionadoId(id);
        
        const cliente = clientes.find(c => c.id === parseInt(id));
        if (cliente) {
            const deuda = parseFloat(cliente.saldo_actual || 0);
            const plan = parseFloat(cliente.plan?.precio_mensual || 0);
            
            if (deuda > 0) {
                setTipoPago("LIQUIDACION");
                setMontoAbono(deuda);
            } else {
                setTipoPago("ABONO");
                setMontoAbono(plan);
            }
        } else {
            setMontoAbono("");
        }
    };

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

    const handleRegistrarPago = async (e) => {
        e.preventDefault();
        if (!clienteSeleccionadoId) return toast.warning("Selecciona un cliente");

        try {
            await client.post("/pagos/abono", {
                clienteId: parseInt(clienteSeleccionadoId),
                monto: parseFloat(montoAbono),
                tipo_pago: tipoPago,
                metodo_pago: metodoPago,
                mes_servicio: mesPago,
            });
            toast.success("Pago registrado correctamente");
            setShowModal(false);
            setClienteSeleccionadoId("");
            setMontoAbono("");
            cargarDatos(); // Recargar tabla
        } catch (error) { 
            toast.error("Error al registrar pago"); 
        }
    };

    // Helpers
    const formatoFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute:'2-digit'
        });
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = movimientos.slice(indexOfFirstItem, indexOfLastItem);
    const listaMeses = generarMeses();

    // Buscar info del cliente seleccionado para mostrar deuda
    const clienteActivo = clientes.find(c => c.id === parseInt(clienteSeleccionadoId));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Finanzas y Pagos</h1>
                    <p className={styles.subtitle}>Registro global de ingresos</p>
                </div>
                <button className={styles.addButton} onClick={abrirModal}>
                    <Plus size={20} /> Registrar Ingreso
                </button>
            </div>

            {/* TARJETAS DE RESUMEN */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.iconBoxIngreso}><ArrowUpRight size={24}/></div>
                    <div>
                        <span className={styles.statLabel}>Ingresos (Hoy)</span>
                        <h3 className={styles.statValue}>
                            ${movimientos
                                .filter(m => new Date(m.fecha).toDateString() === new Date().toDateString() && m.tipo === 'INGRESO')
                                .reduce((acc, curr) => acc + parseFloat(curr.monto), 0).toLocaleString()}
                        </h3>
                    </div>
                </div>
                {/* Puedes agregar más tarjetas aquí (Semana, Mes) */}
            </div>

            {/* TABLA */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente / Descripción</th>
                            <th>Método</th>
                            <th>Monto</th>
                            <th>Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No hay movimientos registrados.</td></tr>
                        ) : (
                            currentItems.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:'0.9rem'}}>
                                            <Calendar size={14} className={styles.mutedIcon}/>
                                            {formatoFecha(m.fecha)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.bold}>
                                            {m.cliente ? m.cliente.nombre_completo : "General"}
                                        </div>
                                        <small className={styles.muted}>{m.descripcion}</small>
                                    </td>
                                    <td>
                                        <span className={styles.methodBadge}>{m.metodo_pago}</span>
                                    </td>
                                    <td>
                                        <span className={styles.amount} style={{color: m.tipo === 'INGRESO' ? '#16a34a' : '#dc2626'}}>
                                            {m.tipo === 'INGRESO' ? '+' : '-'}${parseFloat(m.monto).toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.typeBadge} ${m.tipo === 'INGRESO' ? styles.typeIn : styles.typeOut}`}>
                                            {m.tipo}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <TablePagination 
                    totalItems={movimientos.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            {/* --- MODAL DE PAGO GLOBAL --- */}
            {showModal && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Registrar Ingreso</h3>
                            <button onClick={()=>setShowModal(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleRegistrarPago}>
                            {/* SELECCIÓN DE CLIENTE */}
                            <div className={styles.formGroup}>
                                <label>Seleccionar Cliente</label>
                                <div style={{display:'flex', gap:10}}>
                                    <div style={{position:'relative', flex:1}}>
                                        <User size={18} style={{position:'absolute', top:12, left:10, color:'var(--text-muted)'}}/>
                                        <select 
                                            value={clienteSeleccionadoId} 
                                            onChange={handleClienteChange} 
                                            className={styles.select}
                                            style={{paddingLeft: 35}}
                                            autoFocus
                                        >
                                            <option value="">-- Buscar Cliente --</option>
                                            {clientes.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nombre_completo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* Mostrar Deuda si hay cliente seleccionado */}
                                {clienteActivo && (
                                    <div style={{background: 'var(--body-bg)', padding: '8px 12px', borderRadius: 6, marginTop: 8, border: '1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                                        <span className={styles.muted}>Plan: {clienteActivo.plan?.nombre}</span>
                                        <span style={{fontWeight:'bold', color: clienteActivo.saldo_actual > 0 ? '#ef4444' : '#16a34a'}}>
                                            {clienteActivo.saldo_actual > 0 ? `Debe: $${clienteActivo.saldo_actual}` : 'Al día'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* TABS TIPO PAGO */}
                            <div className={styles.typeSelector}>
                                <button type="button" onClick={()=>{setTipoPago("LIQUIDACION"); if(clienteActivo) setMontoAbono(clienteActivo.saldo_actual)}} className={`${styles.typeButton} ${tipoPago==='LIQUIDACION' ? styles.typeActive : styles.typeInactive}`}>
                                    <CheckCircle2 size={16}/> Liquidar
                                </button>
                                <button type="button" onClick={()=>setTipoPago("ABONO")} className={`${styles.typeButton} ${tipoPago==='ABONO' ? styles.typeActive : styles.typeInactive}`}>
                                    <DollarSign size={16}/> Abono
                                </button>
                                <button type="button" onClick={()=>{setTipoPago("APLAZADO"); setMontoAbono(0)}} className={`${styles.typeButton} ${tipoPago==='APLAZADO' ? styles.typeActive : styles.typeInactive}`}>
                                    <Clock size={16}/> Aplazado
                                </button>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Mes Correspondiente</label>
                                    <select value={mesPago} onChange={e=>setMesPago(e.target.value)} className={styles.select}>
                                        {listaMeses.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
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
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={montoAbono} 
                                        onChange={e=>setMontoAbono(e.target.value)} 
                                        className={styles.input} 
                                        style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', paddingLeft: 35}}
                                        disabled={tipoPago === 'APLAZADO'} 
                                    />
                                    <span style={{position:'absolute', left:12, top:12, color:'var(--text-muted)', fontWeight:'bold'}}>$</span>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={()=>setShowModal(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit}>Registrar</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
}

export default Pagos;