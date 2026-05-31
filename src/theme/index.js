import { useState, useEffect } from "react";

// ─── THEMES ───────────────────────────────────────────────────────────────────
export const THEMES = {
  obsidian: {
    name: "Obsidian", emoji: "⬛", desc: "Professional dark slate",
    light: {
      bg:"#f4f6fa", surface:"#ffffff", surfaceHover:"#f0f3f8", surfaceEl:"#eef1f7", sidebar:"#ffffff",
      brand:"#4361ee", brandHover:"#3451d1", brandSubtle:"#e8ecfd", brandRgb:"67,97,238",
      ink:"#0d1117", inkSub:"#2d3748", inkMuted:"#718096", inkInvert:"#ffffff",
      line:"#e8ecf2", lineMid:"#d1d9e6", lineStrong:"#a0aec0", sidebarBrand:"#4361ee",
    },
    dark: {
      bg:"#0a0c12", surface:"#121620", surfaceHover:"#1a1f2e", surfaceEl:"#181c2a", sidebar:"#0f1320",
      brand:"#6c8fff", brandHover:"#5a7cf0", brandSubtle:"rgba(108,143,255,0.12)", brandRgb:"108,143,255",
      ink:"#e8ecf8", inkSub:"#9baacf", inkMuted:"#4e5d80", inkInvert:"#0a0c12",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.2)", sidebarBrand:"#6c8fff",
    },
  },
  emerald: {
    name: "Emerald", emoji: "💚", desc: "Growth & prosperity",
    light: {
      bg:"#f4f9f6", surface:"#ffffff", surfaceHover:"#eaf4ef", surfaceEl:"#ecf5f0", sidebar:"#ffffff",
      brand:"#059669", brandHover:"#047857", brandSubtle:"#d1fae5", brandRgb:"5,150,105",
      ink:"#052e16", inkSub:"#065f46", inkMuted:"#6b7280", inkInvert:"#ffffff",
      line:"#d1fae5", lineMid:"#a7f3d0", lineStrong:"#6ee7b7", sidebarBrand:"#059669",
    },
    dark: {
      bg:"#030d09", surface:"#0a1f14", surfaceHover:"#102818", surfaceEl:"#0e2316", sidebar:"#071810",
      brand:"#34d399", brandHover:"#10b981", brandSubtle:"rgba(5,150,105,0.15)", brandRgb:"52,211,153",
      ink:"#ecfdf5", inkSub:"#6ee7b7", inkMuted:"#34d399", inkInvert:"#030d09",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#34d399",
    },
  },
  sand: {
    name: "Sand", emoji: "🏺", desc: "Warm parchment",
    light: {
      bg:"#f5f1eb", surface:"#faf8f4", surfaceHover:"#ece7de", surfaceEl:"#ede9e1", sidebar:"#faf8f4",
      brand:"#9a7a45", brandHover:"#7d6235", brandSubtle:"#f2e8d5", brandRgb:"154,122,69",
      ink:"#111009", inkSub:"#2a2520", inkMuted:"#4a4540", inkInvert:"#f5f1eb",
      line:"#e0d9ce", lineMid:"#c8c2b4", lineStrong:"#b0a898", sidebarBrand:"#9a7a45",
    },
    dark: {
      bg:"#141210", surface:"#1c1a17", surfaceHover:"#242018", surfaceEl:"#222018", sidebar:"#161410",
      brand:"#c9a96e", brandHover:"#b8934e", brandSubtle:"rgba(154,122,69,0.15)", brandRgb:"201,169,110",
      ink:"#f0ece5", inkSub:"#c8b89a", inkMuted:"#9a8a70", inkInvert:"#1a1814",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#c9a96e",
    },
  },
  violet: {
    name: "Violet", emoji: "💜", desc: "Deep purple elegance",
    light: {
      bg:"#f5f3ff", surface:"#ffffff", surfaceHover:"#ede9fd", surfaceEl:"#eae6fd", sidebar:"#ffffff",
      brand:"#7c3aed", brandHover:"#6d28d9", brandSubtle:"#ede9fb", brandRgb:"124,58,237",
      ink:"#1a0533", inkSub:"#3b1f6b", inkMuted:"#6b5b8a", inkInvert:"#f4f2fa",
      line:"#e0d9f8", lineMid:"#c5bde8", lineStrong:"#a99fd4", sidebarBrand:"#7c3aed",
    },
    dark: {
      bg:"#0f0b1a", surface:"#17122a", surfaceHover:"#1f1835", surfaceEl:"#1c1530", sidebar:"#130f23",
      brand:"#a78bfa", brandHover:"#8b5cf6", brandSubtle:"rgba(124,58,237,0.18)", brandRgb:"167,139,250",
      ink:"#f0ecff", inkSub:"#c4b8f0", inkMuted:"#8b7bb8", inkInvert:"#0f0b1a",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#a78bfa",
    },
  },
  slate: {
    name: "Slate", emoji: "🌫️", desc: "Clean neutral grey",
    light: {
      bg:"#f1f3f6", surface:"#ffffff", surfaceHover:"#e5e8ed", surfaceEl:"#e8eaef", sidebar:"#ffffff",
      brand:"#334155", brandHover:"#1e293b", brandSubtle:"#dde3ee", brandRgb:"51,65,85",
      ink:"#0f172a", inkSub:"#1e293b", inkMuted:"#475569", inkInvert:"#f1f3f6",
      line:"#e2e8f0", lineMid:"#cbd5e1", lineStrong:"#94a3b8", sidebarBrand:"#334155",
    },
    dark: {
      bg:"#0a0d12", surface:"#111827", surfaceHover:"#1a2333", surfaceEl:"#182030", sidebar:"#0e1520",
      brand:"#94a3b8", brandHover:"#cbd5e1", brandSubtle:"rgba(51,65,85,0.25)", brandRgb:"148,163,184",
      ink:"#f1f5f9", inkSub:"#cbd5e1", inkMuted:"#64748b", inkInvert:"#0a0d12",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#94a3b8",
    },
  },
  // ── 5 NEW THEMES ──────────────────────────────────────────────────────────
  ocean: {
    name: "Ocean", emoji: "🌊", desc: "Deep sea teal & cyan",
    light: {
      bg:"#f0fafa", surface:"#ffffff", surfaceHover:"#e0f4f7", surfaceEl:"#e6f5f8", sidebar:"#ffffff",
      brand:"#0891b2", brandHover:"#0e7490", brandSubtle:"#cffafe", brandRgb:"8,145,178",
      ink:"#042f3e", inkSub:"#0e4f68", inkMuted:"#5b8fa0", inkInvert:"#ffffff",
      line:"#a5f3fc", lineMid:"#67e8f9", lineStrong:"#22d3ee", sidebarBrand:"#0891b2",
    },
    dark: {
      bg:"#010f14", surface:"#051922", surfaceHover:"#08222e", surfaceEl:"#071e28", sidebar:"#041520",
      brand:"#22d3ee", brandHover:"#06b6d4", brandSubtle:"rgba(8,145,178,0.15)", brandRgb:"34,211,238",
      ink:"#ecfeff", inkSub:"#67e8f9", inkMuted:"#164e63", inkInvert:"#010f14",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#22d3ee",
    },
  },
  amber: {
    name: "Amber", emoji: "🔥", desc: "Bold amber & orange energy",
    light: {
      bg:"#fffbf0", surface:"#ffffff", surfaceHover:"#fef3c7", surfaceEl:"#fef5d0", sidebar:"#ffffff",
      brand:"#d97706", brandHover:"#b45309", brandSubtle:"#fef3c7", brandRgb:"217,119,6",
      ink:"#1c0f00", inkSub:"#451a03", inkMuted:"#78350f", inkInvert:"#ffffff",
      line:"#fde68a", lineMid:"#fcd34d", lineStrong:"#fbbf24", sidebarBrand:"#d97706",
    },
    dark: {
      bg:"#120a00", surface:"#1e1100", surfaceHover:"#2a1800", surfaceEl:"#261500", sidebar:"#180e00",
      brand:"#fbbf24", brandHover:"#f59e0b", brandSubtle:"rgba(217,119,6,0.15)", brandRgb:"251,191,36",
      ink:"#fffbeb", inkSub:"#fde68a", inkMuted:"#92400e", inkInvert:"#120a00",
      line:"rgba(255,255,255,0.07)", lineMid:"rgba(255,255,255,0.11)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#fbbf24",
    },
  },
  midnight: {
    name: "Midnight", emoji: "🌌", desc: "Ultra-dark OLED black",
    light: {
      bg:"#f2f2f5", surface:"#ffffff", surfaceHover:"#e8e8f0", surfaceEl:"#ebebf2", sidebar:"#ffffff",
      brand:"#1a1a2e", brandHover:"#0f0f1f", brandSubtle:"#e0e0ef", brandRgb:"26,26,46",
      ink:"#0a0a14", inkSub:"#1a1a2e", inkMuted:"#555570", inkInvert:"#f2f2f5",
      line:"#dcdce8", lineMid:"#c8c8dc", lineStrong:"#a0a0c0", sidebarBrand:"#1a1a2e",
    },
    dark: {
      bg:"#000000", surface:"#0a0a0a", surfaceHover:"#121212", surfaceEl:"#101010", sidebar:"#050505",
      brand:"#818cf8", brandHover:"#6366f1", brandSubtle:"rgba(99,102,241,0.15)", brandRgb:"129,140,248",
      ink:"#f8f8ff", inkSub:"#c8c8e0", inkMuted:"#606080", inkInvert:"#000000",
      line:"rgba(255,255,255,0.06)", lineMid:"rgba(255,255,255,0.10)", lineStrong:"rgba(255,255,255,0.18)", sidebarBrand:"#818cf8",
    },
  },
};

