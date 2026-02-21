import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/axios"; 
import { toast } from "sonner";
import { Hexagon, User, Lock, ArrowRight, Loader2, ShieldCheck, Cpu, Activity, AlertCircle } from "lucide-react";
import styles from "./styles/Login.module.css";

import { APP_CONFIG } from "../config/appConfig";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Estado del servidor
    const [serverStatus, setServerStatus] = useState("checking");

    // --- VARIABLES PARA EL EASTER EGG ---
    const [showSecret, setShowSecret] = useState(false);
    const clickCount = useRef(0); // Contador instantáneo
    const clickTimer = useRef(null);

    const { signin, errors } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkHealth = async () => {
            try {
                await client.get('/health'); 
                setServerStatus("online");
            } catch (error) {
                console.error("Servidor desconectado");
                setServerStatus("offline");
            }
        };
        checkHealth();

        if (errors) {
            errors.forEach(err => toast.error(err));
        }
    }, [errors]);

    // --- FUNCIÓN DEL EASTER EGG ---
    const handleLogoClick = () => {
        clickCount.current += 1;
        
        // Si ya hay un temporizador de reseteo, lo cancelamos
        if (clickTimer.current) clearTimeout(clickTimer.current);
        
        if (clickCount.current >= 7) {
            setShowSecret(true);
            toast.success("Protocolo de desarrollador iniciado.");
            clickCount.current = 0; // Reiniciamos
            
            setTimeout(() => {
                setShowSecret(false);
            }, 5000);
        } else {
            // Si pasas más de 1.5 segundos sin hacer clic, el contador vuelve a cero
            clickTimer.current = setTimeout(() => {
                clickCount.current = 0;
            }, 1500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (serverStatus === 'offline') {
            return toast.error("No hay conexión con el servidor. Intenta más tarde.");
        }

        if(!username || !password) return toast.warning("Requisitos de acceso incompletos");
        
        setIsLoading(true);
        const success = await signin({ username, password });
        
        if (success) {
            toast.success("Autenticación exitosa. Cargando entorno...");
            navigate("/dashboard");
        }
        setIsLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.authWrapper}>
                
                <div className={styles.systemPanel}>
                    <div className={styles.systemHeader}>
                        {/* APLICAMOS EL EVENTO CLIC AL LOGO SIN CAMBIAR EL CURSOR PARA QUE SEA SECRETO */}
                        <div className={styles.logoBox} onClick={handleLogoClick}>
                            <Hexagon size={32} color="white" fill="currentColor"/>
                        </div>
                        <span className={styles.brandText}>{APP_CONFIG.appName}</span>
                    </div>

                    <div className={styles.systemStatus}>
                        <div className={`${styles.statusBadge} ${styles[serverStatus]}`}>
                            <div className={styles.pulseDot}></div>
                            {serverStatus === 'online' && "SISTEMA EN LÍNEA"}
                            {serverStatus === 'offline' && "SISTEMA OFFLINE"}
                            {serverStatus === 'checking' && "CONECTANDO..."}
                        </div>
                        
                        <h2>{APP_CONFIG.tagline}</h2>
                        <p>Terminal de acceso seguro para gestión de infraestructura y enrutamiento de clientes.</p>
                    </div>

                    <div className={styles.securityIndicators}>
                        <div className={styles.indicator}>
                            <ShieldCheck size={18} className={styles.indicatorIcon} />
                            <span>Conexión Cifrada SSL/TLS</span>
                        </div>
                        <div className={styles.indicator}>
                            <Cpu size={18} className={styles.indicatorIcon} />
                            <span>Módulo de Control Activo</span>
                        </div>
                        <div className={styles.indicator}>
                            <Activity size={18} className={styles.indicatorIcon} />
                            <span>Monitoreo en Tiempo Real</span>
                        </div>
                    </div>
                </div>

                <div className={styles.formPanel}>
                    <div className={styles.formHeader}>
                        <h2>Autorización Requerida</h2>
                        <p>Por favor, identifícate para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {serverStatus === 'offline' && (
                            <div style={{color: '#ef4444', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems:'center', background:'#fee2e2', padding:'10px', borderRadius:'8px'}}>
                                <AlertCircle size={18}/> Error de conexión con el Backend
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Identificador de Usuario</label>
                            <div className={styles.inputWrapper}>
                                <User size={18} className={styles.inputIcon} />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ej: admin.root"
                                    disabled={isLoading}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Clave de Seguridad</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitBtn} 
                            disabled={isLoading || serverStatus === 'offline'} 
                        >
                            {isLoading ? (
                                <> <Loader2 size={18} className={styles.spinner} /> Autenticando... </>
                            ) : (
                                <> Iniciar Sesión <ArrowRight size={18} /> </>
                            )}
                        </button>
                    </form>

                    <div className={styles.formFooter}>
                        <span>Acceso restringido a personal técnico y administrativo.</span>
                        <span className={styles.copyright}>
                            {showSecret 
                                ? "Preparando el terreno para Legacy..." 
                                : `© ${new Date().getFullYear()} ${APP_CONFIG.appName}. Todos los derechos reservados.`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;