import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Suscripciones from "../pages/Suscripciones";
import Usuarios from "../pages/Usuarios";
import Audit from "../pages/Audit";
import Profesionales from "../pages/Profesionales";
import Externos from "../pages/Externos";
import PagoExitoso from "../pages/PagoExitoso";

function PagoExitoso() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, maxWidth: 420,
        width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: "0 0 8px", color: "#166534", fontSize: 22, fontWeight: 800 }}>
          ¡Pago confirmado!
        </h2>
        <p style={{ color: "#475569", fontSize: 14, marginBottom: 24 }}>
          Tu suscripción ha sido activada. Recibirás un correo con tus credenciales de acceso al sistema clínico.
        </p>
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12,
          padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#166534" }}>
          Revisa tu bandeja de entrada en <strong>clinica.icarticular.cl</strong>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          ¿Tienes dudas? Escríbenos a contacto@icarticular.cl
        </p>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const { logout } = useAuth();
  const navStyle = ({ isActive }) => ({
    display: "block", padding: "10px 16px", borderRadius: 10,
    fontSize: 13, fontWeight: 600, textDecoration: "none",
    background: isActive ? "#1e3a8a" : "transparent",
    color: isActive ? "#fff" : "#94a3b8",
    marginBottom: 4,
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 220, background: "#0f172a", padding: "24px 12px",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
      }}>
        <div style={{ marginBottom: 28, paddingLeft: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>🏥 ICA</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Superadmin</div>
        </div>
        <nav style={{ flex: 1 }}>
          <NavLink to="/dashboard"     style={navStyle}>📊 Dashboard</NavLink>
          <NavLink to="/suscripciones" style={navStyle}>🔔 Suscripciones</NavLink>
          <NavLink to="/externos"      style={navStyle}>👤 Externos</NavLink>
          <NavLink to="/usuarios"      style={navStyle}>👥 Usuarios</NavLink>
          <NavLink to="/profesionales" style={navStyle}>🩺 Profesionales</NavLink>
          <NavLink to="/audit"         style={navStyle}>📋 Audit Log</NavLink>
        </nav>
        <button onClick={logout}
          style={{ background: "#1e293b", color: "#94a3b8", border: "none",
            borderRadius: 10, padding: "10px 16px", fontSize: 13,
            fontWeight: 600, textAlign: "left", cursor: "pointer" }}>
          ← Salir
        </button>
      </aside>
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}

function Guard({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function AppRouter() {
  const { isAuth } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/pago-exitoso"  element={<PagoExitoso />} />
        <Route path="/dashboard"     element={<Guard><Dashboard /></Guard>} />
        <Route path="/suscripciones" element={<Guard><Suscripciones /></Guard>} />
        <Route path="/externos"      element={<Guard><Externos /></Guard>} />
        <Route path="/usuarios"      element={<Guard><Usuarios /></Guard>} />
        <Route path="/profesionales" element={<Guard><Profesionales /></Guard>} />
        <Route path="/audit"         element={<Guard><Audit /></Guard>} />
        <Route path="*"              element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
