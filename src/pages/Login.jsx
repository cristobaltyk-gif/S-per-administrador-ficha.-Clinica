import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const { login } = useAuth();
  const [key,     setKey]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleLogin() {
    if (!key.trim()) { setError("Ingresa la clave de acceso"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/dashboard`, {
        headers: { "X-Superadmin-Key": key }
      });
      if (res.status === 403) throw new Error("Clave incorrecta");
      if (!res.ok) throw new Error("Error de conexión");
      login(key);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0f172a", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 36,
        width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            ICA Superadmin
          </h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Panel de administración de la plataforma
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
            Clave de acceso
          </p>
          <input
            className="input"
            type="password"
            value={key}
            placeholder="••••••••••••••••"
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", padding: "12px", fontSize: 14 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Verificando…" : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
