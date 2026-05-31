import React, { useState, useRef, useEffect, useCallback } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P } from "../ui/index.jsx";
import { FULL } from "../../constants.js";

// ── Filter definitions ─────────────────────────────────────────────────────────
const FILTER_DEFS = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "Won", "Lost", "Drop"],
  },
  {
    key: "funnelType",
    label: "Funnel type",
    type: "select_custom",
    options: ["Normal", "High Value", "Bulk", "priority", "Others"],
  },
  {
    key: "enquiryType",
    label: "Enquiry type",
    type: "select",
    options: ["New Customer", "Repeat Customer", "Bulk Order", "Custom Design", "Wholesale", "Others"],
  },
  {
    key: "leadSource",
    label: "Lead source",
    type: "select",
    options: ["WhatsApp", "Email", "Website", "Call", "Abandoned Cart", "Social media", "Other", "Owner"],
  },
  {
    key: "followUp",
    label: "Follow-up",
    type: "select",
    options: ["Today", "Missed", "Upcoming", "Overdue", "No follow-up"],
  },
  {
    key: "city",
    label: "City",
    type: "dynamic", // filled at runtime from funnels
  },
  {
    key: "category",
    label: "Product category",
    type: "select",
    options: ["Dresses", "Sarees", "Half Sarees", "Kurtis", "Lehengas", "Mom & Me", "999 Deals", "kids", "Padava Sattai", "Mens", "Blouses", "Others"],
  },
  {
    key: "assignedTo",
    label: "Assigned to",
    type: "dynamic_assignees",
  },
  {
    key: "hasOrder",
    label: "Order number",
    type: "select",
    options: ["Has order", "No order"],
  },
  {
    key: "hasQuote",
    label: "Quote",
    type: "select",
    options: ["Has quote", "No quote"],
  },
  {
    key: "hasEmail",
    label: "Email",
    type: "select",
    options: ["Has email", "No email"],
  },
  {
    key: "existingDeal",
    label: "Deal type",
    type: "select",
    options: ["Existing deal", "New deal"],
  },
  {
    key: "quoteAmt",
    label: "Quote amount (₹)",
    type: "range",
    placeholder: ["Min ₹", "Max ₹"],
  },
  {
    key: "quoteQty",
    label: "Quote quantity",
    type: "range",
    placeholder: ["Min qty", "Max qty"],
  },
  {
    key: "dateCreated",
    label: "Created date",
    type: "daterange",
  },
  {
    key: "followUpDate",
    label: "Follow-up date",
    type: "daterange",
  },
  {
    key: "productSearch",
    label: "Product name",
    type: "text",
    placeholder: 'e.g. "Lehenga"',
  },
  {
    key: "lostReason",
    label: "Lost / Drop reason",
    type: "text",
    placeholder: 'e.g. "price"',
  },
  {
    key: "remarks",
    label: "Remarks / Notes",
    type: "text",
    placeholder: "Search in remarks…",
  },
];

// Map a filter key+value back to a human label for the pill
function pillLabel(def, value, funnels) {
  if (!value || value === "" || value === false) return null;
  if (def.type === "range") {
    const [min, max] = value;
    if (!min && !max) return null;
    return `${def.label}: ${min || "0"} → ${max || "∞"}`;
  }
  if (def.type === "daterange") {
    const [from, to] = value;
    if (!from && !to) return null;
    return `${def.label}: ${from || "…"} → ${to || "…"}`;
  }
  if (def.type === "text") return `${def.label}: "${value}"`;
  return `${def.label} is ${value}`;
}

