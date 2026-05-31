import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { crmService } from "./services/crmService";
import { useTheme, makeT, FontLoader, F, getActiveFont } from "./theme/index.js";
import { SEED_USERS } from "./constants.js";
import { Login } from "./components/layout/Login.jsx";
import { Shell } from "./Shell.jsx";

// ─── SW UPDATE MODAL ──────────────────────────────────────────────────────────
function UpdateModal({ T, onUpdate, onLater, fontCss }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10000,
      background:"rgba(0,0,0,0.50)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, animation:"fadeIn .2s ease",
      backdropFilter:"blur(3px)",
      fontFamily: fontCss || F,
    }}>
      <div style={{
        background:T.surface, borderRadius:18,
        border:`1px solid ${T.lineMid}`,
        width:"100%", maxWidth:420,
        boxShadow:T.shadowXl,
        overflow:"hidden",
        animation:"fadeUp .22s ease",
      }}>
        <div style={{
          background:T.brand, padding:"26px 28px 22px",
          display:"flex", flexDirection:"column", gap:6,
        }}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.7)"}}>
            New version available
          </div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>🚀</span> Suntronix CRM
          </div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>
            A new version is ready to deploy.<br/>
            <strong style={{color:"#fff"}}>Update now</strong> to push it to all users instantly.
          </div>
        </div>

        <div style={{padding:"20px 28px 8px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              ["⚡", "Update Now", "Activates the new version for all users immediately. Takes 2 seconds.", true],
              ["⏳", "Later", "Keep current version. You'll be reminded next time you open the app.", false],
            ].map(([icon, label, desc]) => (
              <div key={label} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",borderRadius:10,background:T.surfaceEl,border:`1px solid ${T.line}`}}>
                <span style={{fontSize:20,flexShrink:0,marginTop:1}}>{icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:2}}>{label}</div>
                  <div style={{fontSize:12,color:T.inkMuted,lineHeight:1.5}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"16px 28px 26px",display:"flex",gap:10}}>
          <button onClick={onUpdate}
            style={{flex:1,padding:"11px 0",borderRadius:9,border:"none",cursor:"pointer",background:T.brand,color:"#fff",fontSize:13,fontWeight:700,transition:"background .15s",boxShadow:`0 4px 14px ${T.brand}44`}}
            onMouseEnter={e=>e.currentTarget.style.background=T.brandHover}
            onMouseLeave={e=>e.currentTarget.style.background=T.brand}>
            Update Now
          </button>
          <button onClick={onLater}
            style={{flex:1,padding:"11px 0",borderRadius:9,cursor:"pointer",background:"transparent",color:T.inkSub,border:`1px solid ${T.lineMid}`,fontSize:13,fontWeight:500,transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.surfaceEl}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem("ek-user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { themeId, setTheme, dark, toggleDark, fontId, setFont, customFont, setCustomFont, customColors, applyCustomColors, clearCustomColors } = useTheme();
  const T = makeT(dark, themeId, customColors);
  const navigate = useNavigate();

  // ─── SW UPDATE STATE ───────────────────────────────────────────────────────
  // showUpdateModal is ONLY set to true when an Editor clicks "Push Update to All"
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const waitingSWRef = React.useRef(null);

  // Restore font size from settings on every mount
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("ek_settings_v1") || "{}");
      const sizeMap = { sm: "13px", md: "14px", lg: "15px", xl: "16px" };
      const size = sizeMap[prefs.fontSize || "md"] || "14px";
      document.documentElement.style.fontSize = size;
    } catch {}
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Silently store the waiting SW — do NOT auto-show modal
        const storeWaiting = (sw) => { waitingSWRef.current = sw; };
        if (reg.waiting) { storeWaiting(reg.waiting); return; }
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed" && navigator.serviceWorker.controller) {
              storeWaiting(newSW);
            }
          });
        });
        const interval = setInterval(() => reg.update(), 60_000);
        return () => clearInterval(interval);
      } catch (err) { console.warn("SW registration failed:", err); }
    };
    registerSW();
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  // Called ONLY when Editor clicks "Push Update to All"
  const handleEditorPushUpdate = () => { setShowUpdateModal(true); };

  const handleUpdateNow = () => {
    const sw = waitingSWRef.current;
    if (sw) sw.postMessage({ type: "SKIP_WAITING" });
    setShowUpdateModal(false);
  };
  const handleUpdateLater = () => { setShowUpdateModal(false); };

  useEffect(() => {
    const fetch = async () => {
      try { const data = await crmService.getUsers(); setUsers(data?.length ? data : SEED_USERS); }
      catch { setUsers(SEED_USERS); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleLogin = (u) => {
    localStorage.setItem("ek-user", JSON.stringify(u));
    setUser(u); navigate("/dashboard");
  };
  const handleLogout = () => {
    localStorage.removeItem("ek-user");
    setUser(null); navigate("/login");
  };
  const handleUsersChange = async (newUsers) => {
    try {
      const cur = users.map(u => u.username);
      const del = cur.filter(u => !newUsers.map(u => u.username).includes(u));
      for (const un of del) await crmService.deleteUser(un);
      await crmService.saveUsers(newUsers);
      const data = await crmService.getUsers(); setUsers(data);
    } catch (err) { console.error(err); }
  };

  const fontCss = getActiveFont(fontId, customFont);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.bg, fontFamily:fontCss, gap:28 }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <div style={{ position:"relative", width:72, height:72 }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${T.line}` }} />
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid transparent`, borderTopColor:T.brand, animation:"spin .75s linear infinite" }} />
          <div style={{ position:"absolute", inset:12, borderRadius:"50%", background:`linear-gradient(135deg, ${T.brand}, ${T.brandHover})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${T.brand}44` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.4px", marginBottom:6 }}>Suntronix CRM</div>
          <div style={{ fontSize:12, color:T.inkMuted, letterSpacing:"0.03em" }}>Loading your workspace…</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.brand, opacity:0.4, animation:`pulse 1.2s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <FontLoader dark={dark} themeId={themeId} fontId={fontId} customFont={customFont} />

      {showUpdateModal && (
        <UpdateModal T={T} fontCss={fontCss}
          onUpdate={handleUpdateNow}
          onLater={handleUpdateLater}
        />
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login users={users} onLogin={handleLogin} T={T} dark={dark} onToggleDark={toggleDark} />} />
        <Route path="/:view" element={user
          ? <Shell
              user={user} users={users}
              onLogout={handleLogout} onUsersChange={handleUsersChange}
              T={T} dark={dark} onToggleDark={toggleDark}
              themeId={themeId} setTheme={setTheme}
              fontId={fontId} setFont={setFont}
              customFont={customFont} setCustomFont={setCustomFont}
              customColors={customColors} applyCustomColors={applyCustomColors} clearCustomColors={clearCustomColors}
              onEditorPushUpdate={handleEditorPushUpdate}
            />
          : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}
