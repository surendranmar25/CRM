import React, { useState, useEffect, useRef } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Ic, P, Avatar } from "../ui/index.jsx";
import { FULL } from "../../constants.js";

export function Sidebar({ active, set, user, onLogout, open, onClose, T, dark, onToggleDark, collapsed, onToggleCollapse, onlineUsers = [] }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const h = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard",  icon: P.dash,     desc: "Overview & KPIs" },
    { id: "funnels",   label: "Funnels",     icon: P.list,     desc: "All leads" },
    { id: "calendar",  label: "Calendar",    icon: P.calendar, desc: "Follow-up calendar" },
    { id: "contacts",  label: "Contacts",    icon: P.users,    desc: "Customers" },
    { id: "tasks",     label: "Tasks",       icon: P.check,    desc: "To-dos" },
    { id: "chat",      label: "Team Chat",   icon: P.msg,      desc: "Internal messaging" },
    { id: "analytics", label: "Analytics",   icon: P.chart,    desc: "Reports" },
    ...(FULL.includes(user.role) ? [
      { id: "team",    label: "Team",        icon: P.layers,   desc: "Members" },
      { id: "targets", label: "Targets",     icon: P.target,   desc: "CRE targets & reports" },
    ] : [{ id: "targets", label: "My Targets", icon: P.target, desc: "My performance" }]),
  ];
  const navBottom = [{ id: "settings", label: "Settings", icon: P.key }];
  const w = collapsed ? 64 : 248;

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />}
      <div className={`ek-sidebar${collapsed ? " collapsed" : ""}${open ? " open" : ""}`} style={{ width: w }}>

        {/* Logo bar */}
        <div style={{
          height: 58, padding: collapsed ? "0" : "0 16px",
          borderBottom: `1px solid ${T.line}`,
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          flexShrink: 0,
          background: collapsed ? "transparent" : "transparent",
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${T.brand}40`, flexShrink: 0,
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, letterSpacing: "-0.4px", lineHeight: 1.2 }}>Suntronix CRM</div>
                <div style={{ fontSize: 9, fontFamily: F_MONO, letterSpacing: "0.12em", color: T.inkMuted, lineHeight: 1, textTransform: "uppercase" }}>v50.1.0 · PRO</div>
              </div>
            </div>
          )}
          {collapsed && (
            <button onClick={onToggleCollapse} title="Expand sidebar" style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 3px 10px ${T.brand}44`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {!collapsed && (
            <button onClick={onToggleCollapse} title="Collapse sidebar" style={{
              width: 28, height: 28, border: `1.5px solid ${T.line}`,
              borderRadius: 8, background: T.surfaceEl, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.inkMuted, transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.brandSubtle; e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.brand; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.line; e.currentTarget.style.color = T.inkMuted; }}>
              <Ic d={P.chevL} sz={12} color="currentColor" />
            </button>
          )}
        </div>

        {/* User quick badge */}
        {!collapsed && (
          <div style={{ margin:"10px 10px 4px", padding:"10px 12px", borderRadius:12, background:`linear-gradient(135deg,${T.brandSubtle},${T.surfaceEl})`, border:`1px solid ${T.brand}22` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <Avatar name={user.name} size={28}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
                <div style={{ fontSize:9, fontFamily:F_MONO, color:T.brand, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:1 }}>{user.role}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 0 2px #10b98120", animation:"pulse 2.5s infinite" }}/>
              </div>
            </div>
          </div>
        )}

        {/* Nav label */}
        {!collapsed && (
          <div style={{ padding:"8px 16px 2px" }}>
            <div style={{ fontSize:9, fontFamily:F_MONO, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:T.inkMuted, opacity:0.6 }}>Navigation</div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: `6px ${collapsed ? 8 : 8}px`, overflowY: "auto" }}>
          {nav.map(item => {
            const a = active === item.id;
            const cnt = onlineUsers.filter(u => u.view === item.id).length;
            return (
              <button key={item.id}
                onClick={() => { set(item.id); onClose && onClose(); }}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                  width: "100%", height: 42, padding: collapsed ? "0" : "0 10px",
                  borderRadius: 10, border: "none",
                  background: a ? (dark ? `rgba(${T.brandRgb},0.15)` : T.brandSubtle) : "transparent",
                  color: a ? T.brand : T.inkMuted,
                  fontSize: 13, fontWeight: a ? 700 : 500, fontFamily: F_BODY,
                  cursor: "pointer", transition: "all .13s", marginBottom: 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!a) { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.color = T.ink; } }}
                onMouseLeave={e => { if (!a) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.inkMuted; } }}>
                {a && !collapsed && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 22, background: T.brand, borderRadius: "0 3px 3px 0" }} />}
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: a ? T.brand : T.surfaceEl,
                  border: `1.5px solid ${a ? "transparent" : T.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all .13s",
                }}>
                  <Ic d={item.icon} sz={15} color={a ? "#fff" : T.inkSub} sw={a ? 2.2 : 1.75} />
                </div>
                {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                {!collapsed && cnt > 0 && (
                  <span style={{ width: 17, height: 17, borderRadius: "50%", background: "#10b981", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dark toggle */}
        {!collapsed && (
          <div style={{ padding: "6px 8px" }}>
            <button onClick={onToggleDark} style={{
              width: "100%", height: 38, borderRadius: 10,
              border: `1.5px solid ${T.line}`, background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              padding: "0 10px", color: T.inkSub, fontSize: 12, fontFamily: F_BODY,
              transition: "all .13s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Ic d={dark ? P.sun : P.moon} sz={14} color={T.inkMuted} />
              <span style={{ fontWeight: 500 }}>{dark ? "Light mode" : "Dark mode"}</span>
              <div style={{ marginLeft: "auto", width: 34, height: 18, borderRadius: 9, background: dark ? T.brand : T.surfaceEl, position: "relative", transition: "background .2s", border: `1.5px solid ${T.lineMid}` }}>
                <div style={{ position: "absolute", top: 2, left: dark ? 17 : 2, width: 11, height: 11, borderRadius: "50%", background: dark ? "#fff" : T.inkMuted, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
              </div>
            </button>
          </div>
        )}

        {/* Settings */}
        <div style={{ padding: `4px ${collapsed ? 8 : 8}px` }}>
          {navBottom.map(item => {
            const a = active === item.id;
            return (
              <button key={item.id}
                onClick={() => { set(item.id); onClose && onClose(); }}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                  width: "100%", height: 42, padding: collapsed ? "0" : "0 10px",
                  borderRadius: 10, border: "none",
                  background: a ? T.brandSubtle : "transparent",
                  color: a ? T.brand : T.inkMuted,
                  fontSize: 13, fontWeight: a ? 700 : 500, fontFamily: F_BODY,
                  cursor: "pointer", transition: "all .13s",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
                onMouseEnter={e => { if (!a) { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.color = T.ink; } }}
                onMouseLeave={e => { if (!a) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.inkMuted; } }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: a ? T.brand : T.surfaceEl, border: `1.5px solid ${a ? "transparent" : T.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic d={item.icon} sz={15} color={a ? "#fff" : T.inkSub} sw={1.75} />
                </div>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Copyright watermark */}
        {!collapsed && (
          <div style={{ padding: "4px 16px 0", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: F_MONO, opacity: 0.5, letterSpacing: "0.04em", lineHeight: 1.7 }}>
              © {new Date().getFullYear()} · by Surendran
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: T.line, margin: "6px 12px" }} />

        {/* Profile logout */}
        <div ref={profileRef} style={{ padding: `8px ${collapsed ? 8 : 8}px 16px`, position: "relative" }}>
          {profileOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)",
              left: collapsed ? 72 : 10, right: collapsed ? "auto" : 10,
              minWidth: 220,
              background: T.surface, border: `1px solid ${T.lineMid}`,
              borderRadius: 14, boxShadow: T.shadowXl,
              overflow: "hidden", zIndex: 400, animation: "fadeUp .15s ease",
            }}>
              <div style={{ padding: "14px 16px", background: `linear-gradient(135deg, ${T.brandSubtle}, ${T.surfaceEl})`, borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={user.name} size={38} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{user.name}</div>
                    <div style={{ fontFamily: F_MONO, fontSize: 10, color: T.inkMuted, marginTop: 2 }}>@{user.username} · {user.role}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <button onClick={onLogout} style={{
                  width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, color: T.lost.text, fontFamily: F_BODY, transition: "background .12s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.lost.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Ic d={P.out} sz={14} color={T.lost.dot} sw={2} />
                  <span style={{ fontWeight: 600 }}>Sign out</span>
                </button>
              </div>
            </div>
          )}
          <button onClick={() => setProfileOpen(x => !x)} style={{
            display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
            width: "100%", height: 40, padding: collapsed ? "0" : "0 10px",
            borderRadius: 10, border: `1.5px solid ${profileOpen ? T.brand : "transparent"}`,
            background: profileOpen ? T.brandSubtle : "transparent",
            cursor: "pointer", transition: "all .13s",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
            onMouseEnter={e => { if (!profileOpen) { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.line; } }}
            onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}>
            <Avatar name={user.name} size={30} />
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                  <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted }}>● Online</div>
                </div>
                <Ic d={P.chevD} sz={11} color={T.inkMuted} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
