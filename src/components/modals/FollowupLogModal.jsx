import React, { useState } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Ic, P, Dot, Btn, inputSx, mkFocus, mkBlur } from "../ui/index.jsx";
import { today } from "../../utils.js";

export const OUTCOMES = [
  "Interested","Needs Time","Callback Requested",
  "Not Interested","Rescheduled","Order Confirmed","Other"
];

// Outcomes that don't require scheduling a next follow-up
const CLOSED_OUTCOMES = ["Order Confirmed", "Not Interested"];

export function FollowupLogModal({ funnel, user, onClose, onSave, T }) {
  const [form, setForm] = useState({ customerResponse: "", outcome: "", nextFollowUp: "" });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fo = mkFocus(T);
  const bl = mkBlur(T);

  const isClosed = CLOSED_OUTCOMES.includes(form.outcome);

  const submit = async () => {
    const e = {};
    if (!form.customerResponse.trim()) e.response = "Required";
    if (!form.outcome)                 e.outcome   = "Required";
    if (!isClosed && !form.nextFollowUp) e.nextFollowUp = "Required for this outcome";
    setErr(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await onSave({
        loggedBy:         user.name,
        followUpDate:     funnel.nextFollowUp,
        customerResponse: form.customerResponse.trim(),
        outcome:          form.outcome,
        nextFollowUp:     isClosed ? null : form.nextFollowUp,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const oc = {
    "Interested":         T.won,
    "Order Confirmed":    T.won,
    "Needs Time":         T.pending,
    "Callback Requested": T.pending,
    "Rescheduled":        T.pending,
    "Not Interested":     T.lost,
    "Other":              T.drop,
  };

  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 8px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background:T.surface,borderRadius:T.r["2xl"],width:"100%",maxWidth:"min(480px,calc(100vw - 16px))",boxShadow:T.shadowXl,animation:"fadeUp .2s ease" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:"clamp(12px,3vw,20px) clamp(14px,4vw,24px) 14px",borderBottom:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <h2 style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:F,margin:"0 0 3px" }}>Log Follow-up</h2>
            <p style={{ margin:0,fontSize:12,color:T.inkSub,fontFamily:F }}>{funnel.name} · Due {funnel.nextFollowUp || "—"}</p>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,border:`1px solid ${T.line}`,borderRadius:T.r.md,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic d={P.close} sz={12} color={T.inkSub}/>
          </button>
        </div>

        <div style={{ padding:"clamp(14px,3vw,20px) clamp(14px,4vw,24px)",display:"flex",flexDirection:"column",gap:16 }}>

          {/* Customer response */}
          <div>
            <label style={{ fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F,display:"block",marginBottom:5 }}>
              What did the customer say? <span style={{ color:"#DC2626" }}>*</span>
            </label>
            <textarea
              value={form.customerResponse}
              onChange={e => set("customerResponse", e.target.value)}
              placeholder="e.g. Customer said she'll confirm after checking with family…"
              rows={3}
              style={{ ...inputSx(T, err.response),padding:"9px 11px",resize:"vertical",lineHeight:1.6,width:"100%",boxSizing:"border-box" }}
              onFocus={fo} onBlur={bl} autoFocus
            />
            {err.response && <div style={{ fontSize:11,color:"#B91C1C",marginTop:4 }}>{err.response}</div>}
          </div>

          {/* Outcome selector */}
          <div>
            <label style={{ fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F,display:"block",marginBottom:8 }}>
              Outcome <span style={{ color:"#DC2626" }}>*</span>
            </label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
              {OUTCOMES.map(o => {
                const c = oc[o] || T.drop;
                const sel = form.outcome === o;
                return (
                  <button key={o} onClick={() => set("outcome", o)}
                    style={{ padding:"5px 12px",borderRadius:20,border:`1px solid ${sel?c.dot:T.line}`,background:sel?c.bg:"transparent",color:sel?c.text:T.inkSub,fontSize:12,fontWeight:sel?600:400,cursor:"pointer",fontFamily:F,transition:"all .15s",display:"flex",alignItems:"center",gap:5 }}>
                    <Dot color={sel ? c.dot : T.inkMuted} size={5}/>{o}
                  </button>
                );
              })}
            </div>
            {err.outcome && <div style={{ fontSize:11,color:"#B91C1C",marginTop:6 }}>{err.outcome}</div>}
          </div>

          {/* Next follow-up — hidden for closed outcomes */}
          {isClosed ? (
            <div style={{ padding:"10px 14px",background:T.won.bg,border:`1px solid ${T.won.dot}44`,borderRadius:T.r.md,fontSize:12,color:T.won.text,fontFamily:F,display:"flex",alignItems:"center",gap:6 }}>
              <Dot color={T.won.dot} size={6}/>
              No follow-up needed for "{form.outcome}" — this lead will be closed.
            </div>
          ) : (
            <div>
              <label style={{ fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F,display:"block",marginBottom:5 }}>
                Reschedule next follow-up to
                {!isClosed && <span style={{ color:"#DC2626" }}> *</span>}
              </label>
              <input
                type="date"
                value={form.nextFollowUp}
                onChange={e => set("nextFollowUp", e.target.value)}
                style={{ ...inputSx(T, err.nextFollowUp) }}
                onFocus={fo} onBlur={bl}
                min={today()}
              />
              {err.nextFollowUp && <div style={{ fontSize:11,color:"#B91C1C",marginTop:4 }}>{err.nextFollowUp}</div>}
            </div>
          )}
        </div>

        <div style={{ display:"flex",justifyContent:"flex-end",gap:10,padding:"14px clamp(14px,4vw,24px) 20px",borderTop:`1px solid ${T.line}` }}>
          <Btn ghost label="Cancel" onClick={onClose} T={T}/>
          <Btn primary icon={P.check} label={saving ? "Saving…" : "Save follow-up"} onClick={submit} disabled={saving} T={T}/>
        </div>
      </div>
    </div>
  );
}
