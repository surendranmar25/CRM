import React, { useState, useEffect, useMemo, useCallback } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Avatar, Ic, P, Btn } from "../ui/index.jsx";
import { big, inr, today } from "../../utils.js";
import { crmService } from "../../services/crmService.js";
import { FULL } from "../../constants.js";

// ─── PERIOD UTILITIES ─────────────────────────────────────────────────────────
function getPeriodBounds(type, anchor) {
  const d = new Date(anchor);
  const fmt = (x) => x.toISOString().split("T")[0];

  if (type === "daily") {
    const s = fmt(d);
    return { start: s, end: s, label: d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) };
  }

  if (type === "weekly") {
    const day  = d.getDay();
    const mon  = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
    return {
      start: fmt(mon), end: fmt(sun),
      label: `${mon.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} – ${sun.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`,
    };
  }

  // monthly
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: fmt(first), end: fmt(last),
    label: d.toLocaleDateString("en-IN", { month:"long", year:"numeric" }),
  };
}

function shiftAnchor(type, anchor, dir) {
  const d = new Date(anchor);
  if (type === "daily")   { d.setDate(d.getDate() + dir); return d; }
  if (type === "weekly")  { d.setDate(d.getDate() + dir * 7); return d; }
  d.setMonth(d.getMonth() + dir); return d;
}

// ─── PROGRESS RING (SVG) ──────────────────────────────────────────────────────
function Ring({ pct, color, size = 56, stroke = 6 }) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - Math.min(pct / 100, 1) * c;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition:"stroke-dashoffset .6s ease" }}/>
    </svg>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function Bar({ value, target, color, T }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div style={{ height:6, background:T.surfaceEl, borderRadius:99, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .7s ease" }}/>
    </div>
  );
}

// ─── STATUS CHIP ──────────────────────────────────────────────────────────────
function StatusChip({ dealPct, revPct, T }) {
  const pct = Math.min(dealPct, revPct);
  if (pct >= 100) return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:T.won.bg, color:T.won.text, border:`1px solid ${T.won.dot}33` }}>✓ Achieved</span>;
  if (pct >= 75)  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:T.pending.bg, color:T.pending.text, border:`1px solid ${T.pending.dot}33` }}>On Track</span>;
  if (pct >= 40)  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:"#fef3c7", color:"#92400e", border:"1px solid #f59e0b33" }}>At Risk</span>;
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:T.lost.bg, color:T.lost.text, border:`1px solid ${T.lost.dot}33` }}>Behind</span>;
}