// Apply a single filter to a funnel row
function applyFilter(f, def, value, TODAY) {
  if (!value && value !== false) return true;
  switch (def.key) {
    case "status":        return f.status === value;
    case "funnelType":    return f.funnelType === value;
    case "enquiryType":   return f.enquiryType === value;
    case "leadSource":    return f.leadSource === value;
    case "city":          return (f.cityRegion || "").toLowerCase().includes(value.toLowerCase());
    case "category":      return (f.products || []).some(p => p.category === value);
    case "assignedTo":    return f.assignedTo === value;
    case "hasOrder":      return value === "Has order" ? !!f.orderNumber : !f.orderNumber;
    case "hasQuote":      return value === "Has quote" ? !!f.quoteAmount : !f.quoteAmount;
    case "hasEmail":      return value === "Has email" ? !!f.email : !f.email;
    case "existingDeal":  return value === "Existing deal" ? !!f.isExisting : !f.isExisting;
    case "followUp": {
      if (value === "Today")       return f.nextFollowUp === TODAY;
      if (value === "Missed")      return f.nextFollowUp && f.nextFollowUp < TODAY && f.status === "Pending";
      if (value === "Upcoming")    return f.nextFollowUp && f.nextFollowUp > TODAY;
      if (value === "Overdue")     return f.nextFollowUp && f.nextFollowUp < TODAY && f.status === "Pending";
      if (value === "No follow-up") return !f.nextFollowUp;
      return true;
    }
    case "quoteAmt": {
      const [min, max] = value;
      const amt = Number(f.quoteAmount) || 0;
      if (min && amt < Number(min)) return false;
      if (max && amt > Number(max)) return false;
      return true;
    }
    case "quoteQty": {
      const [min, max] = value;
      const qty = Number(f.quoteQty) || 0;
      if (min && qty < Number(min)) return false;
      if (max && qty > Number(max)) return false;
      return true;
    }
    case "dateCreated": {
      const [from, to] = value;
      try {
        const d = new Date(f.createdAt).toISOString().split("T")[0];
        if (from && d < from) return false;
        if (to && d > to) return false;
      } catch { return false; }
      return true;
    }
    case "followUpDate": {
      const [from, to] = value;
      if (from && f.nextFollowUp && f.nextFollowUp < from) return false;
      if (to && f.nextFollowUp && f.nextFollowUp > to) return false;
      return true;
    }
    case "productSearch": {
      const q = value.toLowerCase();
      return (f.products || []).some(p => (p.desc || "").toLowerCase().includes(q));
    }
    case "lostReason": {
      const q = value.toLowerCase();
      return (f.lostDropReason || "").toLowerCase().includes(q);
    }
    case "remarks": {
      const q = value.toLowerCase();
      return (f.remarks || "").toLowerCase().includes(q) || (f.quoteDesc || "").toLowerCase().includes(q);
    }
    default: return true;
  }
}

