import React from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Ic, P } from "../ui/index.jsx";

export function NewOrExistingModal({ onClose, onSelect, T }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div style={{background:T.surface,borderRadius:T.r["2xl"],width:"100%",maxWidth:420,boxShadow:T.shadowXl,animation:"fadeUp .2s ease"}} onClick={e=>e.stopPropagation()}>
        
        <div style={{padding:"24px 24px 16px",textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:T.brandSubtle,border:`2px solid ${T.brand}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:22}}>📋</div>
          <h2 style={{fontSize:16,fontWeight:700,color:T.ink,fontFamily:F_MONO,letterSpacing:"0.04em",margin:"0 0 6px",textTransform:"uppercase"}}>One quick question</h2>
          <p style={{fontSize:13,color:T.inkSub,fontFamily:F_BODY,margin:0,lineHeight:1.6}}>Is this a brand new deal, or one that already existed before being added here?</p>
        </div>

        <div style={{padding:"8px 24px 24px",display:"flex",flexDirection:"column",gap:10}}>
          
          <button onClick={()=>onSelect(false)}
            style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:T.r.lg,border:`2px solid ${T.won.dot}`,background:T.won.bg,cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:T.won.dot,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>🆕</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.won.text}}>New Deal</div>
              <div style={{fontSize:11,color:T.won.text}}>Counts in stats & analytics.</div>
            </div>
          </button>

          <button onClick={()=>onSelect(true)}
            style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:T.r.lg,border:`2px solid ${T.lineMid}`,background:T.surfaceEl,cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:T.drop.bg,border:`2px solid ${T.drop.dot}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>📁</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.ink}}>Existing Deal</div>
              <div style={{fontSize:11,color:T.inkMuted}}>Excluded from stats & analytics.</div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
