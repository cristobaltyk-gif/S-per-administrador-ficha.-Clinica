import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const PRECIOS_ROL = { medico: 30000, kine: 25000, psicologo: 30000, secretaria: 20000, admin: 20000 };
const PRECIOS_EXTERNO = { externo_base: 35000, externo_completo: 50000 };
const ROLES = ["medico", "kine", "psicologo", "secretaria", "admin"];

function fmt(n) { return `$${Number(n || 0).toLocaleString("es-CL")}`; }

function estadoBadge(estado) {
  const cfg = {
    activo:    { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", label: "Activo" },
    vencido:   { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Vencido" },
    suspendido:{ bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Suspendido" },
  };
  const c = cfg[estado] || cfg.suspendido;
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

function ModalNueva({ onClose, onCreada, apiKey }) {
  const [plan,       setPlan]       = useState("centro");
  const [centroId,   setCentroId]   = useState("");
  const [nombre,     setNombre]     = useState("");
  const [email,      setEmail]      = useState("");
  const [metodo,     setMetodo]     = useState("manual");
  const [descPct,    setDescPct]    = useState(0);
  const [descMotivo, setDescMotivo] = useState("");
  const [descHasta,  setDescHasta]  = useState("");
  const [roles,      setRoles]      = useState({ medico: 0, kine: 0, psicologo: 0, secretaria: 0, admin: 0 });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [linkPago,   setLinkPago]   = useState(null);

  const headers = { "Content-Type": "application/json", "X-Superadmin-Key": apiKey };

  function precioBase() {
    if (plan === "centro") return Object.entries(roles).reduce((acc, [r, q]) => acc + (PRECIOS_ROL[r] || 0) * q, 0);
    return PRECIOS_EXTERNO[plan] || 0;
  }
  function precioFinal() { return Math.round(precioBase() * (1 - descPct / 100)); }

  async function handleGuardar() {
    setError(null);
    if (!centroId || !nombre || !email) { setError("ID, nombre y email son obligatorios"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones`, {
        method: "POST", headers,
        body: JSON.stringify({
          centro_id: centroId, nombre_centro: nombre, plan,
          roles: plan === "centro" ? roles : {},
          email_contacto: email, metodo_pago: metodo,
          descuento_pct: descPct, descuento_motivo: descMotivo,
          descuento_hasta: descHasta || null,
        })
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      const data = await res.json();
      if (data.link_pago) setLinkPago(data.link_pago);
      else { onCreada(); onClose(); }
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (linkPago) return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>✅ Suscripción creada</h3>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 16 }}>Link de pago:</p>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
          padding: "10px 12px", fontSize: 12, wordBreak: "break-all", marginBottom: 16 }}>{linkPago}</div>
        <button style={styles.btnPrimary} onClick={() => navigator.clipboard.writeText(linkPago).catch(() => {})}>Copiar link</button>
        <button style={{ ...styles.btnSecondary, marginLeft: 8 }} onClick={() => { onCreada(); onClose(); }}>Cerrar</button>
      </div>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 480 }}>
        <h3 style={{ margin: "0 0 16px", color: "#0f172a" }}>Nueva suscripción</h3>
        {error && <div style={styles.error}>{error}</div>}
        <Field label="ID del centro"><input style={styles.input} value={centroId} placeholder="ej: ica"
          onChange={e => setCentroId(e.target.value.toLowerCase().replace(/\s/g, ""))} /></Field>
        <Field label="Nombre del centro"><input style={styles.input} value={nombre} onChange={e => setNombre(e.target.value)} /></Field>
        <Field label="Email de contacto"><input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Plan">
          <select style={styles.input} value={plan} onChange={e => setPlan(e.target.value)}>
            <option value="centro">Centro (por roles)</option>
            <option value="externo_base">Externo Base — {fmt(PRECIOS_EXTERNO.externo_base)}/mes</option>
            <option value="externo_completo">Externo Completo — {fmt(PRECIOS_EXTERNO.externo_completo)}/mes</option>
          </select>
        </Field>
        {plan === "centro" && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#475569" }}>Cantidad por rol</p>
            {ROLES.map(rol => (
              <div key={rol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, textTransform: "capitalize" }}>
                  {rol} <span style={{ color: "#94a3b8", fontSize: 11 }}>({fmt(PRECIOS_ROL[rol])}/u)</span>
                </span>
                <input type="number" min={0} max={20} style={{ ...styles.input, width: 60, margin: 0 }}
                  value={roles[rol]} onChange={e => setRoles(r => ({ ...r, [rol]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
        )}
        <Field label="Descuento (%)"><input style={styles.input} type="number" min={0} max={100} value={descPct}
          onChange={e => setDescPct(Number(e.target.value))} /></Field>
        {descPct > 0 && (<>
          <Field label="Motivo"><input style={styles.input} value={descMotivo} onChange={e => setDescMotivo(e.target.value)} /></Field>
          <Field label="Válido hasta"><input style={styles.input} type="date" value={descHasta} onChange={e => setDescHasta(e.target.value)} /></Field>
        </>)}
        <Field label="Método de cobro">
          <select style={styles.input} value={metodo} onChange={e => setMetodo(e.target.value)}>
            <option value="manual">Manual — link de pago por email</option>
            <option value="automatico">Automático — tarjeta guardada</option>
          </select>
        </Field>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#475569" }}>Precio base</span><span style={{ fontWeight: 600 }}>{fmt(precioBase())}/mes</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800,
            color: "#1e3a8a", borderTop: "1px solid #bfdbfe", marginTop: 6, paddingTop: 6 }}>
            <span>Total mensual</span><span>{fmt(precioFinal())}/mes</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleGuardar} disabled={saving}>
            {saving ? "Creando…" : "Crear suscripción"}
          </button>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function ModalDescuento({ suscripcion, onClose, onGuardado, apiKey }) {
  const [pct,    setPct]    = useState(suscripcion.descuento_pct || 0);
  const [motivo, setMotivo] = useState(suscripcion.descuento_motivo || "");
  const [hasta,  setHasta]  = useState(suscripcion.descuento_hasta || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  async function handleGuardar() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones/${suscripcion.centro_id}/descuento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Superadmin-Key": apiKey },
        body: JSON.stringify({ descuento_pct: pct, descuento_motivo: motivo, descuento_hasta: hasta || null })
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      onGuardado(); onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const precioFinal = Math.round((suscripcion.precio_base || 0) * (1 - pct / 100));
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Descuento — {suscripcion.nombre_centro}</h3>
        {error && <div style={styles.error}>{error}</div>}
        <Field label="Descuento (%)"><input style={styles.input} type="number" min={0} max={100} value={pct} onChange={e => setPct(Number(e.target.value))} /></Field>
        <Field label="Motivo"><input style={styles.input} value={motivo} onChange={e => setMotivo(e.target.value)} /></Field>
        <Field label="Válido hasta"><input style={styles.input} type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></Field>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Precio base</span><span>{fmt(suscripcion.precio_base)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#1e3a8a", borderTop: "1px solid #bfdbfe", marginTop: 6, paddingTop: 6 }}>
            <span>Precio final</span><span>{fmt(precioFinal)}/mes</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleGuardar} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Suscripciones() {
  const { apiKey } = useAuth();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modalNueva,    setModalNueva]    = useState(false);
  const [modalDesc,     setModalDesc]     = useState(null);
  const [cobrando,      setCobrando]      = useState(null);
  const [confirmBorrar, setConfirmBorrar] = useState(null);
  const [borrando,      setBorrando]      = useState(null);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);

  const headers = { "X-Superadmin-Key": apiKey };

  useEffect(() => { cargar(); }, []);

  async function handleBorrar(s) {
    setBorrando(s.centro_id);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones/${s.centro_id}`, {
        method: "DELETE", headers
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      setConfirmBorrar(null);
      setSuccess(`✅ Suscripción ${s.nombre_centro} eliminada`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch (e) { setError(e.message); }
    finally { setBorrando(null); }
  }

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones`, { headers });
      setSuscripciones(res.ok ? await res.json() : []);
    } catch { setSuscripciones([]); }
    finally { setLoading(false); }
  }

  async function handleCobrar(s) {
    setCobrando(s.centro_id); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones/${s.centro_id}/cobrar`,
        { method: "POST", headers });
      const data = await res.json();
      if (data.link_pago) {
        navigator.clipboard.writeText(data.link_pago).catch(() => {});
        setSuccess(`Link copiado para ${s.nombre_centro}`);
      } else {
        setSuccess(`Cobro enviado a ${s.nombre_centro}`);
      }
      await cargar();
    } catch { setError("Error al cobrar"); }
    finally { setCobrando(null); }
  }

  const activas  = suscripciones.filter(s => s.estado === "activo").length;
  const vencidas = suscripciones.filter(s => s.estado === "vencido").length;
  const mrr      = suscripciones.filter(s => s.estado === "activo").reduce((a, s) => a + (s.precio_final || 0), 0);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Suscripciones</h1>
          <p className="page-sub">MRR: <strong>{fmt(mrr)}/mes</strong></p>
        </div>
        <button className="btn-primary" onClick={() => setModalNueva(true)}>+ Nueva</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Activas",  value: activas,  color: "#16a34a" },
          { label: "Vencidas", value: vencidas, color: "#dc2626" },
          { label: "MRR",      value: fmt(mrr), color: "#1e3a8a" },
        ].map(k => (
          <div key={k.label} className="card" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : suscripciones.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Sin suscripciones</p>
      ) : suscripciones.map(s => {
        const dias = s.fecha_vencimiento
          ? Math.ceil((new Date(s.fecha_vencimiento) - new Date()) / 86400000)
          : null;
        return (
          <div key={s.centro_id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.nombre_centro}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {s.plan} · {s.metodo_pago === "automatico" ? "🔄 Auto" : "📧 Manual"}
                </div>
              </div>
              {estadoBadge(s.estado)}
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
              💰 {fmt(s.precio_final)}/mes
              {s.descuento_pct > 0 && <span style={{ color: "#16a34a", marginLeft: 8 }}>({s.descuento_pct}% dto)</span>}
              {dias !== null && <span style={{ marginLeft: 12, color: dias <= 3 ? "#dc2626" : "#475569" }}>📅 {dias} días</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => handleCobrar(s)} disabled={cobrando === s.centro_id}>
                {cobrando === s.centro_id ? "…" : "💳 Cobrar"}
              </button>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => setModalDesc(s)}>
                🏷️ Descuento
              </button>
              <button style={{ fontSize: 12, padding: "6px 12px", background: "#fef2f2",
                color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 600 }}
                onClick={() => setConfirmBorrar(s)}>
                🗑 Borrar
              </button>
            </div>
          </div>
        );
      })}

      {modalNueva && <ModalNueva onClose={() => setModalNueva(false)} onCreada={cargar} apiKey={apiKey} />}
      {confirmBorrar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%" }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar suscripción?</p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Se eliminará la suscripción de <strong>{confirmBorrar.nombre_centro}</strong>.<br/>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmBorrar(null)}>Cancelar</button>
              <button style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}
                onClick={() => handleBorrar(confirmBorrar)} disabled={!!borrando}>
                {borrando ? "…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalDesc  && <ModalDescuento suscripcion={modalDesc} onClose={() => setModalDesc(null)} onGuardado={cargar} apiKey={apiKey} />}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</p>
      {children}
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16, overflowY: "auto" },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none", color: "#0f172a" },
  btnPrimary: { background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnSecondary: { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  error:   { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 },
  success: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 },
};
        
