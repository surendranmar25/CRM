import React, { useMemo, useState } from "react";
import { F, F_MONO, F_SERIF, F_BODY } from "../../theme/index.js";
import { Dot, Avatar, StatusPill, SourcePill, Ic, P } from "../ui/index.jsx";
import { big, inr, today } from "../../utils.js";

// Tiny sparkline SVG
function Sparkline({ data = [], color, height = 28, width = 70 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color}/>
    </svg>
  );
}

function KpiCard({ label, value, sub, dot, spark, onClick, active, T, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      style={{
        background: active ? `${dot}15` : T.surface,
        border: `1.5px solid ${active ? dot : hov && onClick ? dot+"66" : T.line}`,
        borderRadius: 12,
        padding: "18px 18px 14px",
        cursor: onClick ? "pointer" : "default",
        transition: "all .18s",
        position: "relative",
        overflow: "hidden",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 4px 16px ${dot}30` : hov && onClick ? T.shadowMd : T.shadowSm,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {/* Accent blob top-right */}
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${dot}22`, pointerEvents:"none" }} />
      {/* Top row: label + icon */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
        {icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `${dot}28`,
            border: `1.5px solid ${dot}80`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 2px 8px ${dot}30`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dot} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon}/>
            </svg>
          </div>
        )}
      </div>
      {/* Value */}
      <div style={{ fontSize: 28, fontWeight: 800, color: active ? dot : T.ink, fontFamily: F, letterSpacing: "-1px", lineHeight: 1, marginBottom: 8 }}>{value}</div>
      {/* Sub + spark */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize: 11, color: active ? dot : T.inkMuted, display: "flex", alignItems: "center", gap: 4 }}>
          <Dot color={dot} size={4} />{sub}
        </div>
        {spark && <Sparkline data={spark} color={dot} />}
      </div>
    </div>
  );
}

function LeadRow({ f, onView, T, todayV }) {
  const over = f.nextFollowUp && f.nextFollowUp < todayV && f.status === "Pending";
  const tod  = f.nextFollowUp === todayV && f.status === "Pending";
  return (
    <div onClick={() => onView(f)}
      style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${T.line}`, cursor: "pointer", transition: "background .1s" }}
      onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Avatar name={f.name} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
        <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
          {f.leadSource && <SourcePill source={f.leadSource} T={T} />}
          {f.cityRegion && <span>{f.cityRegion}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <StatusPill status={f.status} sm T={T} />
        {f.nextFollowUp && f.status === "Pending" && (
          <span style={{ fontSize: 10, color: over ? T.lost.text : tod ? T.pending.text : T.inkMuted, fontWeight: over||tod?700:400, fontFamily: F_MONO }}>
            {over ? "⚠ Overdue" : tod ? "📅 Today" : f.nextFollowUp}
          </span>
        )}
      </div>
      {f.quoteAmount && <div style={{ fontSize: 12, fontWeight: 700, color: T.brand, fontFamily: F_MONO, flexShrink: 0, minWidth: 64, textAlign: "right" }}>{inr(f.quoteAmount)}</div>}
    </div>
  );
}

function ActivityItem({ icon, label, sub, color, T }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

export function Dashboard({ funnels, user, onView, onAdd, statFilter, onStatClick, recentlyViewed, T }) {
  const [listView, setListView] = useState(false);
  const todayV = today();

  const won      = useMemo(() => funnels.filter(f => f.status === "Won"), [funnels]);
  const pending  = useMemo(() => funnels.filter(f => f.status === "Pending"), [funnels]);
  const lost     = useMemo(() => funnels.filter(f => f.status === "Lost"), [funnels]);
  const drop     = useMemo(() => funnels.filter(f => f.status === "Drop"), [funnels]);
  const overdue  = useMemo(() => pending.filter(f => f.nextFollowUp && f.nextFollowUp < todayV), [pending, todayV]);
  const todayFu  = useMemo(() => pending.filter(f => f.nextFollowUp === todayV), [pending, todayV]);
  const wonRev   = useMemo(() => won.reduce((a, f) => a + (Number(f.quoteAmount)||0), 0), [won]);
  const pipeline = useMemo(() => pending.reduce((a, f) => a + (Number(f.quoteAmount)||0), 0), [pending]);
  const wr       = funnels.length ? Math.round(won.length / funnels.length * 100) : 0;

  const srcMap = {};
  funnels.forEach(f => { if (f.leadSource) srcMap[f.leadSource] = (srcMap[f.leadSource]||0)+1; });
  const srcArr = Object.entries(srcMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxSrc = Math.max(...srcArr.map(x=>x[1]),1);

  const topWon  = [...won].sort((a,b)=>(Number(b.quoteAmount)||0)-(Number(a.quoteAmount)||0)).slice(0,5);
  const recent  = [...funnels].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,8);
  const agenda  = [...overdue,...todayFu].slice(0,10);

  // Fake weekly spark data based on won count (visual only)
  const wonSpark = [won.length*0.4,won.length*0.5,won.length*0.6,won.length*0.7,won.length*0.8,won.length*0.9,won.length].map(Math.round);
  const revSpark = wonSpark.map(v=>v*Math.round(wonRev/(won.length||1)));

  const kpis = [
    { label:"Total Leads",    value:funnels.length, sub:"All time",           dot:T.brand,       filterKey:null,      spark:null,    icon:"M4 6h16M4 10h16M4 14h16M4 18h16" },
    { label:"Won Deals",      value:won.length,     sub:`${wr}% win rate`,    dot:T.won.dot,     filterKey:"Won",     spark:wonSpark,icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    { label:"Win Rate",       value:`${wr}%`,       sub:"Conversion rate",    dot:T.brand,       filterKey:null,      spark:null,    icon:"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { label:"Won Revenue",    value:big(wonRev),    sub:"Closed revenue",     dot:T.won.dot,     filterKey:"Won",     spark:null,    icon:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label:"Avg Deal Size",  value:big(won.length?Math.round(wonRev/won.length):0), sub:"Per won deal", dot:T.brand, filterKey:null, spark:null, icon:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { label:"Pipeline",       value:big(pipeline),  sub:"Potential revenue",  dot:T.pending.dot, filterKey:"Pending", spark:null,    icon:"M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" },
    { label:"Overdue",        value:overdue.length, sub:"Follow-ups missed",  dot:T.lost.dot,    filterKey:null,      spark:null,    icon:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { label:"Today Follow-ups",value:todayFu.length,sub:"Due today",         dot:T.pending.dot, filterKey:null,      spark:null,    icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  // Activity feed from recent leads
  const activity = [...funnels]
    .sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""))
    .slice(0,6)
    .map(f => ({
      icon: f.status==="Won"?"🏆":f.status==="Lost"?"❌":f.leadSource==="WhatsApp"?"💬":"📋",
      label: f.name,
      sub: `${f.status} · ${f.leadSource||"—"} · ${f.createdAt?.slice(0,10)||"—"}`,
      color: f.status==="Won"?T.won.dot:f.status==="Lost"?T.lost.dot:T.pending.dot,
    }));

  return (
    <div style={{ padding: "clamp(14px,3vw,20px) clamp(14px,4vw,20px) 32px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 1600, width: "100%" }}>

      {/* ── WELCOME BAR ── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.brand}18, ${T.brandSubtle})`,
        border: `1.5px solid ${T.brand}33`,
        borderRadius: 14,
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, fontFamily: F_BODY }}>
            Welcome back, {user.name.split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 3, fontFamily: F_BODY }}>
            {overdue.length > 0
              ? `You have ${overdue.length} overdue follow-up${overdue.length>1?"s":""} waiting`
              : todayFu.length > 0
              ? `You have ${todayFu.length} follow-up${todayFu.length>1?"s":""} due today`
              : "You're all caught up — great work! 🎉"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => onStatClick("Pending")} style={{
            padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${T.pending.dot}`,
            background: T.pending.bg, color: T.pending.text, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: F_BODY, whiteSpace: "nowrap",
          }}>View Pending</button>
          <button onClick={onAdd} style={{
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: T.brand, color: T.inkInvert, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: F_BODY, whiteSpace: "nowrap",
            boxShadow: `0 2px 8px ${T.brand}44`,
          }}>+ Add Lead</button>
        </div>
      </div>

      {/* ── RECENTLY VIEWED ── */}
      {recentlyViewed?.length>0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Recent</span>
          {recentlyViewed.map(f => (
            <button key={f.id} onClick={() => onView(f)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
              borderRadius: 20, border: `1.5px solid ${T.line}`, background: T.surface,
              cursor: "pointer", flexShrink: 0, fontFamily: F_BODY, fontSize: 12, color: T.inkSub,
              whiteSpace: "nowrap", transition: "all .13s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.brand;e.currentTarget.style.color=T.brand;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line;e.currentTarget.style.color=T.inkSub;}}>
              <Avatar name={f.name} size={16}/>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* ── KPI STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="ek-kpi-grid">
        {kpis.map((k,i) => (
          <KpiCard key={i} {...k} active={statFilter===k.filterKey&&k.filterKey!==null}
            onClick={k.filterKey?()=>onStatClick(k.filterKey):undefined} T={T}/>
        ))}
      </div>

      {/* ── VIEW TOGGLE ── */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden" }}>
          {[{id:false,label:"Cards"},{id:true,label:"List"}].map(v=>(
            <button key={String(v.id)} onClick={()=>setListView(v.id)} style={{
              padding: "5px 14px", fontSize: 12, fontFamily: F_BODY, border: "none", cursor: "pointer",
              background: listView===v.id?T.brand:"transparent",
              color: listView===v.id?T.inkInvert:T.inkSub, fontWeight: listView===v.id?600:400,
              transition: "all .15s",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {listView ? (
        <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowSm }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>All Leads</div>
            <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{funnels.length} total</span>
          </div>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {funnels.length===0
              ? <div style={{ textAlign: "center", padding: "48px", color: T.inkMuted }}>No leads yet</div>
              : [...funnels].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).map(f=><LeadRow key={f.id} f={f} onView={onView} T={T} todayV={todayV}/>)
            }
          </div>
        </div>
      ) : (
        /* ── CARD VIEW ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16 }} className="ek-dash-grid">

          {/* Col 1: Agenda */}
          <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowSm }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>📅 Today's Agenda</div>
                <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>
                  {overdue.length>0&&<span style={{ color: T.lost.text, fontWeight: 700 }}>{overdue.length} overdue · </span>}
                  {todayFu.length} due today
                </div>
              </div>
              {overdue.length>0&&(
                <span style={{ fontSize: 10, fontWeight: 700, background: T.lost.bg, color: T.lost.text, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.lost.dot}33` }}>
                  ⚠ {overdue.length}
                </span>
              )}
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {agenda.length===0?(
                <div style={{ textAlign: "center", padding: "40px 24px" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>All caught up!</div>
                  <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 4 }}>No follow-ups today</div>
                </div>
              ):agenda.map(f=><LeadRow key={f.id} f={f} onView={onView} T={T} todayV={todayV}/>)}
            </div>
          </div>

          {/* Col 2: Recent leads */}
          <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadowSm }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>🆕 Recent Leads</div>
              <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>Last {recent.length}</span>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {recent.map(f=><LeadRow key={f.id} f={f} onView={onView} T={T} todayV={todayV}/>)}
            </div>
          </div>

          {/* Col 3: Widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Conversion donut */}
            <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, padding: "16px 18px", boxShadow: T.shadowSm }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F_MONO, marginBottom: 12 }}>Conversion</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke={T.surfaceEl} strokeWidth="10"/>
                  <circle cx="36" cy="36" r="28" fill="none" stroke={T.won.dot} strokeWidth="10"
                    strokeDasharray={`${wr*1.758} ${175.8}`} strokeDashoffset="43.95" strokeLinecap="round"/>
                  <text x="36" y="36" textAnchor="middle" fontSize="14" fontWeight="800" fill={T.ink} fontFamily={F} dominantBaseline="central">{wr}%</text>
                  <text x="36" y="50" textAnchor="middle" fontSize="8" fill={T.inkMuted} fontFamily={F}>win rate</text>
                </svg>
                <div style={{ flex: 1 }}>
                  {[{l:"Won",n:won.length,c:T.won.dot},{l:"Pending",n:pending.length,c:T.pending.dot},{l:"Lost",n:lost.length,c:T.lost.dot},{l:"Drop",n:drop.length,c:T.drop.dot}].map(s=>(
                    <div key={s.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: F, marginBottom: 6, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Dot color={s.c} size={6}/>{s.l}</div>
                      <strong style={{ color: s.c, fontFamily: F_MONO }}>{s.n}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead sources */}
            <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, padding: "16px 18px", boxShadow: T.shadowSm }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F_MONO, marginBottom: 12 }}>Lead Sources</div>
              {srcArr.length===0
                ? <div style={{ fontSize: 12, color: T.inkMuted }}>No data yet</div>
                : srcArr.map(([src,n],i)=>(
                  <div key={src} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: T.ink, fontWeight: 500 }}>{src}</span>
                      <span style={{ fontFamily: F_MONO, fontWeight: 700, color: T.brand }}>{n}</span>
                    </div>
                    <div style={{ height: 5, background: T.surfaceEl, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.round(n/maxSrc*100)}%`, height: "100%", background: [T.brand,T.won.dot,T.pending.dot,T.lost.dot,T.inkMuted][i%5], borderRadius: 3, transition: "width .8s ease" }}/>
                    </div>
                  </div>
                ))}
            </div>

            {/* Activity feed */}
            {activity.length>0&&(
              <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, padding: "16px 18px", boxShadow: T.shadowSm }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F_MONO, marginBottom: 10 }}>Recent Activity</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {activity.map((a,i)=>(
                    <div key={i} style={{ borderBottom: i<activity.length-1?`1px solid ${T.line}`:"none", paddingBottom: i<activity.length-1?8:0, marginBottom: i<activity.length-1?8:0 }}>
                      <ActivityItem {...a} T={T}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top won deals */}
            {topWon.length>0&&(
              <div style={{ background: T.surface, border: `1.5px solid ${T.won.dot}44`, borderRadius: 14, padding: "16px 18px", boxShadow: T.shadowSm }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.won.text, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F_MONO, marginBottom: 12 }}>🏆 Top Won Deals</div>
                {topWon.map((f,i)=>(
                  <div key={f.id} onClick={()=>onView(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i<topWon.length-1?`1px solid ${T.line}`:"none", cursor: "pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.72"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.won.dot, fontFamily: F_MONO, minWidth: 18 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{f.enquiryType||"—"}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.won.dot, fontFamily: F_MONO }}>{inr(f.quoteAmount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
