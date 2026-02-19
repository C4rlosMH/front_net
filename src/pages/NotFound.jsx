import { useNavigate } from "react-router-dom";
import { AlertOctagon, ArrowLeft, Home } from "lucide-react";
import styles from "./styles/NotFound.module.css";

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <AlertOctagon size={80} className={styles.icon} />
                </div>
                <h1 className={styles.title}>Error 404</h1>
                <h2 className={styles.subtitle}>Página no encontrada</h2>
                <p className={styles.message}>
                    Lo sentimos, la URL a la que intentas acceder no existe o fue movida. 
                    Verifica que la dirección sea correcta.
                </p>
                <div className={styles.actions}>
                    <button onClick={() => navigate(-1)} className={styles.btnBack}>
                        <ArrowLeft size={18} /> Volver atrás
                    </button>
                    <button onClick={() => navigate("/dashboard")} className={styles.btnHome}>
                        <Home size={18} /> Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotFound;