import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ROLES = ["medico", "kine", "psicologo", "secretaria", "admin"];
const PRECIOS_ROL = { medico: 30000, kine: 25000, psicologo: 30000, secretaria: 20000, admin: 20000 };
function fmt(n) { return `$${Number(n || 0).toLocaleString("es-CL")}`; }

export default function Centros() {
  const { apiKey } = useAuth();
  const [centros,   setCentros]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState("lista"); // lista | nuevo | detalle
  const [seleccionado, setSeleccionado] = useState(null);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [confirm,   setConfirm]   = useState(null);

  // Form nuevo centro
  const [form, setForm] = useState({
    id: "", nombre: "", email_contacto: "", plan: "centro",
    max_usuarios: { medico: 0, kine: 0, psicologo: 0, secretaria: 0, admin: 0 }
  });
  const [saving, setSaving] = useState(false);

  const headers = { "X-Superadmin-Key": apiKey, "Content-Type": "application/json" };

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/centros`, { headers });
      setCentros(res.ok ? await res.json() : []);
    } catch { setCentros([]); }
    finally { setLoading(false); }
  }

  async function handleCrear() {
    setError(null); setSaving(true);
    try {
      if (!form.id || !form.nombre || !form.email_contacto) {
        setError("ID, nombre y email son obligatorios"); return;
      }
      const res = await fetch(`${API_URL}/api/superadmin/centros`, {
        method: "POST", headers,
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      setSuccess("✅ Centro creado correctamente");
      await cargar();
      setTimeout(() => { setSuccess(null); setVista("lista"); }, 1500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleToggleActivo(centro) {
    try {
      await fetch(`${API_URL}/api/superadmin/centros/${centro.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ activo: !centro.activo })
      });
      setSuccess(`${centro.nombre} ${centro.activo ? "desactivado" : "activado"}`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error actualizando centro"); }
  }

  async function handleBorrar(centro) {
    try {
      await fetch(`${API_URL}/api/superadmin/centros/${centro.id}`, {
        method: "DELETE", headers
      });
      setConfirm(null);
      setVista("lista");
      setSuccess(`✅ Centro ${centro.nombre} eliminado`);
      setTimeout(() => setSuccess(null), 2000);
      cargar();
    } catch { setError("Error eliminando centro"); }
  }

  async function abrirDetalle(centro) {
    try {
      const res = await fetch(`${API_URL}/api/superadmin/centros/${centro.id}`, { headers });
      if (res.ok) setSeleccionado(await res.json());
    } catch {}
    setVista("detalle");
  }

  const precioBase = Object.entries(form.max_usuarios)
    .reduce((acc, [rol, qty]) => acc + (PRECIOS_ROL[rol] || 0) * qty, 0);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Centros</h1>
          <p className="page-sub">{centros.length} centros registrados</p>
        </div>
        {vista === "lista"
          ? <button className="btn-primary" onClick={() => { setForm({ id: "", nombre: "", email_contacto: "", plan: "centro", max_usuarios: { medico: 0, kine: 0, psicologo: 0, secretaria: 0, admin: 0 } }); setVista("nuevo"); }}>+ Nuevo</button>
          : <button className="btn-secondary" onClick={() => setVista("lista")}>← Volver</button>
        }
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {/* LISTA */}
      {vista === "lista" && (
        loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> :
        centros.map(c => (
          <div key={c.id} className="card" style={{ cursor: "pointer" }} onClick={() => abrirDetalle(c)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {c.id} · {c.total_usuarios} usuarios
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                background: c.activo ? "#f0fdf4" : "#fef2f2",
                color: c.activo ? "#16a34a" : "#dc2626"
              }}>
                {c.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))
      )}

      {/* NUEVO */}
      {vista === "nuevo" && (
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>ID del centro (scope único)</p>
            <input className="input" value={form.id} placeholder="ej: traumamaule"
              onChange={e => setForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s/g, "") }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Nombre</p>
            <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Email de contacto</p>
            <input className="input" type="email" value={form.email_contacto} onChange={e => setForm(p => ({ ...p, email_contacto: e.target.value }))} />
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Máximo de usuarios por rol</p>
            {ROLES.map(rol => (
              <div key={rol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, textTransform: "capitalize" }}>
                  {rol} <span style={{ color: "#94a3b8", fontSize: 11 }}>({fmt(PRECIOS_ROL[rol])}/u)</span>
                </span>
                <input type="number" min={0} max={20} className="input" style={{ width: 60 }}
                  value={form.max_usuarios[rol]}
                  onChange={e => setForm(p => ({ ...p, max_usuarios: { ...p.max_usuarios, [rol]: Number(e.target.value) } }))} />
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 10, paddingTop: 10,
              display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#1e3a8a" }}>
              <span>Total mensual</span>
              <span>{fmt(precioBase)}/mes</span>
            </div>
          </div>

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleCrear} disabled={saving}>
            {saving ? "Creando…" : "Crear centro"}
          </button>
        </div>
      )}

      {/* DETALLE */}
      {vista === "detalle" && seleccionado && (
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{seleccionado.nombre}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{seleccionado.id} · {seleccionado.email_contacto}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                background: seleccionado.activo ? "#f0fdf4" : "#fef2f2",
                color: seleccionado.activo ? "#16a34a" : "#dc2626"
              }}>
                {seleccionado.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Capacidad por rol */}
            {seleccionado.max_usuarios && Object.keys(seleccionado.max_usuarios).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Usuarios por rol</p>
                {Object.entries(seleccionado.max_usuarios).map(([rol, max]) => {
                  const actual = (seleccionado.usuarios || []).filter(u => u.role?.name === rol).length;
                  return (
                    <div key={rol} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textTransform: "capitalize" }}>{rol}</span>
                      <span style={{ color: actual >= max ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                        {actual}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Usuarios */}
            {seleccionado.usuarios && seleccionado.usuarios.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Usuarios activos</p>
                {seleccionado.usuarios.map(u => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between",
                    fontSize: 12, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontWeight: 600 }}>{u.id}</span>
                    <span style={{ color: "#64748b" }}>{u.role?.name || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-secondary" style={{ fontSize: 12 }}
                onClick={() => handleToggleActivo(seleccionado)}>
                {seleccionado.activo ? "Desactivar" : "Activar"}
              </button>
              <button style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                onClick={() => setConfirm(seleccionado)}>
                🗑 Eliminar centro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BORRAR */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%" }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>¿Eliminar centro?</p>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Se eliminarán <strong>todos los usuarios</strong> con scope <strong>{confirm.id}</strong> y su suscripción.
            </p>
            <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 20 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Cancelar</button>
              <button style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", flex: 1 }} onClick={() => handleBorrar(confirm)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