// ── All / Scope dropdown ───────────────────────────────────────────────────────
function AllDropdown({ fil, setF, reset, users, user, T, activeSegments }) {
  const [open, setOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef(null);
  const ref  = useRef(null);
  const FULL_ROLES = ["CEO", "Manager", "Editor"];

  // CRE members available as scopes (for managers/CEO only)
  const creMembers = FULL_ROLES.includes(user?.role)
    ? (users || []).filter(u => u.role === "CRE").map(u => u.name)
    : [];

  // Saved quick-segments
  const quickSegments = [
    { key: "followUp",   value: "Today",      label: "Today's Follow-ups", group: "follow" },
    { key: "followUp",   value: "Missed",     label: "Missed",             group: "follow" },
    { key: "followUp",   value: "Upcoming",   label: "Upcoming",           group: "follow" },
    { key: "status",     value: "Won",        label: "Won",                group: "status" },
    { key: "status",     value: "Pending",    label: "Pending",            group: "status" },
    { key: "status",     value: "Lost",       label: "Lost",               group: "status" },

  ];

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Currently active scope label
  const activeCRE = fil.assignedTo || "";
  const activeQuick = quickSegments.find(s => fil[s.key] === s.value);
  const scopeLabel = activeCRE
    ? activeCRE.split(" ")[0]          // first name
    : activeQuick
      ? activeQuick.label
      : "All";
  const isDefault = !activeCRE && !activeQuick;

  const pickCRE = (name) => {
    reset();
    if (name !== activeCRE) setF("assignedTo", name);
    setOpen(false);
  };

  const pickQuick = (seg) => {
    reset();
    const already = fil[seg.key] === seg.value;
    if (!already) setF(seg.key, seg.value);
    setOpen(false);
  };

  const pickAll = () => { reset(); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px",
          border: `1px solid ${open || !isDefault ? T.brand : T.line}`,
          borderRadius: 6,
          background: open || !isDefault ? T.brandSubtle : T.surfaceEl,
          color: open || !isDefault ? T.brand : T.inkSub,
          fontSize: 12, fontFamily: F, fontWeight: 600, cursor: "pointer",
          transition: "all .15s",
        }}>
        {scopeLabel}
        <span style={{ fontSize: 10, opacity: 0.7 }}>⌃</span>
      </button>

      {open && (
        <div onMouseDown={e => e.stopPropagation()} style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
          background: T.surface, border: `1px solid ${T.line}`,
          borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
          minWidth: 180, overflow: "hidden",
        }}>

          {/* All */}
          <Item
            label="All"
            checked={isDefault}
            bold
            extra={<span style={{ color: T.inkMuted, fontSize: 11 }}>···</span>}
            onPick={pickAll}
            T={T}
          />

          {/* Quick segments */}
          {quickSegments.length > 0 && (
            <>
              <Divider T={T} label="FOLLOW-UP" />
              {quickSegments.filter(s => s.group === "follow").map(seg => (
                <Item key={seg.key + seg.value} label={seg.label}
                  checked={fil[seg.key] === seg.value && !activeCRE}
                  onPick={() => pickQuick(seg)} T={T} />
              ))}
              <Divider T={T} label="STATUS" />
              {quickSegments.filter(s => s.group === "status").map(seg => (
                <Item key={seg.key + seg.value} label={seg.label}
                  checked={fil[seg.key] === seg.value && !activeCRE}
                  onPick={() => pickQuick(seg)} T={T} />
              ))}
              <Divider T={T} label="TYPE" />
              {/* Active custom type pill */}
              {fil.funnelType && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: F, color: T.ink }}>
                    <span style={{ color: T.brand, fontSize: 12 }}>✓</span>
                    {fil.funnelType}
                  </span>
                  <span onMouseDown={e => { e.preventDefault(); reset(); setShowCustomInput(false); setCustomTypeInput(""); }}
                    style={{ cursor: "pointer", color: T.inkMuted, fontSize: 15, lineHeight: 1, padding: "0 2px" }}>×</span>
                </div>
              )}
              {/* Custom type input */}
              {showCustomInput ? (
                <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.line}` }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      ref={customInputRef}
                      value={customTypeInput}
                      onChange={e => setCustomTypeInput(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === "Enter" && customTypeInput.trim()) {
                          setF("funnelType", customTypeInput.trim());
                          setShowCustomInput(false); setCustomTypeInput(""); setOpen(false);
                        }
                        if (e.key === "Escape") { setShowCustomInput(false); setCustomTypeInput(""); }
                      }}
                      placeholder="e.g. VIP, Urgent…"
                      autoFocus
                      style={{ flex: 1, padding: "6px 9px", border: `1.5px solid ${T.brand}`, borderRadius: 6, fontSize: 12, fontFamily: F, color: T.ink, background: T.surface, outline: "none" }}
                    />
                    <button onMouseDown={e => {
                        e.preventDefault();
                        if (!customTypeInput.trim()) return;
                        setF("funnelType", customTypeInput.trim());
                        setShowCustomInput(false); setCustomTypeInput(""); setOpen(false);
                      }}
                      style={{ padding: "6px 12px", background: T.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                      Apply
                    </button>
                  </div>
                  <div onMouseDown={e => { e.preventDefault(); setShowCustomInput(false); setCustomTypeInput(""); }}
                    style={{ marginTop: 5, fontSize: 11, color: T.brand, cursor: "pointer", fontFamily: F }}>
                    ← Cancel
                  </div>
                </div>
              ) : (
                <div onMouseDown={e => {
                    e.preventDefault();
                    setShowCustomInput(true);
                    setTimeout(() => customInputRef.current?.focus(), 0);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", color: T.brand, fontSize: 13, fontFamily: F, fontWeight: 500, borderTop: fil.funnelType ? `1px solid ${T.line}` : "none" }}>
                  <span style={{ width: 16, height: 16, border: `1.5px dashed ${T.brand}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>+</span>
                  Add custom type…
                </div>
              )}
            </>
          )}

          {/* CRE member scopes */}
          {creMembers.length > 0 && (
            <>
              <Divider T={T} label="BY MEMBER" />
              {creMembers.map(name => (
                <Item
                  key={name}
                  label={name}
                  checked={activeCRE === name}
                  onPick={() => pickCRE(name)}
                  T={T}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ label, checked, bold, extra, onPick, T }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseDown={e => { e.preventDefault(); onPick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px", cursor: "pointer",
        background: hov ? T.surfaceEl : "transparent",
        transition: "background .1s",
      }}>
      <span style={{
        width: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        color: T.brand, fontSize: 14,
      }}>
        {checked ? "✓" : ""}
      </span>
      <span style={{ flex: 1, fontSize: 13, fontFamily: F, fontWeight: bold ? 600 : 400, color: T.ink }}>
        {label}
      </span>
      {extra}
    </div>
  );
}

function Divider({ T, label }) {
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, margin: "4px 0" }}>
      {label && (
        <div style={{ padding: "4px 14px 2px", fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em" }}>
          {label}
        </div>
      )}
    </div>
  );
}


// ─── SAVED PRESETS ────────────────────────────────────────────────────────────
const PRESETS_KEY = "ek_filter_presets_v1";
function loadPresets() { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]"); } catch { return []; } }
function savePresets(p) { try { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); } catch {} }

