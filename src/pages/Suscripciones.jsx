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


function ModalEditar({ suscripcion, onClose, onGuardado, apiKey }) {
  const PRECIOS_ROL = { medico: 30000, kine: 25000, psicologo: 30000, secretaria: 20000, admin: 20000 };
  const ROLES = ["medico", "kine", "psicologo", "secretaria", "admin"];
  const [roles,  setRoles]  = useState(suscripcion.roles || { medico: 0, kine: 0, psicologo: 0, secretaria: 0, admin: 0 });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const precioBase  = Object.entries(roles).reduce((acc, [r, q]) => acc + (PRECIOS_ROL[r] || 0) * q, 0);
  const precioFinal = Math.round(precioBase * (1 - (suscripcion.descuento_pct || 0) / 100));

  async function handleGuardar() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones/${suscripcion.centro_id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Superadmin-Key": apiKey },
        body: JSON.stringify({ roles })
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      onGuardado(); onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Modificar roles — {suscripcion.nombre_centro}</h3>
        {error && <div style={styles.error}>{error}</div>}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569" }}>Cantidad por rol</p>
          {ROLES.map(rol => (
            <div key={rol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, textTransform: "capitalize" }}>
                {rol} <span style={{ color: "#94a3b8", fontSize: 11 }}>(${(PRECIOS_ROL[rol]/1000).toFixed(0)}k/u)</span>
              </span>
              <input type="number" min={0} max={20} style={{ ...styles.input, width: 60 }}
                value={roles[rol] || 0}
                onChange={e => setRoles(r => ({ ...r, [rol]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
          padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#475569" }}>Precio base</span>
            <span style={{ fontWeight: 600 }}>{fmt(precioBase)}/mes</span>
          </div>
          {suscripcion.descuento_pct > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a" }}>
              <span>Descuento {suscripcion.descuento_pct}%</span>
              <span>-{fmt(precioBase - precioFinal)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800,
            color: "#1e3a8a", borderTop: "1px solid #bfdbfe", marginTop: 6, paddingTop: 6 }}>
            <span>Total mensual</span>
            <span>{fmt(precioFinal)}/mes</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}


function ModalEdicion({ suscripcion, onClose, onGuardado, apiKey }) {
  const PRECIOS_ROL = { medico: 30000, kine: 25000, psicologo: 30000, secretaria: 20000, admin: 20000 };
  const ROLES = ["medico", "kine", "psicologo", "secretaria", "admin"];

  const [roles,        setRoles]        = useState(suscripcion.roles || {});
  const [descPct,      setDescPct]      = useState(suscripcion.descuento_pct || 0);
  const [descMotivo,   setDescMotivo]   = useState(suscripcion.descuento_motivo || "");
  const [descHasta,    setDescHasta]    = useState(suscripcion.descuento_hasta || "");
  const [vencimiento,  setVencimiento]  = useState(suscripcion.fecha_vencimiento || "");
  const [email,        setEmail]        = useState(suscripcion.email_contacto || "");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);

  const precioBase  = Object.entries(roles).reduce((acc, [r, q]) => acc + (PRECIOS_ROL[r] || 0) * q, 0);
  const precioFinal = Math.round(precioBase * (1 - descPct / 100));

  async function handleGuardar() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones/${suscripcion.centro_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Superadmin-Key": apiKey },
        body: JSON.stringify({
          roles, descuento_pct: descPct, descuento_motivo: descMotivo,
          descuento_hasta: descHasta || null,
          fecha_vencimiento: vencimiento,
          email_contacto: email,
        })
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      onGuardado(); onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 460 }}>
        <h3 style={{ margin: "0 0 16px", color: "#0f172a" }}>Editar — {suscripcion.nombre_centro}</h3>
        {error && <div style={styles.error}>{error}</div>}

        <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Roles y cantidad</p>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          {ROLES.map(rol => (
            <div key={rol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, textTransform: "capitalize" }}>
                {rol} <span style={{ color: "#94a3b8", fontSize: 11 }}>(${(PRECIOS_ROL[rol]/1000).toFixed(0)}k/u)</span>
              </span>
              <input type="number" min={0} max={20} style={{ ...styles.input, width: 60 }}
                value={roles[rol] || 0}
                onChange={e => setRoles(r => ({ ...r, [rol]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Descuento (%)</p>
            <input style={styles.input} type="number" min={0} max={100} value={descPct}
              onChange={e => setDescPct(Number(e.target.value))} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Dto válido hasta</p>
            <input style={styles.input} type="date" value={descHasta} onChange={e => setDescHasta(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Motivo descuento</p>
          <input style={styles.input} value={descMotivo} onChange={e => setDescMotivo(e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Vencimiento</p>
            <input style={styles.input} type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Email contacto</p>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
          padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#475569" }}>Precio base</span>
            <span style={{ fontWeight: 600 }}>{fmt(precioBase)}/mes</span>
          </div>
          {descPct > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a" }}>
              <span>Descuento {descPct}%</span><span>-{fmt(precioBase - precioFinal)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800,
            color: "#1e3a8a", borderTop: "1px solid #bfdbfe", marginTop: 6, paddingTop: 6 }}>
            <span>Total mensual</span><span>{fmt(precioFinal)}/mes</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

exp
