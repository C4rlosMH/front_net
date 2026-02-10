import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import styles from "./MainLayout.module.css"; 
import logo from "../assets/logo.png"; 

// 1. IMPORTAMOS EL ÍCONO QUE FALTABA (BarChart2)
import { 
    LayoutDashboard, 
    Users, 
    Router, 
    Wallet, 
    LogOut, 
    Moon, 
    Sun, 
    User,
    Map,
    FileText,
    BarChart2, // <--- AGREGADO AQUÍ
    Server
} from "lucide-react";

const MainLayout = () => {
    const { isAuthenticated, loading, logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    if (loading) return <div>Cargando...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logoArea}>
                    <img src={logo} alt="M" className={styles.logoImg} /> 
                </div>

                <nav className={styles.nav}>
                    {/* ENLACE DASHBOARD */}
                    <Link 
                        to="/dashboard" 
                        className={`${styles.link} ${location.pathname === '/dashboard' || location.pathname === '/' ? styles.linkActive : ''}`}
                    >
                        <LayoutDashboard size={20} /> 
                        <span>Dashboard</span>
                    </Link>

                    {/* 2. ENLACE ESTADÍSTICAS (NUEVO) */}
                    <Link 
                        to="/estadisticas" 
                        className={`${styles.link} ${location.pathname === '/estadisticas' ? styles.linkActive : ''}`}
                    >
                        <BarChart2 size={20} />
                        <span>Estadísticas</span>
                    </Link>
                    
                    {/* ENLACE CLIENTES */}
                    <Link 
                        to="/clientes" 
                        className={`${styles.link} ${location.pathname === '/clientes' ? styles.linkActive : ''}`}
                    >
                        <Users size={20} />
                        <span>Clientes</span>
                    </Link>

                    <Link 
                        to="/cajas" 
                        className={`${styles.link} ${location.pathname === '/cajas' ? styles.linkActive : ''}`}
                    >
                        <Server size={20} />
                        <span>Cajas NAP</span>
                    </Link>

                    {/* ENLACE MAPA */}
                    <Link 
                        to="/mapa" 
                        className={`${styles.link} ${location.pathname === '/mapa' ? styles.linkActive : ''}`}
                    >
                        <Map size={20} />
                        <span>Mapa de Red</span>
                    </Link>
                    
                    {/* ENLACE INVENTARIO */}
                    <Link 
                        to="/equipos" 
                        className={`${styles.link} ${location.pathname === '/equipos' ? styles.linkActive : ''}`}
                    >
                        <Router size={20} />
                        <span>Inventario</span>
                    </Link>
                    
                    {/* ENLACE FINANZAS */}
                    <Link 
                        to="/pagos" 
                        className={`${styles.link} ${location.pathname === '/pagos' ? styles.linkActive : ''}`}
                    >
                        <Wallet size={20} />
                        <span>Finanzas</span>
                    </Link>

                    {/* ENLACE PLANES */}
                    <Link 
                        to="/planes" 
                        className={`${styles.link} ${location.pathname === '/planes' ? styles.linkActive : ''}`}
                    >
                        <FileText size={20} />
                        <span>Planes</span>
                    </Link>

                    <Link 
                        to="/logs" 
                        className={`${styles.link} ${location.pathname === '/logs' ? styles.linkActive : ''}`}
                    >
                        <FileText size={20} />
                        <span>Registros</span>
                    </Link>

                </nav>

                <div className={styles.userArea}>
                    <div className={styles.userName} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <User size={18} /> 
                        {user?.nombre}
                    </div>
                    
                    <button onClick={toggleTheme} className={styles.themeBtn}>
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                    </button>

                    <button onClick={logout} className={styles.logoutBtn}>
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;