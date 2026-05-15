import { useState, useEffect } from "react";

const BACKEND_URL = "https://services.icarticular.cl";

export default function PagoExitoso() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    fetch(`${BACKEND_URL}/api/suscripciones/retorno-info?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setInfo(d); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, maxWidth: 420,
        width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: "0 0 8px", color: "#166534", fontSize: 22, fontWeight: 800 }}>
          ¡Pago confirmado!
        </h2>
        <p style={{ color: "#475569", fontSize: 14, marginBottom: 20 }}>
          Su suscripción ha sido activada exitosamente.
        </p>
        {info?.email && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12,
            padding: "14px 20px", marginBottom: 16, fontSize: 13, color: "#166534", textAlign: "left" }}>
            <p style={{ margin: "0 0 6px" }}>📧 Sus credenciales serán enviadas a:</p>
            <strong>{info.email}</strong>
          </div>
        )}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
          padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#1e3a8a", textAlign: "left" }}>
          <p style={{ margin: "0 0 6px" }}>🌐 Podrá ingresar al sistema clínico en:</p>
          <a href="https://clinica.icarticular.cl" target="_blank" rel="noreferrer"
            style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>
            clinica.icarticular.cl
          </a>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          ¿Tienes dudas? Escríbenos a contacto@icarticular.cl
        </p>
      </div>
    </div>
  );
}
