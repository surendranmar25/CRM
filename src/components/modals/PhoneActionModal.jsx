import React from "react";
import { F, F_MONO } from "../../theme/index.js";

export function PhoneActionModal({ phone, name, onClose, T }) {
  const clean = (phone || "").replace(/\D/g, "");
  const waNum = clean.startsWith("91") ? clean : `91${clean}`;

  const actions = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.845L.057 23.885a.5.5 0 00.613.613l6.04-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.073-1.387l-.361-.214-3.757.912.929-3.657-.236-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      ),
      label: "WhatsApp",
      sub: "Open chat on WhatsApp",
      color: "#25D366",
      bg: "#E8F8EE",
      border: "#25D36644",
      onClick: () => { window.open(`https://wa.me/${waNum}`, "_blank"); onClose(); },
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5B3BE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .9h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z"/>
        </svg>
      ),
      label: "Call",
      sub: `Dial ${phone}`,
      color: "#5B3BE8",
      bg: "#EEF0FF",
      border: "#5B3BE844",
      onClick: () => { window.location.href = `tel:${clean}`; onClose(); },
    },
    {
      icon: <span style={{ fontSize: 28 }}>📋</span>,
      label: "Copy number",
      sub: phone,
      color: T.inkSub,
      bg: T.surfaceEl,
      border: T.line,
      onClick: () => { navigator.clipboard?.writeText(phone); onClose(); },
    },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(3px)" }}
      onClick={onClose}>
      <div
        style={{ background: T.surface, borderRadius: 16, width: "100%", maxWidth: 340, boxShadow: T.shadowXl, animation: "fadeUp .18s ease", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.line}`, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Contact</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, fontFamily: F, marginBottom: 3 }}>{name}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5B3BE8", fontFamily: F_MONO, letterSpacing: "0.06em" }}>{phone}</div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {actions.map(a => (
            <button key={a.label} onClick={a.onClick}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${a.border}`, background: a.bg, cursor: "pointer", width: "100%", textAlign: "left", transition: "all .15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: a.color, fontFamily: F }}>{a.label}</div>
                <div style={{ fontSize: 12, color: T.inkMuted, fontFamily: F, marginTop: 2 }}>{a.sub}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 18, color: a.color, opacity: 0.5 }}>›</div>
            </button>
          ))}
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <button onClick={onClose}
            style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${T.line}`, background: T.surfaceEl, color: T.inkSub, fontSize: 13, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
