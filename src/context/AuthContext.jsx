import { createContext, useState, useContext, useEffect } from "react";
import client from "../api/axios";

// Creamos el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto (evita importar useContext en cada archivo)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState(null);

    // Función Modular de Login
    const signin = async (userCredentials) => {
        try {
            const res = await client.post("/auth/login", userCredentials);
            
            // Guardamos datos críticos
            localStorage.setItem("jm_token", res.data.token);
            localStorage.setItem("jm_user", JSON.stringify(res.data.user));
            
            setUser(res.data.user);
            setIsAuthenticated(true);
            setErrors(null);
            return true; // Éxito
        } catch (error) {
            console.error(error);
            // Extraemos el mensaje de error del backend
            const message = error.response?.data?.message || "Error al conectar con el servidor";
            setErrors([message]);
            return false; // Fallo
        }
    };

    const logout = () => {
        localStorage.removeItem("jm_token");
        localStorage.removeItem("jm_user");
        setUser(null);
        setIsAuthenticated(false);
    };

    // Efecto para verificar sesión al recargar la página
    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem("jm_token");
            const storedUser = localStorage.getItem("jm_user");

            if (!token || !storedUser) {
                setIsAuthenticated(false);
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (error) {
                // Si el JSON del usuario está corrupto, limpiamos todo
                logout();
            }
            setLoading(false);
        };
        checkLogin();
    }, []);

    // Exportamos los valores y funciones para que toda la app los use
    return (
        <AuthContext.Provider value={{ 
            signin, 
            logout, 
            user, 
            isAuthenticated, 
            loading,
            errors 
        }}>
            {children}
        </AuthContext.Provider>
    );
};