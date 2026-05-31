import React, { useState, useRef } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, Dot } from "../ui/index.jsx";
import { today } from "../../utils.js";

const REQUIRED = ["name", "phone", "leadSource"];
const FIELD_MAP = {
  // CSV column → internal field
  name: "name", "customer name": "name", "contact name": "name",
  phone: "phone", mobile: "phone", "phone number": "phone",
  email: "email",
  "lead source": "leadSource", source: "leadSource", leadsource: "leadSource",
  city: "cityRegion", region: "cityRegion", "city/region": "cityRegion",
  "enquiry type": "enquiryType", enquiry: "enquiryType",
  "funnel type": "funnelType", type: "funnelType",
  remarks: "remarks", notes: "remarks",
  "next follow up": "nextFollowUp", "follow up": "nextFollowUp", followup: "nextFollowUp",
  "quote amount": "quoteAmount", amount: "quoteAmount", price: "quoteAmount",
  "order number": "orderNumber", order: "orderNumber",
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows = lines.slice(1).map(line => {
    const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v.trim()));
  return { headers, rows };
}

export function CSVImportModal({ onClose, onImport, users, user, T }) {
  const downloadSample = () => {
    const headers = "name,phone,email,lead source,city/region,enquiry type,funnel type,remarks,next follow up,quote amount,order number";
    const rows = [
      "Priya Sharma,9876543210,priya@email.com,WhatsApp,Chennai,New Customer,Normal,Interested in silk sarees,2025-06-15,5000,ORD001",
      "Anita Kumar,9123456789,anita@gmail.com,Call,Bangalore,Repeat Customer,High Value,Wants bridal lehenga,2025-06-20,25000,",
      "Meena Raj,9988776655,,Social media,Coimbatore,Bulk Order,Bulk,School uniform order,,15000,ORD003",
    ].join("\n");
    const csv = headers + "\n" + rows;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "ekanta_crm_sample.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const [step, setStep]       = useState("upload");
  const [parsed, setParsed]   = useState(null);
  const [mapped, setMapped]   = useState({});
  const [preview, setPreview] = useState([]);
  const [errors, setErrors]   = useState([]);
  const [importing, setImp]   = useState(false);
  const [imported, setImported]= useState(0);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      if (!headers.length) return;
      // Auto-map headers
      const autoMap = {};
      headers.forEach(h => { if (FIELD_MAP[h]) autoMap[h] = FIELD_MAP[h]; });
      setParsed({ headers, rows });
      setMapped(autoMap);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const buildLead = (row) => {
    const lead = { status: "Pending", createdAt: new Date().toISOString(), createdBy: user.name, products: [], isExisting: false };
    Object.entries(mapped).forEach(([col, field]) => {
      if (field && row[col] !== undefined) lead[field] = row[col];
    });
    return lead;
  };

  const validateAndPreview = () => {
    const errs = [];
    const valid = parsed.rows.map((row, i) => {
      const lead = buildLead(row);
      const missing = REQUIRED.filter(f => !lead[f]);
      if (missing.length) errs.push(`Row ${i+2}: missing ${missing.join(", ")}`);
      return { lead, valid: !missing.length };
    });
    setPreview(valid);
    setErrors(errs);
  };

  const doImport = async () => {
    setImp(true);
    const leads = preview.filter(r => r.valid).map(r => r.lead);
    await onImport(leads);
    setImported(leads.length);
    setStep("done");
    setImp(false);
  };

  const INTERNAL_FIELDS = ["name","phone","email","cityRegion","enquiryType","funnelType","leadSource","nextFollowUp","quoteAmount","orderNumber","remarks","assignedTo"];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 8px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{ background:T.surface,borderRadius:14,width:"100%",maxWidth:"min(640px,calc(100vw - 16px))",maxHeight:"94dvh",boxShadow:T.shadowXl,animation:"scaleIn .2s ease",display:"flex",flexDirection:"column" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 22px",borderBottom:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:F }}>Import Leads from CSV</div>
            <div style={{ fontSize:12,color:T.inkMuted,fontFamily:F,marginTop:2 }}>
              {step==="upload"?"Upload a CSV file to bulk-import leads":step==="preview"?`${parsed?.rows.length} rows found — map columns below`:"Import complete"}
            </div>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,border:`1px solid ${T.line}`,borderRadius:6,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic d={P.close} sz={12} color={T.inkSub}/>
          </button>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"20px 22px" }}>

          {step==="upload" && (
            <div>
              {/* Sample download */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surfaceEl,border:`1px solid ${T.line}`,borderRadius:8,padding:"12px 16px",marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.ink,fontFamily:F,marginBottom:2 }}>📄 Need a template?</div>
                  <div style={{ fontSize:11,color:T.inkMuted,fontFamily:F }}>Download our sample CSV to see the correct format</div>
                </div>
                <button onClick={downloadSample}
                  style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${T.brand}`,background:T.brandSubtle,color:T.brand,fontSize:12,fontFamily:F,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",flexShrink:0 }}>
                  ⬇ Sample CSV
                </button>
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${T.lineMid}`,borderRadius:10,padding:"40px 20px",textAlign:"center",cursor:"pointer",transition:"all .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#5B3BE8";e.currentTarget.style.background=T.brandSubtle;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.lineMid;e.currentTarget.style.background="transparent";}}>
                <div style={{ fontSize:36,marginBottom:12 }}>📂</div>
                <div style={{ fontSize:14,fontWeight:600,color:T.ink,fontFamily:F,marginBottom:6 }}>Click to upload CSV</div>
                <div style={{ fontSize:12,color:T.inkMuted,fontFamily:F }}>or drag and drop your file here</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display:"none" }}/>
            </div>
          )}

          {step==="preview" && parsed && (
            <div>
              {/* Column mapping */}
              <div style={{ fontSize:12,fontWeight:700,color:T.inkMuted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F,marginBottom:10 }}>Map CSV Columns</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                {parsed.headers.map(h => (
                  <div key={h} style={{ display:"flex",alignItems:"center",gap:8,background:T.surfaceEl,padding:"8px 10px",borderRadius:6,border:`1px solid ${T.line}` }}>
                    <span style={{ fontSize:12,color:T.ink,fontFamily:F_MONO,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h}</span>
                    <span style={{ color:T.inkMuted,fontSize:12 }}>→</span>
                    <select value={mapped[h]||""} onChange={e=>setMapped(m=>({...m,[h]:e.target.value}))}
                      style={{ fontSize:11,fontFamily:F,border:`1px solid ${T.lineMid}`,borderRadius:4,padding:"3px 6px",background:T.surface,color:T.ink,flex:1 }}>
                      <option value="">Skip</option>
                      {INTERNAL_FIELDS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <Btn ghost label="Preview rows" onClick={validateAndPreview} T={T} />

              {errors.length > 0 && (
                <div style={{ marginTop:12,background:T.lost.bg,border:`1px solid ${T.lost.dot}44`,borderRadius:7,padding:"10px 14px" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.lost.text,marginBottom:6 }}>⚠ {errors.length} validation issues</div>
                  {errors.slice(0,5).map((e,i)=><div key={i} style={{ fontSize:11,color:T.lost.text,fontFamily:F_MONO }}>{e}</div>)}
                </div>
              )}

              {preview.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.inkMuted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F,marginBottom:8 }}>
                    Preview ({preview.filter(r=>r.valid).length} valid / {preview.filter(r=>!r.valid).length} invalid)
                  </div>
                  <div style={{ maxHeight:180,overflowY:"auto",border:`1px solid ${T.line}`,borderRadius:7 }}>
                    {preview.slice(0,8).map((r,i)=>(
                      <div key={i} style={{ padding:"8px 12px",borderBottom:i<preview.length-1?`1px solid ${T.line}`:"none",display:"flex",gap:10,alignItems:"center",background:r.valid?T.surface:T.lost.bg }}>
                        <Dot color={r.valid?T.won.dot:T.lost.dot} size={6}/>
                        <span style={{ fontSize:12,fontWeight:500,color:T.ink,fontFamily:F }}>{r.lead.name||"(no name)"}</span>
                        <span style={{ fontSize:11,color:T.inkMuted,fontFamily:F }}>{r.lead.phone}</span>
                        <span style={{ fontSize:11,color:T.inkMuted,fontFamily:F }}>{r.lead.leadSource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step==="done" && (
            <div style={{ textAlign:"center",padding:"24px 0" }}>
              <div style={{ fontSize:52,marginBottom:16 }}>✅</div>
              <div style={{ fontSize:18,fontWeight:700,color:T.ink,fontFamily:F,marginBottom:8 }}>Import Complete!</div>
              <div style={{ fontSize:14,color:T.inkMuted,fontFamily:F }}>{imported} leads imported successfully</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"flex-end",gap:10 }}>
          <Btn ghost label="Close" onClick={onClose} T={T}/>
          {step==="preview" && preview.filter(r=>r.valid).length>0 && (
            <Btn primary icon={P.dl} label={importing?`Importing…`:`Import ${preview.filter(r=>r.valid).length} leads`} onClick={doImport} disabled={importing} T={T}/>
          )}
        </div>
      </div>
    </div>
  );
}
