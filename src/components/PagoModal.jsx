import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, DollarSign, Calendar, CreditCard, User, AlertTriangle, Search } from "lucide-react";
import client from "../api/axios";
import { toast } from "sonner";
import styles from "./styles/PagoModal.module.css";

function PagoModal({ isOpen, onClose, cliente, onSuccess }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    
    const [modoBusqueda, setModoBusqueda] = useState(false);
    const [listaClientes, setListaClientes] = useState([]);
    const [clienteActivo, setClienteActivo] = useState(null);

    const tipoPago = watch("tipo_pago");
    const metodoPago = watch("metodo_pago"); 
    const motivoRetraso = watch("motivo_retraso");

    const [esPagoTardio, setEsPagoTardio] = useState(false);
    const [deudaTotal, setDeudaTotal] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (cliente) {
                setModoBusqueda(false);
                seleccionarCliente(cliente);
            } else {
                setModoBusqueda(true);
                setClienteActivo(null);
                cargarListaClientes();
            }
        } else {
            reset();
            setEsPagoTardio(false);
            setDeudaTotal(0);
            setClienteActivo(null);
        }
    }, [isOpen, cliente]);

    const cargarListaClientes = async () => {
        try {
            const res = await client.get("/clientes");
            const ordenados = res.data.sort((a,b) => a.nombre_completo.localeCompare(b.nombre_completo));
            setListaClientes(ordenados);
        } catch (error) {
            toast.error("Error al cargar lista de clientes");
        }
    };

    const seleccionarCliente = (c) => {
        setClienteActivo(c);
        
        const total = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
        setDeudaTotal(total);

        const diasRetraso = calcularDiasRetraso(c.dia_pago);
        const tieneDeudaAplazada = Number(c.saldo_aplazado) > 0;
        const tardio = diasRetraso > 5 || tieneDeudaAplazada;
        setEsPagoTardio(tardio);

        setValue("monto", total > 0 ? total : (c.plan?.precio_mensual || ""));
        setValue("tipo_pago", total > 0 ? "LIQUIDACION" : "ABONO");
        setValue("metodo_pago", "EFECTIVO"); 
        setValue("mes_correspondiente", new Date().toISOString().slice(0, 7));
        setValue("referencia", "");
        setValue("notas", "");
        setValue("motivo_retraso", "cliente");
    };

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

    const onSubmit = async (data) => {
        if (!clienteActivo) return;
        setLoading(true);
        try {
            const payload = {
                clienteId: clienteActivo.id,
                monto: parseFloat(data.monto),
                tipo_pago: data.tipo_pago,
                // Forzamos "SISTEMA" si es aplazado
                metodo_pago: data.tipo_pago === 'APLAZADO' ? 'SISTEMA' : data.metodo_pago,
                referencia: (data.tipo_pago !== 'APLAZADO' && data.metodo_pago !== 'EFECTIVO' && data.referencia) ? data.referencia : null,
                descripcion: data.notas || undefined,
                motivo_retraso: esPagoTardio ? data.motivo_retraso : undefined,
                mes_servicio: data.mes_correspondiente
            };

            await client.post("/pagos/abono", payload);
            toast.success(data.tipo_pago === 'APLAZADO' ? "Prórroga registrada" : "Pago registrado correctamente");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "Error al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>{tipoPago === 'APLAZADO' ? 'Registrar Prórroga' : 'Registrar Pago'}</h3>
                    <button onClick={onClose} className={styles.closeBtn} type="button"><X size={24} /></button>
                </div>

                <div className={styles.formContent}>
                    
                    {modoBusqueda && (
                        <div className={styles.formGroup} style={{marginBottom: '20px'}}>
                            <label>Buscar Cliente:</label>
                            <div className={styles.inputIconWrap}>
                                <Search size={18} />
                                <select 
                                    className={styles.select}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value);
                                        const found = listaClientes.find(c => c.id === id);
                                        if (found) seleccionarCliente(found);
                                        else setClienteActivo(null);
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Selecciona un cliente --</option>
                                    {listaClientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {clienteActivo && (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            
                            <div className={styles.clientBadge}>
                                <User size={16}/> 
                                <span style={{ fontWeight: 600 }}>{clienteActivo.nombre_completo}</span>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div className={styles.planTag}>{clienteActivo.plan?.nombre || "Sin Plan"}</div>
                                    <div style={{ fontSize: '0.75rem', color: deudaTotal > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                                        {deudaTotal > 0 ? `Debe: $${deudaTotal.toFixed(2)}` : 'Al corriente'}
                                    </div>
                                </div>
                            </div>

                            {esPagoTardio && tipoPago !== 'APLAZADO' && (
                                <div className={styles.warningBox}>
                                    <div className={styles.warningTitle}>
                                        <AlertTriangle size={16} /> Pago fuera de tiempo
                                    </div>
                                    <label style={{ fontSize: '0.8rem' }}>Justificación:</label>
                                    <select {...register("motivo_retraso")} className={styles.warningSelect}>
                                        <option value="cliente">Responsabilidad cliente (Penalizar)</option>
                                        <option value="acuerdo">Acuerdo previo (No penalizar)</option>
                                        <option value="logistica">Logística interna (No penalizar)</option>
                                    </select>
                                </div>
                            )}

                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label>Monto ($)</label>
                                    <div className={styles.inputIconWrap}>
                                        <DollarSign size={18} />
                                        <input 
                                            type="number" step="0.01" 
                                            {...register("monto", { required: "Requerido", min: 1 })} 
                                            className={styles.input} 
                                            style={{ fontWeight: 'bold', color: 'var(--primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Tipo Movimiento</label>
                                    <select {...register("tipo_pago")} className={styles.select}>
                                        <option value="LIQUIDACION">Liquidación</option>
                                        <option value="ABONO">Abono parcial</option>
                                        <option value="APLAZADO">Aplazar / Prórroga</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.gridRow}>
                                {/* Si es APLAZAMIENTO, ocultamos el selector de método de pago porque no nos están pagando */}
                                {tipoPago !== 'APLAZADO' && (
                                    <div className={styles.formGroup}>
                                        <label>Método</label>
                                        <div className={styles.inputIconWrap}>
                                            <CreditCard size={18} />
                                            <select {...register("metodo_pago")} className={styles.select}>
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                                <option value="DEPOSITO">Depósito</option>
                                                <option value="TARJETA">Tarjeta</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label>Mes Correspondiente</label>
                                    <div className={styles.inputIconWrap}>
                                        <Calendar size={18} />
                                        <input type="month" {...register("mes_correspondiente")} className={styles.input} />
                                    </div>
                                </div>
                            </div>

                            {tipoPago !== 'APLAZADO' && metodoPago !== 'EFECTIVO' && (
                                <div className={styles.formGroup} style={{marginBottom: '15px'}}>
                                    <label>Referencia / Folio / Autorización</label>
                                    <input 
                                        {...register("referencia", { required: "Este campo es requerido" })} 
                                        className={styles.input} 
                                        placeholder="Ej: 123456" 
                                    />
                                    {errors.referencia && <span style={{color: 'red', fontSize: '0.8rem'}}>{errors.referencia.message}</span>}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Notas</label>
                                <textarea {...register("notas")} className={styles.textarea} rows="2" placeholder="Detalles opcionales..."></textarea>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                    {loading ? 'Procesando...' : 'Confirmar Operación'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PagoModal;