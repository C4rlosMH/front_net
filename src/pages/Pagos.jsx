import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios";
import { toast } from "sonner";
import { Wallet, Calendar, AlertCircle, Search, ArrowRight } from "lucide-react";
import styles from "./styles/Pagos.module.css";

function Pagos() {
    const [clientes, setClientes] = useState([]);
    const [filtroDia, setFiltroDia] = useState(15); // 15 o 30
    const [busqueda, setBusqueda] = useState("");
    
    // Modal Pagar Rápido
    const [showModal, setShowModal] = useState(false);
    const [clienteSelect, setClienteSelect] = useState(null);
    const [montoAbono, setMontoAbono] = useState("");

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const res = await client.get("/clientes");
            setClientes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        try {
            await client.post("/pagos/abono", {
                clienteId: clienteSelect.id,
                monto: parseFloat(montoAbono),
                descripcion: "Pago rápido desde lista"
            });
            toast.success("Pago registrado");
            setShowModal(false);
            cargarClientes(); // Recargar saldos
        } catch (error) {
            toast.error("Error al registrar pago");
        }
    };

    const abrirModal = (c) => {
        setClienteSelect(c);
        // Sugerir monto: si debe, paga la deuda. Si no, paga la mensualidad del plan.
        const sugerido = c.saldo_actual > 0 ? c.saldo_actual : (c.plan?.precio_mensual || "");
        setMontoAbono(sugerido);
        setShowModal(true);
    };

    // --- LÓGICA DE FILTRADO ---
    // 1. Filtramos por día de pago (15 o 30)
    // 2. Filtramos por búsqueda de nombre
    const clientesFiltrados = clientes.filter(c => {
        const coincideDia = parseInt(c.dia_pago || 15) === filtroDia; // Si es null, asume 15
        const coincideNombre = c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());
        return coincideDia && coincideNombre;
    });

    // Calcular totales de la lista actual
    const totalDeuda = clientesFiltrados.reduce((acc, c) => acc + Number(c.saldo_actual), 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Proyección de Cobranza</h1>
                    <p style={{color:'var(--text-muted)'}}>Gestión de pagos por fecha de corte</p>
                </div>
                
                {/* Resumen Rápido */}
                <div style={{textAlign:'right'}}>
                    <span style={{display:'block', fontSize:'0.9rem', color:'var(--text-muted)'}}>Deuda Total (Lista actual)</span>
                    <span style={{fontSize:'1.5rem', fontWeight:'bold', color: totalDeuda > 0 ? '#ef4444' : '#10b981'}}>
                        ${totalDeuda.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* PESTAÑAS DE FECHA */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${filtroDia === 15 ? styles.tabActive : ''}`}
                    onClick={() => setFiltroDia(15)}
                >
                    <Calendar size={18} /> Corte Día 15
                </button>
                <button 
                    className={`${styles.tab} ${filtroDia === 30 ? styles.tabActive : ''}`}
                    onClick={() => setFiltroDia(30)}
                >
                    <Calendar size={18} /> Corte Día 30
                </button>
            </div>

            {/* BUSCADOR DENTRO DE LA LISTA */}
            <div className={styles.searchSection} style={{marginBottom: 20}}>
                <Search size={20} style={{color:'gray'}} />
                <input 
                    type="text" 
                    placeholder={`Buscar cliente del día ${filtroDia}...`}
                    className={styles.searchInput}
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {/* TABLA DE COBRANZA */}
            <div className={styles.clientCard} style={{display:'block', padding:0, overflow:'hidden'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead>
                        <tr style={{background:'var(--body-bg)', borderBottom:'1px solid var(--border)', textAlign:'left'}}>
                            <th style={{padding:15}}>Cliente</th>
                            <th style={{padding:15}}>Plan Contratado</th>
                            <th style={{padding:15}}>Estado de Cuenta</th>
                            <th style={{padding:15, textAlign:'right'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.map(c => (
                            <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}}>
                                <td style={{padding:15}}>
                                    <b>{c.nombre_completo}</b>
                                    <div style={{fontSize:'0.8rem', color:'gray'}}>{c.direccion}</div>
                                </td>
                                <td style={{padding:15}}>
                                    {c.plan ? (
                                        <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 8px', borderRadius:10, fontSize:'0.85rem'}}>
                                            {c.plan.nombre} (${c.plan.precio_mensual})
                                        </span>
                                    ) : <span style={{color:'red'}}>Sin Plan</span>}
                                </td>
                                <td style={{padding:15}}>
                                    {c.saldo_actual > 0 ? (
                                        <div style={{color:'#ef4444', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                                            <AlertCircle size={16}/> Debe: ${c.saldo_actual}
                                        </div>
                                    ) : (
                                        <div style={{color:'#16a34a', fontWeight:'bold'}}>
                                            Al día
                                        </div>
                                    )}
                                </td>
                                <td style={{padding:15, textAlign:'right'}}>
                                    <button 
                                        onClick={() => abrirModal(c)}
                                        className={styles.payButton} 
                                        style={{padding:'6px 12px', fontSize:'0.85rem', marginRight:10}}
                                    >
                                        <Wallet size={16} style={{marginRight:5}}/> Cobrar
                                    </button>
                                    
                                    <Link to={`/pagos/cliente/${c.id}`} style={{textDecoration:'none'}}>
                                        <button className={styles.payButton} style={{padding:'6px 12px', fontSize:'0.85rem', background:'transparent', border:'1px solid var(--border)', color:'var(--text-main)'}}>
                                            Ver Historial <ArrowRight size={14} style={{marginLeft:5}}/>
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {clientesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{padding:30, textAlign:'center', color:'gray'}}>
                                    No hay clientes para el día {filtroDia} con este criterio.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL PAGO RÁPIDO */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Registrar Abono</h3>
                        <p>{clienteSelect.nombre_completo}</p>
                        <input 
                            type="number" 
                            className={styles.input} 
                            value={montoAbono}
                            onChange={(e) => setMontoAbono(e.target.value)}
                            autoFocus
                        />
                        <button onClick={handlePagar} className={styles.btnSubmit}>Confirmar</button>
                        <button onClick={() => setShowModal(false)} className={styles.btnCancel} style={{marginTop:10, width:'100%'}}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pagos;