import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Profesionales() {
  const { apiKey } = useAuth();
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar,  setBuscar]  = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/superadmin/profesionales`,
      { headers: { "X-Superadmin-Key": apiKey } })
      .then(r => r.json())
      .then(setLista)
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = lista.filter(p =>
    (p.name || "").toLowerCase().includes(buscar.toLowerCase()) ||
    (p.specialty || "").toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="page">
      <h1 className="page-title">Profesionales</h1>
      <p className="page-sub">{lista.length} registrados en la plataforma</p>

      <input className="input" style={{ marginBottom: 16 }}
        placeholder="Buscar por nombre o especialidad…"
        value={buscar} onChange={e => setBuscar(e.target.value)} />

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : filtrados.map(p => (
        <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      ))}
    </div>
  );
}
