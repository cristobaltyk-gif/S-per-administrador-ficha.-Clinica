import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

function KPI({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "20px 14px" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function fmt(n) { return `$${Number(n || 0).toLocaleString("es-CL")}`; }

export default function Dashboard() {
  const { apiKey } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/superadmin/dashboard`,
      { headers: { "X-Superadmin-Key": apiKey } })
      .then(r => r.json())
      .then(setData)
      .catch(() => setError("Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p style={{ color: "#94a3b8" }}>Cargando…</p></div>;
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Resumen global de la plataforma</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <KPI label="Centros activos"    value={data.centros_activos}    color="#16a34a" />
        <KPI label="Centros vencidos"   value={data.centros_vencidos}   color="#dc2626" />
        <KPI label="MRR"               value={fmt(data.mrr)}           color="#1e3a8a" />
        <KPI label="Usuarios activos"  value={data.usuarios_activos}   color="#7c3aed" />
      </div>

      <div className="card">
        <p style={{ fontSize: 13, color: "#475569" }}>
          Profesionales registrados: <strong>{data.total_profesionales}</strong>
        </p>
      </div>
    </div>
  );
}
