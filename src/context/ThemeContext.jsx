import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
    return context;
};

export const ThemeProvider = ({ children }) => {
    // 1. Leemos del localStorage o usamos 'light' por defecto
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("jm_theme") || "light";
    });

    // 2. Cada vez que cambie 'theme', actualizamos el HTML y localStorage
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("jm_theme", theme);
    }, [theme]);

    // 3. Función para alternar
    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};