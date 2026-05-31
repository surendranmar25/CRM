import React, { useState, useCallback, useEffect, useRef } from "react";
import { F_BODY, F_MONO, F_SERIF, F } from "../../theme/index.js";

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function useToast() {
  const [list, set] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    set(p => [...p, { id, msg, type }]);
    setTimeout(() => set(p => p.filter(x => x.id !== id)), 4000);
  }, []);
  return { list, push };
}

export function Toaster({ list, T }) {
  const colors = { success: T.won.dot, error: T.lost.dot, info: T.brand, warning: T.pending.dot };
  const icons  = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none", maxWidth:340 }}>
      {list.map((t, i) => (
        <div key={t.id} style={{
          background: T.surface, border: `1px solid ${T.lineMid}`,
          borderLeft: `3px solid ${colors[t.type] || colors.info}`,
          borderRadius: 10, padding: "12px 16px",
          fontSize: 13, color: T.ink, fontFamily: F_BODY,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          animation: "slideRight .25s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: colors[t.type] || colors.info, color:"#fff", fontSize: 10, fontWeight: 700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
            {icons[t.type] || icons.info}
          </span>
          <span style={{ lineHeight: 1.4 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DOT ──────────────────────────────────────────────────────────────────────
export const Dot = ({ color, size = 6 }) => (
  <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
);

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
export function StatusPill({ status, sm, T }) {
  const map = {
    Won: T.won, Pending: T.pending, Lost: T.lost, Drop: T.drop,
    "New Lead": T.new, Qualified: T.pending, "Proposal Sent": T.high,
    "High Value": T.high, Premium: T.premium, Bulk: T.bulk, Normal: T.drop, Strategic: T.new,
    Interested: T.won, "Order Confirmed": T.won,
    "Needs Time": T.pending, "Callback Requested": T.pending, Rescheduled: T.pending,
    "Not Interested": T.lost, Other: T.drop,
  };
  const c = map[status] || T.drop;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "4px 10px",
      borderRadius: sm ? 4 : 6,
      fontSize: sm ? 10 : 11, fontWeight: 600,
      fontFamily: F_MONO, letterSpacing: "0.06em", textTransform: "uppercase",
      background: c.bg, color: c.text,
      border: `1px solid ${c.dot}28`, whiteSpace: "nowrap",
    }}>
      <Dot color={c.dot} size={sm ? 4 : 5} />{status}
    </span>
  );
}

// ─── SOURCE ICON ──────────────────────────────────────────────────────────────
export function SourceIcon({ source }) {
  const icons = {
    WhatsApp: <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.845L.057 23.885a.5.5 0 00.613.613l6.04-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.073-1.387l-.361-.214-3.757.912.929-3.657-.236-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>,
    Email: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>,
    Website: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    Call: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .9h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92v1z"/></svg>,
    "Abandoned Cart": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
    "Social media": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
    Owner: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Other: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  };
  return icons[source] || icons.Other;
}

export function SourcePill({ source, T }) {
  if (!source) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 5,
      fontSize: 10, fontWeight: 500, fontFamily: F_MONO,
      letterSpacing: "0.04em",
      background: T.surfaceEl, color: T.inkSub,
      border: `1px solid ${T.line}`,
      whiteSpace: "nowrap",
    }}>
      <SourceIcon source={source} />{source}
    </span>
  );
}

// ─── ICON ──────────────────────────────────────────────────────────────────────
export function Ic({ d, sz = 16, color = "currentColor", sw = 1.75 }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <path d={d} />
    </svg>
  );
}

// ─── PATH ICONS ───────────────────────────────────────────────────────────────
export const P = {
  dash:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  list:    "M4 6h16M4 10h16M4 14h10M4 18h8",
  chart:   "M3 3v18h18 M7 16l4-4 4 4 4-7",
  users:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  check:   "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  key:     "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z M12 15a3 3 0 100-6 3 3 0 000 6z",
  layers:  "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  bell:    "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  search:  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  plus:    "M12 5v14M5 12h14",
  close:   "M18 6L6 18M6 6l12 12",
  edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  out:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  dl:      "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  up:      "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  menu:    "M3 12h18M3 6h18M3 18h18",
  chevL:   "M15 18l-6-6 6-6",
  chevR:   "M9 18l6-6-6-6",
  chevD:   "M6 9l6 6 6-6",
  chevU:   "M18 15l-6-6-6 6",
  sun:     "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon:    "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  phone:   "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .9h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92v-.01z",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  copy:    "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  link:    "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  grid:    "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  bolt:    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  trend:   "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  activity:"M22 12h-4l-3 9L9 3l-3 9H2",
  target:  "M22 12A10 10 0 1112 2 M22 12a6 6 0 10-6 6 M22 12a2 2 0 10-2 2",
  award:   "M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  calendar:"M8 2v4M16 2v4 M3 10h18 M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z",
  clock:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  more:    "M12 13a1 1 0 100-2 1 1 0 000 2z M19 13a1 1 0 100-2 1 1 0 000 2z M5 13a1 1 0 100-2 1 1 0 000 2z",
  arrowR:  "M5 12h14M12 5l7 7-7 7",
  check2:  "M20 6L9 17l-5-5",
  zap:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  percent: "M19 5L5 19 M6.5 6.5h.01 M17.5 17.5h.01",
  package: "M12 22l-8.66-5v-10L12 2l8.66 5v10L12 22z M12 22V12 M20.66 7L12 12 3.34 7 M12 2v10",
  msg:     "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  send:    "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
};

// ─── AVATAR ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 32, T }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    ["#dbeafe","#1d4ed8"],["#d1fae5","#065f46"],["#fce7f3","#9d174d"],
    ["#ede9fe","#5b21b6"],["#fef3c7","#92400e"],["#fee2e2","#991b1b"],
    ["#e0f2fe","#0369a1"],["#f0fdf4","#14532d"],
  ];
  const idx = (name || "?").charCodeAt(0) % colors.length;
  const [bg, fg] = colors[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.max(9, size * 0.34), fontWeight: 700,
      fontFamily: F_MONO, letterSpacing: "0.03em",
      flexShrink: 0, userSelect: "none",
    }}>
      {initials}
    </div>
  );
}

