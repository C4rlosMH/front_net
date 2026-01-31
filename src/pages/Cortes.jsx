import { useEffect, useState } from "react";
import client from "../api/axios";
import { toast } from "sonner";
import { Printer, Copy, AlertOctagon, Phone, MapPin, DollarSign } from "lucide-react";
import styles from "./styles/Cortes.module.css";

function Cortes() {
    const [morosos, setMorosos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarMorosos = async () => {
            try {
                const res = await client.get("/clientes");
                // FILTRO: Clientes activos con deuda positiva
                // Puedes ajustar el filtro (ej. deuda > precio_plan)
                const lista = res.data.filter(c => c.saldo_actual > 0 && c.estado !== 'BAJA');
                
                // Ordenar: Los que deben más dinero primero
                lista.sort((a, b) => parseFloat(b.saldo_actual) - parseFloat(a.saldo_actual));
                
                setMorosos(lista);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar la lista de cortes");
            } finally {
                setLoading(false);
            }
        };
        cargarMorosos();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleCopy = () => {
        const texto = morosos.map(c => 
            `${c.nombre_completo} | Deuda: $${c.saldo_actual} | Dir: ${c.direccion} | Tel: ${c.telefono}`
        ).join("\n");
        navigator.clipboard.writeText(texto);
        toast.success("Lista copiada al portapapeles");
    };

    if (loading) return <div className={styles.loading}>Generando reporte...</div>;

    const totalDeuda = morosos.reduce((acc, curr) => acc + parseFloat(curr.saldo_actual), 0);

    return (
        <div className={styles.container}>
            {/* ENCABEZADO (Se oculta al imprimir si configuras CSS de impresión, o se ve bien igual) */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Reporte de Cortes y Morosidad</h1>
                    <p className={styles.subtitle}>
                        {morosos.length} Clientes con deuda pendiente - Total: <strong style={{color:'#ef4444'}}>${totalDeuda.toLocaleString()}</strong>
                    </p>
                </div>
                <div className={styles.actions}>
                    <button onClick={handleCopy} className={styles.btnSecondary} title="Copiar para WhatsApp">
                        <Copy size={20} /> <span className={styles.btnText}>Copiar</span>
                    </button>
                    <button onClick={handlePrint} className={styles.btnPrint}>
                        <Printer size={20} /> Imprimir Lista
                    </button>
                </div>
            </div>

            <div className={styles.listContainer}>
                {morosos.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div style={{background:'#dcfce7', padding:20, borderRadius:'50%', color:'#16a34a', marginBottom:15}}>
                            <DollarSign size={40} />
                        </div>
                        <h3>¡Todo al día!</h3>
                        <p>No hay clientes con deuda pendiente en este momento.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Ubicación</th>
                                <th>Plan</th>
                                <th style={{textAlign:'right'}}>Deuda Total</th>
                                <th style={{textAlign:'center'}}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {morosos.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <strong className={styles.name}>{c.nombre_completo}</strong>
                                        <div className={styles.meta}>
                                            <Phone size={14} style={{marginRight:4}}/> 
                                            {c.telefono || "S/N"}
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
                                    <td style={{textAlign:'right'}}>
                                        <span className={styles.debt}>${c.saldo_actual}</span>
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <span className={`${styles.statusBadge} ${c.estado === 'CORTADO' ? styles.cut : styles.pending}`}>
                                            {c.estado === 'CORTADO' ? 'YA CORTADO' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Cortes;