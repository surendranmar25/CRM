import React, { useState } from "react";
import { F_BODY, F_MONO, F_SERIF, F } from "../../theme/index.js";
import { Ic, P } from "../ui/index.jsx";

export function Login({ users, onLogin, T, dark, onToggleDark }) {
  const [u, su] = useState("");
  const [p, sp] = useState("");
  const [err, se] = useState("");
  const [load, sl] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [uFocus, setUFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);

  const go = () => {
    const trimU = u.trim().toLowerCase();
    const trimP = p.trim();
    if (!trimU || !trimP) { se("Please fill in all fields."); return; }
    se(""); sl(true);
    setTimeout(() => {
      const found = users.find(x => x.username.toLowerCase() === trimU && x.password === trimP);
      if (found) onLogin(found);
      else { se("Incorrect username or password."); sl(false); }
    }, 700);
  };

  const features = [
    { icon: "📊", title: "Live Pipeline", desc: "Track every lead from first contact to close in real-time" },
    { icon: "🔔", title: "Smart Follow-ups", desc: "Never miss a follow-up with intelligent overdue alerts" },
    { icon: "💰", title: "Revenue Analytics", desc: "Deep insights on pipeline value, win rates, and team performance" },
    { icon: "👥", title: "Team Management", desc: "Assign leads, set targets, and monitor CRE performance" },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "Live", label: "Real-time sync" },
    { value: "9+", label: "Team members" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: T.bg, fontFamily: F_BODY }}>

      {/* ── Left branding panel ── */}
      <div className="ek-login-left" style={{
        width: "52%", minHeight: "100vh",
        background: "linear-gradient(150deg, #070a12 0%, #0d1320 40%, #0a1028 100%)",
        padding: "48px 56px", display: "flex", flexDirection: "column",
        justifyContent: "space-between", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative mesh */}
        <div style={{ position: "absolute", top: -160, right: -160, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,143,255,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", left: "60%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,143,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: "linear-gradient(135deg, #4361ee, #3451d1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 28px rgba(67,97,238,0.45)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px", color: "#eef2ff" }}>Suntronix CRM</div>
              <div style={{ fontFamily: F_MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(108,143,255,0.7)", marginTop: 2 }}>v50.1.0 · Enterprise</div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 52 }}>
            <h1 style={{ fontFamily: F_SERIF, fontSize: 44, fontWeight: 400, color: "#eef2ff", lineHeight: 1.15, letterSpacing: "-0.5px", margin: "0 0 18px" }}>
              Close more deals.<br />
              <em style={{ fontStyle: "italic", color: "#6c8fff" }}>Grow faster.</em>
            </h1>
            <p style={{ fontSize: 14, color: "rgba(238,242,255,0.42)", lineHeight: 1.85, maxWidth: 380, margin: 0 }}>
              A world-class CRM for high-performance sales teams. Track every lead, follow up on time, close more deals.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: "16px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                transition: "all .2s",
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#eef2ff", marginBottom: 4, letterSpacing: "-0.2px" }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "rgba(238,242,255,0.38)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 28 }} />
          <div style={{ display: "flex", gap: 36 }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#eef2ff", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(238,242,255,0.38)", marginTop: 3, fontFamily: F_MONO, letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px", position: "relative",
        background: T.bg,
      }}>
        {/* Dark toggle top-right */}
        <button onClick={onToggleDark} style={{
          position: "absolute", top: 20, right: 20,
          width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${T.line}`,
          background: T.surface, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .14s", color: T.inkMuted,
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
          onMouseLeave={e => e.currentTarget.style.background = T.surface}>
          <Ic d={dark ? P.sun : P.moon} sz={15} color={T.inkMuted} />
        </button>

        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp .3s ease" }}>
          {/* Mobile logo (hidden on desktop) */}
          <div className="ek-login-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${T.brand}44` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, letterSpacing: "-0.3px" }}>Suntronix CRM</div>
              <div style={{ fontSize: 9, fontFamily: F_MONO, color: T.inkMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>v50.1.0 · Enterprise</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: "-0.5px", margin: "0 0 6px" }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: T.inkMuted, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>Sign in to your workspace to continue.</p>
          </div>

          {/* Error */}
          {err && (
            <div style={{
              background: T.lost.bg, border: `1px solid ${T.lost.dot}33`,
              borderLeft: `3px solid ${T.lost.dot}`,
              borderRadius: 10, padding: "11px 14px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Ic d={P.close} sz={14} color={T.lost.dot} />
              <span style={{ fontSize: 12, color: T.lost.text, fontFamily: F_BODY, fontWeight: 600 }}>{err}</span>
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.inkSub, marginBottom: 7, letterSpacing: "0.01em" }}>Username</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Ic d={P.users} sz={15} color={uFocus ? T.brand : T.inkMuted} />
              </div>
              <input
                value={u} onChange={e => su(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()}
                onFocus={() => setUFocus(true)} onBlur={() => setUFocus(false)}
                placeholder="Enter your username"
                autoFocus
                style={{
                  width: "100%", height: 44, borderRadius: 10,
                  border: `1.5px solid ${uFocus ? T.brand : T.line}`,
                  background: uFocus ? T.surface : T.surfaceEl,
                  color: T.ink, fontSize: 13, padding: "0 14px 0 40px",
                  fontFamily: F_BODY, outline: "none",
                  transition: "all .15s",
                  boxShadow: uFocus ? `0 0 0 3px rgba(${T.brandRgb},0.12)` : "none",
                  fontWeight: 500,
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.inkSub, marginBottom: 7, letterSpacing: "0.01em" }}>Password</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Ic d={P.key} sz={15} color={pFocus ? T.brand : T.inkMuted} />
              </div>
              <input
                type={showPw ? "text" : "password"}
                value={p} onChange={e => sp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()}
                onFocus={() => setPFocus(true)} onBlur={() => setPFocus(false)}
                placeholder="Enter your password"
                style={{
                  width: "100%", height: 44, borderRadius: 10,
                  border: `1.5px solid ${pFocus ? T.brand : T.line}`,
                  background: pFocus ? T.surface : T.surfaceEl,
                  color: T.ink, fontSize: 13, padding: "0 42px 0 40px",
                  fontFamily: F_BODY, outline: "none",
                  transition: "all .15s",
                  boxShadow: pFocus ? `0 0 0 3px rgba(${T.brandRgb},0.12)` : "none",
                  fontWeight: 500,
                }}
              />
              <button onClick={() => setShowPw(x => !x)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: T.inkMuted,
                display: "flex", alignItems: "center", padding: 4, borderRadius: 6,
              }}>
                <Ic d={showPw ? P.eye : P.eye} sz={15} color={T.inkMuted} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={go}
            disabled={load}
            style={{
              width: "100%", height: 46, borderRadius: 11,
              background: load ? T.inkMuted : `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`,
              border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
              fontFamily: F_BODY, cursor: load ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all .14s",
              boxShadow: load ? "none" : `0 6px 20px ${T.brand}44`,
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { if (!load) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 10px 28px ${T.brand}50`; } }}
            onMouseLeave={e => { if (!load) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 20px ${T.brand}44`; } }}>
            {load ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Signing in…
              </>
            ) : "Sign in →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: T.inkMuted, marginTop: 22, lineHeight: 1.7, fontWeight: 500 }}>
            Contact your administrator for access.<br />
            <span style={{ fontFamily: F_MONO, fontSize: 10, color: T.inkMuted, opacity: 0.7 }}>Secured · Role-based access control</span>
          </p>

          {/* Copyright watermark */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.line}`, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.04em", lineHeight: 1.8, opacity: 0.75 }}>
              © {new Date().getFullYear()} Suntronix CRM · All rights reserved
            </div>
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.03em", opacity: 0.65 }}>
              Designed &amp; developed by <span style={{ color: T.brand, fontWeight: 700 }}>Surendran</span>
            </div>
            <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 4, opacity: 0.6 }}>
              <a href="mailto:surendranbba006@gmail.com" style={{ color: T.brand, textDecoration: "none", fontFamily: F_MONO }}>surendranbba006@gmail.com</a>
              {" · "}
              <a href="tel:9840696374" style={{ color: T.brand, textDecoration: "none", fontFamily: F_MONO }}>9840696374</a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .ek-login-left{display:none!important}
          .ek-login-mobile-logo{display:flex!important}
        }
      `}</style>
    </div>
  );
}
