import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Audit() {
  const { apiKey } = useAuth();
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [rut,     setRut]     = useState("");
  const [usuario, setUsuario] = useState("");

  const headers = { "X-Superadmin-Key": apiKey };

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limite: 200 });
      if (rut)     params.set("rut", rut);
      if (usuario) params.set("usuario", usuario);
      const res = await fetch(`${API_URL}/api/superadmin/audit?${params}`, { headers });
      setLogs(res.ok ? await res.json() : []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div className="page">
      <h1 className="page-title">Audit Log</h1>
      <p className="page-sub">Registro de accesos a fichas clínicas</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: 1, minWidth: 140 }}
          placeholder="Filtrar por RUT…" value={rut} onChange={e => setRut(e.target.value)} />
        <input className="input" style={{ flex: 1, minWidth: 140 }}
          placeholder="Filtrar por usuario…" value={usuario} onChange={e => setUsuario(e.target.value)} />
        <button className="btn-primary" style={{ whiteSpace: "nowrap" }} onClick={cargar}>
          Buscar
        </button>
      </div>

      {loading ? <p style={{ color: "#94a3b8" }}>Cargando…</p> : (
        <div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>{logs.length} registros</p>
          {logs.map(log => (
            <div key={log.id} className="card" style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong style={{ color: "#1e3a8a" }}>{log.usuario}</strong>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  {new Date(log.created_at).toLocaleString("es-CL")}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>
                {log.accion}
                {log.rut_paciente && <span style={{ marginLeft: 8, color: "#0f172a", fontWeight: 600 }}>RUT: {log.rut_paciente}</span>}
                {log.ip && <span style={{ marginLeft: 8, color: "#94a3b8" }}>{log.ip}</span>}
              </div>
              {log.detalle && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{log.detalle}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
