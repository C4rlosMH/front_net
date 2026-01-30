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

// --- AGREGA ESTO PARA QUE NO FALLE ---
const ClientesTemp = () => <h2>Gestión de Equipos (En construcción)</h2>;

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          
          <Routes>
            {/* Ruta Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/clientes" element={<ClientesTemp />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/planes" element={<Planes />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;