import React, { useState, useEffect } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Dot, Btn, FInput, FSelect, inputSx, selectBg, mkFocus, mkBlur } from "../ui/index.jsx";
import { FULL, CATS, ENQS, FTYPES, LEAD_SOURCES } from "../../constants.js";
import { inr } from "../../utils.js";

// ─── SECTION DIVIDER ──────────────────────────────────────────────────────────
function Section({ icon, title, children, T }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontSize:10, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:F_MONO }}>{title}</span>
        <div style={{ flex:1, height:1, background:T.line }} />
      </div>
      {children}
    </div>
  );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children, T }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {label && (
        <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, letterSpacing:"0.01em" }}>
          {label}{required && <span style={{ color:"#ef4444", marginLeft:2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize:11, color:"#ef4444", fontFamily:F }}>{error}</span>}
      {hint  && <span style={{ fontSize:10, color:T.inkMuted, fontFamily:F }}>{hint}</span>}
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export function FunnelForm({ onClose, onSave, existing, user, users = [], T }) {
  const DRAFT_KEY = `ek-draft-${user?.username || "user"}`;

  const blank = {
    name:"", phone:"", email:"", enquiryType:"", funnelType:"", leadSource:"",
    cityRegion:"", nextFollowUp:"", remarks:"", deliveryDetails:"", paymentTerms:"",
    quotationNo:"", orderNumber:"", quoteQty:"", quoteAmount:"", quoteDesc:"",
    status:"Pending", assignedTo:"", lostDropReason:"", isExisting:false,
    products:[{ desc:"", category:"", qty:"", price:"" }],
  };

  const loadDraft  = () => { try { const d = localStorage.getItem(DRAFT_KEY); return d ? JSON.parse(d) : null; } catch { return null; } };
  const saveDraft  = (data) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {} };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  const draft = !existing ? loadDraft() : null;
  const [showDraftBanner, setShowDraftBanner] = useState(!!draft);
  const [form, setForm] = useState(existing ? {
    ...blank, ...existing,
    quotationNo:     existing.quotationNo     ?? "",
    orderNumber:     existing.orderNumber     ?? "",
    paymentTerms:    existing.paymentTerms    ?? "",
    deliveryDetails: existing.deliveryDetails ?? "",
    lostDropReason:  existing.lostDropReason  ?? "",
    cityRegion:      existing.cityRegion      ?? "",
    email:           existing.email           ?? "",
    remarks:         existing.remarks         ?? "",
    quoteDesc:       existing.quoteDesc       ?? "",
    products: existing.products?.length ? existing.products : blank.products,
  } : blank);

  const [errs, setErrs] = useState({});

  useEffect(() => {
    if (existing) return;
    const hasData = form.name || form.phone || form.email || form.remarks ||
      (form.products || []).some(p => p.desc);
    if (hasData) saveDraft(form);
  }, [form, existing]);

  const restoreDraft = () => {
    if (draft) setForm({ ...blank, ...draft, products: draft.products?.length ? draft.products : blank.products });
    setShowDraftBanner(false);
  };
  const discardDraft = () => { clearDraft(); setShowDraftBanner(false); };

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setP = (i, k, v) => { const p = [...form.products]; p[i] = { ...p[i], [k]: v }; set("products", p); };

  const isWon       = form.status === "Won";
  const isLostOrDrop = form.status === "Lost" || form.status === "Drop";
  const fo = mkFocus(T);
  const bl = mkBlur(T);
  const inp = (err) => ({ ...inputSx(T, err) });

  const validate = () => {
    const e = {};
    if (!form.name)                                           e.name          = "Required";
    if (!form.phone)                                          e.phone         = "Required";
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone.trim())) e.phone         = "Invalid phone number";
    if (!form.enquiryType)                                    e.enquiryType   = "Required";
    if (!form.funnelType)                                     e.funnelType    = "Required";
    if (!form.leadSource)                                     e.leadSource    = "Required";
    if (!form.nextFollowUp && !isWon)                         e.nfu           = "Required";
    if (!form.remarks)                                        e.remarks       = "Required";
    if (!form.deliveryDetails)                                e.deliveryDetails = "Required";
    if (!form.quoteDesc)                                      e.quoteDesc     = "Required";
    if (!form.quoteQty)                                       e.quoteQty      = "Required";
    else if (Number(form.quoteQty) <= 0)                      e.quoteQty      = "Must be > 0";
    if (!form.quoteAmount)                                    e.quoteAmount   = "Required";
    else if (Number(form.quoteAmount) <= 0)                   e.quoteAmount   = "Must be > 0";
    if (!form.products.some(p => p.desc.trim()))              e.products      = "At least one product is required";
    if (!user?.name)                                          e.auth          = "You must be logged in";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const submit = () => { if (validate()) { clearDraft(); onSave(form); } };

  const prodTotal = (form.products || []).reduce((a, p) => a + (Number(p.qty) * Number(p.price) || 0), 0);
  const creUsers  = users.filter(u => u.role === "CRE" || u.role === "Editor");

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = {
    background: T.surfaceEl,
    border: `1px solid ${T.line}`,
    borderRadius: 12,
    padding: "clamp(12px,3vw,16px) clamp(12px,3.5vw,18px)",
  };

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.52)", zIndex:9100, display:"flex", alignItems:"center", justifyContent:"center", padding:"8px", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ek-funnel-form"
        style={{
          background: T.surface, borderRadius:16,
          width:"100%", maxWidth:"min(720px,100vw)",
          maxHeight:"98dvh",
          display:"flex", flexDirection:"column",
          boxShadow:`0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.12)`,
          animation:"scaleIn .18s cubic-bezier(0.4,0,0.2,1)",
          overflow:"hidden",
          border:`1px solid ${T.lineMid}`,
        }}
      >

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"clamp(12px,3vw,16px) clamp(14px,4vw,22px)", borderBottom:`1px solid ${T.line}`, background:T.surface, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:T.brandSubtle, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${T.brand}30`, flexShrink:0 }}>
              <Ic d={existing ? P.edit : P.plus} sz={16} color={T.brand} sw={2.5} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:T.ink, fontFamily:F, letterSpacing:"-0.3px" }}>
                {existing ? "Edit Lead" : "New Lead"}
              </div>
              <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F, marginTop:1 }}>
                {existing ? "Update this lead's information" : "Fill in the details to add a new lead"}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {!existing && (
              <div style={{ display:"none", alignItems:"center", gap:5, fontSize:10, color:T.inkMuted, fontFamily:F_MONO }} className="ek-hide-mobile">
                <div style={{ width:5, height:5, borderRadius:"50%", background:"#16A34A", animation:"pulse 2s infinite" }} />
                Auto-saving
              </div>
            )}
            <button onClick={onClose} style={{ width:30, height:30, border:`1px solid ${T.line}`, borderRadius:8, background:T.surfaceEl, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.inkSub, transition:"all .12s" }} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHover} onMouseLeave={e=>e.currentTarget.style.background=T.surfaceEl}>
              <Ic d={P.close} sz={13} color={T.inkSub} />
            </button>
          </div>
        </div>

        {/* ── DRAFT BANNER ── */}
        {showDraftBanner && draft && !existing && (
          <div style={{ padding:"10px clamp(14px,4vw,22px)", background:`rgba(91,59,232,0.07)`, borderBottom:`1px solid rgba(91,59,232,0.14)`, display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
            <span style={{ fontSize:14 }}>📝</span>
            <div style={{ flex:1, minWidth:100 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#5B3BE8", fontFamily:F }}>Unsaved draft found</div>
              <div style={{ fontSize:11, color:"#5B3BE8", opacity:0.7, fontFamily:F }}>{draft.name ? `"${draft.name}"` : "Unnamed lead"} — saved earlier</div>
            </div>
            <button onClick={restoreDraft} style={{ padding:"5px 12px", background:"#5B3BE8", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>Restore</button>
            <button onClick={discardDraft} style={{ padding:"5px 12px", background:"transparent", color:"#5B3BE8", border:`1px solid rgba(91,59,232,0.3)`, borderRadius:7, fontSize:12, cursor:"pointer" }}>Discard</button>
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"clamp(14px,4vw,20px) clamp(14px,5vw,22px)", display:"flex", flexDirection:"column", gap:"clamp(16px,3vw,22px)", minHeight:0 }}>

          {/* 1 · CONTACT INFO */}
          <Section icon="👤" title="Contact Information" T={T}>
            <div style={card}>
              <div className="ek-form-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                <FInput label="Full Name *" value={form.name} onChange={v=>set("name",v)} placeholder="Customer name" error={errs.name} T={T}/>
                <FInput label="Phone *" value={form.phone} onChange={v=>set("phone",v)} placeholder="+91 98765 43210" error={errs.phone} T={T}/>
                <FInput label="Email" type="email" value={form.email} onChange={v=>set("email",v)} placeholder="email@company.com" T={T}/>
              </div>
              <FInput label="City / Region" value={form.cityRegion} onChange={v=>set("cityRegion",v)} placeholder="e.g. Chennai, Tamil Nadu" T={T}/>
            </div>
          </Section>

          {/* 2 · LEAD DETAILS */}
          <Section icon="📋" title="Lead Details" T={T}>
            <div style={card}>
              <div className="ek-form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FSelect label="Enquiry Type *" value={form.enquiryType} onChange={v=>set("enquiryType",v)} options={ENQS} error={errs.enquiryType} T={T}/>
                <FSelect label="Funnel Type *"  value={form.funnelType}  onChange={v=>set("funnelType",v)}  options={FTYPES} error={errs.funnelType} T={T}/>
              </div>
              <div className="ek-form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <FSelect label="Lead Source *" value={form.leadSource} onChange={v=>set("leadSource",v)} options={LEAD_SOURCES} placeholder="Select source…" error={errs.leadSource} T={T}/>

                {isWon ? (
                  <Field label="Next Follow-up" T={T}>
                    <div style={{ height:40, padding:"0 12px", background:T.won.bg, border:`1px solid ${T.won.dot}33`, borderRadius:9, display:"flex", alignItems:"center", gap:7, fontSize:12, color:T.won.text, fontFamily:F }}>
                      <Dot color={T.won.dot} size={6}/> Not required for Won deals
                    </div>
                  </Field>
                ) : (
                  <Field label="Next Follow-up *" error={errs.nfu} T={T}>
                    <input type="date" value={form.nextFollowUp} onChange={e=>set("nextFollowUp",e.target.value)} style={{ ...inp(errs.nfu) }} onFocus={fo} onBlur={bl}/>
                  </Field>
                )}
              </div>

              {isLostOrDrop && (
                <div style={{ marginTop:12, padding:"12px 14px", background:form.status==="Lost"?T.lost.bg:T.drop.bg, border:`1px solid ${form.status==="Lost"?T.lost.dot:T.drop.dot}44`, borderRadius:10 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:form.status==="Lost"?T.lost.text:T.drop.text, fontFamily:F, marginBottom:8 }}>
                    {form.status==="Lost" ? "Why was this lead lost?" : "Why was this lead dropped?"}
                  </div>
                  <textarea value={form.lostDropReason} onChange={e=>set("lostDropReason",e.target.value)}
                    placeholder={form.status==="Lost" ? "e.g. Price too high, went to competitor…" : "e.g. Duplicate entry, wrong number…"}
                    rows={2} onFocus={fo} onBlur={bl}
                    style={{ ...inp(), padding:"8px 10px", resize:"vertical", lineHeight:1.5, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
                </div>
              )}
            </div>
          </Section>

          {/* 3 · ASSIGNMENT (managers only) */}
          {FULL.includes(user?.role) && creUsers.length > 0 && (
            <Section icon="👥" title="Assignment" T={T}>
              <div style={card}>
                <FSelect label="Assign to team member" value={form.assignedTo} onChange={v=>set("assignedTo",v)} options={creUsers.map(u=>u.name)} placeholder="Select team member…" T={T}/>
                {form.assignedTo && (
                  <div style={{ marginTop:8, padding:"8px 12px", background:T.brandSubtle, borderRadius:8, fontSize:12, color:T.inkSub, fontFamily:F, border:`1px solid ${T.brand}20` }}>
                    📋 This lead will appear in <strong style={{ color:T.brand }}>{form.assignedTo}</strong>'s dashboard
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* 4 · PRODUCTS */}
          <Section icon="📦" title="Products & Items" T={T}>
            <div style={{ border:`1.5px solid ${errs.products ? "#ef4444" : T.line}`, borderRadius:12, overflow:"hidden", background:T.surface }}>
              {/* Header row */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(120px,2.5fr) minmax(100px,1.4fr) 64px 100px 32px", gap:6, padding:"9px 12px", background:T.surfaceEl, borderBottom:`1px solid ${T.line}` }}>
                {["Product / Item *","Category","Qty","Price (₹)",""].map(h => (
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:T.inkMuted, letterSpacing:"0.07em", textTransform:"uppercase", fontFamily:F_MONO }}>{h}</div>
                ))}
              </div>
              {/* Rows */}
              <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                <div style={{ minWidth:440 }}>
                  {form.products.map((pr, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(120px,2.5fr) minmax(100px,1.4fr) 64px 100px 32px", gap:6, padding:"8px 12px", borderBottom: i<form.products.length-1 ? `1px solid ${T.line}` : "none", alignItems:"center" }}>
                      <input value={pr.desc} onChange={e=>setP(i,"desc",e.target.value)} placeholder='e.g. MacBook Pro 14"' style={{ ...inp(), padding:"7px 10px", fontSize:12 }} onFocus={fo} onBlur={bl}/>
                      <select value={pr.category} onChange={e=>setP(i,"category",e.target.value)} style={{ ...inp(), padding:"7px 26px 7px 9px", fontSize:12, cursor:"pointer", appearance:"none", background:`${T.surface} ${selectBg}` }} onFocus={fo} onBlur={bl}>
                        <option value="">Category</option>
                        {CATS.map(c=><option key={c}>{c}</option>)}
                      </select>
                      <input type="number" value={pr.qty}   onChange={e=>setP(i,"qty",e.target.value)}   placeholder="0" style={{ ...inp(), padding:"7px 8px", fontSize:12 }} onFocus={fo} onBlur={bl}/>
                      <input type="number" value={pr.price} onChange={e=>setP(i,"price",e.target.value)} placeholder="0" style={{ ...inp(), padding:"7px 8px", fontSize:12 }} onFocus={fo} onBlur={bl}/>
                      <button onClick={()=>set("products",form.products.filter((_,x)=>x!==i))} disabled={form.products.length===1}
                        style={{ background:"none", border:"none", cursor:form.products.length===1?"not-allowed":"pointer", color:T.lost.dot, fontSize:18, opacity:form.products.length===1?.2:0.8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, lineHeight:1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div style={{ padding:"9px 12px", borderTop:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <button onClick={()=>set("products",[...form.products,{desc:"",category:"",qty:"",price:""}])}
                  style={{ background:"none", border:`1.5px dashed ${T.brand}`, borderRadius:8, padding:"5px 12px", color:T.brand, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F, display:"inline-flex", alignItems:"center", gap:5 }}>
                  <Ic d={P.plus} sz={11} color={T.brand}/> Add item
                </button>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {errs.products && <span style={{ fontSize:11, color:"#ef4444", fontWeight:500 }}>{errs.products}</span>}
                  {prodTotal > 0 && <span style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:F }}>Total: {inr(prodTotal)}</span>}
                </div>
              </div>
            </div>
          </Section>

          {/* 5 · QUOTATION */}
          <Section icon="💰" title="Quotation" T={T}>
            <div style={card}>
              {/* Row 1: Quotation No + Order Number */}
              <div className="ek-form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FInput label="Quotation No" value={form.quotationNo} onChange={v=>set("quotationNo",v)} placeholder="e.g. QT-2025-001" hint="Optional" T={T}/>
                <FInput label="Order Number" value={form.orderNumber} onChange={v=>set("orderNumber",v)} placeholder="e.g. ORD-2025-001" hint="Optional" T={T}/>
              </div>
              {/* Row 2: Qty + Amount */}
              <div className="ek-form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FInput label="Quantity *"  type="number" value={form.quoteQty}    onChange={v=>set("quoteQty",v)}    placeholder="0" error={errs.quoteQty}    T={T}/>
                <FInput label="Amount (₹) *" type="number" value={form.quoteAmount} onChange={v=>set("quoteAmount",v)} placeholder="0" error={errs.quoteAmount} T={T}/>
              </div>
              {/* Quote description */}
              <Field label="Quote Description *" error={errs.quoteDesc} T={T}>
                <textarea value={form.quoteDesc} onChange={e=>set("quoteDesc",e.target.value)}
                  placeholder="Describe the quotation — model specs, warranty, inclusions…"
                  rows={2} onFocus={fo} onBlur={bl}
                  style={{ ...inp(errs.quoteDesc), padding:"9px 11px", resize:"vertical", lineHeight:1.6, width:"100%", boxSizing:"border-box" }}/>
              </Field>
            </div>
          </Section>

          {/* 6 · REMARKS */}
          <Section icon="📝" title="Remarks & Notes" T={T}>
            <div style={card}>
              <Field label="Notes *" error={errs.remarks} T={T}>
                <textarea value={form.remarks} onChange={e=>set("remarks",e.target.value)}
                  placeholder="Customer preferences, call notes, special instructions…"
                  rows={3} onFocus={fo} onBlur={bl}
                  style={{ ...inp(errs.remarks), padding:"9px 11px", resize:"vertical", lineHeight:1.6, width:"100%", boxSizing:"border-box" }}/>
              </Field>
            </div>
          </Section>

          {/* 7 · DELIVERY & PAYMENT */}
          <Section icon="🚚" title="Delivery & Payment" T={T}>
            <div style={card}>
              <div className="ek-form-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <Field label="Delivery Details *" error={errs.deliveryDetails} T={T}>
                  <textarea value={form.deliveryDetails} onChange={e=>set("deliveryDetails",e.target.value)}
                    placeholder="e.g. Dispatch by May 10, free installation…"
                    rows={3} onFocus={fo} onBlur={bl}
                    style={{ ...inp(errs.deliveryDetails), padding:"9px 11px", resize:"vertical", lineHeight:1.6, width:"100%", boxSizing:"border-box" }}/>
                </Field>
                <Field label="Payment Terms" T={T}>
                  <textarea value={form.paymentTerms} onChange={e=>set("paymentTerms",e.target.value)}
                    placeholder="e.g. 50% advance, balance on delivery. UPI / Bank…"
                    rows={3} onFocus={fo} onBlur={bl}
                    style={{ ...inp(), padding:"9px 11px", resize:"vertical", lineHeight:1.6, width:"100%", boxSizing:"border-box" }}/>
                </Field>
              </div>
            </div>
          </Section>

        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop:`1px solid ${T.line}`, padding:"clamp(10px,2.5vw,14px) clamp(14px,4vw,22px) clamp(12px,3vw,16px)", background:T.surface, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>

          {/* New vs Existing toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", background:form.isExisting?T.drop.bg:T.surfaceEl, border:`1px solid ${form.isExisting?T.drop.dot:T.line}`, borderRadius:10, transition:"all .2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:14 }}>{form.isExisting ? "📁" : "🆕"}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:form.isExisting?T.drop.text:T.ink, fontFamily:F }}>{form.isExisting ? "Existing Deal" : "New Deal"}</div>
                <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F }}>{form.isExisting ? "Excluded from stats" : "Counts in all stats & analytics"}</div>
              </div>
            </div>
            <div style={{ position:"relative", width:38, height:22, borderRadius:11, background:form.isExisting?T.drop.dot:T.lineMid, transition:"background .2s", cursor:"pointer", flexShrink:0 }}
              onClick={()=>set("isExisting",!form.isExisting)}>
              <div style={{ position:"absolute", top:3, left:form.isExisting?19:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,0.25)" }}/>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, display:"flex", alignItems:"center", gap:5 }}>
              {!existing && <><span>💾</span> Draft auto-saved</>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn ghost label="Cancel" onClick={onClose} T={T}/>
              <Btn primary icon={existing?P.check:P.plus} label={existing?"Save Changes":"Add Lead"} onClick={submit} T={T}/>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