function SavePresetModal({ fil, onSave, onClose, T }) {
  const [name, setName] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.lineMid}`, borderRadius: 12, padding: "20px 24px", width: "min(360px, 100%)", boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Save Filter Preset</div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. High Value Pending, My Leads Today…"
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) onSave(name); if (e.key === "Escape") onClose(); }}
          style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${T.brand}`, borderRadius: 8, fontSize: 13, fontFamily: F, color: T.ink, background: T.bg, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.line}`, background: "transparent", cursor: "pointer", fontSize: 12, color: T.inkSub, fontFamily: F }}>Cancel</button>
          <button onClick={() => name.trim() && onSave(name)}
            style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: T.brand, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: F }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
// ── All / Scope dropdown ───────────────────────────────────────────────────────
// ── Main component ─────────────────────────────────────────────────────────────
export function FilterBar({ fil, setF, reset, users = [], user, T, funnels = [] }) {
  const [inputVal, setInputVal]   = useState("");
  const [step, setStep]           = useState("type"); // "type" | "value" | "custom"
  const [activeDef, setActiveDef] = useState(null);
  const [rangeVal, setRangeVal]   = useState(["", ""]);
  const [dropOpen, setDropOpen]   = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [customVal, setCustomVal] = useState("");
  // Which segment pill is being edited (key string), null = adding new
  const [editingKey, setEditingKey] = useState(null);
  // Saved presets
  const [presets, setPresets] = useState(loadPresets);
  const [showSavePreset, setShowSavePreset] = useState(false);

  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const itemRefs  = useRef([]);

  // Auto-scroll highlighted item
  useEffect(() => {
    const el = itemRefs.current[highlighted];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const TODAY    = new Date().toISOString().split("T")[0];
  const cities   = [...new Set(funnels.map(f => f.cityRegion).filter(Boolean))].sort();
  const assignees= [...new Set(funnels.map(f => f.assignedTo).filter(Boolean))].sort();

  const getOptions = (def) => {
    if (def.type === "dynamic")           return cities;
    if (def.type === "dynamic_assignees") return assignees;
    return def.options || [];
  };

  const commitCustom = () => {
    if (!activeDef || !customVal.trim()) return;
    setF(activeDef.key, customVal.trim());
    closeAll();
    setCustomVal("");
  };

  // All active filter segments
  const activeSegments = FILTER_DEFS.filter(def => {
    const v = fil[def.key];
    if (def.type === "range" || def.type === "daterange") return Array.isArray(v) && (v[0] || v[1]);
    return v && v !== "" && v !== false;
  });

  // Keys already used (to hide from "add new" type list)
  const usedKeys = new Set(activeSegments.map(d => d.key));

  // Type list: when adding new → exclude used; when editing existing → show all
  const typeList = FILTER_DEFS.filter(d => {
    const matchesSearch = d.label.toLowerCase().includes(inputVal.toLowerCase());
    if (editingKey !== null) return matchesSearch;
    return matchesSearch && !usedKeys.has(d.key);
  });

  const valueList = activeDef && (activeDef.type === "select" || activeDef.type === "select_custom" || activeDef.type === "dynamic" || activeDef.type === "dynamic_assignees")
    ? getOptions(activeDef).filter(o => o.toLowerCase().includes(inputVal.toLowerCase()))
    : [];

  // Value-match results: when typing in step "type", search across all filter values
  const valueMatches = inputVal.trim().length > 0 && step === "type"
    ? FILTER_DEFS.flatMap(def => {
        if (usedKeys.has(def.key) && editingKey === null) return [];
        const opts = getOptions(def);
        return opts
          .filter(o => o.toLowerCase().includes(inputVal.toLowerCase()))
          .map(o => ({ def, value: o }));
      })
    : [];

  // ── Close on outside mousedown ──
  useEffect(() => {
    const h = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const closeAll = () => {
    setDropOpen(false); setStep("type"); setActiveDef(null);
    setInputVal(""); setEditingKey(null); setCustomVal("");
  };

  const openAddNew = () => {
    itemRefs.current = [];
    setEditingKey(null);
    setDropOpen(true);
    setStep("type");
    setInputVal("");
    setHighlighted(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openEditSegment = (def) => {
    itemRefs.current = [];
    setEditingKey(def.key);
    setActiveDef(def);
    setInputVal("");
    setHighlighted(0);
    setRangeVal(
      Array.isArray(fil[def.key]) ? fil[def.key] : ["", ""]
    );
    if (def.type === "text" || def.type === "range" || def.type === "daterange") {
      setStep("value");
    } else {
      setStep("value");
    }
    setDropOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const pickType = (def) => {
    setActiveDef(def);
    setEditingKey(def.key);
    setInputVal("");
    itemRefs.current = [];
    setHighlighted(0);
    setRangeVal(["", ""]);
    setStep("value");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const pickValue = (val) => {
    if (!activeDef) return;
    setF(activeDef.key, val);
    closeAll();
  };

  // Direct pick from value-match results in step=type
  const pickValue_direct = (def, val) => {
    setF(def.key, val);
    closeAll();
  };

  const commitRange = () => {
    if (!activeDef) return;
    if (rangeVal[0] || rangeVal[1]) setF(activeDef.key, rangeVal);
    closeAll();
  };

  const commitText = () => {
    if (!activeDef || !inputVal.trim()) return;
    setF(activeDef.key, inputVal.trim());
    closeAll();
  };

  const removeSegment = (key) => {
    const def = FILTER_DEFS.find(d => d.key === key);
    if (!def) return;
    if (def.type === "range" || def.type === "daterange") setF(key, null);
    else setF(key, "");
    if (editingKey === key) closeAll();
  };

  const resetAll = () => { reset(); closeAll(); };

  // Preset management
  const handleSavePreset = (name) => {
    const newPreset = { id: Date.now(), name, filters: { ...fil } };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setShowSavePreset(false);
  };
  const applyPreset = (preset) => {
    reset();
    Object.entries(preset.filters).forEach(([k, v]) => { if (v && v !== "" && !(Array.isArray(v) && !v[0] && !v[1])) setF(k, v); });
  };
  const deletePreset = (id) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  };

  // Keyboard navigation
  const onKeyDown = (e) => {
    e.stopPropagation();
    const list = step === "type" ? typeList : valueList;
    const totalLen = step === "type" ? valueMatches.length + typeList.length : list.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, totalLen - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === "type") {
        const vmLen = valueMatches.length;
        if (highlighted < vmLen) {
          const { def, value } = valueMatches[highlighted];
          pickValue_direct(def, value);
        } else if (typeList[highlighted - vmLen]) {
          pickType(typeList[highlighted - vmLen]);
        }
      }
      else if (step === "value") {
        if (activeDef?.type === "text") commitText();
        else if (activeDef?.type === "range" || activeDef?.type === "daterange") commitRange();
        else if (list[highlighted]) pickValue(list[highlighted]);
      }
    }
    if (e.key === "Escape") { closeAll(); }
    if (e.key === "Backspace" && !inputVal && step === "value") {
      setStep("type"); setActiveDef(null); setInputVal("");
    }
  };

  // Placeholder for the hidden input
  const placeholder = !dropOpen
    ? "Add filter…"
    : step === "type"
      ? "Search filters…"
      : activeDef?.type === "text"
        ? (activeDef.placeholder || "Type value…")
        : `Search ${activeDef?.label || ""}…`;

  // ── Shared styles ──
  const segmentBase = {
    display: "inline-flex", alignItems: "center", gap: 0,
    border: `1px solid ${T.line}`, borderRadius: 6,
    background: T.surface, fontSize: 13, fontFamily: F,
    cursor: "pointer", overflow: "hidden", flexShrink: 0,
  };

  const enterHint = (
    <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 4, padding: "1px 6px" }}>
      ↵ Enter
    </span>
  );

  // local alias so AllDropdown can call setF
  const sf_local = setF;

  return (
    <div style={{ borderBottom: `1px solid ${T.line}`, background: T.surface, position: "relative" }} ref={wrapRef}>

      {/* ── Saved Presets Strip ── */}
      {presets.length > 0 && (
        <div style={{ padding: "5px 12px 4px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Presets</span>
          {presets.map(p => (
            <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 0, border: `1px solid ${T.line}`, borderRadius: 6, overflow: "hidden", fontSize: 12, fontFamily: F }}>
              <span onMouseDown={e => { e.preventDefault(); applyPreset(p); }}
                style={{ padding: "3px 8px", background: T.surfaceEl, color: T.brand, fontWeight: 600, cursor: "pointer", borderRight: `1px solid ${T.line}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.brandSubtle}
                onMouseLeave={e => e.currentTarget.style.background = T.surfaceEl}>
                {p.name}
              </span>
              <span onMouseDown={e => { e.preventDefault(); deletePreset(p.id); }}
                style={{ padding: "3px 6px", background: T.surface, color: T.inkMuted, cursor: "pointer", fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = T.lost.bg}
                onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                ×
              </span>
            </span>
          ))}
        </div>
      )}

      {/* ── Filter bar row ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", gap: 6, flexWrap: "wrap", minHeight: 44 }}>

        <AllDropdown fil={fil} setF={sf_local} reset={reset} users={users} user={user} T={T} activeSegments={activeSegments} />

        {/* ── Active segment pills ── */}
        {activeSegments.map(def => {
          const v = fil[def.key];
          const valLabel = (() => {
            if (Array.isArray(v)) return `${v[0] || "0"} → ${v[1] || "∞"}`;
            return String(v);
          })();
          const isEditing = editingKey === def.key && dropOpen;
          return (
            <span key={def.key}
              style={{ ...segmentBase, border: `1px solid ${isEditing ? T.brand : T.line}`, boxShadow: isEditing ? `0 0 0 2px rgba(${T.brandRgb},0.15)` : "none" }}>
              {/* label part — click to re-edit */}
              <span
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); openEditSegment(def); }}
                style={{ padding: "4px 8px", color: T.inkSub, borderRight: `1px solid ${T.line}`, background: T.surfaceEl, fontSize: 12, userSelect: "none" }}>
                {def.label} is
              </span>
              {/* value part — blue, click also opens edit */}
              <span
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); openEditSegment(def); }}
                style={{ padding: "4px 9px", color: T.brand, fontWeight: 600, background: T.brandSubtle, fontSize: 12, userSelect: "none" }}>
                {valLabel}
              </span>
              {/* × remove */}
              <span
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); removeSegment(def.key); }}
                style={{ padding: "4px 7px", color: T.inkMuted, fontSize: 15, lineHeight: 1, borderLeft: `1px solid ${T.line}`, background: T.surface, display: "flex", alignItems: "center", userSelect: "none" }}>
                ×
              </span>
            </span>
          );
        })}

        {/* ── Add filter input ── */}
        <div
          onMouseDown={e => { e.stopPropagation(); if (!dropOpen) openAddNew(); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
            border: `1.5px solid ${dropOpen && editingKey === null ? T.brand : "transparent"}`,
            borderRadius: 6, cursor: "text", minWidth: 100, flex: 1,
            background: "transparent",
            boxShadow: dropOpen && editingKey === null ? `0 0 0 2px rgba(${T.brandRgb},0.12)` : "none",
          }}>
          {(!dropOpen || editingKey !== null) && (
            <Ic d={P.search} sz={12} color={T.inkMuted} />
          )}
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setHighlighted(0); }}
            onMouseDown={e => { e.stopPropagation(); if (!dropOpen) openAddNew(); }}
            onFocus={() => { if (!dropOpen) openAddNew(); }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: F, color: T.ink, width: "100%", minWidth: 80, cursor: "text" }}
          />
        </div>

        {/* Save as preset */}
        {activeSegments.length > 0 && (
          <button
            onMouseDown={e => { e.preventDefault(); setShowSavePreset(true); }}
            title="Save as filter preset"
            style={{ padding: "4px 10px", border: `1px solid ${T.brand}33`, borderRadius: 6, background: T.brandSubtle, color: T.brand, fontSize: 11, fontFamily: F, cursor: "pointer", flexShrink: 0, fontWeight: 700 }}>
            Save preset
          </button>
        )}

        {/* Reset button */}
        {activeSegments.length > 0 && (
          <button
            onMouseDown={e => { e.preventDefault(); resetAll(); }}
            title="Clear all filters"
            style={{ padding: "4px 10px", border: `1px solid ${T.line}`, borderRadius: 6, background: T.surface, color: T.inkMuted, fontSize: 12, fontFamily: F, cursor: "pointer", flexShrink: 0, fontWeight: 500 }}>
            Clear all
          </button>
        )}
        <button
          onMouseDown={e => { e.preventDefault(); resetAll(); }}
          title="Reset"
          style={{ width: 28, height: 28, border: `1px solid ${T.line}`, borderRadius: 6, background: T.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMuted, flexShrink: 0, fontSize: 14 }}>
          ↺
        </button>
      </div>

      {/* ── Dropdown panel ── */}
      {dropOpen && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: "absolute", zIndex: 9999,
            left: 12, top: "100%", marginTop: 4,
            background: T.surface,
            border: `1px solid ${T.line}`,
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            width: 340, maxHeight: 320, overflowY: "auto",
          }}>

          {/* ── Step 1: pick filter type ── */}
          {step === "type" && (
            <>
              {/* Value-match results when typing */}
              {valueMatches.length > 0 && (
                <>
                  {valueMatches.map(({ def, value }, i) => (
                    <div key={def.key + value}
                      ref={el => itemRefs.current[i] = el}
                      onMouseDown={e => { e.preventDefault(); pickValue_direct(def, value); }}
                      onMouseEnter={() => setHighlighted(i)}
                      style={{
                        padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: F,
                        color: T.ink, background: i === highlighted ? T.surfaceEl : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: `1px solid ${T.line}`,
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, background: T.surfaceEl, padding: "1px 6px", borderRadius: 4, border: `1px solid ${T.line}` }}>
                          {def.label}
                        </span>
                        <span style={{ fontWeight: 500 }}>{value}</span>
                      </div>
                      {i === highlighted && enterHint}
                    </div>
                  ))}
                  {typeList.length > 0 && (
                    <div style={{ padding: "5px 16px 3px", fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", background: T.surfaceEl, borderBottom: `1px solid ${T.line}` }}>
                      FILTERS
                    </div>
                  )}
                </>
              )}
              {/* Filter type list */}
              {typeList.length === 0 && valueMatches.length === 0 && (
                <div style={{ padding: "14px 16px", color: T.inkMuted, fontSize: 13, fontFamily: F }}>No filters available</div>
              )}
              {typeList.map((def, i) => {
                const idx = valueMatches.length + i;
                return (
                  <div key={def.key}
                    ref={el => itemRefs.current[idx] = el}
                    onMouseDown={e => { e.preventDefault(); pickType(def); }}
                    onMouseEnter={() => setHighlighted(idx)}
                    style={{
                      padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: F,
                      color: T.ink, background: idx === highlighted ? T.surfaceEl : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: `1px solid ${T.line}`,
                    }}>
                    <span>{def.label}</span>
                    {idx === highlighted && enterHint}
                  </div>
                );
              })}
            </>
          )}

          {/* ── Step 2a: select / dynamic / select_custom values ── */}
          {step === "value" && activeDef && (activeDef.type === "select" || activeDef.type === "select_custom" || activeDef.type === "dynamic" || activeDef.type === "dynamic_assignees") && (
            <>
              {/* Sticky search box inside dropdown */}
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.line}`, position: "sticky", top: 0, background: T.surface, zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", background: T.surfaceEl, borderRadius: 6, border: `1px solid ${T.line}` }}>
                  <Ic d={P.search} sz={12} color={T.inkMuted} />
                  <input
                    ref={inputRef}
                    autoFocus
                    value={inputVal}
                    onChange={e => { setInputVal(e.target.value); setHighlighted(0); }}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, valueList.length - 1)); }
                      if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
                      if (e.key === "Enter" && valueList[highlighted]) { e.preventDefault(); pickValue(valueList[highlighted]); }
                      if (e.key === "Escape") closeAll();
                      if (e.key === "Backspace" && !inputVal) { setStep("type"); setActiveDef(null); setInputVal(""); }
                    }}
                    placeholder={`Search ${activeDef.label}…`}
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, fontFamily: F, color: T.ink, flex: 1 }}
                  />
                  {inputVal && (
                    <span onMouseDown={e => { e.preventDefault(); setInputVal(""); setHighlighted(0); }}
                      style={{ cursor: "pointer", color: T.inkMuted, fontSize: 14, lineHeight: 1 }}>×</span>
                  )}
                </div>
              </div>
              {valueList.length === 0 && activeDef.type !== "select_custom" && (
                <div style={{ padding: "14px 16px", color: T.inkMuted, fontSize: 13, fontFamily: F }}>No options for "{inputVal}"</div>
              )}
              {valueList.map((opt, i) => {
                const isSelected = fil[activeDef.key] === opt;
                return (
                  <div key={opt}
                    ref={el => itemRefs.current[i] = el}
                    onMouseDown={e => { e.preventDefault(); pickValue(opt); }}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: F,
                      color: T.ink, background: i === highlighted ? T.surfaceEl : "transparent",
                      display: "flex", alignItems: "center", gap: 10,
                      borderBottom: `1px solid ${T.line}`,
                    }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${isSelected ? T.brand : T.lineMid}`,
                      background: isSelected ? T.brand : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </span>
                    {opt}
                    {i === highlighted && <span style={{ marginLeft: "auto" }}>{enterHint}</span>}
                  </div>
                );
              })}
              {/* Custom option at bottom for select_custom */}
              {activeDef.type === "select_custom" && (
                <div
                  onMouseDown={e => { e.preventDefault(); setStep("custom"); setCustomVal(""); setTimeout(() => inputRef.current?.focus(), 0); }}
                  style={{
                    padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: F,
                    color: T.brand, display: "flex", alignItems: "center", gap: 10,
                    borderTop: `1px solid ${T.line}`, fontWeight: 500,
                  }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px dashed ${T.brand}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.brand }}>+</span>
                  Custom type…
                </div>
              )}
            </>
          )}

          {/* ── Step 2-custom: free-text custom type ── */}
          {step === "custom" && activeDef && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Custom type</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  autoFocus
                  value={customVal}
                  onChange={e => setCustomVal(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitCustom(); if (e.key === "Escape") { setStep("value"); setCustomVal(""); } }}
                  placeholder="e.g. VIP, Urgent, Sample…"
                  style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${T.brand}`, borderRadius: 6, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none" }}
                />
                <button onMouseDown={e => { e.preventDefault(); commitCustom(); }}
                  style={{ padding: "7px 14px", background: T.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  Apply
                </button>
              </div>
              <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 6, fontFamily: F }}>
                ← <span onMouseDown={e => { e.preventDefault(); setStep("value"); setCustomVal(""); }} style={{ color: T.brand, cursor: "pointer", textDecoration: "underline" }}>Back to options</span>
              </div>
            </div>
          )}

          {/* ── Step 2b: text input ── */}
          {step === "value" && activeDef?.type === "text" && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{activeDef.label}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  autoFocus
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitText(); if (e.key === "Escape") closeAll(); }}
                  placeholder={activeDef.placeholder || "Type…"}
                  style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${T.brand}`, borderRadius: 6, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none" }}
                />
                <button onMouseDown={e => { e.preventDefault(); commitText(); }}
                  style={{ padding: "7px 14px", background: T.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2c: number range ── */}
          {step === "value" && activeDef?.type === "range" && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{activeDef.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <input type="number" value={rangeVal[0]} onChange={e => setRangeVal([e.target.value, rangeVal[1]])}
                  placeholder={activeDef.placeholder?.[0] || "Min"}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitRange(); if (e.key === "Escape") closeAll(); }}
                  style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${T.line}`, borderRadius: 6, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none" }} />
                <span style={{ color: T.inkMuted }}>→</span>
                <input type="number" value={rangeVal[1]} onChange={e => setRangeVal([rangeVal[0], e.target.value])}
                  placeholder={activeDef.placeholder?.[1] || "Max"}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitRange(); if (e.key === "Escape") closeAll(); }}
                  style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${T.line}`, borderRadius: 6, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none" }} />
              </div>
              <button onMouseDown={e => { e.preventDefault(); commitRange(); }}
                style={{ width: "100%", padding: "7px", background: T.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                Apply
              </button>
            </div>
          )}

          {/* ── Step 2d: date range ── */}
          {step === "value" && activeDef?.type === "daterange" && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{activeDef.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {[["From", 0], ["To", 1]].map(([lbl, idx]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 11, color: T.inkMuted, fontFamily: F, width: 32 }}>{lbl}</label>
                    <input type="date" value={rangeVal[idx]}
                      onChange={e => { const nv = [...rangeVal]; nv[idx] = e.target.value; setRangeVal(nv); }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitRange(); if (e.key === "Escape") closeAll(); }}
                      style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${T.line}`, borderRadius: 6, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none", cursor: "pointer" }} />
                  </div>
                ))}
              </div>
              <button onMouseDown={e => { e.preventDefault(); commitRange(); }}
                style={{ width: "100%", padding: "7px", background: T.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {showSavePreset && <SavePresetModal fil={fil} onSave={handleSavePreset} onClose={() => setShowSavePreset(false)} T={T} />}
    </div>
  );
}
