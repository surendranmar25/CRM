import React, { useState, useMemo, useRef } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Dot, Btn, Avatar, StatusPill, SourcePill, inputSx, mkFocus, mkBlur } from "../ui/index.jsx";
import { FULL, VIEWER, STATUS } from "../../constants.js";
import { today, stamp, inr } from "../../utils.js";
import { PhoneActionModal } from "./PhoneActionModal.jsx";
import { InvoiceModal } from "./InvoiceModal.jsx";

// ─── LEAD SCORING ─────────────────────────────────────────────────────────────
function calcScore(funnel) {
  let score = 0;
  if (funnel.quoteAmount > 100000) score += 25;
  else if (funnel.quoteAmount > 50000) score += 15;
  else if (funnel.quoteAmount > 10000) score += 8;
  if (funnel.email) score += 10;
  if (funnel.phone) score += 10;
  if (funnel.orderNumber) score += 20;
  const src = funnel.leadSource;
  if (src === "Referral" || src === "Existing Customer") score += 15;
  else if (src === "Google Ads" || src === "Partner") score += 10;
  const age = funnel.createdAt ? Math.floor((Date.now() - new Date(funnel.createdAt)) / 86400000) : 99;
  if (age < 3) score += 10;
  else if (age > 30) score -= 10;
  if (funnel.funnelType === "High Value" || funnel.funnelType === "Enterprise") score += 10;
  return Math.max(0, Math.min(100, score));
}

