import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
    LayoutDashboard, Users, Server, Wifi, Map as MapIcon, 
    LogOut, Activity, BarChart2, DollarSign, Package, 
    Scissors, ShieldCheck, Sun, Moon, Hexagon
} from "lucide-react";
import styles from "./MainLayout.module.css";
// Si tienes un logo en assets, puedes usarlo. Si no, usaremos el icono Hexagon
// import logo from "../assets/logo.png"; 

function MainLayout() {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className={styles.layout}>
            {/* SIDEBAR LATERAL */}
            <aside className={styles.sidebar}>
                
                {/* CABECERA (LOGO Y NOMBRE) */}
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoBox}>
                        <Hexagon size={24} color="white" fill="currentColor"/>
                    </div>
                    <h2 className={styles.brandName}>NetAdmin</h2>
                </div>

                {/* MENÚ DE NAVEGACIÓN DIVIDIDO POR SECCIONES */}
                <div className={styles.navMenu}>
                    
                    {/* SECCIÓN 1: Principal */}
                    <div className={styles.navSection}>
                        <span className={styles.sectionTitle}>Principal</span>
                        <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <LayoutDashboard size={20} /> <span>Inicio</span>
                        </NavLink>
                        <NavLink to="/estadisticas" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <BarChart2 size={20} /> <span>Estadísticas</span>
                        </NavLink>
                        <NavLink to="/mapa" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <MapIcon size={20} /> <span>Mapa de Red</span>
                        </NavLink>
                    </div>

                    {/* SECCIÓN 2: Gestión Comercial */}
                    <div className={styles.navSection}>
                        <span className={styles.sectionTitle}>Comercial</span>
                        <NavLink to="/clientes" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Users size={20} /> <span>Cartera de Clientes</span>
                        </NavLink>
                        <NavLink to="/pagos" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <DollarSign size={20} /> <span>Finanzas y Pagos</span>
                        </NavLink>
                        <NavLink to="/cortes" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Scissors size={20} /> <span>Cortes de Servicio</span>
                        </NavLink>
                    </div>

                    {/* SECCIÓN 3: Infraestructura Técnica */}
                    <div className={styles.navSection}>
                        <span className={styles.sectionTitle}>Infraestructura</span>
                        <NavLink to="/cajas" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Server size={20} /> <span>Cajas NAP</span>
                        </NavLink>
                        <NavLink to="/equipos" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Package size={20} /> <span>Inventario Equipos</span>
                        </NavLink>
                        <NavLink to="/planes" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Wifi size={20} /> <span>Planes de Internet</span>
                        </NavLink>
                    </div>

                    {/* SECCIÓN 4: Administración */}
                    <div className={styles.navSection}>
                        <span className={styles.sectionTitle}>Administración</span>
                        <NavLink to="/usuarios" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <ShieldCheck size={20} /> <span>Usuarios del Sistema</span>
                        </NavLink>
                        <NavLink to="/logs" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <Activity size={20} /> <span>Registro de Actividad</span>
                        </NavLink>
                    </div>
                </div>

                {/* PIE DEL SIDEBAR (PERFIL, TEMA Y SALIR) */}
                <div className={styles.sidebarFooter}>
                    
                    {/* Tarjeta de Perfil de Usuario */}
                    <Link to="/perfil" className={styles.userInfo} title="Ir a mi perfil">
                        <div className={styles.avatar}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.nombre || 'Administrador'}</span>
                            <span className={styles.userRole}>{user?.rol || 'Staff'}</span>
                        </div>
                    </Link>

                    {/* Botones de acción */}
                    <div className={styles.footerActions}>
                        <button className={styles.themeToggle} onClick={toggleTheme} title="Cambiar tema">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        
                        <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
                            <LogOut size={18} /> <span>Salir</span>
                        </button>
                    </div>

                </div>
            </aside>

            {/* CONTENEDOR PRINCIPAL DONDE RENDERIZAN LAS VISTAS */}
            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;