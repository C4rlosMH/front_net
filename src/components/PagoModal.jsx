import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { DollarSign, CheckCircle2, Clock, User } from "lucide-react";
import styles from "./styles/PagoModal.module.css";

function PagoModal({ isOpen, onClose, clienteIdPreseleccionado, onSuccess }) {
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
    const [montoAbono, setMontoAbono] = useState("");
    const [tipoPago, setTipoPago] = useState("LIQUIDACION");
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [mesPago, setMesPago] = useState("");

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        } else {
            // Limpiar el estado al cerrar para que no se quede pegado el cliente anterior
            setClienteSeleccionadoId("");
            setMontoAbono("");
            setTipoPago("LIQUIDACION");
            setMetodoPago("EFECTIVO");
        }
    }, [isOpen, clienteIdPreseleccionado]);

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

    const cargarClientes = async () => {
        try {
            const res = await client.get("/clientes");
            const lista = res.data.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
            setClientes(lista);
            
            const meses = generarMeses();
            setMesPago(meses[1]); // Mes actual por defecto

            // Si le pasamos un ID desde el Dashboard o Clientes, lo preseleccionamos
            if (clienteIdPreseleccionado) {
                procesarSeleccionCliente(clienteIdPreseleccionado.toString(), lista);
            }
        } catch (error) {
            toast.error("Error al cargar lista de clientes");
        }
    };

    const procesarSeleccionCliente = (id, listaClientes) => {
        setClienteSeleccionadoId(id);
        const cliente = listaClientes.find(c => c.id === parseInt(id));
        
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
            
            if (onSuccess) onSuccess(); // Disparamos la función para recargar la tabla que llamó al modal
            onClose(); // Cerramos el modal
        } catch (error) { 
            toast.error("Error al registrar pago"); 
        }
    };

    if (!isOpen) return null;

    const listaMeses = generarMeses();
    const clienteActivo = clientes.find(c => c.id === parseInt(clienteSeleccionadoId));

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Registrar Ingreso</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <form onSubmit={handleRegistrarPago}>
                    {/* SELECCIÓN DE CLIENTE */}
                    <div className={styles.formGroup}>
                        <label>Seleccionar Cliente</label>
                        <div style={{position:'relative'}}>
                            <User size={18} style={{position:'absolute', top:12, left:10, color:'var(--text-muted)'}}/>
                            <select 
                                value={clienteSeleccionadoId} 
                                onChange={(e) => procesarSeleccionCliente(e.target.value, clientes)} 
                                className={styles.select}
                                style={{paddingLeft: 35}}
                                autoFocus={!clienteIdPreseleccionado} // Solo hace focus si no hay cliente preseleccionado
                            >
                                <option value="">-- Buscar Cliente --</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Mostrar Deuda si hay cliente seleccionado */}
                        {clienteActivo && (
                            <div className={styles.deudaBox}>
                                <span className={styles.muted}>Plan: {clienteActivo.plan?.nombre || 'Sin Plan'}</span>
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
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit}>Procesar Pago</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PagoModal;