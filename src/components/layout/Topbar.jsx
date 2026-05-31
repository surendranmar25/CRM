import React, { useState, useEffect, useRef } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Ic, P, Avatar, Badge } from "../ui/index.jsx";
import { OnlineAvatarCluster } from "./PresencePanel.jsx";
import { can } from "../../constants.js";
import { today } from "../../utils.js";

export function Topbar({
  title, view = "dashboard",
  search, setSearch, user,
  onAdd, onExportAll, onExportFiltered,
  fLen, aLen,
  onMenuToggle, T,
  todayCount, dateFilter, setDateFilter, dateType, setDateType,
  todayFunnels = [], notifCount = 0, onNotifClick,
  onImportCSV, onlineUsers = [], onEditorPushUpdate, onGlobalSearch,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const moreRef = useRef(null);

  const showLeadSearch = view === "funnels";
  const showSearchBar  = !["chat", "settings", "team", "targets"].includes(view);
  const showLeadCount  = view === "funnels";

  useEffect(() => {
    const h = e => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="ek-topbar" style={{ gap: 8 }}>

      {/* ── Mobile hamburger ── */}
      <button onClick={onMenuToggle} className="ek-mobile-menu ek-show-mobile"
        style={{ background: T.surfaceEl, border: `1.5px solid ${T.line}`, cursor: "pointer", padding: 0, flexShrink: 0, display: "none", alignItems: "center", justifyContent: "center", borderRadius: 10, width: 38, height: 38 }}>
        <Ic d={P.menu} sz={18} color={T.inkSub} sw={2} />
      </button>

      {/* ── Page title ── */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, minWidth: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: "-0.4px", lineHeight: 1.2, whiteSpace: "nowrap" }}>{title}</h1>
        <div className="ek-topbar-sub" style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted, letterSpacing: "0.03em", lineHeight: 1.3, marginTop: 1, whiteSpace: "nowrap" }}>
          {dayName} · {dateStr}
        </div>
      </div>

      {/* ── Lead search (Funnels only) ── */}
      {showLeadSearch && showSearchBar && (
        <div className="ek-topbar-search" style={{
          display: "flex", alignItems: "center", gap: 8,
          background: searchFocused ? T.surface : T.surfaceEl,
          border: `1.5px solid ${searchFocused ? T.brand : T.line}`,
          borderRadius: 10, padding: "0 12px", height: 38,
          minWidth: 160, maxWidth: 260, flex: 1, marginLeft: 4,
          transition: "all .15s",
          boxShadow: searchFocused ? `0 0 0 3px rgba(${T.brandRgb},0.12)` : "none",
        }}>
          <Ic d={P.search} sz={14} color={searchFocused ? T.brand : T.inkMuted} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Search leads…"
            style={{ border: "none", outline: "none", background: "transparent", color: T.ink, fontSize: 13, fontFamily: F_BODY, width: "100%", fontWeight: 500 }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: T.surfaceEl, border: "none", cursor: "pointer", padding: 0, display: "flex", borderRadius: 6, width: 20, height: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic d={P.close} sz={10} color={T.inkMuted} />
            </button>
          )}
        </div>
      )}

      {/* ── Global search button (Dashboard, Analytics, Calendar, Contacts, Tasks) ── */}
      {!showLeadSearch && showSearchBar && onGlobalSearch && (
        <button onClick={onGlobalSearch}
          className="ek-hide-mobile"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 38, borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", fontSize: 12, color: T.inkMuted, fontFamily: F_BODY, transition: "all .14s", flexShrink: 0, flex: 1, maxWidth: 300 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.ink; e.currentTarget.style.background = T.surface; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.color = T.inkMuted; e.currentTarget.style.background = T.surfaceEl; }}>
          <Ic d={P.search} sz={13} color="currentColor" />
          <span style={{ flex: 1, textAlign: "left" }}>Search leads, tasks, contacts…</span>
        </button>
      )}


      <div style={{ flex: 1 }} />

      {/* ── Lead count (funnels only) ── */}
      {showLeadCount && (
        <div className="ek-hide-mobile ek-topbar-badge">
          {fLen} / {aLen} leads
        </div>
      )}

      {/* ── Online users ── */}
      {onlineUsers.length > 0 && (
        <div className="ek-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", background: T.surfaceEl, borderRadius: 20, border: `1.5px solid ${T.line}` }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease infinite", boxShadow: "0 0 0 2px #10b98120" }} />
          <OnlineAvatarCluster users={onlineUsers} T={T} />
          <span style={{ fontSize: 11, fontFamily: F_MONO, color: T.inkMuted, fontWeight: 500 }}>{onlineUsers.length} online</span>
        </div>
      )}

      {/* ── New Lead button (funnels only, hidden on mobile — bottom nav has it) ── */}
      {can(user, "create") && onAdd && (
        <button onClick={onAdd} className="ek-hide-mobile" style={{
          height: 38, padding: "0 16px", borderRadius: 10,
          background: T.brand, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: F_BODY,
          transition: "all .14s", flexShrink: 0, boxShadow: `0 3px 10px ${T.brand}44`,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = T.brandHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.brand; e.currentTarget.style.transform = "translateY(0)"; }}>
          <Ic d={P.plus} sz={14} color="#fff" sw={2.5} />
          <span className="ek-hide-mobile" style={{ display: "flex" }}>New Lead</span>
        </button>
      )}

      {/* ── Editor push update ── */}
      {user.role === "Editor" && onEditorPushUpdate && (
        <button onClick={onEditorPushUpdate} title="Push app update to all users"
          style={{
            height: 38, padding: "0 14px", borderRadius: 10,
            background: `linear-gradient(135deg, #f59e0b, #d97706)`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700, color: "#fff",
            transition: "all .14s", flexShrink: 0, boxShadow: "0 3px 10px rgba(245,158,11,0.4)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(245,158,11,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(245,158,11,0.4)"; }}>
          <span>🚀</span>
          <span className="ek-hide-mobile" style={{ display: "flex" }}>Push Update</span>
        </button>
      )}

      {/* ── Notifications bell ── */}
      <button onClick={onNotifClick} title="Notifications" style={{
        position: "relative", width: 38, height: 38, borderRadius: 10,
        background: "transparent", border: `1.5px solid ${T.line}`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .14s", flexShrink: 0,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.lineMid; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.line; }}>
        <Ic d={P.bell} sz={16} color={T.inkSub} />
        {notifCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 17, height: 17, borderRadius: 9,
            background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 800, fontFamily: F_MONO,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${T.surface}`, padding: "0 3px",
          }}>{notifCount > 99 ? "99+" : notifCount}</span>
        )}
      </button>

      {/* ── More menu ── */}
      <div ref={moreRef} style={{ position: "relative" }}>
        <button onClick={() => setMoreOpen(x => !x)} title="More options" style={{
          width: 38, height: 38, borderRadius: 10,
          background: moreOpen ? T.brandSubtle : "transparent",
          border: `1.5px solid ${moreOpen ? T.brand : T.line}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .14s", flexShrink: 0,
        }}
          onMouseEnter={e => { if (!moreOpen) { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.lineMid; } }}
          onMouseLeave={e => { if (!moreOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.line; } }}>
          <Ic d={P.more} sz={16} color={moreOpen ? T.brand : T.inkSub} />
        </button>
        {moreOpen && (
          <div className="ek-dropdown" style={{ position: "fixed", top: "auto", bottom: "auto", right: "clamp(8px,4vw,16px)", marginTop: 0, minWidth: 210, zIndex: 9999, transform: "translateY(52px)" }}>
            <div style={{ padding: "6px 0" }}>
              {can(user, "export-all") && (
                <div className="ek-dropdown-item" onClick={() => { onExportAll(); setMoreOpen(false); }}>
                  <Ic d={P.dl} sz={14} color={T.inkMuted} />
                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>Export all ({aLen})</span>
                </div>
              )}
              {can(user, "export") && (
                <div className="ek-dropdown-item" onClick={() => { onExportFiltered(); setMoreOpen(false); }}>
                  <Ic d={P.filter} sz={14} color={T.inkMuted} />
                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>Export filtered ({fLen})</span>
                </div>
              )}
              {can(user, "create") && (
                <div className="ek-dropdown-item" onClick={() => { onImportCSV && onImportCSV(); setMoreOpen(false); }}>
                  <Ic d={P.up} sz={14} color={T.inkMuted} />
                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>Import CSV</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
