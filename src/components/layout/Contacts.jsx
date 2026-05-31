import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { F, F_MONO, F_BODY } from "../../theme/index.js";
import { Avatar, StatusPill, Ic, P } from "../ui/index.jsx";
import { inr, big, today } from "../../utils.js";
import { FULL } from "../../constants.js";
import { crmService } from "../../services/crmService.js";

// ── Custom contact-level XLS exporter ────────────────────────────────────────
function exportContactsXls(contactList, segmentLabel, includeCreatedBy, filename) {
  const e = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const headers = ["#", "Name", "Phone", "Location", "Email", "Lead Source", "Segment", "Total Deals", "Won Deals", "Total Revenue (₹)"];
  if (includeCreatedBy) headers.push("Created By");

  const hRow = `<Row ss:StyleID="h">${headers.map(h => `<Cell><Data ss:Type="String">${e(h)}</Data></Cell>`).join("")}</Row>`;

  const rows = contactList.map((c, i) => {
    const cells = [
      [i + 1, "Number"],
      [c.name || ""],
      [c.phone || ""],
      [c.city || ""],
      [c.email || ""],
      [c.leadSource || ""],
      [segmentLabel],
      [c.deals.length, "Number"],
      [c.wonCount, "Number"],
      [c.totalRevenue || 0, "Number"],
    ];
    if (includeCreatedBy) cells.push([c.createdBy || ""]);
    return `<Row>${cells.map(([v, t = "String"]) => `<Cell><Data ss:Type="${t}">${e(v)}</Data></Cell>`).join("")}</Row>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/><Interior ss:Color="#4361ee" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Contacts"><Table>${hRow}${rows}</Table></Worksheet></Workbook>`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }));
  a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Segment constants ─────────────────────────────────────────────────────────
const SEG_COLORS = ["#5B3BE8","#10b981","#f59e0b","#ef4444","#0891b2","#8b5cf6","#ec4899","#059669"];

// ── Contact filter definitions ────────────────────────────────────────────────
const C_FILTERS = [
  { key:"isRepeat",  label:"Customer type", type:"select",  options:["Repeat customer","First-time"] },
  { key:"hasWon",    label:"Won deals",      type:"select",  options:["Has won","No wins"] },
  { key:"hasEmail",  label:"Email",          type:"select",  options:["Has email","No email"] },
  { key:"hasPhone",  label:"Phone",          type:"select",  options:["Has phone","No phone"] },
  { key:"city",      label:"City",           type:"dynamic" },
  { key:"dealRange", label:"Deal count",     type:"range",   placeholder:["Min","Max"] },
  { key:"revRange",  label:"Revenue (₹)",    type:"range",   placeholder:["Min ₹","Max ₹"] },
];

function applyFilter(c, def, value) {
  if (!value) return true;
  switch (def.key) {
    case "isRepeat":  return value === "Repeat customer" ? c.deals.length > 1 : c.deals.length === 1;
    case "hasWon":    return value === "Has won" ? c.wonCount > 0 : c.wonCount === 0;
    case "hasEmail":  return value === "Has email" ? !!c.email : !c.email;
    case "hasPhone":  return value === "Has phone" ? !!c.phone : !c.phone;
    case "city":      return (c.city || "").toLowerCase().includes(value.toLowerCase());
    case "dealRange": { const [mn,mx] = value; if (mn && c.deals.length < Number(mn)) return false; if (mx && c.deals.length > Number(mx)) return false; return true; }
    case "revRange":  { const [mn,mx] = value; if (mn && c.totalRevenue < Number(mn)) return false; if (mx && c.totalRevenue > Number(mx)) return false; return true; }
    default: return true;
  }
}

// Returns true if a contact matches all filters in a saved segment
function matchesSegment(c, filters = {}) {
  return C_FILTERS.every(def => {
    const v = filters[def.key];
    if (!v) return true;
    if (def.type === "range" && Array.isArray(v) && !v[0] && !v[1]) return true;
    return applyFilter(c, def, v);
  });
}

