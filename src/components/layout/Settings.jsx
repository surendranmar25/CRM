import React, { useState, useRef } from "react";
import { F, F_MONO, THEMES, FONT_OPTIONS, getActiveFont } from "../../theme/index.js";
import { Btn, Avatar } from "../ui/index.jsx";
import { FULL } from "../../constants.js";

const SETTING_KEY = "ek_settings_v1";
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTING_KEY) || "{}"); } catch { return {}; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTING_KEY, JSON.stringify(s)); } catch {}
}

const Section = ({ title, sub, icon, children, T }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowSm }}>
    <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.brandSubtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: F }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.inkMuted, fontFamily: F, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
    <div style={{ padding: "20px 24px" }}>{children}</div>
  </div>
);

const Toggle = ({ label, sub, value, onChange, T }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, fontFamily: F }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F, marginTop: 2 }}>{sub}</div>}
    </div>
    <button onClick={() => onChange(!value)}
      style={{ width: 46, height: 26, borderRadius: 13, border: "none", background: value ? T.brand : T.lineMid, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  </div>
);

export function Settings({ T, themeId, setTheme, dark, onToggleDark, user, onLogout, funnels, fontId = "jakarta", setFont, customFont = "", setCustomFont, customColors: savedCustomColors = null, applyCustomColors, clearCustomColors }) {
  const [prefs, setPrefs] = useState(() => ({ ...{ compactTable: false, showAvatars: true, animateCharts: true, defaultView: "dashboard", currency: "INR", dateFormat: "DD/MM/YYYY" }, ...loadSettings() }));
  const [tab, setTab] = useState("appearance");
  const [customFontInput, setCustomFontInput] = useState(customFont || "");
  const [customColorMode, setCustomColorMode] = useState(!!savedCustomColors);
  const [customColors, setCustomColors] = useState(
    savedCustomColors || { brand: T.brand, bg: T.bg, surface: T.surface, ink: T.ink }
  );
  const customFontRef = useRef(null);

  const sp = (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next); saveSettings(next);
  };

  const activeFontCss = getActiveFont(fontId, customFont);

  const tabs = [
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "fonts",      label: "Fonts",       icon: "🔤" },
    { id: "preferences",label: "Preferences", icon: "⚙️" },
    { id: "account",    label: "Account",      icon: "👤" },
    { id: "shortcuts",  label: "Shortcuts",    icon: "⌨️" },
    { id: "data",       label: "Data & Privacy",icon: "🔒" },
    { id: "about",      label: "About",        icon: "ℹ️" },
  ];

  const won = funnels.filter(f => f.status === "Won").length;
  const totalRev = funnels.filter(f => f.status === "Won").reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: activeFontCss }}>
      {/* Left sidebar */}
      <div className="ek-settings-sidebar" style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${T.line}`, background: T.sidebar, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 10px 10px" }}>Settings</div>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: tab === t.id ? T.brandSubtle : "transparent", color: tab === t.id ? T.brand : T.inkSub, cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, fontFamily: activeFontCss, transition: "all .15s", width: "100%" }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = T.surfaceEl; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: T.bg, overflow: "hidden" }}>
        {/* Mobile tab bar */}
        <div className="ek-settings-tabs-mobile" style={{ display: "none", overflowX: "auto", borderBottom: `1px solid ${T.line}`, background: T.surface, flexShrink: 0, scrollbarWidth: "none" }}>
          <div style={{ display: "flex", padding: "0 2px" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 14px", border: "none", borderBottom: `2.5px solid ${tab === t.id ? T.brand : "transparent"}`, background: "transparent", color: tab === t.id ? T.brand : T.inkSub, cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 500, fontFamily: activeFontCss, whiteSpace: "nowrap", flexShrink: 0, transition: "all .15s", marginBottom: -1 }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,24px)" }}>

        {/* ── APPEARANCE ── */}
        {tab === "appearance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 820 }}>

            {/* Light/Dark */}
            <Section T={T} icon="🌗" title="Light / Dark Mode" sub="Switch between light and dark appearance">
              <div style={{ display: "flex", gap: 12 }}>
                {[{ id: false, label: "Light", icon: "☀️" }, { id: true, label: "Dark", icon: "🌙" }].map(m => (
                  <button key={String(m.id)} onClick={() => { if (dark !== m.id) onToggleDark(); }}
                    style={{ flex: 1, padding: "16px", borderRadius: 10, border: `2px solid ${dark === m.id ? T.brand : T.line}`, background: dark === m.id ? T.brandSubtle : T.surfaceEl, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .15s" }}>
                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: dark === m.id ? 700 : 500, color: dark === m.id ? T.brand : T.inkSub }}>{m.label}</span>
                    {dark === m.id && <span style={{ fontSize: 10, color: T.brand, fontFamily: F_MONO, fontWeight: 600 }}>ACTIVE</span>}
                  </button>
                ))}
              </div>
            </Section>

            {/* Color Theme — 10 options */}
            <Section T={T} icon="🎨" title="Color Theme" sub="10 built-in palettes — choose what fits your style">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                {Object.entries(THEMES).map(([id, theme]) => {
                  const base = dark ? theme.dark : theme.light;
                  const active = themeId === id && !customColorMode;
                  return (
                    <button key={id} onClick={() => { setTheme(id); setCustomColorMode(false); }}
                      style={{ padding: "14px 10px", borderRadius: 12, border: `2px solid ${active ? base.brand : T.line}`, background: base.bg, cursor: "pointer", transition: "all .18s", position: "relative", overflow: "hidden" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "scale(1.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                      <div style={{ display: "flex", gap: 3, marginBottom: 8, justifyContent: "center" }}>
                        {[base.brand, "#16a34a", "#d97706", "#dc2626"].map((c, i) => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 18, marginBottom: 3, textAlign: "center" }}>{theme.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: base.ink, textAlign: "center" }}>{theme.name}</div>
                      <div style={{ fontSize: 9, color: base.inkMuted, textAlign: "center", marginTop: 2, lineHeight: 1.3 }}>{theme.desc}</div>
                      {active && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: base.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom color theme */}
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>✏️ Custom Colors</div>
                    <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>Pick your own brand, background, surface, and text colors</div>
                  </div>
                  <button onClick={() => {
                    if (customColorMode) {
                      clearCustomColors && clearCustomColors();
                      setCustomColorMode(false);
                    } else {
                      setCustomColors({ brand: T.brand, bg: T.bg, surface: T.surface, ink: T.ink });
                      setCustomColorMode(true);
                    }
                  }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${customColorMode ? T.brand : T.lineMid}`, background: customColorMode ? T.brandSubtle : T.surfaceEl, color: customColorMode ? T.brand : T.inkSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {customColorMode ? "Active ✓" : "Enable"}
                  </button>
                </div>
                {customColorMode && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { key: "brand", label: "Brand / Accent", desc: "Buttons, highlights, links" },
                      { key: "bg", label: "Page Background", desc: "Main background color" },
                      { key: "surface", label: "Card Surface", desc: "Cards, modals, sidebar" },
                      { key: "ink", label: "Text Color", desc: "Primary text" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: T.surfaceEl, border: `1px solid ${T.line}` }}>
                        <input type="color" value={customColors[key]}
                          onChange={e => setCustomColors(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", padding: 2, background: "transparent" }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{label}</div>
                          <div style={{ fontSize: 10, color: T.inkMuted }}>{desc}</div>
                          <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.brand, marginTop: 1 }}>{customColors[key]}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
                      <button
                        onClick={() => { applyCustomColors && applyCustomColors(customColors); }}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        ✓ Apply Now (Live)
                      </button>
                      {savedCustomColors && (
                        <button
                          onClick={() => { clearCustomColors && clearCustomColors(); setCustomColorMode(false); }}
                          style={{ padding: "10px 18px", borderRadius: 9, border: `1px solid ${T.lineMid}`, background: T.surfaceEl, color: T.inkSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* ── FONTS ── */}
        {tab === "fonts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 780 }}>
            <Section T={T} icon="🔤" title="Typography" sub="Choose the font that feels right for your workflow">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                {FONT_OPTIONS.filter(f => f.id !== "custom").map(opt => {
                  const active = fontId === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setFont && setFont(opt.id)}
                      style={{ padding: "16px 14px", borderRadius: 12, border: `2px solid ${active ? T.brand : T.line}`, background: active ? T.brandSubtle : T.surfaceEl, cursor: "pointer", textAlign: "left", transition: "all .18s", position: "relative" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.border = `2px solid ${T.lineMid}`; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.border = `2px solid ${T.line}`; }}>
                      {/* Font name rendered in itself */}
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, fontFamily: opt.css, marginBottom: 4, letterSpacing: "-0.3px" }}>
                        {opt.name}
                      </div>
                      <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: opt.css, marginBottom: 6, lineHeight: 1.4 }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{opt.emoji}</span>
                        <span style={{ fontSize: 10, color: active ? T.brand : T.inkMuted, fontWeight: 600, fontFamily: F_MONO }}>{opt.desc}</span>
                      </div>
                      {active && (
                        <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: T.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom font */}
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4 }}>✏️ Custom Google Font</div>
                <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 12 }}>
                  Enter any font name from <a href="https://fonts.google.com" target="_blank" rel="noreferrer" style={{ color: T.brand }}>fonts.google.com</a> — e.g. "Nunito", "Poppins", "Raleway"
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    ref={customFontRef}
                    value={customFontInput}
                    onChange={e => setCustomFontInput(e.target.value)}
                    placeholder='e.g. "Nunito" or "Raleway"'
                    style={{ flex: 1, height: 40, borderRadius: 10, border: `1.5px solid ${fontId === "custom" ? T.brand : T.line}`, background: T.surface, color: T.ink, fontSize: 13, padding: "0 12px", outline: "none", fontFamily: customFontInput ? `'${customFontInput}', sans-serif` : "inherit" }}
                    onFocus={e => e.currentTarget.style.borderColor = T.brand}
                    onBlur={e => e.currentTarget.style.borderColor = fontId === "custom" ? T.brand : T.line}
                    onKeyDown={e => { if (e.key === "Enter") { setCustomFont && setCustomFont(customFontInput.trim()); setFont && setFont("custom"); } }}
                  />
                  <button
                    onClick={() => { setCustomFont && setCustomFont(customFontInput.trim()); setFont && setFont("custom"); }}
                    style={{ padding: "0 18px", height: 40, borderRadius: 10, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    Apply
                  </button>
                </div>
                {fontId === "custom" && customFont && (
                  <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: T.brandSubtle, border: `1px solid ${T.brand}33`, fontSize: 12, color: T.brand, fontWeight: 600 }}>
                    ✓ Using custom font: <span style={{ fontFamily: `'${customFont}', sans-serif` }}>{customFont}</span>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 16, marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Live Preview</div>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: T.surfaceEl, border: `1px solid ${T.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginBottom: 4, letterSpacing: "-0.5px" }}>Suntronix CRM Dashboard</div>
                  <div style={{ fontSize: 14, color: T.inkSub, marginBottom: 8, lineHeight: 1.6 }}>Customer Relationship Manager for fashion & textile businesses. Track leads, close deals, and grow revenue.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ padding: "5px 14px", borderRadius: 20, background: T.brand, color: "#fff", fontSize: 12, fontWeight: 700 }}>New Lead</div>
                    <div style={{ padding: "5px 14px", borderRadius: 20, background: T.surfaceEl, border: `1px solid ${T.lineMid}`, color: T.inkSub, fontSize: 12, fontWeight: 500 }}>Analytics</div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Font size */}
            <Section T={T} icon="📐" title="Font Size" sub="Adjust the base text size for the entire app">
              <div style={{ display: "flex", gap: 10 }}>
                {[{ label: "Small", size: "13px", key: "sm" }, { label: "Default", size: "14px", key: "md" }, { label: "Large", size: "15px", key: "lg" }, { label: "X-Large", size: "16px", key: "xl" }].map(opt => {
                  const stored = prefs.fontSize || "md";
                  const active = stored === opt.key;
                  return (
                    <button key={opt.key} onClick={() => {
                      sp("fontSize", opt.key);
                      document.documentElement.style.fontSize = opt.size;
                    }}
                      style={{ flex: 1, padding: "12px 8px", borderRadius: 10, border: `2px solid ${active ? T.brand : T.line}`, background: active ? T.brandSubtle : T.surfaceEl, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                      <div style={{ fontSize: opt.size, fontWeight: 700, color: active ? T.brand : T.ink, marginBottom: 2 }}>Aa</div>
                      <div style={{ fontSize: 10, color: active ? T.brand : T.inkMuted, fontFamily: F_MONO }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {tab === "preferences" && (
          <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 20 }}>
            <Section T={T} icon="⚙️" title="Display Preferences" sub="Customize how data appears">
              <Toggle label="Compact table rows" sub="Show more rows with less padding" value={prefs.compactTable} onChange={v => sp("compactTable", v)} T={T} />
              <Toggle label="Show avatars" sub="Display profile pictures in lists" value={prefs.showAvatars} onChange={v => sp("showAvatars", v)} T={T} />
              <Toggle label="Animate charts" sub="Enable chart transition animations" value={prefs.animateCharts} onChange={v => sp("animateCharts", v)} T={T} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>Default landing page</div>
                  <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>Which page to open after login</div>
                </div>
                <select value={prefs.defaultView} onChange={e => sp("defaultView", e.target.value)}
                  style={{ padding: "7px 12px", border: `1px solid ${T.lineMid}`, borderRadius: 8, fontSize: 13, color: T.ink, background: T.surface, outline: "none", cursor: "pointer" }}>
                  {[["dashboard", "Dashboard"], ["funnels", "Funnels"], ["analytics", "Analytics"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </Section>

            <Section T={T} icon="🌐" title="Regional" sub="Language and format settings">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>Currency</div>
                <select value={prefs.currency} onChange={e => sp("currency", e.target.value)}
                  style={{ padding: "7px 12px", border: `1px solid ${T.lineMid}`, borderRadius: 8, fontSize: 13, color: T.ink, background: T.surface, outline: "none" }}>
                  {[["INR", "₹ Indian Rupee"], ["USD", "$ US Dollar"], ["EUR", "€ Euro"], ["GBP", "£ British Pound"], ["AED", "د.إ Dirham"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>Date format</div>
                <select value={prefs.dateFormat} onChange={e => sp("dateFormat", e.target.value)}
                  style={{ padding: "7px 12px", border: `1px solid ${T.lineMid}`, borderRadius: 8, fontSize: 13, color: T.ink, background: T.surface, outline: "none" }}>
                  {[["DD/MM/YYYY", "DD/MM/YYYY"], ["MM/DD/YYYY", "MM/DD/YYYY"], ["YYYY-MM-DD", "YYYY-MM-DD"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </Section>

            <Section T={T} icon="🖥️" title="Layout" sub="Sidebar and density options">
              <Toggle label="Sidebar collapsed by default" sub="Start with compact sidebar on load" value={prefs.sidebarCollapsed || false} onChange={v => sp("sidebarCollapsed", v)} T={T} />
              <Toggle label="Show lead count badge" sub="Display count in browser tab" value={prefs.showBadge !== false} onChange={v => sp("showBadge", v)} T={T} />
            </Section>
          </div>
        )}

        {/* ── ACCOUNT ── */}
        {tab === "account" && (
          <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
            <Section T={T} icon="👤" title="Your Profile" sub="Your account details">
              <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "8px 0 20px", borderBottom: `1px solid ${T.line}`, marginBottom: 16 }}>
                <Avatar name={user.name} size={56} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 4 }}>@{user.username} · {user.role}</div>
                  <div style={{
                    display: "inline-flex", marginTop: 8, padding: "3px 10px", borderRadius: 20,
                    background: user.role === "Editor" ? "#fef3c7" : T.brandSubtle,
                    fontSize: 11, fontWeight: 700,
                    color: user.role === "Editor" ? "#92400e" : T.brand,
                    border: user.role === "Editor" ? "1px solid #fcd34d" : "none",
                  }}>
                    {user.role === "Editor" ? "⚡ Editor — Super Admin" : user.role}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.inkMuted, padding: "10px 14px", background: T.surfaceEl, borderRadius: 8, lineHeight: 1.6 }}>
                {FULL.includes(user.role)
                  ? user.role === "Editor"
                    ? "You have full CRM access including all features, team management, and the ability to push app updates to all users."
                    : "You have full admin access to all CRM features including team management and data."
                  : "To update your name, username, or password, ask a CEO, Manager, or Editor to edit your account in the Team section."}
              </div>
            </Section>

            <Section T={T} icon="🚪" title="Sign Out" sub="End your current session">
              <p style={{ fontSize: 13, color: T.inkMuted, marginBottom: 16, lineHeight: 1.7 }}>
                You will be returned to the login screen. Your data is safely stored in the cloud.
              </p>
              <button onClick={onLogout}
                style={{ padding: "10px 24px", borderRadius: 9, border: `1px solid ${T.lost.dot}`, background: T.lost.bg, color: T.lost.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                onMouseLeave={e => e.currentTarget.style.background = T.lost.bg}>
                Sign out of Suntronix CRM
              </button>
            </Section>
          </div>
        )}

        {/* ── DATA & PRIVACY ── */}
        {tab === "data" && (
          <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 20 }}>
            <Section T={T} icon="📊" title="Your Data Summary" sub="Overview of your CRM data">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Total Leads", value: funnels.length, color: T.brand },
                  { label: "Won Deals", value: won, color: T.won.dot },
                  { label: "Won Revenue", value: `₹${(totalRev/100000).toFixed(1)}L`, color: T.won.dot },
                ].map(s => (
                  <div key={s.label} style={{ background: T.surfaceEl, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.line}` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section T={T} icon="🔒" title="Privacy & Security" sub="Understand how your data is stored">
              {[
                { label: "Data storage", value: "Supabase (PostgreSQL) — cloud hosted" },
                { label: "Authentication", value: "Username + password (local session)" },
                { label: "Data encryption", value: "In-transit via HTTPS/TLS" },
                { label: "Password storage", value: "Plain text in DB — upgrade recommended" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}`, fontSize: 13 }}>
                  <span style={{ color: T.inkMuted }}>{r.label}</span>
                  <span style={{ color: T.ink, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{r.value}</span>
                </div>
              ))}
            </Section>

            <Section T={T} icon="🗑️" title="Clear Local Data" sub="Remove locally cached data from this browser">
              <p style={{ fontSize: 13, color: T.inkMuted, marginBottom: 16, lineHeight: 1.7 }}>
                Clears tasks, notes, recently viewed, and preferences stored on this device. Your CRM data in the cloud is unaffected.
              </p>
              <button
                onClick={() => { [SETTING_KEY, "ek_tasks_v1", "ek_targets_v1", "ek_recent", "ek-custom-colors"].forEach(k => localStorage.removeItem(k)); alert("Local data cleared."); }}
                style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${T.lineMid}`, background: T.surfaceEl, color: T.inkSub, fontSize: 13, cursor: "pointer" }}>
                Clear local cache
              </button>
            </Section>
          </div>
        )}

        {/* ── KEYBOARD SHORTCUTS ── */}
        {tab === "shortcuts" && (
          <div style={{ maxWidth: 600 }}>
            <Section T={T} icon="⌨️" title="Keyboard Shortcuts" sub="Speed up your workflow with these shortcuts">
              {[
                { group: "Navigation", items: [
                  ["Ctrl + K", "Open global search"],
                  ["N", "Add new lead (Funnels view)"],
                  ["/", "Focus search bar"],
                  ["Esc", "Close any open modal"],
                ]},
                { group: "Leads", items: [
                  ["Click row", "View lead details"],
                  ["Double-click row", "Edit lead (Full access)"],
                ]},
                { group: "Views", items: [
                  ["Dashboard", "Overview and KPIs"],
                  ["Funnels", "Lead list (Table/Kanban)"],
                  ["Calendar", "Follow-up calendar view"],
                  ["Targets", "Team targets & reports"],
                ]},
                { group: "Other", items: [
                  ["Ctrl + Enter", "Submit comment (in ViewDrawer)"],
                  ["@name", "Mention a teammate in comments"],
                ]},
              ].map(({ group, items }) => (
                <div key={group} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: "JetBrains Mono,monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${T.line}` }}>{group}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map(([key, desc]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: T.surfaceEl, borderRadius: 8, border: `1px solid ${T.line}` }}>
                        <span style={{ fontSize: 12, color: T.ink }}>{desc}</span>
                        <kbd style={{ background: T.surface, border: `1px solid ${T.lineMid}`, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontFamily: "JetBrains Mono,monospace", color: T.inkSub, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab === "about" && (
          <div style={{ maxWidth: 560 }}>
            <Section T={T} icon="ℹ️" title="About Suntronix CRM" sub="Version and build information">
              <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🏺</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Suntronix CRM</div>
                <div style={{ fontSize: 13, color: T.inkMuted, marginBottom: 4 }}>Built for electronics & technology businesses</div>
                <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.06em" }}>v50.1.0 · 2025</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  ["Framework", "React 18 + Vite"],
                  ["Database", "Supabase (PostgreSQL)"],
                  ["Routing", "React Router v7"],
                  ["Body Fonts", FONT_OPTIONS.filter(f=>f.id!=="custom").map(f=>f.name).join(", ")],
                  ["Mono Font", "JetBrains Mono"],
                  ["Themes", `${Object.keys(THEMES).length} built-in palettes + custom`],
                  ["Roles", "CEO · Manager · CRE · Editor · Viewer"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}`, fontSize: 13 }}>
                    <span style={{ color: T.inkMuted }}>{k}</span>
                    <span style={{ color: T.ink, fontWeight: 500, textAlign: "right", maxWidth: "65%" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Copyright watermark */}
              <div style={{ marginTop: 24, padding: "16px 0 4px", borderTop: `1px solid ${T.line}`, textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 16px", borderRadius: 20, background: T.brandSubtle, border: `1px solid ${T.brand}30`, marginBottom: 4, alignSelf: "center" }}>
                  <span style={{ fontSize: 14 }}>©</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, fontFamily: F_MONO, letterSpacing: "0.06em" }}>
                    {new Date().getFullYear()} Suntronix CRM · All rights reserved
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.inkSub, fontWeight: 500 }}>
                  Designed &amp; developed by{" "}
                  <span style={{ fontWeight: 800, color: T.brand }}>Surendran</span>
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, lineHeight: 1.7 }}>
                  For updates, errors, or future suggestions —
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                  <a href="mailto:surendranbba006@gmail.com"
                    style={{ fontSize: 12, color: T.brand, fontFamily: F_MONO, fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>
                    surendranbba006@gmail.com
                  </a>
                  <a href="tel:9840696374"
                    style={{ fontSize: 12, color: T.brand, fontFamily: F_MONO, fontWeight: 600, textDecoration: "none", letterSpacing: "0.06em" }}>
                    +91 98406 96374
                  </a>
                </div>
                <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, opacity: 0.6, marginTop: 4 }}>
                  v50.1.0 · Built with React 18 + Vite + Supabase
                </div>
              </div>
            </Section>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
