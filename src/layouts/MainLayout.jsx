import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./MainLayout.module.css"; // Estilos modulares

const MainLayout = () => {
    const { isAuthenticated, loading, logout, user } = useAuth();
    const location = useLocation();

    if (loading) return <div>Cargando...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logoArea}>
                    <img src="/logo_icon.png" alt="M" className={styles.logoImg} /> 
                    <span className={styles.brandName}>MirandaNet</span>
                </div>

                <nav className={styles.nav}>
                    <Link 
                        to="/dashboard" 
                        className={`${styles.link} ${location.pathname === '/dashboard' ? styles.linkActive : ''}`}
                    >
                        📊 Dashboard
                    </Link>
                    <Link 
                        to="/clientes" 
                        className={`${styles.link} ${location.pathname === '/clientes' ? styles.linkActive : ''}`}
                    >
                        👥 Clientes & Mapa
                    </Link>
                    <Link 
                        to="/equipos" 
                        className={`${styles.link} ${location.pathname === '/equipos' ? styles.linkActive : ''}`}
                    >
                        📡 Inventario
                    </Link>
                    <Link 
                        to="/pagos" 
                        className={`${styles.link} ${location.pathname === '/pagos' ? styles.linkActive : ''}`}
                    >
                        💰 Finanzas
                    </Link>
                </nav>

                <div className={styles.userArea}>
                    <div className={styles.userName}>👤 {user?.nombre}</div>
                    <button onClick={logout} className={styles.logoutBtn}>Cerrar Sesión</button>
                </div>
            </aside>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;