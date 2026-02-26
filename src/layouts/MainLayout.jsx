import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
    LayoutDashboard, Users, Server, Wifi, Map as MapIcon, 
    LogOut, Activity, BarChart2, DollarSign, Package, 
    Scissors, ShieldCheck, Sun, Moon, Hexagon,
    MessageCircle, LifeBuoy, ChevronDown, ChevronUp
} from "lucide-react";
import WhatsAppStatus from "../components/WhatsAppStatus";
import styles from "./MainLayout.module.css";

import { APP_CONFIG } from "../config/appConfig";

function MainLayout() {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    // Estado para controlar qué menú desplegable está abierto
    const [openMenu, setOpenMenu] = useState("");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const toggleMenu = (menuName) => {
        setOpenMenu(openMenu === menuName ? "" : menuName);
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
                    <h2 className={styles.brandName}>{APP_CONFIG.appShortName}</h2>
                </div>

                {/* MENÚ DE NAVEGACIÓN */}
                <div className={styles.navMenu}>
                    
                    {/* ACCESOS DIRECTOS (Siempre visibles) */}
                    <div className={styles.navSection}>
                        <span className={styles.sectionTitle}>Principal</span>
                        <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <LayoutDashboard size={20} /> <span>Inicio</span>
                        </NavLink>
                        <NavLink to="/tickets" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <LifeBuoy size={20} /> <span>Soporte Técnico</span>
                        </NavLink>
                        <NavLink to="/mapa" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                            <MapIcon size={20} /> <span>Mapa de Red</span>
                        </NavLink>
                    </div>

                    {/* MENÚ: COMERCIAL */}
                    <div className={styles.navSection}>
                        <button 
                            className={`${styles.dropdownBtn} ${openMenu === 'comercial' ? styles.dropdownActive : ''}`}
                            onClick={() => toggleMenu('comercial')}
                        >
                            <div className={styles.dropdownIcon}><Users size={20} /> <span>Comercial</span></div>
                            {openMenu === 'comercial' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <div className={`${styles.subMenu} ${openMenu === 'comercial' ? styles.subMenuOpen : ''}`}>
                            <NavLink to="/clientes" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Cartera de Clientes
                            </NavLink>
                            <NavLink to="/cortes" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Cortes de Servicio
                            </NavLink>
                        </div>
                    </div>

                    {/* MENÚ: FINANZAS */}
                    <div className={styles.navSection}>
                        <button 
                            className={`${styles.dropdownBtn} ${openMenu === 'finanzas' ? styles.dropdownActive : ''}`}
                            onClick={() => toggleMenu('finanzas')}
                        >
                            <div className={styles.dropdownIcon}><DollarSign size={20} /> <span>Finanzas</span></div>
                            {openMenu === 'finanzas' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <div className={`${styles.subMenu} ${openMenu === 'finanzas' ? styles.subMenuOpen : ''}`}>
                            <NavLink to="/pagos" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Finanzas y Pagos
                            </NavLink>
                            <NavLink to="/gastos" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Gastos
                            </NavLink>
                            <NavLink to="/estadisticas" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Estadísticas
                            </NavLink>
                        </div>
                    </div>

                    {/* MENÚ: INFRAESTRUCTURA */}
                    <div className={styles.navSection}>
                        <button 
                            className={`${styles.dropdownBtn} ${openMenu === 'infra' ? styles.dropdownActive : ''}`}
                            onClick={() => toggleMenu('infra')}
                        >
                            <div className={styles.dropdownIcon}><Server size={20} /> <span>Infraestructura</span></div>
                            {openMenu === 'infra' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <div className={`${styles.subMenu} ${openMenu === 'infra' ? styles.subMenuOpen : ''}`}>
                            <NavLink to="/cajas" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Cajas NAP
                            </NavLink>
                            <NavLink to="/equipos" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Inventario
                            </NavLink>
                            <NavLink to="/planes" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Planes de Internet
                            </NavLink>
                        </div>
                    </div>

                    {/* MENÚ: ADMINISTRACIÓN */}
                    <div className={styles.navSection}>
                        <button 
                            className={`${styles.dropdownBtn} ${openMenu === 'admin' ? styles.dropdownActive : ''}`}
                            onClick={() => toggleMenu('admin')}
                        >
                            <div className={styles.dropdownIcon}><ShieldCheck size={20} /> <span>Sistema</span></div>
                            {openMenu === 'admin' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <div className={`${styles.subMenu} ${openMenu === 'admin' ? styles.subMenuOpen : ''}`}>
                            <NavLink to="/usuarios" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Usuarios
                            </NavLink>
                            <NavLink to="/logs" className={({isActive}) => isActive ? `${styles.subNavItem} ${styles.active}` : styles.subNavItem}>
                                Registro de Actividad
                            </NavLink>
                        </div>
                    </div>

                </div>

                {/* PIE DEL SIDEBAR */}
                <div className={styles.sidebarFooter}>
                    <Link to="/perfil" className={styles.userInfo} title="Ir a mi perfil">
                        <div className={styles.avatar}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.nombre || 'Administrador'}</span>
                            <span className={styles.userRole}>{user?.rol || 'Staff'}</span>
                        </div>
                    </Link>

                    <div className={styles.footerActions}>
                        {/* Botón de WhatsApp integrado al pie */}
                        <button 
                            className={styles.actionBtn} 
                            onClick={() => setIsWhatsAppOpen(true)} 
                            title="Estado de WhatsApp"
                        >
                            <MessageCircle size={18} />
                        </button>

                        <button 
                            className={styles.actionBtn} 
                            onClick={toggleTheme} 
                            title="Cambiar tema"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        
                        <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* CONTENEDOR PRINCIPAL */}
            <main className={styles.mainContent}>
                <Outlet />
            </main>

            <WhatsAppStatus 
                isOpen={isWhatsAppOpen} 
                onClose={() => setIsWhatsAppOpen(false)} 
            />
        </div>
    );
}

export default MainLayout;