// ─── FONTS ────────────────────────────────────────────────────────────────────
export const FONT_OPTIONS = [
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    label: "Jakarta",
    desc: "Modern geometric · CRM default",
    emoji: "🔵",
    google: "Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400",
    css: "'Plus Jakarta Sans', 'SF Pro Display', system-ui, sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    label: "Inter",
    desc: "Highly legible · UI classic",
    emoji: "⚪",
    google: "Inter:wght@300;400;500;600;700;800",
    css: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
  },
  {
    id: "dm",
    name: "DM Sans",
    label: "DM Sans",
    desc: "Clean & friendly · Startup feel",
    emoji: "🟢",
    google: "DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400",
    css: "'DM Sans', system-ui, sans-serif",
  },
  {
    id: "outfit",
    name: "Outfit",
    label: "Outfit",
    desc: "Rounded & bold · Modern brand",
    emoji: "🟣",
    google: "Outfit:wght@300;400;500;600;700;800",
    css: "'Outfit', system-ui, sans-serif",
  },
  {
    id: "sora",
    name: "Sora",
    label: "Sora",
    desc: "Sharp & minimal · Developer style",
    emoji: "⬛",
    google: "Sora:wght@300;400;500;600;700;800",
    css: "'Sora', system-ui, sans-serif",
  },
  {
    id: "custom",
    name: "Custom",
    label: "Custom",
    desc: "Enter any Google Font name",
    emoji: "✏️",
    google: null,
    css: null,
  },
];

