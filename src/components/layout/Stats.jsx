import React, { useState } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Dot, Ic, P } from "../ui/index.jsx";
import { big, inr } from "../../utils.js";

export function Stats({ funnels, activeStatFilter, onStatClick, T }) {
  const won     = funnels.filter(f => f.status === "Won");
  const pending = funnels.filter(f => f.status === "Pending");
  const lost    = funnels.filter(f => f.status === "Lost");
  const drop    = funnels.filter(f => f.status === "Drop");
  const total   = funnels.length;
  const wr      = total ? Math.round(won.length / total * 100) : 0;
  const revenue = won.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
  const pipeline= pending.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);

  const avgDeal = won.length ? Math.round(revenue / won.length) : 0;

  const cards = [
    { label: "Total Leads",  value: total,          caption: "All time",                accent: T.brand,       icon: P.list,     filterKey: null },
    { label: "Won",          value: won.length,     caption: `${wr}% win rate`,          accent: T.won.dot,     icon: P.award,    filterKey: "Won" },
    { label: "Pending",      value: pending.length, caption: "Need follow-up",           accent: T.pending.dot, icon: P.clock,    filterKey: "Pending" },
    { label: "Lost",         value: lost.length,    caption: "Closed lost",              accent: T.lost.dot,    icon: P.close,    filterKey: "Lost" },
    { label: "Drop",         value: drop.length,    caption: "Dropped",                  accent: T.drop.dot,    icon: P.arrowR,   filterKey: "Drop" },
    { label: "Revenue",      value: big(revenue),   caption: "Closed revenue",           accent: T.won.dot,     icon: P.trend,    filterKey: "Won" },
    { label: "Pipeline",     value: big(pipeline),  caption: `Avg deal: ${big(avgDeal)}`, accent: T.pending.dot, icon: P.bolt,    filterKey: "Pending" },
  ];

  return (
    <div style={{ padding: "clamp(12px,2.5vw,16px) clamp(12px,4vw,24px) 12px", borderBottom: `1px solid ${T.line}`, background: T.surface }}>
      {/* Row 1: 4 cards */}
      <div className="ek-stats-row1" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 12 }}>
        {cards.slice(0,4).map((c, i) => {
          const active = activeStatFilter === c.filterKey && c.filterKey !== null;
          return (
            <StatCard key={i} {...c} active={active} onClick={() => onStatClick(c.filterKey)} T={T} delay={i * 0.03} />
          );
        })}
      </div>
      {/* Row 2: 3 cards (narrower) */}
      <div className="ek-stats-row2" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        {cards.slice(4).map((c, i) => {
          const active = activeStatFilter === c.filterKey && c.filterKey !== null;
          return (
            <StatCard key={i+4} {...c} active={active} onClick={() => onStatClick(c.filterKey)} T={T} delay={(i+4) * 0.03} />
          );
        })}
      {activeStatFilter && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.brand }} />
          <span style={{ fontFamily: F_MONO, fontSize: 11, color: T.inkMuted }}>
            Filtering: <strong style={{ color: T.ink }}>{activeStatFilter}</strong> leads
          </span>
          <button onClick={() => onStatClick(null)} style={{
            fontFamily: F_MONO, fontSize: 11, color: T.brand,
            background: T.brandSubtle, border: `1px solid ${T.brand}33`,
            borderRadius: 5, cursor: "pointer", padding: "2px 9px", fontWeight: 600,
          }}>Clear filter ×</button>
        </div>
      )}
    </div>
  </div>
  );
}

function StatCard({ label, value, caption, accent, icon, filterKey, active, onClick, T, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="ek-stat-card"
      style={{
        background: T.surface,
        border: `1.5px solid ${active ? accent : hov && filterKey ? T.lineMid : T.line}`,
        borderRadius: 12, padding: "20px 18px 16px",
        cursor: filterKey ? "pointer" : "default",
        position: "relative", overflow: "hidden",
        boxShadow: active ? `0 4px 16px ${accent}20` : T.shadowSm,
        animation: `fadeUp .3s ease ${delay}s both`,
        transition: "border-color .15s, box-shadow .2s, transform .15s",
        transform: hov && filterKey ? "translateY(-2px)" : "none",
      }}>
      {/* Colored accent background blob */}
      <div style={{
        position: "absolute", top: -24, right: -24,
        width: 90, height: 90, borderRadius: "50%",
        background: `${accent}28`,
        pointerEvents: "none",
      }} />

      {/* Top: icon bubble + active dot */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: `${accent}30`,
          border: `1.5px solid ${accent}70`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 2px 8px ${accent}25`,
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        {active && (
          <div style={{ fontSize: 9, fontFamily: F_MONO, fontWeight: 700, color: accent, background: `${accent}15`, padding: "2px 7px", borderRadius: 10, border: `1px solid ${accent}30`, letterSpacing: "0.06em" }}>
            ACTIVE
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ fontFamily: F_BODY, fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: "-0.8px", lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>

      {/* Label */}
      <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: T.inkMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
        {label}
      </div>

      {/* Caption */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Dot color={accent} size={5} />
        <span style={{ fontFamily: F_MONO, fontSize: 9.5, color: active ? accent : T.inkMuted, letterSpacing: "0.04em" }}>
          {active ? "Currently filtered" : caption}
        </span>
      </div>
    </div>
  );
}
