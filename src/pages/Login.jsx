import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Hexagon, User, Lock, ArrowRight, Loader2, ShieldCheck, Cpu, Activity } from "lucide-react";
import styles from "./styles/Login.module.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const { signin, errors } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (errors) {
            errors.forEach(err => toast.error(err));
        }
    }, [errors]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                
                {/* --- PANEL DE ESTADO DEL SISTEMA (Izquierda) --- */}
                <div className={styles.systemPanel}>
                    <div className={styles.systemHeader}>
                        <div className={styles.logoBox}>
                            <Hexagon size={32} color="white" fill="currentColor"/>
                        </div>
                        <span className={styles.brandText}>NetAdmin Core</span>
                    </div>

                    <div className={styles.systemStatus}>
                        <div className={styles.statusBadge}>
                            <div className={styles.pulseDot}></div>
                            SISTEMA EN LÍNEA
                        </div>
                        <h2>Plataforma de<br/>Administración ISP</h2>
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

                {/* --- FORMULARIO DE ACCESO (Derecha) --- */}
                <div className={styles.formPanel}>
                    <div className={styles.formHeader}>
                        <h2>Autorización Requerida</h2>
                        <p>Por favor, identifícate para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
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

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? (
                                <> <Loader2 size={18} className={styles.spinner} /> Autenticando... </>
                            ) : (
                                <> Iniciar Sesión <ArrowRight size={18} /> </>
                            )}
                        </button>
                    </form>

                    <div className={styles.formFooter}>
                        Acceso restringido a personal técnico y administrativo.
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;