// ── ContactFilterBar ──────────────────────────────────────────────────────────
function ContactFilterBar({ fil, setF, reset, cities, T }) {
  const [inputVal, setInputVal] = useState("");
  const [step, setStep] = useState("type");
  const [activeDef, setActiveDef] = useState(null);
  const [rangeVal, setRangeVal] = useState(["",""]);
  const [dropOpen, setDropOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) closeAll(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getOptions = def => def.type === "dynamic" ? cities : def.options || [];
  const activeSegments = C_FILTERS.filter(def => {
    const v = fil[def.key];
    if (def.type === "range") return Array.isArray(v) && (v[0] || v[1]);
    return v && v !== "";
  });
  const usedKeys = new Set(activeSegments.map(d => d.key));
  const typeList = C_FILTERS.filter(d => d.label.toLowerCase().includes(inputVal.toLowerCase()) && (editingKey !== null || !usedKeys.has(d.key)));
  const valueList = activeDef && activeDef.type !== "range" ? getOptions(activeDef).filter(o => o.toLowerCase().includes(inputVal.toLowerCase())) : [];

  const closeAll = () => { setDropOpen(false); setStep("type"); setActiveDef(null); setInputVal(""); setEditingKey(null); };
  const openAdd = () => { setEditingKey(null); setDropOpen(true); setStep("type"); setInputVal(""); setHighlighted(0); setTimeout(() => inputRef.current?.focus(), 0); };
  const openEdit = def => { setEditingKey(def.key); setActiveDef(def); setInputVal(""); setHighlighted(0); setRangeVal(Array.isArray(fil[def.key]) ? fil[def.key] : ["",""]); setStep("value"); setDropOpen(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const pickType = def => { setActiveDef(def); setEditingKey(def.key); setInputVal(""); setHighlighted(0); setRangeVal(["",""]); setStep("value"); setTimeout(() => inputRef.current?.focus(), 0); };
  const pickValue = val => { if (!activeDef) return; setF(activeDef.key, val); closeAll(); };
  const commitRange = () => { if (!activeDef) return; if (rangeVal[0] || rangeVal[1]) setF(activeDef.key, rangeVal); closeAll(); };
  const removeSegment = key => { const def = C_FILTERS.find(d => d.key === key); if (!def) return; setF(key, def.type === "range" ? null : ""); if (editingKey === key) closeAll(); };

  const onKeyDown = e => {
    e.stopPropagation();
    const total = step === "type" ? typeList.length : valueList.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, total - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === "type" && typeList[highlighted]) pickType(typeList[highlighted]);
      else if (step === "value") { if (activeDef?.type === "range") commitRange(); else if (valueList[highlighted]) pickValue(valueList[highlighted]); }
    }
    if (e.key === "Escape") closeAll();
    if (e.key === "Backspace" && !inputVal && step === "value") { setStep("type"); setActiveDef(null); setInputVal(""); }
  };

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {activeSegments.map(def => {
          const v = fil[def.key];
          const valLabel = Array.isArray(v) ? `${v[0] || "0"} → ${v[1] || "∞"}` : String(v);
          const isEditing = editingKey === def.key && dropOpen;
          return (
            <span key={def.key} style={{ display:"inline-flex", alignItems:"center", border:`1px solid ${isEditing ? T.brand : T.line}`, borderRadius: 6, background: T.surface, fontSize: 12, fontFamily: F, overflow: "hidden", flexShrink: 0, boxShadow: isEditing ? `0 0 0 2px rgba(${T.brandRgb},.15)` : "none" }}>
              <span onMouseDown={e=>{e.preventDefault();e.stopPropagation();openEdit(def);}} style={{ padding:"3px 7px", color:T.inkSub, borderRight:`1px solid ${T.line}`, background:T.surfaceEl, userSelect:"none", cursor:"pointer" }}>{def.label}</span>
              <span onMouseDown={e=>{e.preventDefault();e.stopPropagation();openEdit(def);}} style={{ padding:"3px 8px", color:T.brand, fontWeight:700, background:T.brandSubtle, userSelect:"none", cursor:"pointer" }}>{valLabel}</span>
              <span onMouseDown={e=>{e.preventDefault();e.stopPropagation();removeSegment(def.key);}} style={{ padding:"3px 7px", color:T.inkMuted, borderLeft:`1px solid ${T.line}`, cursor:"pointer", userSelect:"none", fontSize:14, lineHeight:1 }}>×</span>
            </span>
          );
        })}
        <div onMouseDown={e=>{e.stopPropagation(); if(!dropOpen) openAdd();}} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", border:`1.5px solid ${dropOpen && !editingKey ? T.brand : "transparent"}`, borderRadius:6, cursor:"text", flex:1, minWidth:100 }}>
          <Ic d={P.search} sz={12} color={T.inkMuted}/>
          <input ref={inputRef} value={inputVal} onChange={e=>{setInputVal(e.target.value);setHighlighted(0);}} onMouseDown={e=>{e.stopPropagation();if(!dropOpen)openAdd();}} onFocus={()=>{if(!dropOpen)openAdd();}} onKeyDown={onKeyDown}
            placeholder={!dropOpen ? "Filter contacts…" : step==="type" ? "Search filters…" : `Search ${activeDef?.label||""}…`}
            style={{ border:"none", outline:"none", background:"transparent", fontSize:12, fontFamily:F, color:T.ink, flex:1, minWidth:60 }}/>
        </div>
        {activeSegments.length > 0 && (
          <button onMouseDown={e=>{e.preventDefault();reset();closeAll();}} style={{ fontSize:11, color:T.brand, background:"none", border:"none", cursor:"pointer", fontWeight:600, fontFamily:F, padding:"0 2px", textDecoration:"underline" }}>Clear</button>
        )}
      </div>
      {dropOpen && (
        <div onMouseDown={e=>e.stopPropagation()} style={{ position:"absolute", zIndex:9999, left:0, top:"calc(100% + 6px)", background:T.surface, border:`1px solid ${T.lineMid}`, borderRadius:10, boxShadow:"0 12px 40px rgba(0,0,0,0.16)", width:280, maxHeight:280, overflowY:"auto" }}>
          {step === "type" && (
            typeList.length === 0
              ? <div style={{ padding:"14px 16px", color:T.inkMuted, fontSize:13 }}>No filters available</div>
              : typeList.map((def, i) => (
                <div key={def.key} onMouseDown={e=>{e.preventDefault();pickType(def);}} onMouseEnter={()=>setHighlighted(i)}
                  style={{ padding:"10px 16px", cursor:"pointer", fontSize:13, fontFamily:F, color:T.ink, background:i===highlighted?T.surfaceEl:"transparent", borderBottom:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{def.label}</span>
                  <Ic d={P.chevR || "M9 18l6-6-6-6"} sz={12} color={T.inkMuted}/>
                </div>
              ))
          )}
          {step === "value" && activeDef && activeDef.type !== "range" && (
            valueList.length === 0
              ? <div style={{ padding:"13px 16px", color:T.inkMuted, fontSize:13 }}>No options</div>
              : valueList.map((opt, i) => {
                const isSel = fil[activeDef.key] === opt;
                return (
                  <div key={opt} onMouseDown={e=>{e.preventDefault();pickValue(opt);}} onMouseEnter={()=>setHighlighted(i)}
                    style={{ padding:"10px 16px", cursor:"pointer", fontSize:13, fontFamily:F, color:T.ink, background:i===highlighted?T.surfaceEl:"transparent", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ width:16,height:16,borderRadius:4,flexShrink:0,border:`1.5px solid ${isSel?T.brand:T.lineMid}`,background:isSel?T.brand:"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      {isSel && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                    </span>
                    {opt}
                  </div>
                );
              })
          )}
          {step === "value" && activeDef?.type === "range" && (
            <div style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, marginBottom:8, letterSpacing:"0.08em", textTransform:"uppercase" }}>{activeDef.label}</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {[0,1].map(idx => (
                  <input key={idx} type="number" value={rangeVal[idx]} onChange={e=>{const n=[...rangeVal];n[idx]=e.target.value;setRangeVal(n);}} onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")commitRange();if(e.key==="Escape")closeAll();}}
                    placeholder={activeDef.placeholder?.[idx] || (idx===0?"Min":"Max")}
                    style={{ flex:1, padding:"7px 10px", border:`1.5px solid ${T.line}`, borderRadius:6, fontSize:13, fontFamily:F, color:T.ink, background:T.surface, outline:"none" }}
                    onFocus={e=>e.target.style.borderColor=T.brand} onBlur={e=>e.target.style.borderColor=T.line}/>
                ))}
              </div>
              <button onMouseDown={e=>{e.preventDefault();commitRange();}} style={{ width:"100%", padding:"8px", background:T.brand, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:F }}>Apply</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SegmentsBar ───────────────────────────────────────────────────────────────
function SegmentsBar({ segments, activeSegId, contacts, fil, onSelect, onDelete, onSaveNew, T }) {
  const hasActiveFilter = C_FILTERS.some(def => {
    const v = fil[def.key];
    if (def.type === "range") return Array.isArray(v) && (v[0] || v[1]);
    return v && v !== "";
  });

  const getCnt = useCallback(filters => contacts.filter(c => matchesSegment(c, filters)).length, [contacts]);

  const pill = (active, color, bg) => ({
    display:"flex", alignItems:"center", gap:5,
    padding:"5px 12px", borderRadius:20, cursor:"pointer",
    border:`1.5px solid ${active ? color : T.line}`,
    background: active ? bg : T.surfaceEl,
    color: active ? color : T.inkMuted,
    fontSize:12, fontWeight: active ? 700 : 500,
    fontFamily:F, flexShrink:0, transition:"all .15s",
    whiteSpace:"nowrap",
  });

  return (
    <div style={{ display:"flex", gap:8, alignItems:"center", overflowX:"auto", padding:"9px 20px", borderBottom:`1px solid ${T.line}`, background:T.surface, scrollbarWidth:"none", flexShrink:0 }}>

      {/* All Contacts */}
      <button onClick={() => onSelect(null)} style={{ ...pill(!activeSegId, T.brand, T.brandSubtle), border:"none" }}
        onMouseEnter={e => { if (activeSegId) e.currentTarget.style.background = T.surfaceHover; }}
        onMouseLeave={e => { if (activeSegId) e.currentTarget.style.background = T.surfaceEl; }}>
        <span style={{ fontSize:10 }}>👥</span>
        All
        <span style={{ background:!activeSegId?T.brand:T.line, color:!activeSegId?"#fff":T.inkMuted, borderRadius:10, padding:"1px 7px", fontSize:9, fontWeight:800, fontFamily:F_MONO }}>
          {contacts.length}
        </span>
      </button>

      {segments.length > 0 && <div style={{ width:1, height:20, background:T.line, flexShrink:0 }}/>}

      {/* Saved segments */}
      {segments.map(seg => {
        const isActive = activeSegId === seg.id;
        const cnt = getCnt(seg.filters);
        return (
          <div key={seg.id} style={{ display:"flex", alignItems:"center", borderRadius:20, border:`1.5px solid ${isActive ? seg.color : T.line}`, background: isActive ? `${seg.color}14` : T.surfaceEl, overflow:"hidden", flexShrink:0, transition:"all .15s" }}>
            <button onClick={() => onSelect(seg)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:"none", border:"none", cursor:"pointer", color:isActive?seg.color:T.inkMuted, fontSize:12, fontWeight:isActive?700:500, fontFamily:F }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:seg.color, boxShadow:isActive?`0 0 0 2px ${seg.color}30`:"none", flexShrink:0 }}/>
              {seg.name}
              <span style={{ background:isActive?seg.color:T.line, color:isActive?"#fff":T.inkMuted, borderRadius:10, padding:"1px 6px", fontSize:9, fontWeight:800, fontFamily:F_MONO }}>
                {cnt}
              </span>
            </button>
            <button
              onClick={e => { e.stopPropagation(); if (window.confirm(`Delete segment "${seg.name}"?`)) onDelete(seg.id); }}
              style={{ padding:"5px 9px 5px 2px", background:"none", border:"none", cursor:"pointer", color:T.inkMuted, fontSize:13, lineHeight:1, opacity:0.4, transition:"opacity .1s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.4"}>
              ×
            </button>
          </div>
        );
      })}

      {/* Save current filter as segment */}
      {hasActiveFilter && (
        <>
          <div style={{ width:1, height:20, background:T.line, flexShrink:0 }}/>
          <button onClick={onSaveNew}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20, border:`1.5px dashed ${T.brand}`, background:"transparent", color:T.brand, fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, fontFamily:F }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.brand} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Save as Segment
          </button>
        </>
      )}
    </div>
  );
}

// ── CreateSegmentModal ─────────────────────────────────────────────────────────
function CreateSegmentModal({ fil, contacts, onSave, onClose, T }) {
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(SEG_COLORS[0]);
  const [desc,  setDesc]  = useState("");

  const previewCount = useMemo(() => contacts.filter(c => matchesSegment(c, fil)).length, [contacts, fil]);

  const filterLabel = C_FILTERS.filter(def => {
    const v = fil[def.key];
    if (def.type === "range") return Array.isArray(v) && (v[0] || v[1]);
    return v && v !== "";
  }).map(def => {
    const v = fil[def.key];
    const vl = Array.isArray(v) ? `${v[0]||"0"}–${v[1]||"∞"}` : String(v);
    return `${def.label}: ${vl}`;
  }).join(" · ") || "No filters applied";

  const canSave = name.trim().length > 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.52)", zIndex:9200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ background:T.surface, borderRadius:16, width:"100%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.24)", border:`1px solid ${T.lineMid}`, animation:"scaleIn .18s ease", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:color, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 12px ${color}44` }}>
              <span style={{ fontSize:15 }}>🏷</span>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:T.ink, fontFamily:F }}>Save Segment</div>
              <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F, marginTop:1 }}>Name and save these filters for quick reuse</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, border:`1px solid ${T.line}`, borderRadius:7, background:T.surfaceEl, cursor:"pointer", fontSize:16, color:T.inkMuted, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Filter preview */}
          <div style={{ background:T.surfaceEl, borderRadius:10, padding:"11px 14px", border:`1px solid ${T.line}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:F_MONO, marginBottom:5 }}>Filter Criteria</div>
            <div style={{ fontSize:12, color:T.inkSub, fontFamily:F, marginBottom:8, lineHeight:1.5 }}>{filterLabel}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.brand, background:T.brandSubtle, padding:"2px 10px", borderRadius:10, fontFamily:F_MONO }}>
                {previewCount} contact{previewCount !== 1 ? "s" : ""} match now
              </span>
              <span style={{ fontSize:10, color:T.inkMuted, fontFamily:F }}>· auto-updates as contacts are added</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>
              Segment Name <span style={{ color:"#ef4444" }}>*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSave && onSave(name.trim(), color, desc.trim())}
              autoFocus placeholder="e.g. Chennai Customers, Repeat Buyers, High Value…"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${T.line}`, borderRadius:9, fontSize:13, fontFamily:F, color:T.ink, background:T.surfaceEl, outline:"none", boxSizing:"border-box", transition:"border-color .15s" }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e => e.target.style.borderColor = T.line}/>
          </div>

          {/* Color picker */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:8 }}>Colour</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SEG_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width:28, height:28, borderRadius:"50%", background:c, border: color===c ? `3px solid ${T.ink}` : "3px solid transparent", cursor:"pointer", outline:"none", transition:"all .15s", boxShadow: color===c ? `0 0 0 3px ${c}44` : "none" }}/>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.inkSub, fontFamily:F, display:"block", marginBottom:5 }}>
              Description <span style={{ color:T.inkMuted, fontWeight:400 }}>(optional)</span>
            </label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this segment for?"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${T.line}`, borderRadius:9, fontSize:13, fontFamily:F, color:T.ink, background:T.surfaceEl, outline:"none", boxSizing:"border-box", transition:"border-color .15s" }}
              onFocus={e => e.target.style.borderColor = T.brand}
              onBlur={e => e.target.style.borderColor = T.line}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px 18px", borderTop:`1px solid ${T.line}`, display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button onClick={onClose}
            style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.line}`, background:"transparent", color:T.inkMuted, fontSize:13, cursor:"pointer", fontFamily:F }}>
            Cancel
          </button>
          <button onClick={() => canSave && onSave(name.trim(), color, desc.trim())}
            disabled={!canSave}
            style={{ padding:"8px 20px", borderRadius:8, border:"none", background:canSave ? color : T.surfaceEl, color:canSave?"#fff":T.inkMuted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"not-allowed", fontFamily:F, transition:"all .15s", boxShadow: canSave ? `0 4px 12px ${color}44` : "none" }}>
            💾 Save Segment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ c, selected, onClick, T }) {
  const [hov, setHov] = useState(false);
  const isSelected = selected === c.id;
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: isSelected ? T.brandSubtle : hov ? T.surfaceEl : T.surface,
        border: `1.5px solid ${isSelected ? T.brand : hov ? T.lineMid : T.line}`,
        borderRadius: 14, padding: "16px", cursor: "pointer",
        transition: "all .18s ease",
        boxShadow: isSelected ? `0 4px 18px rgba(${T.brandRgb},0.15)` : hov ? "0 4px 16px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hov && !isSelected ? "translateY(-1px)" : "none",
        position: "relative", overflow: "hidden",
      }}>
      {isSelected && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:T.brand, borderRadius:"0 3px 3px 0" }}/>}

      {/* Avatar + name */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <Avatar name={c.name} size={38} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, minWidth:0 }}>{c.name}</span>
            {c.deals.length > 1 && (
              <span style={{ fontSize:9, fontWeight:800, color:T.pending.text, background:T.pending.bg, padding:"2px 5px", borderRadius:4, flexShrink:0, letterSpacing:"0.05em", border:`1px solid ${T.pending.dot}22` }}>REPEAT</span>
            )}
          </div>
          {c.city && <div style={{ fontSize:11, color:T.inkMuted, display:"flex", alignItems:"center", gap:3 }}>📍 {c.city}</div>}
        </div>
      </div>

      {/* Contact info */}
      <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:10 }}>
        {c.phone && (
          <div style={{ fontSize:11, color:T.inkSub, display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ color:T.inkMuted }}>📞</span>
            <span style={{ fontFamily:F_MONO }}>{c.phone}</span>
          </div>
        )}
        {c.email && (
          <div style={{ fontSize:11, color:T.inkSub, display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
            <span style={{ color:T.inkMuted }}>✉</span>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.email}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingTop:10, borderTop:`1px solid ${T.line}` }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.brand, background:T.brandSubtle, padding:"3px 8px", borderRadius:6, border:`1px solid ${T.brand}20` }}>
          {c.deals.length} deal{c.deals.length !== 1 ? "s" : ""}
        </span>
        {c.wonCount > 0 && (
          <span style={{ fontSize:11, fontWeight:600, color:T.won.text, background:T.won.bg, padding:"3px 8px", borderRadius:6, border:`1px solid ${T.won.dot}22` }}>✓ {c.wonCount} won</span>
        )}
        {c.totalRevenue > 0 && (
          <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F_MONO, padding:"3px 0", fontWeight:600 }}>{big(c.totalRevenue)}</span>
        )}
      </div>
    </div>
  );
}

// ── Contact Detail Panel ───────────────────────────────────────────────────────
function ContactDetail({ sel, onView, onClose, exportOne, T }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${T.line}`, background:T.surface, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:0 }}>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <Avatar name={sel.name} size={52} />
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.4px", marginBottom:4 }}>{sel.name}</div>
              {sel.phone && <div style={{ fontSize:12, color:T.inkMuted, display:"flex", alignItems:"center", gap:4, marginBottom:2 }}>📞 <span style={{ fontFamily:F_MONO }}>{sel.phone}</span></div>}
              {sel.email && <div style={{ fontSize:12, color:T.inkMuted, marginBottom:2 }}>✉ {sel.email}</div>}
              {sel.city && <div style={{ fontSize:12, color:T.inkMuted }}>📍 {sel.city}</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={() => exportOne(sel)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surfaceEl, color:T.inkSub, fontSize:12, fontFamily:F, cursor:"pointer", fontWeight:600, transition:"all .14s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHover} onMouseLeave={e=>e.currentTarget.style.background=T.surfaceEl}>
              ⬇ Export
            </button>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, border:`1.5px solid ${T.line}`, background:T.surfaceEl, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .14s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceHover} onMouseLeave={e=>e.currentTarget.style.background=T.surfaceEl}>
              <Ic d={P.close} sz={13} color={T.inkSub}/>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:"14px 20px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, borderBottom:`1px solid ${T.line}`, background:T.surface, flexShrink:0 }}>
        {[
          { label:"Total Deals", value:sel.deals.length, color:T.brand },
          { label:"Won Deals",   value:sel.wonCount,      color:T.won.dot },
          { label:"Total Value", value:big(sel.totalRevenue), color:T.brand },
        ].map(s => (
          <div key={s.label} style={{ background:T.bg, border:`1.5px solid ${T.line}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:F, letterSpacing:"-0.5px", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.inkMuted, marginTop:4, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Deal history */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Deal History ({sel.deals.length})</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[...sel.deals].sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||"")).map(deal => (
            <div key={deal.id} onClick={() => { onView(deal); onClose(); }}
              style={{ background:T.surface, border:`1.5px solid ${T.line}`, borderRadius:11, padding:"13px 15px", cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.lineMid; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.line; }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>{deal.enquiryType || "Enquiry"}</span>
                <StatusPill status={deal.status} sm T={T}/>
              </div>
              <div style={{ display:"flex", gap:10, fontSize:11, color:T.inkMuted, flexWrap:"wrap", alignItems:"center" }}>
                {deal.quoteAmount && <span style={{ color:T.brand, fontWeight:700, fontFamily:F_MONO }}>{inr(deal.quoteAmount)}</span>}
                {deal.createdAt && <span>{new Date(deal.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>}
                {deal.assignedTo && <span>→ {deal.assignedTo}</span>}
              </div>
              {deal.remarks && <div style={{ fontSize:12, color:T.inkSub, marginTop:6, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{deal.remarks}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Contacts ─────────────────────────────────────────────────────────────
export function Contacts({ funnels, onView, user, T }) {
  const [search,        setSearch]        = useState("");
  const [selected,      setSelected]      = useState(null);
  const [sortBy,        setSortBy]        = useState("deals");
  const [fil,           setFil]           = useState({});
  const [isMobile,      setIsMobile]      = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [showDetail,    setShowDetail]    = useState(false);
  const [exportOpen,    setExportOpen]    = useState(false);
  const [segments,      setSegments]      = useState([]);
  const [segLoading,    setSegLoading]    = useState(true);
  const [activeSegId,   setActiveSegId]   = useState(null);
  const [showCreateSeg, setShowCreateSeg] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const h = e => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Load segments from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    setSegLoading(true);
    crmService.getAllSegments().then(list => {
      if (!cancelled) { setSegments(list); setSegLoading(false); }
    }).catch(() => setSegLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Create a new segment in Supabase
  const createSegment = useCallback(async (name, color, desc) => {
    try {
      const saved = await crmService.createSegment({ name, color, description:desc, filters:{ ...fil }, createdBy: user?.name || "admin" });
      setSegments(prev => [...prev, saved]);
      setActiveSegId(saved.id);
      setShowCreateSeg(false);
    } catch (e) {
      console.error("Failed to save segment:", e);
    }
  }, [fil, user]);

  const deleteSegment = useCallback(async (id) => {
    try {
      await crmService.deleteSegment(id);
      setSegments(prev => prev.filter(s => s.id !== id));
      if (activeSegId === id) { setActiveSegId(null); setFil({}); }
    } catch (e) {
      console.error("Failed to delete segment:", e);
    }
  }, [activeSegId]);

  const applySegment = useCallback((seg) => {
    if (!seg) { setActiveSegId(null); setFil({}); return; }
    setActiveSegId(seg.id);
    setFil(seg.filters || {});
  }, []);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const setF = useCallback((k, v) => setFil(p => ({ ...p, [k]: v })), []);
  const reset = useCallback(() => setFil({}), []);

  const contacts = useMemo(() => {
    const map = {};
    funnels.forEach(f => {
      const key = (f.phone || "").replace(/\s/g, "") || `nophone_${f.id}`;
      if (!map[key]) map[key] = { id:key, name:f.name, phone:f.phone, email:f.email, city:f.cityRegion, deals:[], totalRevenue:0, wonCount:0, lastContact:f.createdAt, leadSource:f.leadSource||"", createdBy:f.createdBy||"" };
      map[key].deals.push(f);
      if (f.quoteAmount) map[key].totalRevenue += Number(f.quoteAmount);
      if (f.status === "Won") map[key].wonCount++;
      if ((f.createdAt || "") > (map[key].lastContact || "")) {
        map[key].lastContact  = f.createdAt;
        map[key].leadSource   = f.leadSource  || map[key].leadSource;
        map[key].createdBy    = f.createdBy   || map[key].createdBy;
      }
    });
    return Object.values(map);
  }, [funnels]);

  const cities = useMemo(() => [...new Set(contacts.map(c => c.city).filter(Boolean))].sort(), [contacts]);

  const filtered = useMemo(() => {
    let list = contacts;
    const q = search.toLowerCase();
    if (q) list = list.filter(c =>
      (c.name || "").toLowerCase().includes(q) || (c.phone || "").includes(q) ||
      (c.email || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q)
    );
    C_FILTERS.forEach(def => {
      const v = fil[def.key];
      if (!v) return;
      if (def.type === "range" && Array.isArray(v) && !v[0] && !v[1]) return;
      list = list.filter(c => applyFilter(c, def, v));
    });
    return [...list].sort((a, b) => {
      if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "won")     return b.wonCount - a.wonCount;
      if (sortBy === "name")    return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "recent")  return (b.lastContact || "").localeCompare(a.lastContact || "");
      return b.deals.length - a.deals.length;
    });
  }, [contacts, search, fil, sortBy]);

  const sel = selected ? contacts.find(c => c.id === selected) : null;

  // Human-readable label for the currently active segment/filter (used in export)
  const activeSegmentLabel = useMemo(() => {
    // If a named segment is active, use its name
    if (activeSegId) {
      const seg = segments.find(s => s.id === activeSegId);
      if (seg) return seg.name;
    }
    // Otherwise build label from active filters
    const active = C_FILTERS.filter(def => {
      const v = fil[def.key];
      if (def.type === "range") return Array.isArray(v) && (v[0] || v[1]);
      return v && v !== "";
    });
    if (!active.length) return "All Contacts";
    return active.map(def => {
      const v = fil[def.key];
      const valLabel = Array.isArray(v) ? `${v[0] || "0"}–${v[1] || "∞"}` : String(v);
      return `${def.label}: ${valLabel}`;
    }).join(" · ");
  }, [fil, activeSegId, segments]);

  const isFull   = FULL.includes(user?.role);
  const todayStr = today();

  const doExportFiltered = () => {
    exportContactsXls(filtered, activeSegmentLabel, isFull, `Contacts_${activeSegmentLabel.replace(/[^a-z0-9]/gi,"_").slice(0,40)}_${todayStr}.xls`);
    setExportOpen(false);
  };
  const doExportAll = () => {
    exportContactsXls(contacts, "All Contacts", true, `Contacts_All_${todayStr}.xls`);
    setExportOpen(false);
  };
  // Single-contact export (from detail panel)
  const exportOne = c => exportContactsXls([c], "Single Contact", isFull, `${(c.name||"contact").replace(/\s/g,"_")}_${todayStr}.xls`);

  const handleCardClick = (c) => {
    if (isMobile) {
      setSelected(c.id);
      setShowDetail(true);
    } else {
      setSelected(selected === c.id ? null : c.id);
    }
  };

  const handleCloseDetail = () => {
    setSelected(null);
    setShowDetail(false);
  };

  // Mobile detail overlay
  if (isMobile && showDetail && sel) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:500, background:T.bg, display:"flex", flexDirection:"column" }}>
        {/* Mobile detail header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:`1px solid ${T.line}`, background:T.surface, flexShrink:0 }}>
          <button onClick={handleCloseDetail} style={{ width:36,height:36,borderRadius:10,border:`1.5px solid ${T.line}`,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke={T.inkSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize:15, fontWeight:700, color:T.ink }}>Contact Details</span>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          <ContactDetail sel={sel} onView={onView} onClose={handleCloseDetail} exportOne={exportOne} T={T}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", width:"100%", height:"100%", fontFamily:F_BODY, background:T.bg, overflow:"hidden" }}>

      {/* ── LEFT: List ── */}
      <div style={{ flex: sel && !isMobile ? "0 0 42%" : "1 1 auto", display:"flex", flexDirection:"column", background:T.surface, borderRight: sel && !isMobile ? `1px solid ${T.line}` : "none", minWidth:0, width: sel && !isMobile ? "42%" : "100%", transition:"flex .2s ease, width .2s ease" }}>

        {/* Header */}
        <div style={{ padding:"clamp(14px,3vw,20px) clamp(14px,4vw,24px) 14px", borderBottom:`1px solid ${T.line}`, background:T.surface, flexShrink:0 }}>
          {/* Title row */}
          <div className="ek-contacts-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:10 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:T.ink, letterSpacing:"-0.3px" }}>Contacts</div>
              <div style={{ fontSize:12, color:T.inkMuted, marginTop:2 }}>
                {filtered.length === contacts.length ? `${contacts.length} customers` : `${filtered.length} of ${contacts.length}`}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:"6px 28px 6px 10px", border:`1.5px solid ${T.line}`, borderRadius:8, fontSize:11, fontFamily:F_MONO, color:T.inkSub, background:T.surfaceEl, cursor:"pointer", outline:"none", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center" }}>
                <option value="deals">Most deals</option>
                <option value="revenue">Top revenue</option>
                <option value="won">Most won</option>
                <option value="recent">Most recent</option>
                <option value="name">A → Z</option>
              </select>
              {/* Export dropdown */}
              <div ref={exportRef} style={{ position:"relative" }}>
                <button
                  onClick={() => setExportOpen(x => !x)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border:`1.5px solid ${exportOpen ? T.brand : T.line}`, background: exportOpen ? T.brandSubtle : T.surfaceEl, color: exportOpen ? T.brand : T.inkSub, fontSize:12, fontFamily:F, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap", transition:"all .14s" }}>
                  <Ic d={P.dl} sz={12} color={exportOpen ? T.brand : T.inkSub}/>
                  <span className="ek-hide-mobile">Export</span>
                  <Ic d={P.chevD} sz={10} color={exportOpen ? T.brand : T.inkMuted}/>
                </button>

                {exportOpen && (
                  <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:T.surface, border:`1px solid ${T.lineMid}`, borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,0.18)", minWidth:260, zIndex:9999, overflow:"hidden", animation:"scaleIn .13s ease", transformOrigin:"top right" }}>

                    {/* Header */}
                    <div style={{ padding:"10px 14px 8px", borderBottom:`1px solid ${T.line}` }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:F_MONO }}>Export Options</div>
                    </div>

                    {/* Option 1: Export filtered (segment) */}
                    <button
                      onClick={doExportFiltered}
                      style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"block", transition:"background .12s", borderBottom:`1px solid ${T.line}` }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:14 }}>📥</span>
                        <span style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:F }}>Export Filtered</span>
                        <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, color:T.brand, background:T.brandSubtle, padding:"2px 7px", borderRadius:10, fontFamily:F_MONO }}>{filtered.length}</span>
                      </div>
                      <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F, lineHeight:1.4, paddingLeft:22 }}>
                        Segment: <strong style={{ color:T.inkSub }}>{activeSegmentLabel}</strong>
                      </div>
                      <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, paddingLeft:22, marginTop:3 }}>
                        Columns: Name · Phone · Location · Lead Source · Segment{isFull ? " · Created By" : ""}
                      </div>
                    </button>

                    {/* Option 2: Export all (full access only) */}
                    {isFull ? (
                      <button
                        onClick={doExportAll}
                        style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"block", transition:"background .12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>📋</span>
                          <span style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:F }}>Export All Contacts</span>
                          <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, color:T.inkMuted, background:T.surfaceEl, padding:"2px 7px", borderRadius:10, fontFamily:F_MONO, border:`1px solid ${T.line}` }}>{contacts.length}</span>
                        </div>
                        <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F, lineHeight:1.4, paddingLeft:22 }}>
                          Segment: <strong style={{ color:T.inkSub }}>All Contacts</strong>
                        </div>
                        <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO, paddingLeft:22, marginTop:3 }}>
                          Includes Created By · Full access export
                        </div>
                      </button>
                    ) : (
                      <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:12 }}>🔒</span>
                        <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>Full export requires CEO, Manager, or Editor role</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:10 }}>
            <div style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <Ic d={P.search} sz={13} color={T.inkMuted}/>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, email, city…"
              style={{ width:"100%", padding:"9px 34px 9px 34px", border:`1.5px solid ${T.line}`, borderRadius:10, fontSize:13, fontFamily:F_BODY, color:T.ink, background:T.surfaceEl, outline:"none", boxSizing:"border-box", transition:"all .15s", fontWeight:500 }}
              onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.background = T.surface; e.target.style.boxShadow = `0 0 0 3px rgba(${T.brandRgb},0.12)`; }}
              onBlur={e => { e.target.style.borderColor = T.line; e.target.style.background = T.surfaceEl; e.target.style.boxShadow = "none"; }}
            />
            {search && (
              <button onMouseDown={e => { e.preventDefault(); setSearch(""); }}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:T.surfaceEl, border:`1px solid ${T.line}`, cursor:"pointer", color:T.inkMuted, borderRadius:5, width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                <Ic d={P.close} sz={9} color={T.inkMuted}/>
              </button>
            )}
          </div>

          {/* Filter bar */}
          <ContactFilterBar fil={fil} setF={setF} reset={reset} cities={cities} T={T}/>
        </div>

        {/* Segments bar */}
        <SegmentsBar
          segments={segments}
          activeSegId={activeSegId}
          contacts={contacts}
          fil={fil}
          onSelect={applySegment}
          onDelete={deleteSegment}
          onSaveNew={() => setShowCreateSeg(true)}
          T={T}
        />

        {/* Grid */}
        <div style={{ flex:1, overflowY:"auto", padding: filtered.length === 0 ? "0" : "clamp(12px,2vw,16px) clamp(12px,3vw,20px)", width:"100%", boxSizing:"border-box" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 24px" }}>
              <div style={{ width:56, height:56, borderRadius:16, background:T.surfaceEl, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="1.5" strokeLinecap="round"><path d={P.users}/></svg>
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:6 }}>No contacts found</div>
              <div style={{ fontSize:13, color:T.inkMuted }}>Try adjusting your search or filters</div>
            </div>
          ) : (
            <div className="ek-contacts-grid">
              {filtered.map(c => (
                <ContactCard key={c.id} c={c} selected={selected} onClick={() => handleCardClick(c)} T={T}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Detail (desktop only) ── */}
      {sel && !isMobile && (
        <div style={{ flex:"1 1 auto", minWidth:0, overflowY:"auto", background:T.bg }}>
          <ContactDetail sel={sel} onView={onView} onClose={handleCloseDetail} exportOne={exportOne} T={T}/>
        </div>
      )}

      {/* ── Create Segment Modal (position:fixed, safe inside wrapper) ── */}
      {showCreateSeg && (
        <CreateSegmentModal
          fil={fil}
          contacts={contacts}
          onSave={createSegment}
          onClose={() => setShowCreateSeg(false)}
          T={T}
        />
      )}
    </div>
  );
}
