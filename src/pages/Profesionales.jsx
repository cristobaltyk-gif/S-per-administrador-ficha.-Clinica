import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Profesionales() {
  const { apiKey } = useAuth();
  const [lista,         setLista]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [buscar,        setBuscar]        = useState("");
  const [success,       setSuccess]       = useState(null);
  const [error,         setError]         = useState(null);
  const [confirmBorrar, setConfirmBorrar] = useState(null);

  const headers = { "X-Superadmin-Key": apiKey };

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    fetch(`${API_URL}/api/superadmin/profesionales`, { headers })
      .then(r => r.json())
      .then(setLista)
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  }

  async function handleBorrar(id) {
    try {
      await fetch(`${API_URL}/professionals/${id}`, { method: "DELETE", headers });
      setConfirmBorrar(null);
      setSuccess(`✅ ${id} eliminado`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error eliminando profesional"); }
  }

  const filtrados = lista.filter(p =>
    (p.name || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (p.specialty || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="page">
      <h1 className="page-title">Profesionales</h1>
      <p className="page-sub">{lista.length} registrados en la plataforma</p>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <input className="input" style={{ marginBottom: 16 }}
        placeholder="Buscar por nombre o especialidad…"
        value={buscar} onChange={e => setBuscar(e.target.value)} />

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : filtrados.map(p => (
        <div key={p.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {p.specialty || "Sin especialidad"} · {p.id}
                {p.rut && ` · ${p.rut}`}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
              background: p.active ? "#f0fdf4" : "#fef2f2",
              color: p.active ? "#16a34a" : "#dc2626"
            }}>
              {p.active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8,
            background: "#fef2f2", color: "#dc2626",
            border: "1px solid #fecaca", fontWeight: 600, cursor: "pointer" }}
            onClick={() => setConfirmBorrar(p)}>
            🗑 Borrar
          </button>
        </div>
      ))}

      {confirmBorrar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%" }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar profesional?</p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Se eliminará <strong>{confirmBorrar.name}</strong> y su usuario asociado.
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmBorrar(null)}>Cancelar</button>
              <button style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                onClick={() => handleBorrar(confirmBorrar.id)}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
