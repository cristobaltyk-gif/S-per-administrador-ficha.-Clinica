import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Usuarios() {
  const { apiKey } = useAuth();
  const [lista,         setLista]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [buscar,        setBuscar]        = useState("");
  const [success,       setSuccess]       = useState(null);
  const [error,         setError]         = useState(null);
  const [confirmBorrar, setConfirmBorrar] = useState(null);

  const headers = { "X-Superadmin-Key": apiKey, "Content-Type": "application/json" };

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/usuarios`, { headers });
      setLista(res.ok ? await res.json() : []);
    } catch { setLista([]); }
    finally { setLoading(false); }
  }

  async function toggleActivo(username, activo) {
    try {
      await fetch(`${API_URL}/api/superadmin/usuarios/${username}/active`, {
        method: "PATCH", headers,
        body: JSON.stringify({ active: !activo })
      });
      setSuccess(`${username} ${activo ? "desactivado" : "activado"}`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch {}
  }

  async function handleBorrar(username) {
    try {
      await fetch(`${API_URL}/professionals/${username}`, { method: "DELETE", headers });
      await fetch(`${API_URL}/admin/users/${username}`, { method: "DELETE", headers });
      setConfirmBorrar(null);
      setSuccess(`✅ ${username} eliminado`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error eliminando usuario"); }
  }

  const filtrados = lista.filter(u =>
    u.username.toLowerCase().includes(buscar.toLowerCase()) ||
    (u.role?.name || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="page">
      <h1 className="page-title">Usuarios</h1>
      <p className="page-sub">{lista.length} usuarios registrados</p>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <input className="input" style={{ marginBottom: 16 }}
        placeholder="Buscar por usuario o rol…"
        value={buscar} onChange={e => setBuscar(e.target.value)} />

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : filtrados.map(u => (
        <div key={u.username} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{u.username}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {u.role?.name || "—"} · {u.role?.scope || "ica"}
                {u.professional && u.professional !== "system" && ` · ${u.professional}`}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
              background: u.active ? "#f0fdf4" : "#fef2f2",
              color: u.active ? "#16a34a" : "#dc2626"
            }}>
              {u.active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
              background: u.active ? "#fef2f2" : "#f0fdf4",
              color: u.active ? "#dc2626" : "#16a34a",
              border: "none", fontWeight: 600, cursor: "pointer" }}
              onClick={() => toggleActivo(u.username, u.active)}>
              {u.active ? "Desactivar" : "Activar"}
            </button>
            <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
              background: "#fef2f2", color: "#dc2626",
              border: "1px solid #fecaca", fontWeight: 600, cursor: "pointer" }}
              onClick={() => setConfirmBorrar(u)}>
              🗑 Borrar
            </button>
          </div>
        </div>
      ))}

      {confirmBorrar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%" }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar usuario?</p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Se eliminará <strong>{confirmBorrar.username}</strong> del sistema.
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmBorrar(null)}>Cancelar</button>
              <button style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                onClick={() => handleBorrar(confirmBorrar.username)}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
