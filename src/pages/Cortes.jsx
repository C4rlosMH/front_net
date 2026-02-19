import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Printer, Copy, AlertOctagon, Phone, MapPin, 
    Search, Scissors, Wallet, MessageCircle, AlertTriangle
} from "lucide-react";
import TablePagination from "../components/TablePagination";
import PagoModal from "../components/PagoModal";
import styles from "./styles/Cortes.module.css";

function Cortes() {
    const [morosos, setMorosos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Modal de Pago Global
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [clienteCobrarId, setClienteCobrarId] = useState(null);

    useEffect(() => { 
        cargarMorosos(); 
    }, []);

    useEffect(() => { 
        setCurrentPage(1); 
    }, [busqueda]);

    const cargarMorosos = async () => {
        try {
            setLoading(true);
            const res = await client.get("/clientes");
            
            // FILTRO A PRUEBA DE FALLOS:
            const lista = res.data.filter(c => {
                const deudaCorriente = parseFloat(c.saldo_actual) || 0;
                const deudaAplazada = parseFloat(c.saldo_aplazado) || 0;
                const deudaTotal = deudaCorriente + deudaAplazada;
                
                // Mostrar si debe dinero, O si ya está cortado (Ignorando a los dados de baja)
                return (deudaTotal > 0 || c.estado === 'CORTADO') && c.estado !== 'BAJA';
            });
            
            // Ordenar: Los que deben más dinero primero
            lista.sort((a, b) => {
                const deudaA = (parseFloat(a.saldo_actual) || 0) + (parseFloat(a.saldo_aplazado) || 0);
                const deudaB = (parseFloat(b.saldo_actual) || 0) + (parseFloat(b.saldo_aplazado) || 0);
                return deudaB - deudaA;
            });
            
            setMorosos(lista);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la lista de cortes");
        } finally {
            setLoading(false);
        }
    };

    // Calculadora de Días de Gracia
    const calcularDiasRetraso = (diaPago) => {
        if (!diaPago) return 0;
        const hoy = new Date();
        const diaActual = hoy.getDate();
        let dias = diaActual - parseInt(diaPago);
        
        if (dias < 0 && diaActual <= 7) {
            const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
            dias = diaActual + (ultimoDiaMesAnterior - parseInt(diaPago));
        }
        return dias;
    };

    // Evaluador de Estado de Corte
    const getEstadoCorte = (cliente) => {
        if (cliente.estado === 'CORTADO') {
            return { texto: 'YA CORTADO', clase: styles.cut };
        }
        
        const tieneDeudaAplazada = (parseFloat(cliente.saldo_aplazado) || 0) > 0;
        const diasRetraso = calcularDiasRetraso(cliente.dia_pago);

        if (tieneDeudaAplazada || diasRetraso > 5) {
            return { texto: 'CORTE INMEDIATO', clase: styles.immediate };
        }

        if (diasRetraso > 0 && diasRetraso <= 5) {
            return { texto: `GRACIA (DÍA ${diasRetraso})`, clase: styles.grace };
        }

        return { texto: 'PENDIENTE', clase: styles.pending };
    };

    // Filtro por búsqueda
    const morososFiltrados = morosos.filter(c => 
        c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.direccion && c.direccion.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // Lógica Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMorosos = morososFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    // Acciones Generales
    const handlePrint = () => window.print();

    const handleCopy = () => {
        const texto = morosos.map(c => {
            const deudaTotal = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
            return `• ${c.nombre_completo} | Debe: $${deudaTotal.toFixed(2)} | Dir: ${c.direccion || 'N/A'}`;
        }).join("\n");
        navigator.clipboard.writeText(`🚨 LISTA DE CORTES/MOROSOS:\n\n${texto}`);
        toast.success("Lista copiada al portapapeles (Lista para WhatsApp)");
    };

    // Mensaje rápido de WhatsApp
    const handleWhatsApp = (cliente) => {
        if (!cliente.telefono) return toast.warning("El cliente no tiene teléfono registrado");
        const deudaTotal = (parseFloat(cliente.saldo_actual) || 0) + (parseFloat(cliente.saldo_aplazado) || 0);
        const estadoCorte = getEstadoCorte(cliente);
        
        let mensaje = `Hola ${cliente.nombre_completo}. Te recordamos que tienes un saldo pendiente de *$${deudaTotal.toFixed(2)}* en tu servicio de internet. `;
        
        if (estadoCorte.clase === styles.grace) {
            mensaje += `Te invitamos a regularizar tu pago para evitar la suspensión del servicio. ¡Excelente día!`;
        } else if (estadoCorte.clase === styles.immediate) {
            mensaje += `Tu periodo de gracia ha expirado. Por favor, regulariza tu pago inmediatamente para evitar la suspensión del servicio.`;
        } else {
            mensaje += `Te invitamos a regularizar tu pago a la brevedad.`;
        }

        const numLimpio = cliente.telefono.replace(/\D/g, '');
        const url = `https://wa.me/52${numLimpio}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    // KPIs Calculados
    const totalDeuda = morosos.reduce((acc, c) => acc + (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0), 0);
    const porCortar = morosos.filter(c => {
        const estado = getEstadoCorte(c);
        return estado.clase === styles.immediate;
    }).length;
    const yaCortados = morosos.filter(c => c.estado === 'CORTADO').length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestión de Cortes y Morosidad</h1>
                    <p className={styles.subtitle}>Supervisa los atrasos y ejecuta suspensiones</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={handleCopy} title="Copiar como texto">
                        <Copy size={18} /> Copiar Lista
                    </button>
                    <button className={styles.btnPrint} onClick={handlePrint} title="Imprimir hoja de ruta">
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            {/* TARJETAS DE MÉTRICAS (KPIs) */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span>Deuda en Riesgo</span>
                        <strong>${totalDeuda.toFixed(2)}</strong>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)'}}>
                        <AlertOctagon size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span>Cortes Inmediatos</span>
                        <strong>{porCortar} <small style={{fontSize:'0.8rem', fontWeight:'normal', color:'var(--text-muted)'}}>Clientes</small></strong>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{color: '#64748b', background: 'rgba(100, 116, 139, 0.1)'}}>
                        <Scissors size={24} />
                    </div>
                    <div className={styles.kpiInfo}>
                        <span>Ya Suspendidos</span>
                        <strong>{yaCortados} <small style={{fontSize:'0.8rem', fontWeight:'normal', color:'var(--text-muted)'}}>Clientes</small></strong>
                    </div>
                </div>
            </div>

            {/* BUSCADOR */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o dirección..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* TABLA DE MOROSOS */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.emptyState}>Analizando cartera de clientes...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Ubicación</th>
                                    <th>Plan</th>
                                    <th>Deuda Total</th>
                                    <th>Estado / Acción</th>
                                    <th className={styles.noPrint}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentMorosos.length === 0 ? (
                                    <tr><td colSpan="6" className={styles.emptyState}>No se encontraron clientes morosos en el sistema.</td></tr>
                                ) : (
                                    currentMorosos.map(c => {
                                        const deudaTotal = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
                                        const estadoCorte = getEstadoCorte(c);

                                        return (
                                        <tr key={c.id}>
                                            <td>
                                                <strong className={styles.name}>{c.nombre_completo}</strong>
                                                <div className={styles.meta}>
                                                    <Phone size={12} style={{marginRight:4}}/> 
                                                    {c.telefono || "Sin teléfono"}
                                                </div>
                                            </td>
                                            <td style={{maxWidth:'250px'}}>
                                                <div className={styles.meta} style={{whiteSpace:'normal'}}>
                                                    <MapPin size={14} style={{marginRight:4, flexShrink:0}}/> 
                                                    {c.direccion || "Sin dirección"}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.planBadge}>{c.plan?.nombre || "Sin Plan"}</span>
                                            </td>
                                            <td>
                                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                                    <span className={styles.debt}>${deudaTotal.toFixed(2)}</span>
                                                    {(parseFloat(c.saldo_aplazado) || 0) > 0 && <span style={{fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold'}}>Adeudo Atrasado</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${estadoCorte.clase}`}>
                                                    {estadoCorte.texto}
                                                </span>
                                            </td>
                                            <td className={styles.noPrint}>
                                                <div className={styles.flexActions}>
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.btnWhatsApp}`} 
                                                        onClick={() => handleWhatsApp(c)} 
                                                        title="Enviar Recordatorio por WhatsApp"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.btnPay}`} 
                                                        onClick={() => { setClienteCobrarId(c.id); setModalPagoOpen(true); }} 
                                                        title="Registrar Pago"
                                                    >
                                                        <Wallet size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                        
                        <div className={styles.noPrint}>
                            <TablePagination 
                                totalItems={morososFiltrados.length} 
                                itemsPerPage={itemsPerPage} 
                                currentPage={currentPage} 
                                onPageChange={setCurrentPage} 
                            />
                        </div>
                    </>
                )}
            </div>

            {/* MODAL DE COBRO REUTILIZADO */}
            <PagoModal 
                isOpen={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                clienteIdPreseleccionado={clienteCobrarId}
                onSuccess={cargarMorosos} 
            />
        </div>
    );
}

export default Cortes;