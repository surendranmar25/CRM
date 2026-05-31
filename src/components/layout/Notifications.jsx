import React, { useState, useMemo, useEffect } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Dot, Ic, P, Btn, Avatar } from "../ui/index.jsx";
import { today, big, inr } from "../../utils.js";
import { FULL } from "../../constants.js";
import { TaskNotifPanel } from "./Tasks.jsx";

const TARGETS_KEY = "ek_targets_v1";
function loadTargets() { try { return JSON.parse(localStorage.getItem(TARGETS_KEY) || "{}"); } catch { return {}; } }
function saveTargets(t) { try { localStorage.setItem(TARGETS_KEY, JSON.stringify(t)); } catch {} }

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
export function NotificationCenter({ funnels, user, onView, onClose, T }) {
  const todayV = today();

  const notifications = useMemo(() => {
    const notifs = [];
    const scoped = FULL.includes(user.role)
      ? funnels
      : funnels.filter(f => f.createdBy === user.name || f.assignedTo === user.name);

    scoped.filter(f => f.status === "Pending").forEach(f => {
      if (f.nextFollowUp && f.nextFollowUp < todayV) {
        notifs.push({ type: "overdue", funnel: f, label: `Follow-up overdue since ${f.nextFollowUp}`, color: T.lost });
      } else if (f.nextFollowUp === todayV) {
        notifs.push({ type: "today", funnel: f, label: `Follow-up due today`, color: T.pending });
      } else if (f.nextFollowUp === new Date(Date.now() + 86400000).toISOString().split("T")[0]) {
        notifs.push({ type: "tomorrow", funnel: f, label: `Follow-up due tomorrow`, color: T.new });
      }
    });

    const order = { overdue: 0, today: 1, tomorrow: 2 };
    return notifs.sort((a, b) => order[a.type] - order[b.type]);
  }, [funnels, user, todayV, T]);

  return (
    <div className="ek-notif-panel" style={{ position:"fixed", top:52, right:"clamp(8px,3vw,16px)", width:"min(380px, calc(100vw - 16px))", maxHeight:"min(560px, calc(100dvh - 70px))", background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, boxShadow:T.shadowXl, zIndex:4000, display:"flex", flexDirection:"column", animation:"fadeUp .18s ease" }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontFamily:F }}>Notifications</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{notifications.length} follow-up alert{notifications.length!==1?"s":""}</span>
          <button onClick={onClose} style={{ width:24, height:24, border:`1px solid ${T.line}`, borderRadius:5, background:T.surfaceEl, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={P.close} sz={10} color={T.inkSub} />
          </button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {/* ── Task notifications first ── */}
        <TaskNotifPanel userName={user.name} T={T} onDismiss={onClose} />

        {/* ── Follow-up alerts ── */}
        {notifications.length === 0 && (
          <div style={{ textAlign:"center", padding:"28px 16px", color:T.inkMuted, fontFamily:F }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>All caught up!</div>
            <div style={{ fontSize:12, marginTop:4 }}>No pending follow-ups or task notifications</div>
          </div>
        )}
        {notifications.length > 0 && (
          <div>
            <div style={{ padding:"8px 16px 4px", fontSize:10, fontWeight:700, color:T.inkMuted, fontFamily:F_MONO, textTransform:"uppercase", letterSpacing:"0.08em" }}>Follow-up Alerts</div>
            {notifications.map((n, i) => (
              <div key={i} onClick={() => { onView(n.funnel); onClose(); }}
                style={{ padding:"12px 16px", borderBottom:`1px solid ${T.line}`, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:n.color.dot, flexShrink:0, marginTop:4 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.funnel.name}</div>
                  <div style={{ fontSize:11, color:n.color.text, marginTop:2 }}>{n.label}</div>
                  {n.funnel.assignedTo && <div style={{ fontSize:10, color:T.inkMuted, marginTop:2 }}>→ {n.funnel.assignedTo}</div>}
                </div>
                <span style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, flexShrink:0 }}>{n.funnel.nextFollowUp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SALES TARGETS + FORECAST ─────────────────────────────────────────────────
export function SalesTargets({ funnels, user, T }) {
  const [targets, setTargets] = useState(loadTargets);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ revenue: "", deals: "" });

  const todayV = today();
  const monthKey = todayV.slice(0, 7);
  const monthLabel = new Date(monthKey + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" });

  const monthFunnels = useMemo(() => {
    return funnels.filter(f => {
      try { return new Date(f.createdAt).toISOString().slice(0,7) === monthKey; } catch { return false; }
    });
  }, [funnels, monthKey]);

  const wonThisMonth  = monthFunnels.filter(f => f.status === "Won");
  const actualRev     = wonThisMonth.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
  const actualDeals   = wonThisMonth.length;

  // Pipeline forecast: pending × avg win rate
  const allWon     = funnels.filter(f => f.status === "Won");
  const winRate    = funnels.length ? allWon.length / funnels.length : 0.3;
  const pending    = monthFunnels.filter(f => f.status === "Pending");
  const pendingRev = pending.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
  const forecast   = actualRev + pendingRev * winRate;

  const target = targets[monthKey] || { revenue: 0, deals: 0 };
  const revPct  = target.revenue ? Math.min(Math.round(actualRev / target.revenue * 100), 100) : 0;
  const dealPct = target.deals   ? Math.min(Math.round(actualDeals / target.deals * 100), 100)   : 0;

  const saveTarget = () => {
    const updated = { ...targets, [monthKey]: { revenue: Number(form.revenue) || 0, deals: Number(form.deals) || 0 } };
    setTargets(updated); saveTargets(updated); setEditing(false);
  };

  const barColor = (pct) => pct >= 100 ? T.won.dot : pct >= 60 ? T.pending.dot : T.lost.dot;

  if (!FULL.includes(user.role)) return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F, marginBottom: 10 }}>Monthly Performance · {monthLabel}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: T.won.dot }}>{big(actualRev)}</div><div style={{ fontSize: 11, color: T.inkMuted }}>Won Revenue</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: "#5B3BE8" }}>{actualDeals}</div><div style={{ fontSize: 11, color: T.inkMuted }}>Deals Won</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: T.pending.dot }}>{big(forecast)}</div><div style={{ fontSize: 11, color: T.inkMuted }}>Forecast</div></div>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F }}>
          Monthly Target · {monthLabel}
        </div>
        {!editing && (
          <button onClick={() => { setForm({ revenue: target.revenue || "", deals: target.deals || "" }); setEditing(true); }}
            style={{ fontSize: 12, color: "#5B3BE8", background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 500 }}>
            {target.revenue ? "Edit target" : "Set target"}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, fontFamily: F, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Revenue Target (₹)</label>
            <input type="number" value={form.revenue} onChange={e=>setForm(f=>({...f,revenue:e.target.value}))} placeholder="e.g. 500000"
              style={{ padding:"8px 11px", border:`1px solid ${T.lineMid}`, borderRadius:6, fontSize:13, fontFamily:F, color:T.ink, background:T.surface, outline:"none", width:160 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: T.inkMuted, fontFamily: F, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Deals Target</label>
            <input type="number" value={form.deals} onChange={e=>setForm(f=>({...f,deals:e.target.value}))} placeholder="e.g. 20"
              style={{ padding:"8px 11px", border:`1px solid ${T.lineMid}`, borderRadius:6, fontSize:13, fontFamily:F, color:T.ink, background:T.surface, outline:"none", width:100 }} />
          </div>
          <Btn primary sm label="Save" onClick={saveTarget} T={T} />
          <Btn ghost sm label="Cancel" onClick={() => setEditing(false)} T={T} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {target.revenue > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.ink, fontFamily: F }}>Revenue: {big(actualRev)} / {big(target.revenue)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: barColor(revPct), fontFamily: F }}>{revPct}%</span>
              </div>
              <div style={{ height: 8, background: T.surfaceEl, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${revPct}%`, height: "100%", background: barColor(revPct), borderRadius: 4, transition: "width .8s ease" }} />
              </div>
            </div>
          )}
          {target.deals > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.ink, fontFamily: F }}>Deals: {actualDeals} / {target.deals}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: barColor(dealPct), fontFamily: F }}>{dealPct}%</span>
              </div>
              <div style={{ height: 8, background: T.surfaceEl, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${dealPct}%`, height: "100%", background: barColor(dealPct), borderRadius: 4, transition: "width .8s ease" }} />
              </div>
            </div>
          )}
          {!target.revenue && !target.deals && (
            <div style={{ fontSize: 12, color: T.inkMuted, fontFamily: F }}>No target set for this month. Click "Set target" to add one.</div>
          )}
          {/* Forecast row */}
          <div style={{ display: "flex", gap: 16, paddingTop: 8, borderTop: `1px solid ${T.line}`, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: T.won.dot, fontFamily: F }}>{big(actualRev)}</div><div style={{ fontSize: 11, color: T.inkMuted }}>Won this month</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: T.pending.dot, fontFamily: F }}>{big(pendingRev)}</div><div style={{ fontSize: 11, color: T.inkMuted }}>In pipeline</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: "#5B3BE8", fontFamily: F }}>{big(forecast)}</div><div style={{ fontSize: 11, color: T.inkMuted }}>Forecast ({Math.round(winRate*100)}% win rate)</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
