import React, { useState, useEffect, useRef } from "react";
import { F_BODY, F_MONO, F_SERIF, F } from "../../theme/index.js";
import { Ic, P, Dot, Btn, FInput, FSelect, Avatar, StatusPill, SourcePill, SL, inputSx, selectBg, mkFocus, mkBlur } from "../ui/index.jsx";
import { FULL, VIEWER, can, CATS, ENQS, FTYPES, STATUS, OUTCOMES } from "../../constants.js";
import { today, stamp, inr } from "../../utils.js";

export function CREEditModal({funnel,onClose,onSave,T}) {
  const [products,setProducts]=useState(funnel.products?.length?funnel.products.map(p=>({...p})):[{desc:"",category:"",qty:"",price:""}]);
  const [quoteQty,setQuoteQty]=useState(String(funnel.quoteQty||""));
  const [quoteAmount,setQuoteAmount]=useState(String(funnel.quoteAmount||""));
  const [quoteDesc,setQuoteDesc]=useState(String(funnel.quoteDesc||""));
  const [orderNumber,setOrderNumber]=useState(String(funnel.orderNumber||""));
  const [remarks,setRemarks]=useState(String(funnel.remarks||""));
  const [saving,setSaving]=useState(false);
  const [isExistingLocal,setIsExistingLocal]=useState(funnel.isExisting||false);
  const sp=(i,k,v)=>{const p=[...products];p[i]={...p[i],[k]:v};setProducts(p);};
  const prodTotal=products.reduce((a,p)=>a+(Number(p.qty)*Number(p.price)||0),0);
  const fo=mkFocus(T); const bl=mkBlur(T);
  const submit=async()=>{
    setSaving(true);
    try{
      await onSave({
  ...funnel,
  products:products.filter(p=>p.desc||p.category||p.qty||p.price),
  quoteQty:quoteQty?Number(quoteQty):funnel.quoteQty,
  quoteAmount:quoteAmount?Number(quoteAmount):funnel.quoteAmount,
  quoteDesc:quoteDesc.trim(),
  orderNumber:orderNumber.trim(),
  remarks:remarks.trim(),
  isExisting:isExistingLocal,
});
      onClose();
    }catch(err){console.error(err);}finally{setSaving(false);}
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 8px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:T.surface,borderRadius:T.r["2xl"],width:"100%",maxWidth:"min(680px,calc(100vw - 16px))",maxHeight:"94dvh",overflowY:"auto",boxShadow:T.shadowXl,animation:"fadeUp .2s ease"}} onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"clamp(12px,3vw,18px) clamp(14px,4vw,24px) 14px",borderBottom:`1px solid ${T.line}`,position:"sticky",top:0,background:T.surface,zIndex:1,borderRadius:`${T.r["2xl"]} ${T.r["2xl"]} 0 0`}}>
          <div>
            <h2 style={{fontSize:15,fontWeight:700,color:T.ink,fontFamily:F,margin:"0 0 2px"}}>Edit Products & Quote</h2>
            <p style={{margin:0,fontSize:12,color:T.inkSub,fontFamily:F}}>{funnel.name} — update products, quote and order details</p>
          </div>
          <button onClick={onClose} style={{width:30,height:30,border:`1px solid ${T.line}`,borderRadius:T.r.md,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic d={P.close} sz={13} color={T.inkSub}/>
          </button>
        </div>

        <div style={{padding:"clamp(14px,3vw,20px) clamp(14px,4vw,24px)",display:"flex",flexDirection:"column",gap:20}}>

          {/* ── Customer info strip ── */}
          <div style={{background:T.brandSubtle,border:`1px solid rgba(91,59,232,.15)`,borderRadius:T.r.lg,padding:"12px 16px",display:"flex",gap:24,flexWrap:"wrap"}}>
            {[["Customer",funnel.name],["Phone",funnel.phone],["Status",funnel.status],["Follow-up",funnel.nextFollowUp]].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:10,fontWeight:600,color:"#5B3BE8",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:F,marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500,color:T.ink,fontFamily:F}}>{v||"—"}</div>
              </div>
            ))}
          </div>

          {/* ── Products table ── */}
          <section>
            <SL T={T}>Customer requirements</SL>
            <div style={{border:`1px solid ${T.line}`,borderRadius:T.r.lg,overflow:"hidden"}}>
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <div style={{minWidth:340}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(120px,2.5fr) minmax(80px,1.4fr) minmax(50px,.8fr) minmax(70px,1fr) 28px",padding:"8px 14px",background:T.surfaceEl,gap:8}}>
                  {["Product / item","Category","Qty","Unit price (₹)",""].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:600,color:T.inkMuted,letterSpacing:"0.06em",fontFamily:F}}>{h}</div>
                  ))}
                </div>
              {products.map((pr,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"minmax(120px,2.5fr) minmax(80px,1.4fr) minmax(50px,.8fr) minmax(70px,1fr) 28px",padding:"9px 14px",borderTop:`1px solid ${T.line}`,gap:8,alignItems:"center"}}>
                  <input value={pr.desc} onChange={e=>sp(i,"desc",e.target.value)} placeholder="e.g. Bridal Lehenga" style={{...inputSx(T),padding:"6px 9px",fontSize:12}} onFocus={fo} onBlur={bl}/>
                  <select value={pr.category} onChange={e=>sp(i,"category",e.target.value)} style={{...inputSx(T),padding:"6px 24px 6px 9px",fontSize:12,cursor:"pointer",appearance:"none",background:`${T.surface} ${selectBg}`}} onFocus={fo} onBlur={bl}>
                    <option value="">Category</option>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                  {[["qty","0"],["price","0"]].map(([k,ph])=>(
                    <input key={k} type="number" value={pr[k]} onChange={e=>sp(i,k,e.target.value)} placeholder={ph} style={{...inputSx(T),padding:"6px 9px",fontSize:12}} onFocus={fo} onBlur={bl}/>
                  ))}
                  <button onClick={()=>setProducts(products.filter((_,x)=>x!==i))} disabled={products.length===1}
                    style={{background:"none",border:"none",cursor:products.length===1?"not-allowed":"pointer",color:T.inkMuted,fontSize:16,opacity:products.length===1?.2:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ))}
                </div>{/* minWidth wrapper */}
              </div>{/* overflow scroll */}
              <div style={{padding:"9px 14px",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={()=>setProducts([...products,{desc:"",category:"",qty:"",price:""}])}
                  style={{background:"none",border:`1px dashed #5B3BE8`,borderRadius:T.r.sm,padding:"4px 12px",color:"#5B3BE8",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:F,display:"inline-flex",alignItems:"center",gap:5}}>
                  <Ic d={P.plus} sz={11} color="#5B3BE8"/> Add item
                </button>
                {prodTotal>0&&<span style={{fontSize:12,fontWeight:600,color:T.ink,fontFamily:F}}>Total: {inr(prodTotal)}</span>}
              </div>
            </div>
          </section>

          {/* ── Quote details ── */}
          <section>
            <SL T={T}>Quote details</SL>
            <div className="ek-form-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="Quantity" type="number" value={quoteQty} onChange={v=>setQuoteQty(v)} placeholder="0" T={T}/>
              <FInput label="Amount (₹)" type="number" value={quoteAmount} onChange={v=>setQuoteAmount(v)} placeholder="0" T={T}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F}}>Description</label>
              <textarea value={quoteDesc} onChange={e=>setQuoteDesc(e.target.value)}
                placeholder="Quote notes, special instructions…" rows={2}
                style={{...inputSx(T),padding:"9px 11px",resize:"vertical",lineHeight:1.5}}
                onFocus={fo} onBlur={bl}/>
            </div>
          </section>

          {/* ── Order Number ── */}
          <section>
            <SL T={T}>Order details</SL>
            <FInput
              label="Order Number"
              value={orderNumber}
              onChange={v=>setOrderNumber(v)}
              placeholder="Enter order number"
              T={T}
            />
          </section>

          {/* ── Remarks ── */}
          <section>
            <SL T={T}>Remarks</SL>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
              placeholder="Additional notes, customer feedback, follow-up context…" rows={3}
              style={{...inputSx(T),padding:"9px 11px",resize:"vertical",lineHeight:1.6,width:"100%",boxSizing:"border-box"}}
              onFocus={fo} onBlur={bl}/>
          </section>

          {/* ── Lock notice ── */}
          <div style={{background:T.surfaceEl,border:`1px solid ${T.line}`,borderRadius:T.r.md,padding:"10px 14px",fontSize:12,color:T.inkMuted,fontFamily:F,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>🔒</span>
            Contact info, funnel type, lead source, delivery details and payment terms can only be edited by Manager or CEO.
          </div>

        </div>

{/* ── Footer ── */}
<div style={{display:"flex",flexDirection:"column",gap:10,padding:"14px 24px 20px",borderTop:`1px solid ${T.line}`,position:"sticky",bottom:0,background:T.surface,borderRadius:`0 0 ${T.r["2xl"]} ${T.r["2xl"]}`}}>

  {/* ── Existing deal toggle ── */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:isExistingLocal?T.drop.bg:T.surfaceEl,border:`1px solid ${isExistingLocal?T.drop.dot:T.line}`,borderRadius:T.r.md,transition:"all .2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:16}}>{isExistingLocal?"📁":"🆕"}</span>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:isExistingLocal?T.drop.text:T.ink,fontFamily:F_BODY}}>
          {isExistingLocal?"Existing Deal":"New Deal"}
        </div>
        <div style={{fontSize:11,color:T.inkMuted,fontFamily:F_BODY}}>
          {isExistingLocal?"Excluded from stats & analytics":"Counts in all stats & analytics"}
        </div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:T.inkMuted,fontFamily:F_MONO,letterSpacing:"0.06em",textTransform:"uppercase"}}>
        {isExistingLocal?"Mark as new":"Mark as existing"}
      </span>
      <div style={{position:"relative",width:36,height:20,borderRadius:10,background:isExistingLocal?T.drop.dot:T.lineMid,transition:"background .2s",flexShrink:0,cursor:"pointer"}} onClick={()=>setIsExistingLocal(x=>!x)}>
        <div style={{position:"absolute",top:2,left:isExistingLocal?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </div>
    </div>
  </div>

  <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
    <Btn ghost label="Cancel" onClick={onClose} T={T}/>
    <Btn primary icon={P.check} label={saving?"Saving…":"Save changes"} onClick={submit} disabled={saving} T={T}/>
  </div>

</div>

      </div>
    </div>
  );
}