// ─── SET TARGET MODAL ─────────────────────────────────────────────────────────
function SetTargetModal({ creUsers, periodType, periodStart, periodEnd, periodLabel, existing, setBy, onSave, onClose, T }) {
  const [form, setForm] = useState({
    assignedTo:    existing?.assignedTo    || (creUsers[0]?.name || ""),
    targetDeals:   existing?.targetDeals   || "",
    targetRevenue: existing?.targetRevenue || "",
    notes:         existing?.notes         || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.assignedTo)                    { setErr("Select a team member."); return; }
    if (!form.targetDeals && !form.targetRevenue) { setErr("Set at least one target."); return; }
    setSaving(true);
    try {
      await onSave({ ...form, periodType, periodStart, periodEnd, setBy, targetDeals: Number(form.targetDeals)||0, targetRevenue: Number(form.targetRevenue)||0 });
      onClose();
    } catch { setErr("Failed to save. Please try again."); setSaving(false); }
  };

  const inp = { width:"100%", height:40, borderRadius:9, border:`1.5px solid ${T.line}`, background:T.surfaceEl, color:T.ink, fontSize:13, padding:"0 12px", outline:"none", boxSizing:"border-box", fontFamily:F, transition:"border-color .15s" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:18, width:"100%", maxWidth:440, boxShadow:"0 32px 80px rgba(0,0,0,0.25)", border:`1px solid ${T.lineMid}`, overflow:"hidden", animation:"scaleIn .18s ease" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 18px", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:T.ink, fontFamily:F }}>
              {existing ? "Edit Target" : "Set Target"}
            </div>
            <div style={{ fontSize:11, color:T.inkMuted, marginTop:2, fontFamily:F }}>{periodLabel}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.line}`, background:T.surfaceEl, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={P.close} sz={13} color={T.inkSub}/>
          </button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          {err && <div style={{ padding:"9px 12px", borderRadius:8, background:T.lost.bg, border:`1px solid ${T.lost.dot}44`, fontSize:12, color:T.lost.text, fontFamily:F }}>{err}</div>}

          {/* Team member */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>Team Member *</label>
            <select value={form.assignedTo} onChange={e=>set("assignedTo",e.target.value)} style={{ ...inp, appearance:"none" }}>
              {creUsers.map(u => <option key={u.username} value={u.name}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {/* Targets row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>Target Deals</label>
              <input type="number" min="0" value={form.targetDeals} onChange={e=>set("targetDeals",e.target.value)} placeholder="e.g. 10"
                style={inp} onFocus={e=>e.target.style.borderColor=T.brand} onBlur={e=>e.target.style.borderColor=T.line}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>Target Revenue (₹)</label>
              <input type="number" min="0" value={form.targetRevenue} onChange={e=>set("targetRevenue",e.target.value)} placeholder="e.g. 100000"
                style={inp} onFocus={e=>e.target.style.borderColor=T.brand} onBlur={e=>e.target.style.borderColor=T.line}/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>Notes <span style={{ color:T.inkMuted, fontWeight:400 }}>(optional)</span></label>
            <input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any special instructions…"
              style={inp} onFocus={e=>e.target.style.borderColor=T.brand} onBlur={e=>e.target.style.borderColor=T.line}/>
          </div>
        </div>

        <div style={{ padding:"14px 24px 20px", borderTop:`1px solid ${T.line}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn ghost label="Cancel" onClick={onClose} T={T}/>
          <Btn primary icon={P.check} label={saving ? "Saving…" : "Save Target"} onClick={save} T={T}/>
        </div>
      </div>
    </div>
  );
}

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon, color, T }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, border:`1.5px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>{icon}</div>
      <div>
        <div style={{ fontSize:22, fontWeight:800, color:T.ink, fontFamily:F, letterSpacing:"-0.5px" }}>{value}</div>
        <div style={{ fontSize:11, fontWeight:600, color:T.inkMuted, fontFamily:F_MONO, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:T.inkMuted, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── MAIN TARGETS COMPONENT ───────────────────────────────────────────────────
export function Targets({ funnels, users, user, T }) {
  const [periodType,    setPeriodType]    = useState("monthly");
  const [anchor,        setAnchor]        = useState(new Date());
  const [targets,       setTargets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [filterCRE,     setFilterCRE]    = useState("all");

  const isFull = FULL.includes(user?.role);

  // Load targets from Supabase
  useEffect(() => {
    let cancelled = false;
    crmService.getAllTargets().then(d => { if (!cancelled) { setTargets(d); setLoading(false); } }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const { start, end, label } = useMemo(() => getPeriodBounds(periodType, anchor), [periodType, anchor]);

  const navigate = (dir) => setAnchor(shiftAnchor(periodType, anchor, dir));

  // CRE + Editor users (who can be given targets)
  const targetableUsers = useMemo(() =>
    users.filter(u => u.role === "CRE" || u.role === "Editor"),
    [users]
  );

  // For each CRE compute performance in the selected period
  const performance = useMemo(() => {
    const todayStr = today();
    return targetableUsers.map(cre => {
      const mine = funnels.filter(f => {
        const assigned  = f.assignedTo === cre.name || (!f.assignedTo && f.createdBy === cre.name);
        const created   = (f.createdAt || "").slice(0, 10);
        return assigned && created >= start && created <= end;
      });

      const won        = mine.filter(f => f.status === "Won");
      const pending    = mine.filter(f => f.status === "Pending");
      const wonRev     = won.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
      const pipeline   = pending.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
      const overdue    = pending.filter(f => f.nextFollowUp && f.nextFollowUp < todayStr).length;

      const target     = targets.find(t => t.assignedTo === cre.name && t.periodType === periodType && t.periodStart === start);
      const dealPct    = target?.targetDeals   > 0 ? Math.round((won.length / target.targetDeals)   * 100) : null;
      const revPct     = target?.targetRevenue > 0 ? Math.round((wonRev    / target.targetRevenue)  * 100) : null;

      return { cre, mine, won, pending, wonRev, pipeline, overdue, target, dealPct, revPct };
    })
    .filter(p => filterCRE === "all" || p.cre.name === filterCRE);
  }, [targetableUsers, funnels, targets, start, end, periodType, filterCRE]);

  // Team summary
  const summary = useMemo(() => {
    const totalDeals   = performance.reduce((a, p) => a + p.won.length, 0);
    const totalRev     = performance.reduce((a, p) => a + p.wonRev, 0);
    const totalTarget  = performance.reduce((a, p) => a + (p.target?.targetDeals || 0), 0);
    const revTarget    = performance.reduce((a, p) => a + (p.target?.targetRevenue || 0), 0);
    const achieved     = performance.filter(p => (p.dealPct || 0) >= 100 && (p.revPct || 0) >= 100).length;
    return { totalDeals, totalRev, totalTarget, revTarget, achieved };
  }, [performance]);

  const handleSave = async (data) => {
    const saved = await crmService.upsertTarget({ ...data, setBy: user.name });
    setTargets(prev => {
      const idx = prev.findIndex(t => t.assignedTo === data.assignedTo && t.periodType === data.periodType && t.periodStart === data.periodStart);
      const mapped = { id: saved.id, assignedTo: saved.assigned_to, periodType: saved.period_type, periodStart: saved.period_start, periodEnd: saved.period_end, targetDeals: saved.target_deals, targetRevenue: saved.target_revenue, setBy: saved.set_by, notes: saved.notes || "" };
      return idx >= 0 ? prev.map((t, i) => i === idx ? mapped : t) : [...prev, mapped];
    });
    setShowModal(false);
    setEditTarget(null);
  };

  const handleDelete = async (target) => {
    if (!window.confirm(`Remove target for ${target.assignedTo} this ${periodType}?`)) return;
    await crmService.deleteTarget(target.id);
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  // ── Period type tabs ──
  const PERIOD_TABS = [
    { id:"daily",   label:"Daily"   },
    { id:"weekly",  label:"Weekly"  },
    { id:"monthly", label:"Monthly" },
  ];

  return (
    <div style={{ padding:"clamp(16px,3vw,28px) clamp(16px,4vw,32px)", fontFamily:F, maxWidth:1200, margin:"0 auto" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.ink, margin:"0 0 4px", letterSpacing:"-0.5px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:28 }}>🎯</span> Sales Targets
          </h1>
          <p style={{ margin:0, fontSize:13, color:T.inkMuted }}>Set and track performance targets for your sales team</p>
        </div>
        {isFull && (
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, border:"none", background:T.brand, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 14px ${T.brand}44`, transition:"all .15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 8px 20px ${T.brand}55`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=`0 4px 14px ${T.brand}44`; }}>
            <Ic d={P.plus} sz={14} color="#fff" sw={2.5}/> Set Target
          </button>
        )}
      </div>

      {/* ── PERIOD SELECTOR ── */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        {/* Type tabs */}
        <div style={{ display:"flex", background:T.surfaceEl, borderRadius:10, padding:3, border:`1px solid ${T.line}` }}>
          {PERIOD_TABS.map(tab => (
            <button key={tab.id} onClick={() => { setPeriodType(tab.id); setAnchor(new Date()); }}
              style={{ padding:"6px 16px", borderRadius:8, border:"none", background:periodType===tab.id?T.surface:"transparent", color:periodType===tab.id?T.ink:T.inkMuted, fontSize:12, fontWeight:periodType===tab.id?700:500, cursor:"pointer", transition:"all .15s", boxShadow:periodType===tab.id?T.shadowSm:"none" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.surface, border:`1px solid ${T.line}`, borderRadius:10, padding:"6px 12px" }}>
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:T.inkMuted, display:"flex", alignItems:"center", padding:2 }}>
            <Ic d={P.chevL} sz={14} color={T.inkMuted}/>
          </button>
          <span style={{ fontSize:13, fontWeight:600, color:T.ink, fontFamily:F, minWidth:180, textAlign:"center" }}>{label}</span>
          <button onClick={() => navigate(1)} style={{ background:"none", border:"none", cursor:"pointer", color:T.inkMuted, display:"flex", alignItems:"center", padding:2 }}>
            <Ic d={P.chevR} sz={14} color={T.inkMuted}/>
          </button>
        </div>

        {/* Today shortcut */}
        <button onClick={() => setAnchor(new Date())}
          style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${T.line}`, background:T.surfaceEl, color:T.inkSub, fontSize:12, cursor:"pointer", fontWeight:500 }}>
          Today
        </button>

        {/* CRE filter */}
        <select value={filterCRE} onChange={e => setFilterCRE(e.target.value)}
          style={{ padding:"6px 28px 6px 12px", borderRadius:8, border:`1px solid ${T.line}`, background:T.surfaceEl, color:T.inkSub, fontSize:12, cursor:"pointer", outline:"none", appearance:"none", fontFamily:F, marginLeft:"auto" }}>
          <option value="all">All Team Members</option>
          {targetableUsers.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
        </select>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }} className="ek-kpi-grid">
        <SummaryCard label="Deals Won"     value={summary.totalDeals} sub={summary.totalTarget > 0 ? `of ${summary.totalTarget} target` : "No target set"} icon="🏆" color={T.won.dot} T={T}/>
        <SummaryCard label="Revenue Won"   value={big(summary.totalRev)} sub={summary.revTarget > 0 ? `of ${big(summary.revTarget)} target` : "No target set"} icon="💰" color="#5B3BE8" T={T}/>
        <SummaryCard label="Targets Set"   value={performance.filter(p=>p.target).length} sub={`of ${performance.length} members`} icon="🎯" color={T.pending.dot} T={T}/>
        <SummaryCard label="Goal Achieved" value={summary.achieved} sub={`member${summary.achieved!==1?"s":""} hit target`} icon="✅" color={T.won.dot} T={T}/>
      </div>

      {/* ── TEAM PERFORMANCE CARDS ── */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[1,2,3].map(i => <div key={i} className="ek-skeleton" style={{ height:160, borderRadius:14 }}/>)}
        </div>
      ) : performance.length === 0 ? (
        <div style={{ textAlign:"center", padding:"64px 24px", background:T.surface, borderRadius:16, border:`1px solid ${T.line}` }}>
          <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>No team members found</div>
          <div style={{ fontSize:13, color:T.inkMuted }}>Add CRE users in the Team section to set targets.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {performance.map(({ cre, won, mine, wonRev, pipeline, overdue, target, dealPct, revPct }) => {
            const hasTarget = !!target;
            const dp = dealPct || 0;
            const rp = revPct  || 0;
            const ringColor = dp >= 100 ? T.won.dot : dp >= 60 ? T.pending.dot : T.lost.dot;

            return (
              <div key={cre.username}
                style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"box-shadow .2s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,0.08)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"}>

                {/* Card header */}
                <div style={{ padding:"18px 22px", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <Avatar name={cre.name} size={42}/>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:T.ink, fontFamily:F }}>{cre.name}</div>
                      <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F_MONO, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{cre.role}</div>
                    </div>
                    {hasTarget && <StatusChip dealPct={dp} revPct={rp} T={T}/>}
                    {!hasTarget && <span style={{ fontSize:11, color:T.inkMuted, background:T.surfaceEl, padding:"3px 10px", borderRadius:99, border:`1px solid ${T.line}` }}>No target set</span>}
                  </div>

                  {isFull && (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setEditTarget({ ...target, assignedTo: cre.name }); setShowModal(true); }}
                        style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.brand}`, background:T.brandSubtle, color:T.brand, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .14s" }}>
                        {hasTarget ? "Edit Target" : "Set Target"}
                      </button>
                      {hasTarget && (
                        <button onClick={() => handleDelete(target)}
                          style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.line}`, background:T.surfaceEl, color:T.lost.text, fontSize:12, cursor:"pointer" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding:"18px 22px", display:"grid", gridTemplateColumns:"auto 1fr", gap:20, alignItems:"center" }}>

                  {/* Donut ring showing deal % */}
                  {hasTarget ? (
                    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                      <Ring pct={dp} color={ringColor} size={72} stroke={7}/>
                      <div style={{ position:"absolute", textAlign:"center" }}>
                        <div style={{ fontSize:14, fontWeight:800, color:T.ink, lineHeight:1 }}>{dp}%</div>
                        <div style={{ fontSize:8, color:T.inkMuted, fontFamily:F_MONO, letterSpacing:"0.06em", textTransform:"uppercase" }}>deals</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ width:72, height:72, borderRadius:"50%", background:T.surfaceEl, display:"flex", alignItems:"center", justifyContent:"center", border:`2px dashed ${T.lineMid}`, fontSize:22 }}>🎯</div>
                  )}

                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* Deals row */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:T.inkSub, fontFamily:F }}>Deals Won</span>
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                          <span style={{ fontSize:18, fontWeight:800, color:T.won.dot, fontFamily:F }}>{won.length}</span>
                          {hasTarget && <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>/ {target.targetDeals}</span>}
                          {hasTarget && <span style={{ fontSize:11, fontWeight:700, color:dp>=100?T.won.text:T.inkMuted, fontFamily:F_MONO, marginLeft:4 }}>{dp}%</span>}
                        </div>
                      </div>
                      {hasTarget && <Bar value={won.length} target={target.targetDeals} color={dp>=100?T.won.dot:T.pending.dot} T={T}/>}
                    </div>

                    {/* Revenue row */}
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:T.inkSub, fontFamily:F }}>Won Revenue</span>
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                          <span style={{ fontSize:18, fontWeight:800, color:"#5B3BE8", fontFamily:F }}>{big(wonRev)}</span>
                          {hasTarget && <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>/ {big(target.targetRevenue)}</span>}
                          {hasTarget && <span style={{ fontSize:11, fontWeight:700, color:rp>=100?T.won.text:T.inkMuted, fontFamily:F_MONO, marginLeft:4 }}>{rp}%</span>}
                        </div>
                      </div>
                      {hasTarget && <Bar value={wonRev} target={target.targetRevenue} color={rp>=100?T.won.dot:"#5B3BE8"} T={T}/>}
                    </div>
                  </div>
                </div>

                {/* Stats footer */}
                <div style={{ padding:"12px 22px", borderTop:`1px solid ${T.line}`, background:T.surfaceEl, display:"flex", gap:0 }}>
                  {[
                    { label:"Total Leads",  value:mine.length,   color:T.brand },
                    { label:"Pipeline",     value:big(pipeline), color:T.pending.dot },
                    { label:"Overdue",      value:overdue,       color:T.lost.dot },
                    { label:"Win Rate",     value:`${mine.length?Math.round(won.length/mine.length*100):0}%`, color:T.won.dot },
                  ].map((s, i, arr) => (
                    <div key={s.label} style={{ flex:1, textAlign:"center", padding:"0 8px", borderRight: i<arr.length-1?`1px solid ${T.line}`:"none" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:s.color, fontFamily:F }}>{s.value}</div>
                      <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {target?.notes && (
                  <div style={{ padding:"10px 22px", borderTop:`1px solid ${T.line}`, fontSize:12, color:T.inkSub, fontFamily:F, display:"flex", alignItems:"center", gap:6 }}>
                    <span>📝</span> {target.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SET TARGET MODAL ── */}
      {showModal && (
        <SetTargetModal
          creUsers={targetableUsers}
          periodType={periodType}
          periodStart={start}
          periodEnd={end}
          periodLabel={label}
          existing={editTarget}
          setBy={user.name}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          T={T}
        />
      )}
    </div>
  );
}