function ScoreBadge({ score, T }) {
  const color = score >= 70 ? T.won.dot : score >= 40 ? T.pending.dot : T.lost.dot;
  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return (
    <div title={`Lead score: ${score}/100`} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${color}15`, border: `1px solid ${color}40`, cursor: "default" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: F_MONO, letterSpacing: "0.06em" }}>
        {label.toUpperCase()} · {score}
      </span>
    </div>
  );
}

// ─── ACTIVITY TIMELINE ────────────────────────────────────────────────────────
function ActivityTimeline({ funnel, comments, followupLogs, T }) {
  const events = useMemo(() => {
    const list = [];

    // Creation event
    list.push({
      type: "created",
      time: funnel.createdAt,
      label: `Lead created by ${funnel.createdBy || "unknown"}`,
      icon: "🌱",
      color: T.brand,
    });

    // Follow-up logs
    followupLogs.forEach(log => {
      list.push({
        type: "followup",
        time: log.loggedAt,
        rawTime: log.loggedAt,
        label: `Follow-up logged by ${log.loggedBy}`,
        detail: log.customerResponse,
        outcome: log.outcome,
        nextFollowUp: log.nextFollowUp,
        icon: "📅",
        color: T.pending.dot,
      });
    });

    // Comments
    comments.forEach(c => {
      list.push({
        type: "comment",
        time: c.time,
        label: `Comment by ${c.author} (${c.role})`,
        detail: c.text,
        icon: "💬",
        color: T.brand,
        author: c.author,
        role: c.role,
      });
    });

    // Status — if won/lost/drop, infer from last change
    if (funnel.status !== "Pending") {
      list.push({
        type: "status",
        time: null,
        label: `Status changed to ${funnel.status}`,
        detail: funnel.lostDropReason || null,
        icon: funnel.status === "Won" ? "🏆" : funnel.status === "Lost" ? "❌" : "⛔",
        color: funnel.status === "Won" ? T.won.dot : funnel.status === "Lost" ? T.lost.dot : T.drop.dot,
      });
    }

    // Sort by time descending (newest first), nulls last
    return list.sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return new Date(b.time) - new Date(a.time);
    });
  }, [funnel, comments, followupLogs, T]);

  const outcomeColors = {
    "Interested": T.won, "Order Confirmed": T.won,
    "Needs Time": T.pending, "Callback Requested": T.pending, "Rescheduled": T.pending,
    "Not Interested": T.lost, Other: T.drop
  };

  if (events.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: T.inkMuted, fontSize: 13 }}>No activity yet</div>
  );

  return (
    <div style={{ position: "relative", paddingBottom: 8 }}>
      <div style={{ position: "absolute", left: 15, top: 8, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${T.brand}40, transparent)`, borderRadius: 2 }} />
      {events.map((ev, i) => {
        const c = ev.type === "followup" ? (outcomeColors[ev.outcome] || T.pending) : null;
        return (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 18, position: "relative" }}>
            {/* Dot */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: ev.type === "comment" ? T.brandSubtle : ev.type === "followup" ? (c?.bg || T.surfaceEl) : `${ev.color}15`, border: `2px solid ${ev.color}60`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, zIndex: 1 }}>
              {ev.icon}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{ev.label}</span>
                  {ev.outcome && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: c?.bg || T.surfaceEl, color: c?.text || T.inkSub, padding: "1px 7px", borderRadius: 10, border: `1px solid ${ev.color}33` }}>{ev.outcome}</span>
                  )}
                </div>
                {ev.time && (
                  <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, flexShrink: 0 }}>
                    {typeof ev.time === "string" && ev.time.includes("T")
                      ? new Date(ev.time).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : ev.time}
                  </span>
                )}
              </div>
              {ev.detail && (
                <div style={{ background: T.surfaceEl, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.ink, lineHeight: 1.6, border: `1px solid ${T.line}` }}>
                  {ev.detail}
                </div>
              )}
              {ev.nextFollowUp && (
                <div style={{ fontSize: 11, color: T.brand, marginTop: 4, fontWeight: 600 }}>→ Next follow-up: {ev.nextFollowUp}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMMENT BOX WITH @MENTIONS ───────────────────────────────────────────────
function CommentBox({ onSubmit, users = [], T }) {
  const [text, setText] = useState("");
  const [mentionSearch, setMentionSearch] = useState(null); // { query, start }
  const textareaRef = useRef(null);
  const fo = mkFocus(T); const bl = mkBlur(T);

  const handleChange = e => {
    const val = e.target.value;
    setText(val);
    // Detect @mention
    const cursorPos = e.target.selectionStart;
    const before = val.slice(0, cursorPos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionSearch({ query: match[1].toLowerCase(), start: before.lastIndexOf("@") });
    } else {
      setMentionSearch(null);
    }
  };

  const suggestions = useMemo(() => {
    if (!mentionSearch) return [];
    return users.filter(u => u.name.toLowerCase().includes(mentionSearch.query)).slice(0, 5);
  }, [mentionSearch, users]);

  const insertMention = (name) => {
    const before = text.slice(0, mentionSearch.start);
    const after = text.slice(textareaRef.current.selectionStart);
    const newText = `${before}@${name} ${after}`;
    setText(newText);
    setMentionSearch(null);
    textareaRef.current.focus();
  };

  const renderText = (t) => {
    return t.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? <mark key={i} style={{ background: T.brandSubtle, color: T.brand, borderRadius: 3, padding: "0 2px" }}>{part}</mark> : part
    );
  };

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder="Write a comment… Use @name to mention a teammate"
        rows={3}
        style={{ ...inputSx(T), padding: "10px 12px", resize: "vertical", lineHeight: 1.6, width: "100%", boxSizing: "border-box" }}
        onFocus={fo} onBlur={bl}
        onKeyDown={e => {
          if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); if (text.trim()) { onSubmit(text); setText(""); setMentionSearch(null); } }
        }}
      />
      {/* Mention suggestions dropdown */}
      {mentionSearch && suggestions.length > 0 && (
        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: T.surface, border: `1.5px solid ${T.brand}`, borderRadius: 8, boxShadow: T.shadowXl, zIndex: 100, overflow: "hidden", minWidth: 180 }}>
          {suggestions.map(u => (
            <div key={u.id || u.name} onMouseDown={() => insertMention(u.name)}
              style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.ink, transition: "background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.brandSubtle}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Avatar name={u.name} size={22} />
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{u.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>Ctrl+Enter to submit · @name to mention</span>
        <Btn primary sm icon={P.check} label="Save comment" onClick={() => { if (text.trim()) { onSubmit(text); setText(""); setMentionSearch(null); } }} disabled={!text.trim()} T={T} />
      </div>
    </div>
  );
}

// ─── EMAIL COMPOSER ───────────────────────────────────────────────────────────
function EmailComposer({ funnel, user, onClose, T }) {
  const [to] = useState(funnel.email || "");
  const [subject, setSubject] = useState(`Re: ${funnel.enquiryType || "Enquiry"} — ${funnel.name}`);
  const [body, setBody] = useState(`Dear ${funnel.name.split(" ")[0]},\n\nThank you for your interest. `);
  const fo = mkFocus(T); const bl = mkBlur(T);

  const handleSend = () => {
    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: F }}>
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.lineMid}`, width: "min(520px, 100%)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Compose Email</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={P.close} sz={12} color={T.inkMuted} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 4 }}>To</label>
            <input value={to} readOnly style={{ ...inputSx(T), background: T.surfaceEl, cursor: "default" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 4 }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inputSx(T) }} onFocus={fo} onBlur={bl} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.inkSub, display: "block", marginBottom: 4 }}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8}
              style={{ ...inputSx(T), height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.6, width: "100%", boxSizing: "border-box" }}
              onFocus={fo} onBlur={bl} />
          </div>
          <div style={{ fontSize: 11, color: T.inkMuted, background: T.surfaceEl, borderRadius: 8, padding: "8px 12px", border: `1px solid ${T.line}` }}>
            ℹ️ This will open your default email client (Gmail, Outlook, etc.)
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.line}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.line}`, background: "transparent", cursor: "pointer", fontSize: 13, color: T.inkSub, fontFamily: F }}>Cancel</button>
          <button onClick={handleSend}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: F, display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 12px ${T.brand}44` }}>
            <Ic d={P.mail} sz={13} color="#fff" />
            Open Email Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN VIEWDRAWER ──────────────────────────────────────────────────────────
export function ViewDrawer({
  funnel, onClose, onEdit, onCreEdit, onStatusChange,
  user, users = [], comments = [], onAddComment,
  followupLogs = [], onLogFollowup, onAddProof, T
}) {
  const [status,        setStatus]        = useState(funnel.status);
  const [savedStatus,   setSavedStatus]   = useState(funnel.status);
  const [reason,        setReason]        = useState(funnel.lostDropReason || "");
  const [showWonPrompt, setShowWonPrompt] = useState(false);
  const [phoneModal,    setPhoneModal]    = useState(false);
  const [savingStatus,  setSavingStatus]  = useState(false);
  const [showEmail,     setShowEmail]     = useState(false);
  const [showInvoice,   setShowInvoice]   = useState(false);
  const [activeTab,     setActiveTab]     = useState("details"); // details | timeline | comments
  const [quickNote,     setQuickNote]     = useState(() => {
    try { return localStorage.getItem(`ek_note_${funnel.id}`) || ""; } catch { return ""; }
  });

  const isViewer   = VIEWER.includes(user.role);
  const canEdit    = FULL.includes(user.role) && !isViewer;
  const canCreEdit = !FULL.includes(user.role) && !isViewer &&
                     (funnel.createdBy === user.name || funnel.assignedTo === user.name);
  const isWon  = status === "Won";
  const fo = mkFocus(T); const bl = mkBlur(T);

  // Lead aging
  let ageDays = null;
  try { ageDays = Math.floor((Date.now() - new Date(funnel.createdAt)) / 86400000); } catch {}
  const ageCol = ageDays > 30 ? T.lost : ageDays > 14 ? T.pending : T.won;

  // Products total
  const tot = (funnel.products || []).reduce((a, p) => a + (Number(p.qty) * Number(p.price) || 0), 0);

  // Score
  const score = useMemo(() => calcScore(funnel), [funnel]);

  const doStatus = s => setStatus(s);
  const handleStatusClick = s => { if (!isViewer) doStatus(s); };
  const saveStatus = async () => {
    if (status === savedStatus) return;
    setSavingStatus(true);
    try {
      await onStatusChange(funnel.id, status, (status === "Lost" || status === "Drop") ? reason : "");
      setSavedStatus(status);
      if (status === "Won" && !funnel.wonProofUrl) setTimeout(() => setShowWonPrompt(true), 400);
    } finally { setSavingStatus(false); }
  };
  const cancelStatus = () => { setStatus(savedStatus); setReason(funnel.lostDropReason || ""); };
  const statusChanged = status !== savedStatus;

  const saveQuickNote = v => {
    setQuickNote(v);
    try { localStorage.setItem(`ek_note_${funnel.id}`, v); } catch {}
  };

  const submitComment = text => {
    onAddComment(funnel.id, { text: text.trim(), author: user.name, role: user.role, time: stamp() });
  };

  const roleColor = { CEO: T.high, Manager: T.won, CRE: T.pending, Editor: T.cold };

  const Row = ({ l, v, mono }) => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(100px,140px) 1fr", gap: 8, padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
      <dt style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, fontFamily: F }}>{l}</dt>
      <dd style={{ fontSize: 13, color: T.ink, fontFamily: mono ? F_MONO : F, wordBreak: "break-word" }}>{v || "—"}</dd>
    </div>
  );

  const Sec = ({ t }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, marginTop: 4, fontFamily: F_MONO, display: "flex", alignItems: "center", gap: 10 }}>
      <span>{t}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${T.line}, transparent)` }} />
    </div>
  );

  const outcomeColors = {
    "Interested": "won", "Order Confirmed": "won", "Needs Time": "pending",
    "Callback Requested": "pending", "Rescheduled": "pending", "Not Interested": "lost", Other: "drop"
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    const prods = (funnel.products || []).map(p =>
      `<tr><td>${p.desc||"—"}</td><td>${p.category||"—"}</td><td>${p.qty||"—"}</td><td>₹${p.price||0}</td><td>₹${Number(p.qty||0)*Number(p.price||0)}</td></tr>`
    ).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Lead — ${funnel.name}</title>
    <style>body{font-family:sans-serif;color:#111;padding:32px;max-width:720px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}p{font-size:13px;color:#555;margin:0 0 16px}.grid{display:grid;grid-template-columns:160px 1fr;gap:6px 12px;font-size:13px;margin-bottom:20px}.label{font-weight:600;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin:20px 0 10px;border-top:1px solid #eee;padding-top:14px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}th,td{padding:8px 10px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5;font-weight:600}@media print{body{padding:16px}}</style></head><body>
    <h1>${funnel.name || "Lead"}</h1><p>Created ${funnel.createdAt ? new Date(funnel.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"} · By ${funnel.createdBy||"—"} ${funnel.assignedTo?`· Assigned to ${funnel.assignedTo}`:""}</p>
    <div class="section">Contact</div><div class="grid"><span class="label">Phone</span><span>${funnel.phone||"—"}</span><span class="label">Email</span><span>${funnel.email||"—"}</span><span class="label">City / Region</span><span>${funnel.cityRegion||"—"}</span></div>
    <div class="section">Deal Details</div><div class="grid"><span class="label">Status</span><span>${funnel.status}</span><span class="label">Enquiry Type</span><span>${funnel.enquiryType||"—"}</span><span class="label">Lead Source</span><span>${funnel.leadSource||"—"}</span><span class="label">Quote Amount</span><span>${funnel.quoteAmount?"₹"+Number(funnel.quoteAmount).toLocaleString("en-IN"):"—"}</span></div>
    ${(funnel.products||[]).length?`<div class="section">Products</div><table><tr><th>Item</th><th>Category</th><th>Qty</th><th>Price</th><th>Total</th></tr>${prods}</table>`:""}
    <p style="margin-top:40px;font-size:10px;color:#aaa">Printed from Suntronix CRM · ${new Date().toLocaleString("en-IN")}</p></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  const TABS = [
    { id: "details",  label: "Details", count: null },
    { id: "timeline", label: "Timeline", count: comments.length + followupLogs.length + 1 },
    { id: "comments", label: "Comments", count: comments.length },
  ];

  return (
    <>
      {/* ── BACKDROP ── */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} onClick={onClose}>

        {/* ── PANEL ── */}
        <div style={{ background: T.surface, width: "100%", maxWidth: "min(600px,100vw)", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-16px 0 56px rgba(0,0,0,.28)", animation: "slideRight .22s cubic-bezier(0.4,0,0.2,1)" }} className="ek-drawer" onClick={e => e.stopPropagation()}>

          {/* ─── STICKY HEADER ─── */}
          <div style={{ padding: "clamp(12px,3vw,18px) clamp(14px,4vw,22px) 0", borderBottom: `1px solid ${T.line}`, background: T.surface, flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>

            {/* Name row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {funnel.name || "(No name)"}
                  </h2>
                  {funnel.isExisting && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: T.pending.bg, color: T.pending.text, padding: "2px 7px", borderRadius: 4, border: `1px solid ${T.pending.dot}44`, fontFamily: F_MONO, flexShrink: 0 }}>EXISTING</span>
                  )}
                  <ScoreBadge score={score} T={T} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: T.inkMuted }}>
                    {funnel.createdAt ? new Date(funnel.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    {funnel.createdBy ? ` · ${funnel.createdBy}` : ""}
                  </span>
                  {funnel.assignedTo && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: T.brandSubtle, color: T.brand, padding: "1px 8px", borderRadius: 10 }}>→ {funnel.assignedTo}</span>
                  )}
                  {funnel.leadSource && <SourcePill source={funnel.leadSource} T={T} />}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {funnel.phone && !isViewer && (
                  <a href={`https://wa.me/91${funnel.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: "#25D36618", border: "1px solid #25D36644", color: "#25D366", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.845L.057 23.885a.5.5 0 00.613.613l6.04-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.073-1.387l-.361-.214-3.757.912.929-3.657-.236-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    WA
                  </a>
                )}
                {funnel.email && !isViewer && (
                  <button onClick={() => setShowEmail(true)} title="Send email"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: T.surfaceEl, border: `1px solid ${T.line}`, color: T.inkSub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <Ic d={P.mail} sz={12} color={T.inkSub} />
                    Email
                  </button>
                )}
                {!isViewer && funnel.quoteAmount > 0 && (
                  <button onClick={() => setShowInvoice(true)} title="Generate Invoice"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: T.brandSubtle, border: `1px solid ${T.brand}33`, color: T.brand, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                    <Ic d={P.dl} sz={12} color={T.brand} />
                    Invoice
                  </button>
                )}
                <button onClick={handlePrint} title="Print"
                  style={{ width: 30, height: 30, border: `1px solid ${T.line}`, borderRadius: 7, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🖨</button>
                {canEdit && <Btn ghost sm icon={P.edit} label="Edit" onClick={() => { onClose(); onEdit(funnel); }} T={T} />}
                {canCreEdit && <Btn ghost sm icon={P.edit} label="Edit" onClick={() => { onClose(); onCreEdit(funnel); }} T={T} />}
                <button onClick={onClose} style={{ width: 30, height: 30, border: `1px solid ${T.line}`, borderRadius: 7, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic d={P.close} sz={12} color={T.inkSub} />
                </button>
              </div>
            </div>

            {/* Status pills */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", paddingBottom: 10 }}>
              {STATUS.map(s => {
                const c = T[s.toLowerCase()] || T.drop;
                const active = status === s;
                return (
                  <button key={s} onClick={() => handleStatusClick(s)}
                    style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${active ? c.dot : T.line}`, background: active ? c.bg : "transparent", color: active ? c.text : T.inkSub, fontSize: 11, fontWeight: active ? 700 : 400, cursor: isViewer ? "default" : "pointer", fontFamily: F, transition: "all .15s", display: "flex", alignItems: "center", gap: 4, opacity: isViewer && !active ? 0.4 : 1 }}>
                    <Dot color={active ? c.dot : T.inkMuted} size={5} />{s}
                  </button>
                );
              })}
              {isViewer && <span style={{ fontSize: 11, color: T.inkMuted, marginLeft: 4 }}>🔒 View only</span>}
            </div>

            {/* Status save/cancel bar */}
            {statusChanged && !isViewer && (
              <div style={{ marginBottom: 8, background: T.brandSubtle, border: `1.5px solid ${T.brand}33`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>⚠️ Status → <strong>{status}</strong> — unsaved</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={cancelStatus} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.inkMuted, fontSize: 12, cursor: "pointer", fontFamily: F }}>Cancel</button>
                  <button onClick={saveStatus} disabled={savingStatus}
                    style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: T.brand, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, opacity: savingStatus ? 0.7 : 1 }}>
                    {savingStatus ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}

            {statusChanged && !isViewer && (status === "Lost" || status === "Drop") && (
              <div style={{ marginBottom: 8 }}>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder={status === "Lost" ? "Lost reason (competitor, price…)" : "Drop reason…"}
                  rows={2}
                  style={{ width: "100%", padding: "8px 11px", border: `1px solid ${T.lineMid}`, borderRadius: 8, fontSize: 12, fontFamily: F, color: T.ink, background: T.surfaceEl, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={fo} onBlur={bl} />
              </div>
            )}

            {showWonPrompt && (
              <div style={{ marginBottom: 8, background: T.won.bg, border: `1.5px solid ${T.won.dot}`, borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.won.text }}>Deal Won!</div>
                    <div style={{ fontSize: 11, color: T.won.text, opacity: 0.8 }}>Upload proof to complete</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowWonPrompt(false)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.won.dot}55`, background: "transparent", color: T.won.text, fontSize: 11, cursor: "pointer", fontFamily: F }}>Later</button>
                  <button onClick={() => { setShowWonPrompt(false); onAddProof && onAddProof(funnel); }} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: T.won.dot, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: 700 }}>📷 Upload</button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 1, background: T.surfaceEl, borderRadius: "0 0 10px 10px", marginLeft: -22, marginRight: -22, padding: "0 14px" }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "9px 16px", border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? T.brand : T.inkMuted,
                    fontFamily: F, borderBottom: `2px solid ${activeTab === tab.id ? T.brand : "transparent"}`,
                    transition: "all .12s", display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ background: activeTab === tab.id ? T.brandSubtle : T.surfaceEl, color: activeTab === tab.id ? T.brand : T.inkMuted, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "0 5px", border: `1px solid ${T.line}` }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ─── SCROLLABLE BODY ─── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,20px) clamp(14px,4vw,22px) 80px" }}>

            {/* ── DETAILS TAB ── */}
            {activeTab === "details" && (
              <>
                {/* Lead aging */}
                {ageDays !== null && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ageCol.bg, color: ageCol.text, fontSize: 11, padding: "4px 12px", borderRadius: 20, marginBottom: 14, fontWeight: 600, border: `1px solid ${ageCol.dot}33` }}>
                    ⏱ {ageDays} day{ageDays !== 1 ? "s" : ""} old{ageDays > 30 ? " · Going cold!" : ageDays > 14 ? " · Follow up soon" : " · Fresh lead"}
                  </div>
                )}

                <Sec t="Contact" />
                <dl style={{ margin: 0 }}>
                  <Row l="Name" v={funnel.name} />
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(100px,140px) 1fr", gap: 8, padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
                    <dt style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted }}>Phone</dt>
                    <dd>
                      {funnel.phone ? (
                        isViewer ? <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{funnel.phone}</span> :
                          <button onClick={() => setPhoneModal(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, color: T.brand, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>{funnel.phone}</button>
                      ) : <span style={{ fontSize: 13, color: T.inkMuted }}>—</span>}
                    </dd>
                  </div>
                  <Row l="Email" v={funnel.email} />
                  {funnel.cityRegion && <Row l="City / Region" v={funnel.cityRegion} />}
                  {funnel.assignedTo && <Row l="Assigned to" v={funnel.assignedTo} />}
                </dl>

                {/* Quick Notes */}
                <div style={{ marginTop: 20 }}>
                  <Sec t="Quick Notes" />
                  <textarea value={quickNote} onChange={e => isViewer ? null : saveQuickNote(e.target.value)}
                    placeholder={isViewer ? "No notes." : "Jot a quick note (auto-saved locally)…"}
                    rows={2} readOnly={isViewer}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.lineMid}`, borderRadius: 8, fontSize: 12, fontFamily: F, color: T.ink, background: T.surfaceEl, outline: "none", resize: isViewer ? "none" : "vertical", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color .15s" }}
                    onFocus={isViewer ? undefined : fo} onBlur={isViewer ? undefined : bl} />
                  <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 3 }}>💾 Saved locally on this device</div>
                </div>

                {/* Funnel */}
                <div style={{ marginTop: 20 }}><Sec t="Funnel Details" />
                  <dl style={{ margin: 0 }}>
                    <Row l="Enquiry type" v={funnel.enquiryType} />
                    <Row l="Funnel type" v={funnel.funnelType} />
                    <Row l="Lead source" v={funnel.leadSource} />
                    {!isWon && <Row l="Next follow-up" v={funnel.nextFollowUp} />}
                    {(funnel.status === "Lost" || funnel.status === "Drop") && funnel.lostDropReason && (
                      <Row l={funnel.status + " reason"} v={funnel.lostDropReason} />
                    )}
                  </dl>
                </div>

                {/* Quotation */}
                <div style={{ marginTop: 20 }}><Sec t="Quotation" />
                  {funnel.quoteAmount > 0 && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, padding: "12px 14px", background: T.brandSubtle, borderRadius: 10, border: `1px solid ${T.brand}25`, minWidth: 100 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.brand, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F_MONO, marginBottom: 4 }}>Quote Amount</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.brand }}>{inr(funnel.quoteAmount)}</div>
                      </div>
                      <div style={{ flex: 1, padding: "12px 14px", background: T.surfaceEl, borderRadius: 10, border: `1px solid ${T.line}`, minWidth: 100 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F_MONO, marginBottom: 4 }}>Quantity</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{funnel.quoteQty || "—"}</div>
                      </div>
                    </div>
                  )}
                  <dl style={{ margin: 0 }}>
                    {funnel.quotationNo && <Row l="Quotation No." v={funnel.quotationNo} mono />}
                    {funnel.orderNumber && <Row l="Order Number" v={funnel.orderNumber} mono />}
                    {funnel.quoteDesc && <Row l="Description" v={funnel.quoteDesc} />}
                  </dl>
                </div>

                {/* Products */}
                {(funnel.products || []).length > 0 && (
                  <div style={{ marginTop: 20 }}><Sec t="Products" />
                    <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr .7fr 1fr 1fr", padding: "8px 14px", background: T.surfaceEl }}>
                        {["Item", "Cat.", "Qty", "Price", "Total"].map(h => (
                          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, letterSpacing: "0.08em", fontFamily: F_MONO }}>{h}</div>
                        ))}
                      </div>
                      {(funnel.products || []).map((p, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr .7fr 1fr 1fr", padding: "9px 14px", borderTop: `1px solid ${T.line}` }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc || "—"}</span>
                          <span style={{ fontSize: 11, color: T.inkSub }}>{p.category || "—"}</span>
                          <span style={{ fontSize: 11, color: T.inkSub }}>{p.qty || "—"}</span>
                          <span style={{ fontSize: 11, color: T.inkSub }}>{inr(p.price) || "—"}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.brand }}>{inr(Number(p.qty) * Number(p.price)) || "—"}</span>
                        </div>
                      ))}
                      {tot > 0 && <div style={{ display: "flex", justifyContent: "flex-end", padding: "9px 14px", borderTop: `1px solid ${T.lineMid}`, fontSize: 13, fontWeight: 700, color: T.ink }}>Total: {inr(tot)}</div>}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {funnel.remarks && (
                  <div style={{ marginTop: 20 }}><Sec t="Remarks" />
                    <div style={{ background: T.surfaceEl, padding: "12px 14px", borderRadius: 8, fontSize: 13, color: T.ink, lineHeight: 1.7, border: `1px solid ${T.line}` }}>{funnel.remarks}</div>
                  </div>
                )}

                {/* Delivery & Payment */}
                {(funnel.deliveryDetails || funnel.paymentTerms) && (
                  <div style={{ marginTop: 20 }}><Sec t="Delivery & Payment" />
                    <dl style={{ margin: 0 }}>
                      {funnel.deliveryDetails && <Row l="Delivery" v={funnel.deliveryDetails} />}
                      {funnel.paymentTerms && <Row l="Payment terms" v={funnel.paymentTerms} />}
                    </dl>
                  </div>
                )}

                {/* Won Proof */}
                {funnel.wonProofUrl && (
                  <div style={{ marginTop: 20 }}><Sec t="Won Proof" />
                    <div style={{ border: `1.5px solid ${T.won.dot}44`, borderRadius: 10, overflow: "hidden", background: T.won.bg }}>
                      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.won.text }}>🏆 Payment/Order Proof</span>
                        <a href={funnel.wonProofUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: T.brand, fontWeight: 600 }}>Open ↗</a>
                      </div>
                      <div style={{ padding: 8, background: "#000", textAlign: "center" }}>
                        <img src={funnel.wonProofUrl} alt="Won proof" style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain", display: "block", margin: "0 auto", borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Follow-up section in details */}
                <div style={{ marginTop: 28, borderTop: `2px solid ${T.line}`, paddingTop: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>📅</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Follow-up History</span>
                      {followupLogs.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: T.brandSubtle, color: T.brand, padding: "1px 8px", borderRadius: 10 }}>{followupLogs.length}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {isWon && !isViewer && (
                        <button onClick={() => onAddProof && onAddProof(funnel)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${funnel.wonProofUrl ? T.won.dot : T.line}`, background: funnel.wonProofUrl ? T.won.bg : "transparent", color: funnel.wonProofUrl ? T.won.text : T.inkSub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {funnel.wonProofUrl ? "🏆 Update Proof" : "🏆 Add Proof"}
                        </button>
                      )}
                      {!isWon && !isViewer && <Btn primary sm label="+ Log Follow-up" onClick={() => onLogFollowup && onLogFollowup(funnel)} T={T} />}
                    </div>
                  </div>

                  {followupLogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: T.inkMuted }}>No follow-ups logged yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
                      <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: T.line, borderRadius: 2 }} />
                      {[...followupLogs].reverse().map((log, i) => {
                        const cKey = outcomeColors[log.outcome] || "drop";
                        const c = T[cKey] || T.drop;
                        return (
                          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, position: "relative" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: c.bg, border: `2px solid ${c.dot}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                              <Dot color={c.dot} size={6} />
                            </div>
                            <div style={{ flex: 1, background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 20, border: `1px solid ${c.dot}33` }}>{log.outcome}</span>
                                  <span style={{ fontSize: 11, color: T.inkMuted }}>by {log.loggedBy}</span>
                                </div>
                                <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, whiteSpace: "nowrap" }}>{log.loggedAt}</span>
                              </div>
                              <p style={{ margin: "0 0 6px", fontSize: 13, color: T.ink, lineHeight: 1.6 }}>{log.customerResponse}</p>
                              {log.nextFollowUp && <div style={{ fontSize: 11, color: T.brand, fontWeight: 600 }}>→ Rescheduled to {log.nextFollowUp}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TIMELINE TAB ── */}
            {activeTab === "timeline" && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 16 }}>
                  Full activity history for this lead — creation, follow-ups, comments, and status changes.
                </div>
                <ActivityTimeline funnel={funnel} comments={comments} followupLogs={followupLogs} T={T} />
              </div>
            )}

            {/* ── COMMENTS TAB ── */}
            {activeTab === "comments" && (
              <div style={{ marginTop: 4 }}>
                {!isViewer && (
                  <CommentBox onSubmit={submitComment} users={users} T={T} />
                )}
                {comments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0", fontSize: 12, color: T.inkMuted }}>No comments yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...comments].reverse().map((c, i) => {
                      const rc = roleColor[c.role] || T.drop;
                      return (
                        <div key={i} style={{ background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Avatar name={c.author} size={26} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.author}</span>
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: rc.bg, color: rc.text }}>{c.role}</span>
                            </div>
                            <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, whiteSpace: "nowrap" }}>{c.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: T.ink, lineHeight: 1.6 }}>
                            {c.text.split(/(@\w+)/g).map((part, pi) =>
                              part.startsWith("@") ? <mark key={pi} style={{ background: T.brandSubtle, color: T.brand, borderRadius: 3, padding: "0 2px" }}>{part}</mark> : part
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {phoneModal && funnel.phone && <PhoneActionModal phone={funnel.phone} name={funnel.name} onClose={() => setPhoneModal(false)} T={T} />}
      {showEmail && <EmailComposer funnel={funnel} user={user} onClose={() => setShowEmail(false)} T={T} />}
      {showInvoice && <InvoiceModal funnel={funnel} onClose={() => setShowInvoice(false)} T={T} />}
    </>
  );
}