// ─── BUTTON ────────────────────────────────────────────────────────────────────
export function Btn({ primary, ghost, danger, sm, icon, label, onClick, disabled, full, T, title }) {
  const [hov, setHov] = useState(false);
  const h = sm ? 30 : 36;
  const fs = sm ? 12 : 13;
  const px = sm ? 10 : 14;
  let bg, border, color;
  if (primary) {
    bg = hov ? T.brandHover : T.brand;
    border = "transparent";
    color = "#fff";
  } else if (danger) {
    bg = hov ? T.lost.bg : "transparent";
    border = T.lost.dot + "44";
    color = T.lost.text;
  } else {
    bg = hov ? T.surfaceEl : "transparent";
    border = T.line;
    color = T.inkSub;
  }
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: h, padding: `0 ${px}px`,
        background: bg, border: `1px solid ${border}`,
        borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: fs, fontWeight: 500, fontFamily: F_BODY,
        color: disabled ? T.inkMuted : color,
        transition: "all .14s", flexShrink: 0, whiteSpace: "nowrap",
        width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start",
        opacity: disabled ? 0.5 : 1,
      }}>
      {icon && <svg width={sm ? 13 : 14} height={sm ? 13 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>}
      {label}
    </button>
  );
}

// ─── FORM INPUT ────────────────────────────────────────────────────────────────
export const inputSx = (T, err) => ({
  width: "100%", height: 38, borderRadius: 8,
  border: `1.5px solid ${err ? T.lost.dot : T.line}`,
  background: T.surface, color: T.ink,
  fontSize: 13, padding: "0 12px",
  fontFamily: F_BODY, outline: "none",
  transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
});
export const mkFocus = T => e => {
  e.target.style.borderColor = T.brand;
  e.target.style.boxShadow = `0 0 0 3px rgba(${T.brandRgb},0.15)`;
};
export const mkBlur = T => e => {
  e.target.style.borderColor = T.line;
  e.target.style.boxShadow = "none";
};
export const selectBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center`;

export function FInput({ label, value, onChange, placeholder, type = "text", error, required, T, hint }) {
  const fo = mkFocus(T); const bl = mkBlur(T);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, letterSpacing: "0.02em" }}>
          {label}{required && <span style={{ color: T.lost.dot, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...inputSx(T, error), paddingRight: 12 }}
        onFocus={fo} onBlur={bl} />
      {error && <span style={{ fontSize: 11, color: T.lost.text, fontFamily: F_MONO }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 11, color: T.inkMuted }}>{hint}</span>}
    </div>
  );
}

export function FSelect({ label, value, onChange, options, placeholder, required, error, T }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = (options || []).filter(o =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setQuery("");
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const displayValue = open ? query : (value || "");
  const showPlaceholder = !open && !value;

  const borderColor = error ? T.lost.dot : focused ? T.brand : T.line;
  const boxShadow = focused ? `0 0 0 3px rgba(${T.brandRgb},0.15)` : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }} ref={wrapRef}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, letterSpacing: "0.02em" }}>
          {label}{required && <span style={{ color: T.lost.dot, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={showPlaceholder ? (placeholder || "Select or type…") : ""}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); setQuery(""); }}
          onBlur={() => { setFocused(false); }}
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); setOpen(false); setQuery(""); }
            if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); e.stopPropagation(); select(filtered[0]); }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); }
          }}
          style={{
            ...inputSx(T, error),
            paddingRight: 56,
            borderColor,
            boxShadow,
            transition: "border-color .15s, box-shadow .15s",
            cursor: "text",
          }}
        />
        {/* Clear button */}
        {value && !open && (
          <button onMouseDown={clear} style={{
            position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: T.inkMuted,
            fontSize: 14, lineHeight: 1, padding: "2px 4px", display: "flex", alignItems: "center",
          }}>×</button>
        )}
        {/* Chevron */}
        <div style={{
          position: "absolute", right: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          pointerEvents: "none", transition: "transform .2s",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        {/* Dropdown */}
        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
            background: T.surface, border: `1.5px solid ${T.brand}`, borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", overflow: "hidden", maxHeight: 220, overflowY: "auto",
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 14px", fontSize: 12, color: T.inkMuted, fontFamily: F_BODY }}>
                No results for "{query}"
              </div>
            ) : filtered.map(o => (
              <div key={o} onMouseDown={() => select(o)} style={{
                padding: "9px 14px", fontSize: 13, color: o === value ? T.brand : T.ink,
                background: o === value ? `rgba(${T.brandRgb},0.08)` : "transparent",
                fontFamily: F_BODY, cursor: "pointer", fontWeight: o === value ? 600 : 400,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "background .1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = `rgba(${T.brandRgb},0.1)`}
                onMouseLeave={e => e.currentTarget.style.background = o === value ? `rgba(${T.brandRgb},0.08)` : "transparent"}
              >
                {o}
                {o === value && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: T.lost.text, fontFamily: F_MONO }}>{error}</span>}
    </div>
  );
}

// ─── SECTION LABEL ─────────────────────────────────────────────────────────────
export const SL = ({ children, T }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>
    {children}
  </div>
);

// ─── SKELETON ROW ──────────────────────────────────────────────────────────────
export function SkeletonRow({ T }) {
  return (
    <tr>
      {[34, 32, "22%", "14%", "10%", "12%", "11%", "10%", "9%", "9%", 110].map((w, i) => (
        <td key={i} style={{ padding: "12px 10px", borderBottom: `1px solid ${T.line}` }}>
          <div className="ek-skeleton" style={{ height: 14, width: typeof w === "string" ? "80%" : w === 34 ? 16 : w === 32 ? 20 : "70%", borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

// ─── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ count, color }) {
  if (!count) return null;
  return (
    <span style={{
      minWidth: 18, height: 18, borderRadius: 9,
      background: color || "#ef4444", color: "#fff",
      fontSize: 10, fontWeight: 700, fontFamily: F_MONO,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "0 5px",
    }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
