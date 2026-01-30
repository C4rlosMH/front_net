import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext"; // Ajusta la ruta (subimos 2 niveles)
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import logo from "../assets/logo.png"
import styles from "../pages/styles/Login.module.css"; // <--- AQUÍ IMPORTAMOS LOS ESTILOS

function Login() {
    const { register, handleSubmit, formState: { errors: formErrors } } = useForm();
    const { signin, isAuthenticated, errors: authErrors } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate("/dashboard");
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (authErrors) authErrors.forEach(err => toast.error(err));
    }, [authErrors]);

    const onSubmit = async (data) => {
        const success = await signin(data);
        if (success) toast.success("Bienvenido a MirandaNet");
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoArea}>
                    <img src={logo} alt="MirandaNet" className={styles.logo} />
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Usuario</label>
                        <input 
                            type="text"
                            {...register("username", { required: "Usuario requerido" })}
                            className={styles.input}
                            placeholder="admin"
                        />
                        {formErrors.username && <p className={styles.errorMsg}>{formErrors.username.message}</p>}
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Contraseña</label>
                        <input 
                            type="password"
                            {...register("password", { required: "Contraseña requerida" })}
                            className={styles.input}
                            placeholder="••••••"
                        />
                        {formErrors.password && <p className={styles.errorMsg}>{formErrors.password.message}</p>}
                    </div>

                    <button type="submit" className={styles.button}>
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;