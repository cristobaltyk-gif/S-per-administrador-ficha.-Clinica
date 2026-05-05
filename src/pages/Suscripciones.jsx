import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;
function fmt(n) { return `$${Number(n || 0).toLocaleString("es-CL")}`; }

function Badge({ estado }) {
  const cfg = {
    activo:    { bg: "#f0fdf4", color: "#16a34a", label: "Activo" },
    vencido:   { bg: "#fef2f2", color: "#dc2626", label: "Vencido" },
    suspendido:{ bg: "#f8fafc", color: "#64748b", label: "Suspendido" },
  };
  const c = cfg[estado] || cfg.suspendido;
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20,
      padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

export default function Suscripciones() {
  const { apiKey } = useAuth();
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState(null);

  // Modal descuento
  const [modalDesc, setModalDesc] = useState(null);
  const [dPct,      setDPct]      = useState(0);
  const [dMotivo,   setDMotivo]   = useState("");
  const [dHasta,    setDHasta]    = useState("");
  const [saving,    setSaving]    = useState(false);

  const headers = { "X-Superadmin-Key": apiKey, "Content-Type": "application/json" };

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones`, { headers });
      setLista(res.ok ? await res.json() : []);
    } catch { setLista([]); }
    finally { setLoading(false); }
  }

  async function cambiarEstado(centroId, estado) {
    try {
      await fetch(`${API_URL}/api/superadmin/suscripciones/${centroId}/estado`, {
        method: "PATCH", headers,
        body: JSON.stringify({ estado })
      });
      setSuccess(`Estado actualizado`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error actualizando estado"); }
  }

  async function guardarDescuento() {
    setSaving(true);
    try {
      const precio_final = Math.round((modalDesc.precio_base || 0) * (1 - dPct / 100));
      await fetch(`${API_URL}/api/superadmin/suscripciones/${modalDesc.centro_id}/descuento`, {
        method: "PATCH", headers,
        body: JSON.stringify({ descuento_pct: dPct, descuento_motivo: dMotivo, descuento_hasta: dHasta || null, precio_final })
      });
      setModalDesc(null);
      setSuccess("Descuento aplicado");
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error aplicando descuento"); }
    finally { setSaving(false); }
  }

  const mrr = lista.filter(s => s.estado === "activo").reduce((a, s) => a + (s.precio_final || 0), 0);

  return (
    <div className="page">
      <h1 className="page-title">Suscripciones</h1>
      <p className="page-sub">MRR total: <strong>{fmt(mrr)}/mes</strong></p>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : lista.map(s => {
        const dias = s.fecha_vencimiento
          ? Math.ceil((new Date(s.fecha_vencimiento) - new Date()) / 86400000)
          : null;
        return (
          <div key={s.centro_id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.nombre_centro}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.centro_id} · {s.plan}</div>
              </div>
              <Badge estado={s.estado} />
            </div>

            <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
              <span>💰 {fmt(s.precio_final)}/mes</span>
              {s.descuento_pct > 0 && <span style={{ color: "#16a34a", marginLeft: 8 }}>({s.descuento_pct}% dto)</span>}
              {dias !== null && (
                <span style={{ marginLeft: 12, color: dias <= 3 ? "#dc2626" : "#475569" }}>
                  📅 {dias} días
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {s.estado !== "activo" && (
                <button className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => cambiarEstado(s.centro_id, "activo")}>
                  ✅ Activar
                </button>
              )}
              {s.estado === "activo" && (
                <button className="btn-danger" style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => cambiarEstado(s.centro_id, "suspendido")}>
                  ⏸ Suspender
                </button>
              )}
              <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => {
                  setDPct(s.descuento_pct || 0);
                  setDMotivo(s.descuento_motivo || "");
                  setDHasta(s.descuento_hasta || "");
                  setModalDesc(s);
                }}>
                🏷️ Descuento
              </button>
            </div>
          </div>
        );
      })}

      {/* Modal descuento */}
      {modalDesc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
            <h3 style={{ margin: "0 0 16px" }}>Descuento — {modalDesc.nombre_centro}</h3>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Descuento (%)</p>
              <input className="input" type="number" min={0} max={100} value={dPct}
                onChange={e => setDPct(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Motivo</p>
              <input className="input" value={dMotivo} onChange={e => setDMotivo(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Válido hasta</p>
              <input className="input" type="date" value={dHasta} onChange={e => setDHasta(e.target.value)} />
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#1e3a8a" }}>
                <span>Precio final</span>
                <span>{fmt(Math.round((modalDesc.precio_base || 0) * (1 - dPct / 100)))}/mes</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={guardarDescuento} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button className="btn-secondary" onClick={() => setModalDesc(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
