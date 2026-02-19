import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { DollarSign, CheckCircle2, Clock, User, FileText, AlertTriangle } from "lucide-react";
import styles from "./styles/PagoModal.module.css";

function PagoModal({ isOpen, onClose, clienteIdPreseleccionado, onSuccess }) {
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
    const [montoAbono, setMontoAbono] = useState("");
    const [tipoPago, setTipoPago] = useState("LIQUIDACION");
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [mesPago, setMesPago] = useState("");
    const [nota, setNota] = useState(""); 
    
    // Nuevo estado para la justificación del retraso
    const [motivoRetraso, setMotivoRetraso] = useState("cliente");

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        } else {
            setClienteSeleccionadoId("");
            setMontoAbono("");
            setTipoPago("LIQUIDACION");
            setMetodoPago("EFECTIVO");
            setNota(""); 
            setMotivoRetraso("cliente");
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
            setMesPago(meses[1]); 

            if (clienteIdPreseleccionado) {
                procesarSeleccionCliente(clienteIdPreseleccionado.toString(), lista);
            }
        } catch (error) {
            toast.error("Error al cargar lista de clientes");
        }
    };

    const procesarSeleccionCliente = (id, listaClientes) => {
        setClienteSeleccionadoId(id);
        setMotivoRetraso("cliente"); // Reseteamos el motivo al cambiar de cliente
        
        const cliente = listaClientes.find(c => c.id === parseInt(id));
        
        if (cliente) {
            // Calculamos la deuda real (actual + aplazado)
            const deudaCorriente = parseFloat(cliente.saldo_actual || 0);
            const deudaAplazada = parseFloat(cliente.saldo_aplazado || 0);
            const deudaTotal = deudaCorriente + deudaAplazada;
            
            const plan = parseFloat(cliente.plan?.precio_mensual || 0);
            
            if (deudaTotal > 0) {
                setTipoPago("LIQUIDACION");
                setMontoAbono(deudaTotal);
            } else {
                setTipoPago("ABONO");
                setMontoAbono(plan);
            }
        } else {
            setMontoAbono("");
        }
    };

    // Calculadora para saber si el pago es tardío
    const calcularDiasRetraso = (diaPago) => {
        if (!diaPago) return 0;
        const hoy = new Date();
        const diaActual = hoy.getDate();
        let dias = diaActual - diaPago;
        
        if (dias < 0 && diaActual <= 7) {
            const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
            dias = diaActual + (ultimoDiaMesAnterior - diaPago);
        }
        return dias;
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
                motivo_retraso: motivoRetraso, // Se envía al backend para la regla de confiabilidad
                descripcion: nota.trim() !== "" ? nota : undefined 
            });
            toast.success("Pago registrado correctamente");
            
            if (onSuccess) onSuccess(); 
            onClose(); 
        } catch (error) { 
            toast.error("Error al registrar pago"); 
        }
    };

    if (!isOpen) return null;

    const listaMeses = generarMeses();
    const clienteActivo = clientes.find(c => c.id === parseInt(clienteSeleccionadoId));
    
    // Evaluaciones para UI condicional
    const diasRetraso = clienteActivo ? calcularDiasRetraso(clienteActivo.dia_pago) : 0;
    const tieneDeudaAplazada = clienteActivo ? Number(clienteActivo.saldo_aplazado) > 0 : false;
    const esPagoTardio = diasRetraso > 5 || tieneDeudaAplazada;
    
    const deudaCorriente = clienteActivo ? parseFloat(clienteActivo.saldo_actual || 0) : 0;
    const deudaTotal = clienteActivo ? deudaCorriente + (parseFloat(clienteActivo.saldo_aplazado || 0)) : 0;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Registrar Ingreso</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <form onSubmit={handleRegistrarPago}>
                    <div className={styles.formGroup}>
                        <label>Seleccionar Cliente</label>
                        <div style={{position:'relative'}}>
                            <User size={18} style={{position:'absolute', top:12, left:10, color:'var(--text-muted)'}}/>
                            <select 
                                value={clienteSeleccionadoId} 
                                onChange={(e) => procesarSeleccionCliente(e.target.value, clientes)} 
                                className={styles.select}
                                style={{paddingLeft: 35}}
                                autoFocus={!clienteIdPreseleccionado} 
                            >
                                <option value="">-- Buscar Cliente --</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {clienteActivo && (
                            <div className={styles.deudaBox}>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span className={styles.muted}>Plan: {clienteActivo.plan?.nombre || 'Sin Plan'}</span>
                                    {tieneDeudaAplazada && (
                                        <span style={{fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold', marginTop: '2px'}}>
                                            Adeudo Atrasado: ${clienteActivo.saldo_aplazado}
                                        </span>
                                    )}
                                </div>
                                <span style={{fontWeight:'bold', color: deudaTotal > 0 ? '#ef4444' : '#16a34a', textAlign: 'right'}}>
                                    {deudaTotal > 0 ? `Debe: $${deudaTotal}` : 'Al corriente'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ALERTA Y SELECTOR DE PAGO TARDÍO (Solo aparece si el cliente se atrasó) */}
                    {clienteActivo && esPagoTardio && (
                        <div className={styles.warningBox}>
                            <p className={styles.warningText}>
                                <AlertTriangle size={16} /> Pago detectado fuera de tiempo
                            </p>
                            <label style={{display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-main)'}}>
                                Justificación del retraso:
                            </label>
                            <select 
                                value={motivoRetraso} 
                                onChange={(e) => setMotivoRetraso(e.target.value)}
                                className={styles.warningSelect}
                            >
                                <option value="cliente">Responsabilidad del cliente (Aplicar penalización a confiabilidad)</option>
                                <option value="acuerdo">Acuerdo previo (No penalizar)</option>
                                <option value="logistica">Retraso de mi logística / No pasé a cobrar (No penalizar)</option>
                            </select>
                        </div>
                    )}

                    <div className={styles.typeSelector}>
                        <button type="button" onClick={()=>{setTipoPago("LIQUIDACION"); if(clienteActivo) setMontoAbono(deudaTotal)}} className={`${styles.typeButton} ${tipoPago==='LIQUIDACION' ? styles.typeActive : styles.typeInactive}`}>
                            <CheckCircle2 size={16}/> Liquidar
                        </button>
                        <button type="button" onClick={()=>setTipoPago("ABONO")} className={`${styles.typeButton} ${tipoPago==='ABONO' ? styles.typeActive : styles.typeInactive}`}>
                            <DollarSign size={16}/> Abono
                        </button>
                        <button type="button" onClick={()=>{setTipoPago("APLAZADO"); setMontoAbono(0)}} className={`${styles.typeButton} ${tipoPago==='APLAZADO' ? styles.typeActive : styles.typeInactive}`}>
                            <Clock size={16}/> Aplazar
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
                            <label>Metodo de Pago</label>
                            <select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className={styles.select} disabled={tipoPago === 'APLAZADO'}>
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="DEPOSITO">Deposito</option>
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

                    <div className={styles.formGroup}>
                        <label>Concepto o Nota (Opcional)</label>
                        <div style={{position:'relative'}}>
                            <FileText size={18} style={{position:'absolute', top:12, left:10, color:'var(--text-muted)'}}/>
                            <textarea 
                                value={nota}
                                onChange={e=>setNota(e.target.value)}
                                className={styles.textarea}
                                placeholder="Ej: Intercambio por servicios, abono parcial..."
                                rows="2"
                                style={{paddingLeft: 35, resize: 'none'}}
                            />
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