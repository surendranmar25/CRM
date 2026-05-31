import React, { useMemo, useState, useEffect } from "react";
import { F, F_MONO, F_BODY } from "../../theme/index.js";
import { Dot, Avatar, StatusPill, SourcePill, Ic, P } from "../ui/index.jsx";
import { big, inr, today } from "../../utils.js";

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data = [], color, height = 30, width = 72 }) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const lastPt = pts.split(" ").pop().split(",");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color}/>
    </svg>
  );
}

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
function MiniBarChart({ data, color, T }) {
  if (!data.length) return null;
  const maxV = Math.max(...data.map(d => d.value), 1);
  const W = 420, H = 80, padB = 20, barW = W / data.length * 0.6, gap = W / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.3"/>
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = d.value ? ((d.value / maxV) * (H - padB - 6)) : 2;
        const x = i * gap + gap * 0.2;
        const y = H - padB - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill="url(#barGrad)"/>
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill={T.inkMuted} fontFamily={F_MONO}>{d.label}</text>
            {d.value > 0 && barH > 14 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill={color} fontFamily={F_MONO} fontWeight="700">{big(d.value)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, dot, spark, onClick, active, icon, T, change }) {
  const [hov, setHov] = useState(false);
  const isPositive = change > 0;
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active ? `${dot}08` : T.surface,
        border: `1.5px solid ${active ? dot : hov && onClick ? T.lineMid : T.line}`,
        borderRadius: 14, padding: "18px 20px 16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all .18s", position: "relative", overflow: "hidden",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 4px 20px ${dot}20` : hov && onClick ? T.shadowLg : T.shadowSm,
        animation: "fadeUp .3s ease both",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: dot, opacity: active ? 1 : 0.3, borderRadius: "14px 14px 0 0" }}/>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${dot}14`, pointerEvents: "none" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? dot : `${dot}20`, border: `1.5px solid ${dot}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : dot} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: active ? dot : T.ink, fontFamily: F, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 8 }}>{value}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Dot color={dot} size={4}/>
            <span style={{ fontSize: 11, color: T.inkMuted }}>{sub}</span>
            {change !== undefined && (
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F_MONO, color: isPositive ? "#10b981" : change < 0 ? "#ef4444" : T.inkMuted, marginLeft: 4 }}>
                {isPositive ? "↑" : change < 0 ? "↓" : ""}{Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        {spark && <Sparkline data={spark} color={dot}/>}
      </div>
    </div>
  );
}

// ─── LEAD ROW ──────────────────────────────────────────────────────────────────
function LeadRow({ f, onView, T, todayV, index }) {
  const over = f.nextFollowUp && f.nextFollowUp < todayV && f.status === "Pending";
  const tod  = f.nextFollowUp === todayV && f.status === "Pending";
  return (
    <div onClick={() => onView(f)}
      style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 16px", borderBottom: `1px solid ${T.line}`, cursor: "pointer", transition: "background .12s", animation: `fadeUp .25s ease ${index*0.04}s both` }}
      onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Avatar name={f.name} size={34}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{f.name}</div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
          {f.leadSource && <SourcePill source={f.leadSource} T={T}/>}
          {f.enquiryType && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: T.brandSubtle, color: T.brand, fontFamily: F_MONO, fontWeight: 600 }}>{f.enquiryType}</span>}
          {f.cityRegion && <span style={{ fontSize: 10, color: T.inkMuted }}>{f.cityRegion}</span>}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <StatusPill status={f.status} sm T={T}/>
        {f.nextFollowUp && f.status === "Pending" && (
          <span style={{ fontSize: 10, fontWeight: 600, fontFamily: F_MONO, color: over ? T.lost.text : tod ? T.pending.text : T.inkMuted }}>
            {over ? "⚠ Overdue" : tod ? "📅 Today" : f.nextFollowUp}
          </span>
        )}
      </div>
      {f.quoteAmount && <div style={{ fontSize: 12, fontWeight: 700, color: T.brand, fontFamily: F_MONO, flexShrink: 0, minWidth: 60, textAlign: "right" }}>{inr(f.quoteAmount)}</div>}
    </div>
  );
}

// ─── REVENUE FORECAST ─────────────────────────────────────────────────────────
function RevenueForecast({ funnels, T }) {
  const todayV = today();
  const winRate = useMemo(() => {
    const total = funnels.length;
    const won = funnels.filter(f => f.status === "Won").length;
    return total > 0 ? won / total : 0.25;
  }, [funnels]);

  const currentMonthKey = todayV.slice(0, 7);
  const pending = funnels.filter(f => f.status === "Pending");
  const won = funnels.filter(f => f.status === "Won");

  // Next 3 months forecast buckets
  const forecasts = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const isCurrentMonth = offset === 0;

      // Won revenue this month
      const wonRev = won.filter(f => {
        try { return new Date(f.createdAt).toISOString().slice(0, 7) === mKey; } catch { return false; }
      }).reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);

      // Pending pipeline for follow-ups in this month
      const pipelineRev = pending
        .filter(f => f.nextFollowUp && f.nextFollowUp.slice(0, 7) === mKey)
        .reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);

      const forecastRev = wonRev + pipelineRev * winRate;
      return { label, mKey, wonRev, pipelineRev, forecastRev, isCurrentMonth };
    });
  }, [funnels, winRate]);

  return (
    <div className="ek-card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Revenue Forecast</div>
          <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>Next 3 months · {Math.round(winRate * 100)}% win rate</div>
        </div>
        <div style={{ fontSize: 11, color: T.inkMuted, background: T.surfaceEl, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.line}` }}>
          Win rate: {Math.round(winRate * 100)}%
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {forecasts.map((fc) => (
          <div key={fc.mKey} style={{ flex: 1, background: fc.isCurrentMonth ? T.brandSubtle : T.bg, border: `1.5px solid ${fc.isCurrentMonth ? T.brand + "44" : T.line}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: fc.isCurrentMonth ? T.brand : T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {fc.label}{fc.isCurrentMonth ? " (Now)" : ""}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: fc.isCurrentMonth ? T.brand : T.ink, letterSpacing: "-0.5px", marginBottom: 6 }}>{big(fc.forecastRev)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.inkMuted }}>
                <span>Won</span><span style={{ color: T.won.dot, fontWeight: 600 }}>{big(fc.wonRev)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.inkMuted }}>
                <span>Pipeline</span><span style={{ color: T.pending.dot, fontWeight: 600 }}>{big(fc.pipelineRev)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WIN/LOSS ANALYSIS ────────────────────────────────────────────────────────
function WinLossAnalysis({ funnels, T }) {
  const lost = funnels.filter(f => f.status === "Lost" && f.lostDropReason);
  const drop = funnels.filter(f => f.status === "Drop" && f.lostDropReason);
  const all = [...lost, ...drop];

  // Group by reason keywords
  const reasonGroups = useMemo(() => {
    const keywords = [
      { key: "price", label: "Price too high", match: ["price", "costly", "expensive", "budget", "cost"] },
      { key: "competitor", label: "Went to competitor", match: ["competitor", "other", "elsewhere", "different", "someone else"] },
      { key: "timing", label: "Timing / Not ready", match: ["time", "timing", "not ready", "later", "delay", "postpone"] },
      { key: "quality", label: "Quality concern", match: ["quality", "product", "spec", "feature"] },
      { key: "no_response", label: "No response", match: ["no response", "not responding", "unreachable", "disconnected"] },
      { key: "other", label: "Other", match: [] },
    ];

    const groups = keywords.map(k => ({ ...k, count: 0, revenue: 0, items: [] }));

    all.forEach(f => {
      const r = (f.lostDropReason || "").toLowerCase();
      let matched = false;
      for (let i = 0; i < groups.length - 1; i++) {
        if (groups[i].match.some(m => r.includes(m))) {
          groups[i].count++;
          groups[i].revenue += Number(f.quoteAmount) || 0;
          groups[i].items.push(f);
          matched = true;
          break;
        }
      }
      if (!matched) {
        groups[groups.length - 1].count++;
        groups[groups.length - 1].revenue += Number(f.quoteAmount) || 0;
        groups[groups.length - 1].items.push(f);
      }
    });

    return groups.filter(g => g.count > 0).sort((a, b) => b.count - a.count);
  }, [all]);

  const totalLost = all.length;
  const totalRevLost = all.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);

  if (totalLost === 0) return (
    <div className="ek-card" style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Win/Loss Analysis</div>
      <div style={{ textAlign: "center", padding: "24px 0", color: T.inkMuted, fontSize: 12 }}>No lost deals with recorded reasons yet.</div>
    </div>
  );

  const colors = ["#ef4444", "#f59e0b", "#6366f1", "#10b981", "#ec4899", "#6b7280"];

  return (
    <div className="ek-card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Win/Loss Analysis</div>
          <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>Lost revenue: {big(totalRevLost)}</div>
        </div>
        <div style={{ background: T.lost.bg, color: T.lost.text, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.lost.dot}33` }}>
          {totalLost} lost deal{totalLost !== 1 ? "s" : ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reasonGroups.map((g, i) => {
          const pct = Math.round(g.count / totalLost * 100);
          return (
            <div key={g.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Dot color={colors[i] || "#6b7280"} size={7}/>
                  <span style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>{g.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{big(g.revenue)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: F_MONO, width: 28, textAlign: "right" }}>{g.count}</span>
                  <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, width: 28, textAlign: "right" }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 5, background: T.surfaceEl, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: colors[i] || "#6b7280", borderRadius: 4, transition: "width .6s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
export function Dashboard({ funnels, user, onView, onAdd, statFilter, onStatClick, recentlyViewed = [], T }) {
  const todayV = today();

  const won     = funnels.filter(f => f.status === "Won");
  const pending = funnels.filter(f => f.status === "Pending");
  const lost    = funnels.filter(f => f.status === "Lost");
  const total   = funnels.length;
  const wr      = total ? Math.round(won.length / total * 100) : 0;
  const revenue = won.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
  const pipeline = pending.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
  const overdue  = pending.filter(f => f.nextFollowUp && f.nextFollowUp < todayV);
  const todayDue = pending.filter(f => f.nextFollowUp === todayV);
  const avgDeal  = won.length ? revenue / won.length : 0;

  const recent = useMemo(() =>
    [...funnels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [funnels]);

  const todayList = useMemo(() =>
    pending.filter(f => f.nextFollowUp === todayV).slice(0, 6),
    [pending, todayV]);

  const monthlyRevenue = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", { month: "short" });
      const value = funnels
        .filter(f => { try { return new Date(f.createdAt).toISOString().slice(0, 7) === key && f.status === "Won"; } catch { return false; } })
        .reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
      months.push({ label, value, key });
    }
    return months;
  }, [funnels]);

  const upcomingDays = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleString("en-IN", { weekday: "short", day: "numeric" });
      const count = pending.filter(f => f.nextFollowUp === key).length;
      if (count > 0) result.push({ label, count, key, isToday: i === 0 });
    }
    return result;
  }, [pending]);

  const topCustomers = useMemo(() =>
    [...funnels].filter(f => f.quoteAmount).sort((a, b) => (Number(b.quoteAmount) || 0) - (Number(a.quoteAmount) || 0)).slice(0, 5),
    [funnels]);

  // Enhanced source data with conversion rates
  const sourceData = useMemo(() => {
    const map = {};
    funnels.forEach(f => {
      if (!f.leadSource) return;
      if (!map[f.leadSource]) map[f.leadSource] = { total: 0, won: 0, revenue: 0 };
      map[f.leadSource].total++;
      if (f.status === "Won") { map[f.leadSource].won++; map[f.leadSource].revenue += Number(f.quoteAmount) || 0; }
    });
    return Object.entries(map)
      .map(([src, d]) => ({ src, ...d, rate: d.total > 0 ? Math.round(d.won / d.total * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [funnels]);

  const kpis = [
    { label: "Total Leads", value: total, sub: "All time", dot: T.brand, icon: P.list, spark: [3,5,4,7,6,9,8,11,total], onClick: () => onStatClick(null), active: !statFilter },
    { label: "Won", value: won.length, sub: `${wr}% win rate`, dot: T.won.dot, icon: P.award, spark: [1,2,1,3,2,4,3,5,won.length], onClick: () => onStatClick("Won"), active: statFilter === "Won" },
    { label: "Pipeline", value: big(pipeline), sub: "Active pipeline", dot: T.pending.dot, icon: P.bolt, spark: [8,12,9,15,11,18,14,pipeline/1000||10], onClick: () => onStatClick("Pending"), active: statFilter === "Pending" },
    { label: "Revenue", value: big(revenue), sub: "Closed revenue", dot: T.won.dot, icon: P.trend, spark: [5,8,6,10,9,13,11,revenue/1000||8], onClick: () => onStatClick("Won"), active: false },
  ];

  const quickMetrics = [
    { label: "Avg Deal Size", value: avgDeal > 0 ? big(avgDeal) : "—", icon: "💰" },
    { label: "Win Rate", value: `${wr}%`, icon: "🎯" },
    { label: "Overdue", value: overdue.length || "0", icon: "⚠️", alert: overdue.length > 0 },
    { label: "Top Source", value: sourceData[0]?.src || "—", icon: "📡" },
    { label: "Lost Deals", value: lost.length || "0", icon: "📉" },
    { label: "Today Follow-ups", value: todayDue.length || "0", icon: "📅" },
  ];

  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hour      = now.getHours();
  const greeting  = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : hour < 21 ? "Good Evening" : "Good Night";
  const greetIcon = hour < 12 ? "🌅" : hour < 17 ? "☀️" : hour < 21 ? "🌆" : "🌙";
  const timeStr   = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr   = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div style={{ padding: "clamp(14px,3vw,24px) clamp(14px,4vw,28px)", fontFamily: F_BODY }}>

      {/* ── WELCOME BANNER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: T.surface, border: `1.5px solid ${T.line}`, borderLeft: `4px solid ${T.brand}`, borderRadius: 14, padding: "16px 22px", marginBottom: 22, boxShadow: T.shadowSm, animation: "fadeUp .3s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg,${T.brand},${T.brand}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: `0 4px 14px ${T.brand}40` }}>
            {greetIcon}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, fontFamily: F, letterSpacing: "-0.4px", lineHeight: 1.2 }}>{greeting}, {firstName}!</div>
            <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 3 }}>{dateStr}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.surfaceEl, borderRadius: 20, border: `1px solid ${T.line}` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.won.dot, boxShadow: `0 0 0 2px ${T.won.dot}30` }}/>
              <span style={{ fontSize: 11, fontFamily: F_MONO, color: T.inkSub, fontWeight: 600 }}>{won.length} won · {wr}% win rate</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, background: T.surfaceEl, borderRadius: 10, padding: "9px 16px", border: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, fontFamily: F_MONO, letterSpacing: "0.02em", lineHeight: 1 }}>{timeStr}</div>
            <div style={{ fontSize: 9, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>Local Time</div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="ek-kpi-grid" style={{ marginBottom: 16 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} T={T}/>)}
      </div>

      {/* ── QUICK METRICS STRIP ── */}
      <div className="ek-quick-metrics">
        {quickMetrics.map((m, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${m.alert ? T.lost.dot+"55" : T.line}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4, animation: `fadeUp .3s ease ${i*0.04}s both`, boxShadow: T.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <span style={{ fontSize: 9, fontFamily: F_MONO, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: m.alert ? T.lost.dot : T.ink, fontFamily: F, letterSpacing: "-0.5px" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── ALERT BAR ── */}
      {(overdue.length > 0 || todayDue.length > 0) && (
        <div style={{ background: overdue.length > 0 ? T.lost.bg : T.pending.bg, border: `1px solid ${overdue.length>0?T.lost.dot:T.pending.dot}33`, borderLeft: `3px solid ${overdue.length>0?T.lost.dot:T.pending.dot}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>{overdue.length > 0 ? "⚠️" : "📅"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: overdue.length>0 ? T.lost.text : T.pending.text }}>
              {overdue.length > 0 ? `${overdue.length} overdue follow-up${overdue.length>1?"s":""}` : `${todayDue.length} follow-up${todayDue.length>1?"s":""} due today`}
            </div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>Review pending leads requiring immediate attention</div>
          </div>
          <button onClick={() => onStatClick("Pending")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: overdue.length>0 ? T.lost.dot : T.pending.dot, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View now →</button>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="ek-dash-grid">

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Recent Leads */}
          <div className="ek-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: "-0.2px" }}>Recent Leads</div>
                <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>Latest {recent.length} entries</div>
              </div>
              {onAdd && (
                <button onClick={onAdd} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.brand}`, background: T.brandSubtle, color: T.brand, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  + Add Lead
                </button>
              )}
            </div>
            <div>
              {recent.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: T.inkMuted, fontSize: 13 }}>No leads yet — add your first lead above.</div>
              ) : recent.map((f, i) => <LeadRow key={f.id} f={f} onView={onView} T={T} todayV={todayV} index={i}/>)}
            </div>
          </div>

          {/* Today's Follow-ups */}
          {todayList.length > 0 && (
            <div className="ek-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: T.pending.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.pending.dot} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={P.calendar}/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Today's Follow-ups</div>
                  <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{todayList.length} due today</div>
                </div>
              </div>
              <div>{todayList.map((f, i) => <LeadRow key={f.id} f={f} onView={onView} T={T} todayV={todayV} index={i}/>)}</div>
            </div>
          )}

          {/* Revenue Trend */}
          {monthlyRevenue.some(m => m.value > 0) && (
            <div className="ek-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Revenue Trend</div>
                  <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>Won revenue · Last 6 months</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.won.dot, fontFamily: F, letterSpacing: "-0.5px" }}>{big(revenue)}</div>
              </div>
              <MiniBarChart data={monthlyRevenue} color={T.won.dot} T={T}/>
            </div>
          )}

          {/* Revenue Forecast */}
          <RevenueForecast funnels={funnels} T={T}/>

          {/* Conversion Funnel */}
          {total > 0 && (
            <div className="ek-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Conversion Funnel</div>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                {[
                  { label: "Total",   n: total,           color: "#5B3BE8", pct: 100 },
                  { label: "Active",  n: pending.length,  color: T.pending.dot, pct: total?Math.round(pending.length/total*100):0 },
                  { label: "Won",     n: won.length,       color: T.won.dot,    pct: total?Math.round(won.length/total*100):0 },
                  { label: "Lost",    n: lost.length,      color: T.lost.dot,   pct: total?Math.round(lost.length/total*100):0 },
                ].map((stage, i, arr) => (
                  <React.Fragment key={stage.label}>
                    <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", background: `${stage.color}10`, borderRadius: 8, border: `1px solid ${stage.color}25`, position: "relative" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: stage.color, fontFamily: F }}>{stage.n}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{stage.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginTop: 2 }}>{stage.pct}%</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: T.inkMuted, fontSize: 14 }}>→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Win/Loss Analysis */}
          <WinLossAnalysis funnels={funnels} T={T}/>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Pipeline Breakdown */}
          <div className="ek-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Pipeline Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Pending", value: pending.length, color: T.pending.dot },
                { label: "Won", value: won.length, color: T.won.dot },
                { label: "Lost", value: lost.length, color: T.lost.dot },
                { label: "Drop", value: funnels.filter(f=>f.status==="Drop").length, color: T.drop?.dot || "#6b7280" },
              ].map(({ label, value, color }) => {
                const pct = total ? Math.round(value / total * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Dot color={color} size={7}/><span style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>{label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: F_MONO }}>{value}</span>
                        <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, width: 28, textAlign: "right" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: T.surfaceEl, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .6s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Follow-ups */}
          {upcomingDays.length > 0 && (
            <div className="ek-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Upcoming Follow-ups</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcomingDays.map(({ label, count, isToday }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 8, background: isToday ? T.pending.bg : T.surfaceEl, border: `1px solid ${isToday ? T.pending.dot+"44" : T.line}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 11 }}>{isToday ? "📅" : "📆"}</span>
                      <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? T.pending.text : T.ink }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? T.pending.dot : T.brand, fontFamily: F_MONO, padding: "1px 8px", borderRadius: 10, background: isToday ? T.pending.dot+"20" : T.brandSubtle }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <div className="ek-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Top Customers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topCustomers.map((f, i) => (
                  <div key={f.id} onClick={() => onView(f)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 9, cursor: "pointer", transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.brandSubtle, color: T.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, fontFamily: F_MONO, flexShrink: 0 }}>{i+1}</div>
                    <Avatar name={f.name} size={28}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{f.status}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.brand, fontFamily: F_MONO, flexShrink: 0 }}>{inr(f.quoteAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Sources with conversion rates */}
          <div className="ek-card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Lead Sources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sourceData.length === 0 ? (
                <div style={{ fontSize: 12, color: T.inkMuted, textAlign: "center", padding: "12px 0" }}>No data yet</div>
              ) : sourceData.map(({ src, total: cnt, won: w, rate }, i) => {
                const pct = funnels.length ? Math.round(cnt / funnels.length * 100) : 0;
                const colors = [T.brand, T.won.dot, T.pending.dot, T.premium?.dot || "#8b5cf6", T.new?.dot || "#06b6d4", "#ec4899"];
                return (
                  <div key={src}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[i] || T.brand, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{src}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: T.won.dot, fontFamily: F_MONO, fontWeight: 700 }}>{rate}% cvr</span>
                        <span style={{ fontSize: 11, fontFamily: F_MONO, color: T.inkMuted }}>{cnt}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: T.surfaceEl, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: colors[i] || T.brand, borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div className="ek-card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Recently Viewed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentlyViewed.slice(0, 5).map((f) => (
                  <div key={f.id} onClick={() => onView(f)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 8px", borderRadius: 8, transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Avatar name={f.name} size={26}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{f.status}</div>
                    </div>
                    {f.quoteAmount && <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, fontFamily: F_MONO, flexShrink: 0 }}>{inr(f.quoteAmount)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
