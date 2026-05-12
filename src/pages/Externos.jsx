import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const PLANES = {
  externo_base:     { label: "Externo Base",     monto: 35000 },
  externo_completo: { label: "Externo Completo", monto: 50000 },
};

const ROLES_PROFESIONAL = ["medico", "kine", "psicologo"];
const TODOS_ROLES       = [...ROLES_PROFESIONAL, "secretaria", "admin"];

const ESPECIALIDADES_POR_ROL = {
  medico:    ["Cadera", "Rodilla", "Hombro", "Columna", "Tobillo", "Cirugía Articular", "Traumatología"],
  kine:      ["Kinesiología"],
  psicologo: ["Psicología"],
};

function fmt(n) { return `$${Number(n || 0).toLocaleString("es-CL")}`; }

function generarUsername(nombre, apellido) {
  return `${nombre.toLowerCase().replace(/\s+/g, "").slice(0, 6)}${apellido.toLowerCase().replace(/\s+/g, "").slice(0, 4)}`.replace(/[^a-z0-9]/g, "") || "externo";
}

function generarPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function estadoBadge(estado) {
  const cfg = {
    activo:         { bg: "#f0fdf4", color: "#16a34a", label: "Activo" },
    pendiente_pago: { bg: "#fffbeb", color: "#d97706", label: "Pendiente" },
    suspendido:     { bg: "#f8fafc", color: "#64748b", label: "Suspendido" },
    vencido:        { bg: "#fef2f2", color: "#dc2626", label: "Vencido" },
  };
  const c = cfg[estado] || cfg.suspendido;
  return <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{c.label}</span>;
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
  overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 },
  modal:        { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto" },
  input:        { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", color: "#0f172a" },
  btnPrimary:   { background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnSecondary: { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  error:        { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 12 },
};

function ModalNuevoExterno({ onClose, onCreado, apiKey }) {
  const [rol,          setRol]          = useState("medico");
  const [nombre,       setNombre]       = useState("");
  const [apellido,     setApellido]     = useState("");
  const [rut,          setRut]          = useState("");
  const [email,        setEmail]        = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [plan,         setPlan]         = useState("externo_base");
  const [descPct,      setDescPct]      = useState(0);
  const [descMotivo,   setDescMotivo]   = useState("");
  const [descHasta,    setDescHasta]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [creado,       setCreado]       = useState(null);

  const headers     = { "Content-Type": "application/json", "X-Superadmin-Key": apiKey };
  const monto       = Math.round((PLANES[plan]?.monto || 0) * (1 - descPct / 100));
  const username    = generarUsername(nombre, apellido);
  const esProf      = ROLES_PROFESIONAL.includes(rol);
  const especialidades = ESPECIALIDADES_POR_ROL[rol] || [];

  async function handleGuardar() {
    setError(null);
    if (!nombre || !email) { setError("Nombre y email son obligatorios"); return; }
    if (esProf && !rut)    { setError("RUT es obligatorio para profesionales"); return; }
    setSaving(true);
    const password = generarPassword();
    try {
      // 1. Crear profesional o usuario — add_professional crea usuario automáticamente
      if (esProf) {
        const res = await fetch(`${API_URL}/professionals`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: username, name: `${nombre} ${apellido}`.trim(),
            rut, specialty: especialidad, active: true,
            username, password, role: rol, scope: "externo", email,
          })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Error creando profesional"); }
      } else {
        const res = await fetch(`${API_URL}/admin/users`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username, password,
            nombre: `${nombre} ${apellido}`.trim(),
            role: rol, scope: "externo", email, active: true,
          })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Error creando usuario"); }
      }

      // 2. Crear suscripción
      const susRes = await fetch(`${API_URL}/api/superadmin/suscripciones`, {
        method: "POST", headers,
        body: JSON.stringify({
          centro_id: username, nombre_centro: `${nombre} ${apellido}`.trim(),
          plan, roles: {}, email_contacto: email, metodo_pago: "manual",
          descuento_pct: descPct, descuento_motivo: descMotivo, descuento_hasta: descHasta || null,
        })
      });
      if (!susRes.ok) throw new Error((await susRes.json()).detail || "Error creando suscripción");
      const susData = await susRes.json();

      // 3. Enviar credenciales
      await fetch(`${API_URL}/api/superadmin/externos/${username}/enviar-credenciales`, {
        method: "POST", headers,
        body: JSON.stringify({ email_contacto: email, nombre: `${nombre} ${apellido}`.trim(), username, password_temp: password, plan })
      }).catch(() => {});

      setCreado({ username, password, linkPago: susData.link_pago || null });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (creado) return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 12px", color: "#166534" }}>✅ Externo creado</h3>
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>Credenciales enviadas a <strong>{email}</strong></p>
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#475569" }}>Usuario:</p>
          <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>{creado.username}</p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#475569" }}>Contraseña temporal:</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>{creado.password}</p>
        </div>
        {creado.linkPago && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 12, wordBreak: "break-all", marginBottom: 12 }}>
            {creado.linkPago}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {creado.linkPago && <button style={styles.btnPrimary} onClick={() => navigator.clipboard.writeText(creado.linkPago).catch(() => {})}>Copiar link</button>}
          <button style={styles.btnSecondary} onClick={() => { onCreado(); onClose(); }}>Cerrar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 16px" }}>Nuevo externo</h3>
        {error && <div style={styles.error}>{error}</div>}

        <Field label="Rol">
          <select style={styles.input} value={rol} onChange={e => { setRol(e.target.value); setEspecialidad(""); }}>
            {TODOS_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Field label="Nombre *">
            <input style={styles.input} value={nombre} onChange={e => setNombre(e.target.value)} />
          </Field>
          <Field label="Apellido">
            <input style={styles.input} value={apellido} onChange={e => setApellido(e.target.value)} />
          </Field>
        </div>

        {esProf && (
          <Field label="RUT *">
            <input style={styles.input} value={rut} placeholder="12345678-9" onChange={e => setRut(e.target.value)} />
          </Field>
        )}

        <Field label="Email *">
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>

        {esProf && especialidades.length > 0 && (
          <Field label="Especialidad">
            <select style={styles.input} value={especialidad} onChange={e => setEspecialidad(e.target.value)}>
              <option value="">Seleccionar…</option>
              {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
        )}

        <Field label="Plan">
          <select style={styles.input} value={plan} onChange={e => setPlan(e.target.value)}>
            {Object.entries(PLANES).map(([k, v]) => <option key={k} value={k}>{v.label} — {fmt(v.monto)}/mes</option>)}
          </select>
        </Field>

        <Field label="Descuento (%)">
          <input style={styles.input} type="number" min={0} max={100} value={descPct} onChange={e => setDescPct(Number(e.target.value))} />
        </Field>

        {descPct > 0 && <>
          <Field label="Motivo"><input style={styles.input} value={descMotivo} onChange={e => setDescMotivo(e.target.value)} /></Field>
          <Field label="Válido hasta"><input style={styles.input} type="date" value={descHasta} onChange={e => setDescHasta(e.target.value)} /></Field>
        </>}

        {nombre && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#475569" }}>
            Usuario que se creará: <strong>{username}</strong>
          </div>
        )}

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>
            <span>Total mensual</span><span>{fmt(monto)}/mes</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleGuardar} disabled={saving}>
            {saving ? "Creando…" : "Crear y enviar credenciales"}
          </button>
          <button style={styles.btnSecondary} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Externos() {
  const { apiKey } = useAuth();
  const [lista,         setLista]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modalNuevo,    setModalNuevo]    = useState(false);
  const [confirmBorrar, setConfirmBorrar] = useState(null);
  const [cobrando,      setCobrando]      = useState(null);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);

  const headers = { "X-Superadmin-Key": apiKey, "Content-Type": "application/json" };

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/suscripciones`, { headers });
      const all = res.ok ? await res.json() : [];
      setLista(all.filter(s => s.plan !== "centro"));
    } catch { setLista([]); }
    finally { setLoading(false); }
  }

  async function handleCobrar(s) {
    setCobrando(s.centro_id); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/superadmin/suscripciones/${s.centro_id}/cobrar`, { method: "POST", headers });
      const data = await res.json();
      if (data.link_pago) { navigator.clipboard.writeText(data.link_pago).catch(() => {}); setSuccess(`✅ Link enviado y copiado para ${s.nombre_centro}`); }
      setTimeout(() => setSuccess(null), 3000);
      cargar();
    } catch { setError("Error al cobrar"); }
    finally { setCobrando(null); }
  }

  async function handleBorrar(s) {
    try {
      await fetch(`${API_URL}/api/superadmin/suscripciones/${s.centro_id}`, { method: "DELETE", headers });
      await fetch(`${API_URL}/professionals/${s.centro_id}`, { method: "DELETE" }).catch(() => {});
      setConfirmBorrar(null);
      setSuccess(`✅ ${s.nombre_centro} eliminado`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error eliminando"); }
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Externos</h1>
          <p className="page-sub">{lista.length} profesionales externos</p>
        </div>
        <button className="btn-primary" onClick={() => setModalNuevo(true)}>+ Nuevo</button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> :
        lista.length === 0 ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Sin externos registrados</p> :
        lista.map(s => {
          const dias = s.fecha_vencimiento ? Math.ceil((new Date(s.fecha_vencimiento) - new Date()) / 86400000) : null;
          return (
            <div key={s.centro_id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.nombre_centro}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{PLANES[s.plan]?.label || s.plan} · {s.email_contacto}</div>
                </div>
                {estadoBadge(s.estado)}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
                💰 {fmt(s.precio_final)}/mes
                {s.descuento_pct > 0 && <span style={{ color: "#16a34a", marginLeft: 8 }}>({s.descuento_pct}% dto)</span>}
                {dias !== null && <span style={{ marginLeft: 12, color: dias <= 3 ? "#dc2626" : "#475569" }}>📅 {dias} días</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => handleCobrar(s)} disabled={cobrando === s.centro_id}>
                  {cobrando === s.centro_id ? "…" : "💳 Cobrar"}
                </button>
                <button style={{ fontSize: 12, padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 600 }} onClick={() => setConfirmBorrar(s)}>
                  🗑 Borrar
                </button>
              </div>
            </div>
          );
        })
      }

      {modalNuevo && <ModalNuevoExterno onClose={() => setModalNuevo(false)} onCreado={cargar} apiKey={apiKey} />}

      {confirmBorrar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%" }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar externo?</p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Se eliminará la suscripción, usuario y profesional de <strong>{confirmBorrar.nombre_centro}</strong>.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmBorrar(null)}>Cancelar</button>
              <button style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }} onClick={() => handleBorrar(confirmBorrar)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
