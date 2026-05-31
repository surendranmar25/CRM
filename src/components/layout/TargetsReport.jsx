import React, { useState, useEffect, useMemo, useCallback } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, Avatar } from "../ui/index.jsx";
import { today, big, inr } from "../../utils.js";
import { crmService } from "../../services/crmService.js";
import { FULL } from "../../constants.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekRange(offset = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = x => x.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function getMonthRange(offset = 0) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + offset;
  const start = new Date(y, m, 1).toISOString().split("T")[0];
  const end = new Date(y, m + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

function getDayRange(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const key = d.toISOString().split("T")[0];
  return { start: key, end: key };
}

function getPeriodLabel(type, start, end) {
  const opts = { day: "numeric", month: "short" };
  if (type === "daily") return new Date(start + "T00:00:00").toLocaleDateString("en-IN", opts);
  if (type === "weekly") {
    const s = new Date(start + "T00:00:00").toLocaleDateString("en-IN", opts);
    const e = new Date(end + "T00:00:00").toLocaleDateString("en-IN", opts);
    return `${s} – ${e}`;
  }
  return new Date(start + "T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getActuals(funnels, assignedTo, start, end) {
  const inRange = funnels.filter(f => {
    if (f.isExisting) return false;
    const who = f.assignedTo || f.createdBy;
    if (who !== assignedTo) return false;
    try {
      const d = new Date(f.createdAt).toISOString().split("T")[0];
      return d >= start && d <= end;
    } catch { return false; }
  });
  const won = inRange.filter(f => f.status === "Won");
  return {
    totalLeads: inRange.length,
    wonDeals: won.length,
    wonRevenue: won.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0),
    pipeline: inRange.filter(f => f.status === "Pending").reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0),
    lostDeals: inRange.filter(f => f.status === "Lost").length,
  };
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ actual, target, color, T, small }) {
  const pct = target > 0 ? Math.min(Math.round(actual / target * 100), 100) : 0;
  const exceed = target > 0 && actual > target;
  const barColor = exceed ? T.won.dot : pct >= 70 ? color || T.brand : pct >= 40 ? T.pending.dot : T.lost.dot;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: small ? 3 : 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: small ? 11 : 12, color: T.ink }}>{big(actual)} <span style={{ color: T.inkMuted }}>/ {big(target)}</span></span>
        <span style={{ fontSize: small ? 11 : 12, fontWeight: 700, color: barColor, fontFamily: F_MONO }}>{pct}%{exceed ? " 🎉" : ""}</span>
      </div>
      <div style={{ height: small ? 5 : 7, background: T.surfaceEl, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width .8s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ─── CRE PERFORMANCE CARD ─────────────────────────────────────────────────────
function CRECard({ cre, actuals, target, periodLabel, onEdit, T, isFullAccess }) {
  const [expanded, setExpanded] = useState(false);
  const hasTarget = target && (target.targetRevenue > 0 || target.targetDeals > 0);
  const revPct = hasTarget && target.targetRevenue > 0 ? Math.min(Math.round(actuals.wonRevenue / target.targetRevenue * 100), 150) : null;
  const dealPct = hasTarget && target.targetDeals > 0 ? Math.min(Math.round(actuals.wonDeals / target.targetDeals * 100), 150) : null;
  const overallScore = revPct !== null || dealPct !== null ? Math.round(((revPct || 0) + (dealPct || 0)) / ((revPct !== null ? 1 : 0) + (dealPct !== null ? 1 : 0))) : null;

  const scoreColor = overallScore === null ? T.brand : overallScore >= 100 ? T.won.dot : overallScore >= 70 ? T.pending.dot : T.lost.dot;
  const scoreLabel = overallScore === null ? "No target" : overallScore >= 100 ? "On target" : overallScore >= 70 ? "On track" : "Needs attention";

  return (
    <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, overflow: "hidden", transition: "box-shadow .15s", boxShadow: T.shadowSm }}>
      {/* Card header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={cre.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{cre.name}</div>
          <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{cre.role} · {periodLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {overallScore !== null && (
            <div style={{ textAlign: "center", background: `${scoreColor}15`, border: `1.5px solid ${scoreColor}40`, borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor, fontFamily: F_MONO, lineHeight: 1 }}>{overallScore}%</div>
              <div style={{ fontSize: 9, color: scoreColor, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{scoreLabel}</div>
            </div>
          )}
          {isFullAccess && (
            <button onClick={() => onEdit(cre)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.brand, fontFamily: F, transition: "all .12s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.brandSubtle}
              onMouseLeave={e => e.currentTarget.style.background = T.surfaceEl}>
              {hasTarget ? "Edit target" : "Set target"}
            </button>
          )}
          <button onClick={() => setExpanded(x => !x)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={expanded ? P.chevU : P.chevD} sz={12} color={T.inkMuted} />
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        {[
          { label: "Total Leads", value: actuals.totalLeads, color: T.brand },
          { label: "Won Deals", value: actuals.wonDeals, color: T.won.dot },
          { label: "Revenue", value: big(actuals.wonRevenue), color: T.won.dot },
          { label: "Pipeline", value: big(actuals.pipeline), color: T.pending.dot },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "12px 16px", borderRight: i < 3 ? `1px solid ${T.line}` : "none", borderBottom: expanded ? `1px solid ${T.line}` : "none" }}>
            <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: F_MONO, letterSpacing: "-0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Expanded targets */}
      {expanded && (
        <div style={{ padding: "16px 20px", background: T.bg }}>
          {!hasTarget ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: T.inkMuted, fontSize: 13 }}>
              No target set for this period.
              {isFullAccess && <button onClick={() => onEdit(cre)} style={{ marginLeft: 8, color: T.brand, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>Set target →</button>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {target.targetRevenue > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, marginBottom: 6 }}>Revenue Target</div>
                  <ProgressBar actual={actuals.wonRevenue} target={target.targetRevenue} color={T.brand} T={T} />
                </div>
              )}
              {target.targetDeals > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, marginBottom: 6 }}>Deals Target</div>
                  <ProgressBar actual={actuals.wonDeals} target={target.targetDeals} color={T.brand} T={T} />
                </div>
              )}
              {target.notes && (
                <div style={{ fontSize: 12, color: T.inkMuted, background: T.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${T.line}` }}>
                  📝 {target.notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SET TARGET MODAL ─────────────────────────────────────────────────────────
function SetTargetModal({ cre, periodType, periodStart, periodEnd, existing, onSave, onClose, T, user }) {
  const [form, setForm] = useState({
    targetRevenue: existing?.targetRevenue || "",
    targetDeals: existing?.targetDeals || "",
    notes: existing?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        assignedTo: cre.name,
        periodType,
        periodStart,
        periodEnd,
        targetRevenue: Number(form.targetRevenue) || 0,
        targetDeals: Number(form.targetDeals) || 0,
        notes: form.notes,
        setBy: user.name,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 8500, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.lineMid}`, width: "min(460px, 100%)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Set Target</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{cre.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
            {periodType.charAt(0).toUpperCase() + periodType.slice(1)} target · {getPeriodLabel(periodType, periodStart, periodEnd)}
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 6 }}>Revenue Target (₹)</label>
            <input type="number" value={form.targetRevenue} onChange={e => setForm(f => ({ ...f, targetRevenue: e.target.value }))}
              placeholder="e.g. 500000"
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${T.lineMid}`, borderRadius: 8, fontSize: 14, fontFamily: F, color: T.ink, background: T.bg, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e => e.target.style.borderColor = T.lineMid}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 6 }}>Deals Target (count)</label>
            <input type="number" value={form.targetDeals} onChange={e => setForm(f => ({ ...f, targetDeals: e.target.value }))}
              placeholder="e.g. 20"
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${T.lineMid}`, borderRadius: 8, fontSize: 14, fontFamily: F, color: T.ink, background: T.bg, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e => e.target.style.borderColor = T.lineMid}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 6 }}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any specific instructions or context…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${T.lineMid}`, borderRadius: 8, fontSize: 13, fontFamily: F, color: T.ink, background: T.bg, outline: "none", resize: "vertical", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e => e.target.style.borderColor = T.lineMid}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.line}`, background: "transparent", cursor: "pointer", fontSize: 13, color: T.inkSub, fontFamily: F }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: T.brand, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: F, opacity: saving ? 0.7 : 1, boxShadow: `0 4px 14px ${T.brand}44` }}>
              {saving ? "Saving…" : "Save Target"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TARGETS REPORT (main export) ─────────────────────────────────────────────
export function TargetsReport({ funnels, users, user, T }) {
  const isFullAccess = FULL.includes(user.role);

  const [periodType, setPeriodType] = useState("monthly");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCre, setEditCre] = useState(null);

  const todayV = today();

  // Period bounds
  const { start: periodStart, end: periodEnd } = useMemo(() => {
    if (periodType === "daily")   return getDayRange(periodOffset);
    if (periodType === "weekly")  return getWeekRange(periodOffset);
    return getMonthRange(periodOffset);
  }, [periodType, periodOffset]);

  const periodLabel = getPeriodLabel(periodType, periodStart, periodEnd);

  // CRE users (people who have leads)
  const creUsers = useMemo(() => {
    if (isFullAccess) {
      return users.filter(u => ["CRE", "Manager", "CEO", "Editor"].includes(u.role));
    }
    return users.filter(u => u.name === user.name);
  }, [users, user, isFullAccess]);

  // Load targets from Supabase
  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.getAllTargets();
      setTargets(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  // Find target for cre + current period
  const findTarget = useCallback((creName) => {
    return targets.find(t =>
      t.assignedTo === creName &&
      t.periodType === periodType &&
      t.periodStart === periodStart
    ) || null;
  }, [targets, periodType, periodStart]);

  const handleSaveTarget = async (targetData) => {
    await crmService.upsertTarget(targetData);
    await loadTargets();
  };

  // Summary stats
  const totalWonRevenue = useMemo(() => {
    return creUsers.reduce((sum, cre) => {
      const a = getActuals(funnels, cre.name, periodStart, periodEnd);
      return sum + a.wonRevenue;
    }, 0);
  }, [creUsers, funnels, periodStart, periodEnd]);

  const totalLeads = useMemo(() => {
    return creUsers.reduce((sum, cre) => {
      const a = getActuals(funnels, cre.name, periodStart, periodEnd);
      return sum + a.totalLeads;
    }, 0);
  }, [creUsers, funnels, periodStart, periodEnd]);

  const totalTargetRevenue = useMemo(() => {
    return creUsers.reduce((sum, cre) => {
      const t = findTarget(cre.name);
      return sum + (t?.targetRevenue || 0);
    }, 0);
  }, [creUsers, findTarget]);

  // Top performer
  const topPerformer = useMemo(() => {
    if (creUsers.length === 0) return null;
    return creUsers.reduce((best, cre) => {
      const a = getActuals(funnels, cre.name, periodStart, periodEnd);
      const bestA = getActuals(funnels, best.name, periodStart, periodEnd);
      return a.wonRevenue > bestA.wonRevenue ? cre : best;
    }, creUsers[0]);
  }, [creUsers, funnels, periodStart, periodEnd]);

  return (
    <div style={{ padding: "20px 24px", fontFamily: F, maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: "-0.5px" }}>
          {isFullAccess ? "Team Targets & Performance" : "My Performance"}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: T.inkMuted }}>
          {isFullAccess ? "Set targets for your team and track their performance" : "Your targets and progress"}
        </p>
      </div>

      {/* Period controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        {/* Period type tabs */}
        <div style={{ display: "flex", background: T.surfaceEl, borderRadius: 10, padding: 3, border: `1px solid ${T.line}`, gap: 2 }}>
          {[["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"]].map(([id, label]) => (
            <button key={id} onClick={() => { setPeriodType(id); setPeriodOffset(0); }}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "none",
                background: periodType === id ? T.brand : "transparent",
                color: periodType === id ? "#fff" : T.inkMuted,
                fontSize: 12, fontWeight: periodType === id ? 700 : 500,
                cursor: "pointer", fontFamily: F, transition: "all .14s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPeriodOffset(o => o - 1)}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={P.chevL} sz={13} color={T.inkMuted} />
          </button>
          <div style={{ minWidth: 160, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{periodLabel}</div>
            {periodOffset === 0 && <div style={{ fontSize: 10, color: T.brand, fontFamily: F_MONO }}>CURRENT</div>}
          </div>
          <button onClick={() => setPeriodOffset(o => o + 1)} disabled={periodOffset >= 0}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: periodOffset >= 0 ? "not-allowed" : "pointer", opacity: periodOffset >= 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={P.chevR} sz={13} color={T.inkMuted} />
          </button>
          {periodOffset !== 0 && (
            <button onClick={() => setPeriodOffset(0)}
              style={{ padding: "4px 12px", borderRadius: 8, border: `1px solid ${T.brand}`, background: T.brandSubtle, color: T.brand, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: F }}>
              Current
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {isFullAccess && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Team Revenue", value: big(totalWonRevenue), sub: totalTargetRevenue > 0 ? `of ${big(totalTargetRevenue)} target` : "No target set", color: T.won.dot },
            { label: "Total Leads", value: totalLeads, sub: `${periodLabel}`, color: T.brand },
            { label: "Team Members", value: creUsers.length, sub: "tracked", color: "#5B3BE8" },
            { label: "Top Performer", value: topPerformer?.name?.split(" ")[0] || "—", sub: topPerformer ? `${big(getActuals(funnels, topPerformer.name, periodStart, periodEnd).wonRevenue)} won` : "", color: T.pending.dot },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 12, padding: "14px 18px", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.inkMuted }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* CRE cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: T.inkMuted }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${T.line}`, borderTopColor: T.brand, animation: "spin .8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {creUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: T.inkMuted }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>No team members found</div>
              <div style={{ fontSize: 13, marginTop: 5 }}>Add CRE users in the Team section</div>
            </div>
          ) : (
            creUsers.map(cre => {
              const actuals = getActuals(funnels, cre.name, periodStart, periodEnd);
              const target = findTarget(cre.name);
              return (
                <CRECard
                  key={cre.id || cre.name}
                  cre={cre}
                  actuals={actuals}
                  target={target}
                  periodLabel={periodLabel}
                  onEdit={setEditCre}
                  T={T}
                  isFullAccess={isFullAccess}
                />
              );
            })
          )}
        </div>
      )}

      {/* Set target modal */}
      {editCre && (
        <SetTargetModal
          cre={editCre}
          periodType={periodType}
          periodStart={periodStart}
          periodEnd={periodEnd}
          existing={findTarget(editCre.name)}
          onSave={handleSaveTarget}
          onClose={() => setEditCre(null)}
          T={T}
          user={user}
        />
      )}
    </div>
  );
}
