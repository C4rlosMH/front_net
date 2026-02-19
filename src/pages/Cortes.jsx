import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { 
    Printer, Copy, AlertOctagon, Phone, MapPin, 
    Search, Scissors, Wallet, MessageCircle, AlertTriangle
} from "lucide-react";
import TablePagination from "../components/TablePagination";
import PagoModal from "../components/PagoModal";
import WhatsAppMessageModal from "../components/WhatsAppMessageModal";
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
    const [clienteCobrar, setClienteCobrar] = useState(null);

    // Modal de WhatsApp
    const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
    const [clienteWhatsApp, setClienteWhatsApp] = useState(null);

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
            
            const lista = res.data.filter(c => {
                const deudaCorriente = parseFloat(c.saldo_actual) || 0;
                const deudaAplazada = parseFloat(c.saldo_aplazado) || 0;
                
                // Calculamos a cuántos meses equivale su deuda total
                const precioMensual = parseFloat(c.plan?.precio_mensual) || Infinity; // Previene dividir entre 0
                const mesesDeuda = (deudaCorriente + deudaAplazada) / precioMensual;
                
                // MUESTRA AL CLIENTE EN LA LISTA SI:
                // 1. Debe dinero del mes actual (y no ha pedido prórroga)
                // 2. O si ya alcanzó el Límite Crítico de 5 meses arrastrados
                // 3. O si ya está CORTADO actualmente
                return (deudaCorriente > 0 || mesesDeuda >= 5 || c.estado === 'CORTADO') && c.estado !== 'BAJA';
            });
            
            // Ordenar: Los que tienen límite de 5 meses primero, luego los de mayor deuda
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

    const getEstadoCorte = (cliente) => {
        if (cliente.estado === 'CORTADO') {
            return { texto: 'YA CORTADO', clase: styles.cut };
        }
        
        const deudaCorriente = parseFloat(cliente.saldo_actual) || 0;
        const deudaAplazada = parseFloat(cliente.saldo_aplazado) || 0;
        const precioMensual = parseFloat(cliente.plan?.precio_mensual) || Infinity;
        const mesesDeuda = (deudaCorriente + deudaAplazada) / precioMensual;

        const diasRetraso = calcularDiasRetraso(cliente.dia_pago);

        // NUEVA REGLA ESTRELLA: Si llega a 5 meses de arrastre, se corta sí o sí
        if (mesesDeuda >= 5) {
            return { texto: 'LÍMITE: 5 MESES (CORTAR)', clase: styles.immediate };
        }

        // Si tiene deuda corriente (del mes actual) y superó los 5 días sin avisar
        if (deudaCorriente > 0 && diasRetraso > 5) {
            return { texto: 'CORTE INMEDIATO', clase: styles.immediate };
        }

        // Si tiene deuda corriente pero está en sus 5 días para avisar/pagar
        if (deudaCorriente > 0 && diasRetraso > 0 && diasRetraso <= 5) {
            return { texto: `GRACIA (DÍA ${diasRetraso})`, clase: styles.grace };
        }

        return { texto: 'PENDIENTE', clase: styles.pending };
    };

    const morososFiltrados = morosos.filter(c => 
        c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.direccion && c.direccion.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMorosos = morososFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    const handlePrint = () => window.print();

    const handleCopy = () => {
        const texto = morosos.map(c => {
            const deudaTotal = (parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0);
            return `• ${c.nombre_completo} | Debe: $${deudaTotal.toFixed(2)} | Dir: ${c.direccion || 'N/A'}`;
        }).join("\n");
        navigator.clipboard.writeText(`LISTA DE CORTES/MOROSOS:\n\n${texto}`);
        toast.success("Lista copiada al portapapeles");
    };

    const handleWhatsApp = (cliente) => {
        if (!cliente.telefono) return toast.warning("El cliente no tiene teléfono registrado");
        setClienteWhatsApp(cliente);
        setModalWhatsAppOpen(true);
    };

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
                                    <tr><td colSpan="6" className={styles.emptyState}>No hay clientes pendientes de corte.</td></tr>
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
                                                    {/* Mostrar los meses que arrastra */}
                                                    {(parseFloat(c.saldo_aplazado) || 0) > 0 && (
                                                        <span style={{fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold'}}>
                                                            Arrastrando {Math.floor(((parseFloat(c.saldo_actual) || 0) + (parseFloat(c.saldo_aplazado) || 0)) / (parseFloat(c.plan?.precio_mensual) || 1))} meses
                                                        </span>
                                                    )}
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
                                                        onClick={() => { setClienteCobrar(c); setModalPagoOpen(true); }} 
                                                        title="Registrar Pago o Prórroga"
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

            <PagoModal 
                isOpen={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                cliente={clienteCobrar} 
                onSuccess={cargarMorosos} 
            />

            <WhatsAppMessageModal 
                isOpen={modalWhatsAppOpen}
                onClose={() => setModalWhatsAppOpen(false)}
                cliente={clienteWhatsApp}
            />
        </div>
    );
}

export default Cortes;