export const DEFAULT_FONT_ID = "jakarta";

// ─── useTheme hook ─────────────────────────────────────────────────────────────
export const useTheme = () => {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem("ek-theme") || "obsidian"; } catch { return "obsidian"; }
  });
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("ek-dark") === "1"; } catch { return false; }
  });
  const [fontId, setFontId] = useState(() => {
    try { return localStorage.getItem("ek-font-id") || DEFAULT_FONT_ID; } catch { return DEFAULT_FONT_ID; }
  });
  const [customFont, setCustomFontState] = useState(() => {
    try { return localStorage.getItem("ek-custom-font") || ""; } catch { return ""; }
  });
  const [customColors, setCustomColorsState] = useState(() => {
    try {
      const s = localStorage.getItem("ek-custom-colors");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const toggleDark = () => setDark(d => {
    const next = !d;
    try { localStorage.setItem("ek-dark", next ? "1" : "0"); } catch {}
    return next;
  });
  const setTheme = (id) => {
    if (!THEMES[id]) return;
    try { localStorage.setItem("ek-theme", id); } catch {}
    setThemeId(id);
  };
  const setFont = (id) => {
    try { localStorage.setItem("ek-font-id", id); } catch {}
    setFontId(id);
  };
  const setCustomFont = (name) => {
    try { localStorage.setItem("ek-custom-font", name); } catch {}
    setCustomFontState(name);
  };
  const applyCustomColors = (colors) => {
    try { localStorage.setItem("ek-custom-colors", JSON.stringify(colors)); } catch {}
    setCustomColorsState(colors);
  };
  const clearCustomColors = () => {
    try { localStorage.removeItem("ek-custom-colors"); } catch {}
    setCustomColorsState(null);
  };

  return { themeId, setTheme, dark, toggleDark, fontId, setFont, customFont, setCustomFont, customColors, applyCustomColors, clearCustomColors };
};

export const useDark = () => {
  const { dark, toggleDark } = useTheme();
  return { dark, toggle: toggleDark };
};

// ─── makeT ────────────────────────────────────────────────────────────────────
export const makeT = (dark, themeId = "obsidian", customColors = null) => {
  const def = THEMES[themeId] || THEMES.obsidian;
  const base = dark ? def.dark : def.light;
  // Apply custom color overrides if set
  const effectiveBase = customColors
    ? {
        ...base,
        ...(customColors.brand ? { brand: customColors.brand, brandHover: customColors.brand, sidebarBrand: customColors.brand } : {}),
        ...(customColors.bg    ? { bg: customColors.bg }       : {}),
        ...(customColors.surface ? { surface: customColors.surface, sidebar: customColors.surface } : {}),
        ...(customColors.ink   ? { ink: customColors.ink }     : {}),
      }
    : base;
  return {
    ...effectiveBase,
    themeId,
    won:     { dot:"#10b981", bg: dark?"rgba(16,185,129,0.12)":"#d1fae5",  text: dark?"#34d399":"#065f46" },
    pending: { dot:"#f59e0b", bg: dark?"rgba(245,158,11,0.12)":"#fef3c7",  text: dark?"#fbbf24":"#92400e" },
    lost:    { dot:"#ef4444", bg: dark?"rgba(239,68,68,0.12)":"#fee2e2",   text: dark?"#f87171":"#991b1b" },
    drop:    { dot:"#6b7280", bg: dark?"rgba(107,114,128,0.10)":"#f3f4f6", text: dark?"#9ca3af":"#374151" },
    cold:    { dot:"#8b5cf6", bg: dark?"rgba(139,92,246,0.12)":"#ede9fe",  text: dark?"#a78bfa":"#5b21b6" },
    neg:     { dot:"#f43f5e", bg: dark?"rgba(239,68,68,0.08)":"#fff1f2",   text: dark?"#fb7185":"#be123c" },
    ntc:     { dot:"#64748b", bg: dark?"rgba(100,116,139,0.1)":"#f1f5f9",  text: dark?"#94a3b8":"#334155" },
    new:     { dot:"#3b82f6", bg: dark?"rgba(59,130,246,0.12)":"#dbeafe",  text: dark?"#60a5fa":"#1e40af" },
    high:    { dot:"#f59e0b", bg: dark?"rgba(245,158,11,0.12)":"#fef3c7",  text: dark?"#fbbf24":"#92400e" },
    premium: { dot:"#8b5cf6", bg: dark?"rgba(139,92,246,0.12)":"#f3e8ff",  text: dark?"#c084fc":"#6b21a8" },
    bulk:    { dot:"#10b981", bg: dark?"rgba(16,185,129,0.12)":"#d1fae5",  text: dark?"#34d399":"#065f46" },
    r: { xs:"4px", sm:"6px", md:"8px", lg:"10px", xl:"12px", "2xl":"16px", "3xl":"20px" },
    shadowSm:  dark ? "0 1px 4px rgba(0,0,0,0.5)"    : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    shadowMd:  dark ? "0 4px 16px rgba(0,0,0,0.5)"   : "0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
    shadowLg:  dark ? "0 10px 30px rgba(0,0,0,0.6)"  : "0 12px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)",
    shadowXl:  dark ? "0 25px 60px rgba(0,0,0,0.7)"  : "0 24px 48px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)",
    shadow2xl: dark ? "0 40px 80px rgba(0,0,0,0.8)"  : "0 25px 50px rgba(0,0,0,0.12)",
    glow: `0 0 0 3px rgba(${base.brandRgb},0.2)`,
  };
};

// ─── getActiveFont ─────────────────────────────────────────────────────────────
export function getActiveFont(fontId, customFont) {
  if (fontId === "custom") {
    const name = (customFont || "").trim();
    return name ? `'${name}', system-ui, sans-serif` : "'Plus Jakarta Sans', system-ui, sans-serif";
  }
  const opt = FONT_OPTIONS.find(f => f.id === fontId);
  return opt?.css || "'Plus Jakarta Sans', system-ui, sans-serif";
}

export function getGoogleFontUrl(fontId, customFont) {
  if (fontId === "custom") {
    const name = (customFont || "").trim().replace(/ /g, "+");
    return name
      ? `https://fonts.googleapis.com/css2?family=${name}:wght@300;400;500;600;700;800&display=swap`
      : null;
  }
  const opt = FONT_OPTIONS.find(f => f.id === fontId);
  return opt?.google
    ? `https://fonts.googleapis.com/css2?family=${opt.google}&family=JetBrains+Mono:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap`
    : null;
}

export const F_BODY  = "'Plus Jakarta Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif";
export const F_MONO  = "'JetBrains Mono', 'Fira Code', monospace";
export const F_SERIF = "'Lora', Georgia, serif";
export const F       = F_BODY;

export function FontLoader({ dark, themeId = "obsidian", fontId = "jakarta", customFont = "" }) {
  useEffect(() => {
    // Load Google Font
    const url = getGoogleFontUrl(fontId, customFont);
    let linkEl = document.getElementById("ek-font");
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.id = "ek-font";
      linkEl.rel = "stylesheet";
      document.head.appendChild(linkEl);
    }
    if (url) linkEl.href = url;

    const activeFont = getActiveFont(fontId, customFont);
    const def = THEMES[themeId] || THEMES.obsidian;
    const base = dark ? def.dark : def.light;

    let g = document.getElementById("ek-global-style");
    if (!g) { g = document.createElement("style"); g.id = "ek-global-style"; document.head.appendChild(g); }
    g.textContent = `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{font-size:14px}
      html{height:100%}
      body{
        background:${base.bg};color:${base.ink};
        font-family:${activeFont};
        -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
        transition:background .3s,color .3s,font-family .2s;height:100%;overflow:auto;
      }
      #root{height:100%;display:flex;flex-direction:column}
      input,select,textarea,button{font-family:inherit}

      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      @keyframes slideRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
      @keyframes slideLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
      @keyframes bounceIn{0%{opacity:0;transform:scale(0.85)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
      @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(${base.brandRgb},.2);border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:rgba(${base.brandRgb},.4)}
      ::-webkit-scrollbar-corner{background:transparent}
      ::selection{background:rgba(${base.brandRgb},0.18);color:${base.ink}}

      .ek-shell{height:100vh;overflow:hidden;display:flex}
      .ek-main-col{flex:1;min-width:0;height:100vh;overflow:hidden;display:flex;flex-direction:column}
      .ek-page-content{flex:1;overflow-y:auto;animation:fadeUp .22s ease both}
      .ek-table-scroll{overflow-y:auto}
      .ek-hide-mobile{display:flex}
      .ek-show-mobile{display:none}

      .ek-card{background:${base.surface};border:1px solid ${base.line};border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 1px 2px rgba(0,0,0,0.03);transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease;}
      .ek-card-hover:hover{box-shadow:0 10px 28px rgba(0,0,0,0.09),0 4px 10px rgba(0,0,0,0.04);transform:translateY(-2px);border-color:${base.lineMid};}

      .ek-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
      .ek-stats-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
      .ek-dash-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
      .ek-analytics-hero{display:grid;grid-template-columns:2fr 1fr;gap:16px}
      .ek-stat-card{transition:transform .2s ease,box-shadow .2s ease;cursor:pointer}
      .ek-stat-card:hover{transform:translateY(-2px)}
      .ek-table-row{transition:background .12s ease}
      .ek-stats-row1{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}
      .ek-stats-row2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}

      .ek-sidebar{width:248px;height:100vh;flex-shrink:0;background:${base.sidebar};border-right:1px solid ${base.line};display:flex;flex-direction:column;position:relative;z-index:10;transition:width .22s cubic-bezier(0.4,0,0.2,1);overflow:hidden;}
      .ek-sidebar.collapsed{width:64px}

      .ek-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${base.surface};border-top:1px solid ${base.line};z-index:200;height:calc(64px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);align-items:center;justify-content:space-around;box-shadow:0 -8px 32px rgba(0,0,0,0.1);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);}
      .ek-bottom-nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 8px;border-radius:12px;border:none;background:none;cursor:pointer;transition:all .18s ease;flex:1;-webkit-tap-highlight-color:transparent;min-width:44px;min-height:48px;justify-content:center;}
      .ek-bottom-nav-item.active{background:rgba(${base.brandRgb},0.1)}
      .ek-bottom-nav-label{font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-top:2px}

      .ek-skeleton{background:linear-gradient(90deg,${base.surfaceEl} 0%,${base.surfaceHover} 50%,${base.surfaceEl} 100%);background-size:600px 100%;animation:shimmer 1.6s infinite;border-radius:8px;}

      button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid ${base.brand};outline-offset:2px;}

      @media(max-width:1400px){.ek-kpi-grid{grid-template-columns:repeat(4,1fr)!important}.ek-stats-grid{grid-template-columns:repeat(4,1fr)!important}}
      @media(max-width:1200px){.ek-kpi-grid{grid-template-columns:repeat(2,1fr)!important}.ek-dash-grid{grid-template-columns:1fr!important}.ek-analytics-hero{grid-template-columns:1fr!important}.ek-stats-row1{grid-template-columns:repeat(2,1fr)!important}.ek-stats-row2{grid-template-columns:repeat(3,1fr)!important}}
      @media(max-width:768px){
        html{-webkit-text-size-adjust:100%}
        *{-webkit-tap-highlight-color:transparent}
        .ek-shell{height:100dvh}
        .ek-main-col{height:100dvh}
        .ek-page-content{padding-bottom:calc(72px + env(safe-area-inset-bottom))!important}
        .ek-sidebar{display:none!important}
        .ek-sidebar.open{display:flex!important;position:fixed!important;top:0!important;left:0!important;bottom:0!important;width:min(280px,88vw)!important;z-index:300!important;height:100dvh!important;box-shadow:8px 0 48px rgba(0,0,0,0.35)!important;}
        .ek-bottom-nav{display:flex!important}
        .ek-hide-mobile{display:none!important}
        .ek-show-mobile{display:flex!important}
        .ek-kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
        .ek-stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
        .ek-stats-row1{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-bottom:8px!important}
        .ek-stats-row2{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
        .ek-dash-grid{grid-template-columns:1fr!important;gap:12px!important}
        .ek-topbar-sub{display:none!important}
        .ek-mobile-menu{display:flex!important}
        .ek-drawer{width:100vw!important;max-width:100vw!important;border-radius:16px 16px 0 0!important;max-height:95dvh!important}
        .ek-modal{width:calc(100vw - 16px)!important;margin:0 auto;max-height:95dvh!important;border-radius:16px!important}
        .ek-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .ek-filter-scroll{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;padding-bottom:4px!important}
        .ek-filter-scroll>*{flex-shrink:0}
        .ek-topbar{padding:0 14px!important;gap:8px!important;height:52px!important}
        .ek-contacts-grid{grid-template-columns:1fr!important;gap:10px!important}
        .ek-contacts-header{flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
        .ek-bulk-bar{flex-direction:row!important;flex-wrap:wrap!important;gap:8px!important;padding:10px 14px!important}
        .ek-bulk-bar button,.ek-bulk-bar>*{flex-shrink:0}
        .ek-funnel-toolbar{flex-direction:column!important;align-items:stretch!important;gap:8px!important}
        .ek-task-card{padding:14px!important}
        .ek-notif-panel{width:100vw!important;right:0!important;left:0!important;border-radius:0!important;max-height:80dvh!important}
        .ek-settings-content{padding:12px!important}
        .ek-view-drawer{width:100vw!important;max-width:100vw!important}
      }
      @media(max-width:480px){
        .ek-kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
        .ek-stats-grid{grid-template-columns:1fr 1fr!important;gap:6px!important}
        .ek-topbar-search{max-width:140px!important;min-width:80px!important}
        .ek-modal{width:100vw!important;border-radius:16px 16px 0 0!important;position:fixed!important;bottom:0!important;top:auto!important}
        .ek-bottom-nav{height:calc(60px + env(safe-area-inset-bottom))!important}
      }

      .ek-page-content,.ek-table-scroll,[style*="overflow-y:auto"],[style*="overflowY:auto"]{-webkit-overflow-scrolling:touch;}
      .ek-tr:hover td{background:rgba(${base.brandRgb},0.04)!important}

      .ek-dropdown{background:${base.surface};border:1px solid ${base.lineMid};border-radius:14px;box-shadow:0 20px 48px rgba(0,0,0,0.14),0 4px 12px rgba(0,0,0,0.06);overflow:hidden;animation:scaleIn .15s ease;transform-origin:top center;}
      .ek-dropdown-item{padding:10px 14px;font-size:13px;color:${base.ink};cursor:pointer;transition:background .1s;display:flex;align-items:center;gap:10px;}
      .ek-dropdown-item:hover{background:${base.surfaceEl}}

      .ek-topbar{background:${base.surface};border-bottom:1px solid ${base.line};height:56px;display:flex;align-items:center;padding:0 24px;gap:12px;position:sticky;top:0;z-index:8;flex-shrink:0;overflow:hidden;}
      .ek-topbar-search{flex:1;min-width:120px;}

      .ek-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;}

      .ek-input{width:100%;height:40px;border-radius:10px;border:1.5px solid ${base.line};background:${base.surface};color:${base.ink};font-size:13px;padding:0 12px;transition:border-color .15s,box-shadow .15s;outline:none;}
      .ek-input:focus{border-color:${base.brand};box-shadow:0 0 0 3px rgba(${base.brandRgb},0.15)}
      .ek-input::placeholder{color:${base.inkMuted}}

      .ek-form-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
      .ek-form-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:600px){.ek-form-3col{grid-template-columns:1fr!important}.ek-form-2col{grid-template-columns:1fr!important}.ek-tasks-form-grid{grid-template-columns:1fr!important}.ek-tasks-form-grid2{grid-template-columns:1fr 1fr!important}input,select,textarea{font-size:16px!important}input[type="number"]{font-size:16px!important}}

      @media(max-width:768px){.ek-settings-sidebar{display:none!important}.ek-settings-tabs-mobile{display:block!important}}

      .ek-analytics-tabs{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
      .ek-analytics-tabs::-webkit-scrollbar{display:none}
      .ek-analytics-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .ek-analytics-stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      @media(max-width:768px){.ek-analytics-chart-grid{grid-template-columns:1fr!important}.ek-analytics-stat-row{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}.ek-analytics-hero{grid-template-columns:1fr!important}}
      @media(max-width:480px){.ek-analytics-stat-row{grid-template-columns:1fr 1fr!important;gap:6px!important}}

      .ek-contacts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;align-items:start;width:100%;box-sizing:border-box}
      .ek-contact-card{background:${base.surface};border:1.5px solid ${base.line};border-radius:14px;padding:16px 18px;cursor:pointer;transition:all .2s ease;box-shadow:0 1px 4px rgba(0,0,0,0.04);height:fit-content;}
      .ek-contact-card:hover{border-color:${base.brand};transform:translateY(-3px);box-shadow:0 12px 32px rgba(${base.brandRgb},0.12),0 4px 12px rgba(0,0,0,0.06);}

      /* ── ENHANCED CARD ───────────────────────────────────────────── */
      .ek-card{background:${base.surface};border:1px solid ${base.line};border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 1px 2px rgba(0,0,0,0.03);transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease;}
      .ek-card-hover:hover{box-shadow:0 12px 32px rgba(${base.brandRgb},0.1),0 4px 12px rgba(0,0,0,0.06);transform:translateY(-2px);border-color:${base.lineMid};}

      /* ── ENHANCED INPUT ─────────────────────────────────────────── */
      .ek-input{width:100%;height:40px;border-radius:10px;border:1.5px solid ${base.line};background:${base.surface};color:${base.ink};font-size:13px;padding:0 12px;transition:border-color .15s,box-shadow .15s;outline:none;font-family:inherit;}
      .ek-input:hover{border-color:${base.lineMid}}
      .ek-input:focus{border-color:${base.brand};box-shadow:0 0 0 3px rgba(${base.brandRgb},0.14)}
      .ek-input::placeholder{color:${base.inkMuted}}

      /* ── MISSING BASE DEFINITIONS ──────────────────────────────── */
      .ek-tasks-form-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}
      .ek-tasks-form-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .ek-team-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
      .ek-funnel-toolbar{display:flex;align-items:center;gap:8px;padding:8px 20px;background:${base.surface};border-bottom:1px solid ${base.line};overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:0}
      .ek-funnel-toolbar::-webkit-scrollbar{display:none}
      .ek-notif-panel{position:fixed;top:60px;right:16px;width:360px;max-height:80vh;background:${base.surface};border:1px solid ${base.lineMid};border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.18),0 8px 16px rgba(0,0,0,0.08);z-index:500;overflow:hidden;display:flex;flex-direction:column;animation:scaleIn .15s ease;transform-origin:top right}
      .ek-settings-sidebar{display:flex;flex-direction:column;gap:2px;width:192px;flex-shrink:0}
      .ek-settings-tabs-mobile{display:none}
      .ek-settings-content{flex:1;min-width:0;overflow:hidden}
      .ek-view-drawer{position:fixed;top:0;right:0;bottom:0;z-index:900;width:560px;max-width:96vw;background:${base.surface};border-left:1px solid ${base.line};box-shadow:-8px 0 48px rgba(0,0,0,0.18);display:flex;flex-direction:column;overflow:hidden}
      .ek-drawer{position:fixed;top:0;right:0;bottom:0;z-index:1000;width:480px;max-width:96vw;background:${base.surface};border-left:1px solid ${base.line};box-shadow:-8px 0 48px rgba(0,0,0,0.18);display:flex;flex-direction:column;overflow:hidden}
      .ek-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.46);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px;animation:fadeIn .18s ease}
      .ek-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;min-width:0}

      /* ── CRM UTILITY CLASSES ──────────────────────────────────── */
      .ek-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.04em}
      .ek-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px 24px;text-align:center;color:${base.inkMuted}}
      .ek-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${base.inkMuted}}
      .ek-divider{height:1px;background:${base.line};margin:0}
      .ek-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      /* ── IMPROVED TABLE ROWS ──────────────────────────────────── */
      .ek-tr td{transition:background .1s ease}
      .ek-tr:hover td{background:${base.surfaceHover}!important}

      /* ── BETTER SIDEBAR ANIMATION ────────────────────────────── */
      .ek-sidebar{transition:width .22s cubic-bezier(0.4,0,0.2,1),transform .22s cubic-bezier(0.4,0,0.2,1)}

      /* ── BETTER MOBILE BOTTOM NAV ────────────────────────────── */
      .ek-bottom-nav-item:hover{background:rgba(${base.brandRgb},0.08)}
      .ek-bottom-nav-item:active{transform:scale(0.92)}

      /* ── RESPONSIVE ADDITIONS ─────────────────────────────────── */
      @media(max-width:1200px){.ek-team-grid{grid-template-columns:1fr!important}}
      @media(max-width:900px){.ek-analytics-chart-grid{grid-template-columns:1fr!important}}
      @media(max-width:768px){
        .ek-tasks-form-grid{grid-template-columns:1fr!important}
        .ek-tasks-form-grid2{grid-template-columns:1fr!important}
        .ek-team-grid{grid-template-columns:1fr!important}
        .ek-view-drawer{width:100vw!important;max-width:100vw!important;border-left:none!important}
        .ek-notif-panel{top:auto!important;bottom:78px!important;right:8px!important;left:8px!important;width:auto!important;max-height:65dvh!important;transform-origin:bottom center!important}
        .ek-funnel-toolbar{padding:8px 12px!important;gap:6px!important}
        .ek-modal{padding:0!important;align-items:flex-end!important}
      }
      @media(max-width:600px){
        .ek-tasks-form-grid{grid-template-columns:1fr!important}
        .ek-tasks-form-grid2{grid-template-columns:1fr 1fr!important}
        .ek-form-2col{grid-template-columns:1fr!important}
        .ek-form-3col{grid-template-columns:1fr!important}
      }

      /* ── BETTER SIDEBAR NAV ITEMS ──────────────────────────────── */
      .ek-nav-item{display:flex;align-items:center;gap:10px;width:100%;height:42px;padding:0 10px;border-radius:10px;border:none;background:transparent;cursor:pointer;transition:all .15s ease;font-size:13px;font-weight:500;color:${base.inkMuted};}
      .ek-nav-item:hover{background:${base.surfaceEl};color:${base.ink}}
      .ek-nav-item.active{background:${dark?`rgba(${base.brandRgb},0.15)`:base.brandSubtle};color:${base.brand};font-weight:700}

      /* ── BETTER TABLE ──────────────────────────────────────────── */
      .ek-th{font-size:10px;font-weight:700;color:${base.inkMuted};text-transform:uppercase;letter-spacing:0.08em;padding:10px 14px;white-space:nowrap;border-bottom:1px solid ${base.line};background:${base.surfaceEl}}
      .ek-td{font-size:13px;color:${base.inkSub};padding:11px 14px;vertical-align:middle;border-bottom:1px solid ${base.line}}
      .ek-tr:hover .ek-td{background:${base.surfaceHover}!important;color:${base.ink}}

      /* ── BOTTOM NAV ACTIVE INDICATOR ───────────────────────────── */
      .ek-bottom-nav-item.active::before{content:"";position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:24px;height:3px;background:${base.brand};border-radius:0 0 3px 3px}
      .ek-bottom-nav-item{position:relative}

      /* ── BETTER STAT CARD ──────────────────────────────────────── */
      .ek-stat-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;cursor:pointer;border-radius:14px;overflow:hidden}
      .ek-stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(${base.brandRgb},0.1),0 3px 8px rgba(0,0,0,0.06);border-color:${base.lineMid}!important}

      /* ── SKELETON SHIMMER ──────────────────────────────────────── */
      .ek-skeleton{background:linear-gradient(90deg,${base.surfaceEl} 0%,${base.surfaceHover} 50%,${base.surfaceEl} 100%);background-size:800px 100%;animation:shimmer 1.4s ease infinite;border-radius:8px}

      /* ── FORM HINT TEXT ────────────────────────────────────────── */
      .ek-hint{font-size:10px;color:${base.inkMuted};margin-top:3px;font-family:inherit}

      /* ── BETTER DROPDOWN ───────────────────────────────────────── */
      .ek-dropdown{background:${base.surface};border:1px solid ${base.lineMid};border-radius:14px;box-shadow:0 20px 48px rgba(0,0,0,0.16),0 6px 16px rgba(0,0,0,0.08);overflow:hidden;animation:scaleIn .14s ease;transform-origin:top center}
      .ek-dropdown-item{padding:10px 14px;font-size:13px;color:${base.ink};cursor:pointer;transition:background .1s;display:flex;align-items:center;gap:10}
      .ek-dropdown-item:hover{background:${base.surfaceEl}}
      .ek-dropdown-item:active{background:${base.brandSubtle}}

      /* ── SCROLLBAR REFINED ─────────────────────────────────────── */
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(${base.brandRgb},.18);border-radius:8px}
      ::-webkit-scrollbar-thumb:hover{background:rgba(${base.brandRgb},.36)}

      /* ── FOCUS RING GLOBAL ─────────────────────────────────────── */
      button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid ${base.brand};outline-offset:2px;border-radius:4px}

      /* ── TOPBAR PILL BADGE ─────────────────────────────────────── */
      .ek-topbar-badge{display:inline-flex;align-items:center;padding:4px 10px;background:${base.surfaceEl};border:1.5px solid ${base.line};border-radius:20px;font-size:11px;font-weight:600;color:${base.inkMuted};white-space:nowrap;font-family:'JetBrains Mono',monospace}

      /* ── PAGE CONTENT SMOOTH ───────────────────────────────────── */
      .ek-page-content{flex:1;overflow-y:auto;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}

      /* ── MOBILE FORM FIX ───────────────────────────────────────── */
      @media(max-width:540px){
        .ek-form-2col{grid-template-columns:1fr!important}
        .ek-form-3col{grid-template-columns:1fr!important}
        .ek-analytics-stat-row{grid-template-columns:1fr 1fr!important;gap:8px!important}
      }

      /* ── MOBILE COMPREHENSIVE ─────────────────────────────────── */

      /* Dashboard quick-metrics (6-col inline → responsive) */
      .ek-quick-metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
      @media(max-width:1200px){.ek-quick-metrics{grid-template-columns:repeat(3,1fr)!important}}
      @media(max-width:768px){.ek-quick-metrics{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}}
      @media(max-width:480px){.ek-quick-metrics{grid-template-columns:repeat(2,1fr)!important;gap:6px!important}}

      /* Calendar */
      .ek-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
      @media(max-width:768px){
        .ek-calendar-grid{gap:2px!important}
        .ek-calendar-day{min-height:60px!important;padding:4px!important}
        .ek-calendar-day-num{width:22px!important;height:22px!important;font-size:11px!important}
      }
      @media(max-width:480px){
        .ek-calendar-grid{gap:1px!important}
        .ek-calendar-day{min-height:44px!important;padding:3px!important;border-radius:6px!important}
        .ek-calendar-day-num{width:18px!important;height:18px!important;font-size:10px!important}
        .ek-calendar-event{display:none!important}
        .ek-calendar-event:first-of-type{display:block!important}
      }

      /* Calendar side panel */
      @media(max-width:768px){
        .ek-calendar-panel{position:fixed!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;max-height:60dvh!important;border-radius:16px 16px 0 0!important;border-top:1px solid ${base.line}!important;z-index:50}
      }

      /* Chat */
      @media(max-width:640px){
        .ek-chat-sidebar{display:none!important}
        .ek-chat-menu-btn{display:flex!important}
      }

      /* Targets period controls */
      @media(max-width:768px){
        .ek-targets-header{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
        .ek-targets-period-nav{justify-content:center!important}
        .ek-targets-summary{grid-template-columns:repeat(2,1fr)!important}
      }
      @media(max-width:480px){
        .ek-targets-summary{grid-template-columns:1fr 1fr!important;gap:8px!important}
      }

      /* CRE Card stats on mobile */
      @media(max-width:600px){
        .ek-cre-stats-grid{grid-template-columns:repeat(2,1fr)!important}
      }

      /* Topbar push update button text */
      @media(max-width:768px){
        .ek-push-update-label{display:none!important}
      }

      /* Drawer full height on mobile, sheet from bottom */
      @media(max-width:768px){
        .ek-drawer{width:100vw!important;max-width:100vw!important;top:auto!important;height:95dvh!important;border-radius:16px 16px 0 0!important;border-left:none!important;animation:slideUp .25s cubic-bezier(0.4,0,0.2,1)!important}
        .ek-view-drawer{width:100vw!important;max-width:100vw!important;top:auto!important;height:95dvh!important;border-radius:16px 16px 0 0!important;border-left:none!important;animation:slideUp .25s cubic-bezier(0.4,0,0.2,1)!important}
      }

      /* Table mobile card mode */
      @media(max-width:640px){
        .ek-table-wrap table{display:block}
        .ek-table-wrap thead{display:none}
        .ek-table-wrap tbody{display:flex;flex-direction:column;gap:8px;padding:8px}
        .ek-table-wrap tr{display:flex;flex-direction:column;background:${base.surface};border:1px solid ${base.line};border-radius:12px;padding:12px 14px;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
        .ek-table-wrap td{display:flex;align-items:center;justify-content:space-between;padding:3px 0!important;border:none!important;font-size:13px!important}
        .ek-table-wrap td[data-label]::before{content:attr(data-label);font-size:10px;font-weight:700;color:${base.inkMuted};text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;margin-right:8px}
        .ek-table-wrap td:empty{display:none}
      }

      /* FunnelForm full screen on mobile */
      @media(max-width:768px){
        .ek-funnel-form{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;top:0!important;bottom:0!important}
      }

      /* Notification panel bottom sheet on mobile */
      @media(max-width:768px){
        .ek-notif-panel{top:auto!important;bottom:calc(64px + env(safe-area-inset-bottom))!important;right:8px!important;left:8px!important;width:auto!important;max-height:65dvh!important;border-radius:16px!important}
      }

      /* Filter bar - horizontal scroll on mobile, no wrap */
      @media(max-width:768px){
        .ek-filter-bar{padding:6px 10px!important;min-height:40px!important}
        .ek-filter-bar .ek-preset-strip{overflow-x:auto;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;padding-bottom:2px}
      }

      /* Page content bottom padding includes bottom nav */
      @media(max-width:768px){
        .ek-page-content{padding-bottom:calc(70px + env(safe-area-inset-bottom))!important}
      }

      /* Analytics tabs scroll */
      .ek-analytics-tabs{-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .ek-analytics-tabs::-webkit-scrollbar{display:none}

      /* Funnel month toolbar scrollable on mobile */
      @media(max-width:768px){
        .ek-month-strip{padding:8px 10px 0!important}
        .ek-month-strip-pills{gap:4px!important}
      }

      /* Global search modal mobile */
      @media(max-width:768px){
        .ek-global-search{padding-top:0!important;align-items:flex-end!important}
        .ek-global-search>div{border-radius:16px 16px 0 0!important;max-height:90dvh!important;width:100vw!important}
      }

      /* Invoice modal mobile */
      @media(max-width:600px){
        .ek-invoice-modal{width:100vw!important;max-height:100dvh!important;border-radius:16px 16px 0 0!important}
      }

      /* ── SLIDE ANIMATIONS ──────────────────────────────────────── */
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideDown{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(16px)}}
    `;
  }, [dark, themeId, fontId, customFont]);
  return null;
}
