import React, { useState } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, Dot, FSelect, Avatar } from "../ui/index.jsx";
import { STATUS, FTYPES, LEAD_SOURCES } from "../../constants.js";
import { today } from "../../utils.js";

export function BulkEditModal({ funnels, users, onClose, onSave, T }) {
  const [fields, setFields] = useState({
    status: "", assignedTo: "", nextFollowUp: "",
    funnelType: "", leadSource: "", lostDropReason: "",
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("edit"); // edit | confirm | done

  const sf = (k, v) => setFields(f => ({ ...f, [k]: v }));
  const todayV = today();

  const activeFields = Object.entries(fields).filter(([k, v]) => v !== "" && !(k === "lostDropReason" && fields.status !== "Lost" && fields.status !== "Drop"));
  const hasChanges   = activeFields.length > 0;

  const teamOptions = [...new Set(users.map(u => u.name))];

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (fields.status)        payload.status        = fields.status;
      if (fields.assignedTo)    payload.assignedTo    = fields.assignedTo;
      if (fields.nextFollowUp)  payload.nextFollowUp  = fields.nextFollowUp;
      if (fields.funnelType)    payload.funnelType    = fields.funnelType;
      if (fields.leadSource)    payload.leadSource    = fields.leadSource;
      if ((fields.status==="Lost"||fields.status==="Drop") && fields.lostDropReason)
        payload.lostDropReason = fields.lostDropReason;
      await onSave(funnels.map(f=>f.id), payload);
      setStep("done");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const statusColors = { Won:T.won, Pending:T.pending, Lost:T.lost, Drop:T.drop };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div style={{ background:T.surface,borderRadius:16,width:"100%",maxWidth:"min(520px,calc(100vw - 16px))",boxShadow:T.shadowXl,animation:"scaleIn .2s ease",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"90vh" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 22px",borderBottom:`1px solid ${T.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:F }}>Bulk Edit</div>
            <div style={{ fontSize:12,color:T.inkMuted,fontFamily:F,marginTop:2 }}>
              Editing <strong style={{ color:T.brand }}>{funnels.length} leads</strong> at once
            </div>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,border:`1px solid ${T.line}`,borderRadius:8,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic d={P.close} sz={12} color={T.inkSub}/>
          </button>
        </div>

        {/* Affected leads strip */}
        <div style={{ padding:"10px 22px",background:T.brandSubtle,borderBottom:`1px solid ${T.line}`,display:"flex",gap:6,flexWrap:"wrap",flexShrink:0,alignItems:"center" }}>
          <span style={{ fontSize:11,fontWeight:600,color:T.brand,fontFamily:F_MONO,textTransform:"uppercase",letterSpacing:"0.06em",flexShrink:0 }}>Leads:</span>
          {funnels.slice(0,6).map(f => (
            <span key={f.id} style={{ fontSize:11,background:T.surface,color:T.ink,padding:"2px 8px",borderRadius:20,fontFamily:F,border:`1px solid ${T.line}`,whiteSpace:"nowrap" }}>
              {f.name}
            </span>
          ))}
          {funnels.length > 6 && <span style={{ fontSize:11,color:T.inkMuted,fontFamily:F }}>+{funnels.length-6} more</span>}
        </div>

        {step === "done" ? (
          <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 24px",gap:12 }}>
            <div style={{ fontSize:56 }}>✅</div>
            <div style={{ fontSize:18,fontWeight:700,color:T.ink,fontFamily:F }}>Updated {funnels.length} leads!</div>
            <div style={{ fontSize:13,color:T.inkMuted,fontFamily:F }}>All changes have been saved successfully.</div>
            <button onClick={onClose} style={{ marginTop:12,padding:"10px 28px",borderRadius:10,border:"none",background:T.brand,color:"#fff",fontSize:13,fontFamily:F,cursor:"pointer",fontWeight:600 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex:1,overflowY:"auto",padding:"20px 22px",display:"flex",flexDirection:"column",gap:14 }}>

              {/* Status */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.inkMuted,fontFamily:F_MONO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Change Status</div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  <button onClick={() => sf("status","")}
                    style={{ padding:"7px 14px",borderRadius:20,border:`1.5px solid ${fields.status===""?T.brand:T.line}`,background:fields.status===""?T.brandSubtle:"transparent",color:fields.status===""?T.brand:T.inkSub,fontSize:12,fontFamily:F,cursor:"pointer",fontWeight:fields.status===""?700:400,transition:"all .15s" }}>
                    — No change
                  </button>
                  {STATUS.map(s=>{
                    const c=statusColors[s]||T.drop;
                    const active=fields.status===s;
                    return (
                      <button key={s} onClick={()=>sf("status",s)}
                        style={{ padding:"7px 14px",borderRadius:20,border:`1.5px solid ${active?c.dot:T.line}`,background:active?c.bg:"transparent",color:active?c.text:T.inkSub,fontSize:12,fontFamily:F,cursor:"pointer",fontWeight:active?700:400,transition:"all .15s",display:"flex",alignItems:"center",gap:5 }}>
                        <Dot color={active?c.dot:T.inkMuted} size={5}/>{s}
                      </button>
                    );
                  })}
                </div>
                {(fields.status==="Lost"||fields.status==="Drop")&&(
                  <textarea value={fields.lostDropReason} onChange={e=>sf("lostDropReason",e.target.value)}
                    placeholder={`Reason for ${fields.status.toLowerCase()} (optional)...`} rows={2}
                    style={{ marginTop:10,width:"100%",padding:"8px 11px",border:`1px solid ${T.lineMid}`,borderRadius:7,fontSize:12,fontFamily:F,color:T.ink,background:T.surface,outline:"none",resize:"vertical",boxSizing:"border-box" }}/>
                )}
              </div>

              {/* Assign to */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.inkMuted,fontFamily:F_MONO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Assign To</div>
                <select value={fields.assignedTo} onChange={e=>sf("assignedTo",e.target.value)}
                  style={{ width:"100%",padding:"9px 11px",border:`1px solid ${T.lineMid}`,borderRadius:8,fontSize:13,fontFamily:F,color:T.ink,background:T.surface,outline:"none",appearance:"none",cursor:"pointer" }}>
                  <option value="">— No change</option>
                  <option value="__clear__">Clear assignment</option>
                  {teamOptions.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Next follow-up */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.inkMuted,fontFamily:F_MONO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Set Next Follow-up Date</div>
                <input type="date" value={fields.nextFollowUp} onChange={e=>sf("nextFollowUp",e.target.value)} min={todayV}
                  style={{ width:"100%",padding:"9px 11px",border:`1px solid ${T.lineMid}`,borderRadius:8,fontSize:13,fontFamily:F,color:T.ink,background:T.surface,outline:"none",cursor:"pointer",boxSizing:"border-box" }}/>
              </div>

              {/* Funnel type */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.inkMuted,fontFamily:F_MONO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Change Funnel Type</div>
                <select value={fields.funnelType} onChange={e=>sf("funnelType",e.target.value)}
                  style={{ width:"100%",padding:"9px 11px",border:`1px solid ${T.lineMid}`,borderRadius:8,fontSize:13,fontFamily:F,color:T.ink,background:T.surface,outline:"none",appearance:"none",cursor:"pointer" }}>
                  <option value="">— No change</option>
                  {FTYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Summary of changes */}
              {hasChanges && (
                <div style={{ background:T.brandSubtle,border:`1px solid ${T.brand}44`,borderRadius:10,padding:"12px 16px" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:T.brand,fontFamily:F_MONO,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Changes to apply</div>
                  {activeFields.map(([k,v])=>(
                    <div key={k} style={{ fontSize:12,color:T.ink,fontFamily:F,marginBottom:4,display:"flex",gap:8 }}>
                      <span style={{ color:T.inkMuted,minWidth:100 }}>{k}:</span>
                      <strong>{v==="__clear__"?"[cleared]":v}</strong>
                    </div>
                  ))}
                  <div style={{ fontSize:11,color:T.inkMuted,fontFamily:F,marginTop:8 }}>
                    → will apply to all {funnels.length} selected leads
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:"14px 22px",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
              <Btn ghost label="Cancel" onClick={onClose} T={T}/>
              <Btn primary icon={P.check}
                label={saving?"Saving…":`Apply to ${funnels.length} leads`}
                onClick={submit} disabled={!hasChanges||saving} T={T}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
