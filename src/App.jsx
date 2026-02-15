import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import Mapa from "./pages/Mapa";
import Equipos from "./pages/Equipos";
import Planes from "./pages/Planes";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";
import HistorialPagos from "./pages/HistorialPagos";
import Estadisticas from "./pages/Estadisticas";
import Cajas from "./pages/Cajas";
import Cortes from "./pages/Cortes";
import Logs from "./pages/Logs";

// --- IMPORTACIONES NUEVAS ---
import Usuarios from "./pages/Usuarios";
import Perfil from "./pages/Perfil";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="bottom-right" richColors />
          
          <Routes>
            {/* Ruta Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas (Todas van dentro del MainLayout) */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/planes" element={<Planes />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/pagos/cliente/:id" element={<HistorialPagos />} />
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/cajas" element={<Cajas />} />
              <Route path="/cortes" element={<Cortes />} />
              <Route path="/logs" element={<Logs />} />
              
              {/* --- RUTAS NUEVAS --- */}
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;