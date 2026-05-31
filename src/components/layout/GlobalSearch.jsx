import React, { useState, useEffect, useRef, useMemo } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Avatar, StatusPill } from "../ui/index.jsx";
import { inr } from "../../utils.js";

// Keyboard shortcut: Cmd+K or Ctrl+K opens global search
// Pass onClose + onViewLead + onNavigate from Shell

export function GlobalSearch({ funnels, tasks = [], onClose, onViewLead, onNavigate, T }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // all | leads | tasks
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape closes
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  const leadResults = useMemo(() => {
    if (!q) return funnels.slice(0, 6);
    return funnels.filter(f =>
      (f.name || "").toLowerCase().includes(q) ||
      (f.phone || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q) ||
      (f.orderNumber || "").toLowerCase().includes(q) ||
      (f.cityRegion || "").toLowerCase().includes(q) ||
      (f.remarks || "").toLowerCase().includes(q) ||
      ((f.products || []).some(p => (p.desc || "").toLowerCase().includes(q))) ||
      (f.assignedTo || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [funnels, q]);

  const taskResults = useMemo(() => {
    if (!q) return tasks.slice(0, 4);
    return tasks.filter(t =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.note || "").toLowerCase().includes(q) ||
      (t.assignedTo || "").toLowerCase().includes(q)
    ).slice(0, 6);
  }, [tasks, q]);

  const allResults = useMemo(() => {
    const ls = leadResults.map(f => ({ type: "lead", item: f }));
    const ts = taskResults.map(t => ({ type: "task", item: t }));
    return [...ls, ...ts];
  }, [leadResults, taskResults]);

  const results = tab === "leads" ? leadResults.map(f => ({ type: "lead", item: f }))
    : tab === "tasks" ? taskResults.map(t => ({ type: "task", item: t }))
    : allResults;

  useEffect(() => { setCursor(0); }, [query, tab]);

  const handleKeyDown = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) {
      const r = results[cursor];
      if (r.type === "lead") { onViewLead(r.item); onClose(); }
      else { onNavigate("tasks"); onClose(); }
    }
  };

  // Scroll cursor into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const statusColors = { Won: "#10b981", Lost: "#ef4444", Pending: "#f59e0b", Drop: "#6b7280" };

  return (
    <div
      className="ek-global-search"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "clamp(60px, 8vh, 120px)",
        animation: "fadeIn .15s ease",
        fontFamily: F,
      }}>
      <div style={{
        width: "min(640px, calc(100vw - 32px))",
        background: T.surface, borderRadius: 16,
        border: `1px solid ${T.lineMid}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        overflow: "hidden", animation: "fadeUp .18s ease",
        maxHeight: "70vh", display: "flex", flexDirection: "column",
      }}>
        {/* Search input */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
          <Ic d={P.search} sz={16} color={T.inkMuted} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search leads, tasks, contacts…"
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", fontSize: 15, color: T.ink,
              fontFamily: F, fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ border: "none", background: T.surfaceEl, borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>Clear</button>
          )}
          <div style={{ background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 5, padding: "2px 7px", fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>ESC</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, padding: "8px 14px 0", borderBottom: `1px solid ${T.line}` }}>
          {[
            ["all", "All", allResults.length],
            ["leads", "Leads", leadResults.length],
            ["tasks", "Tasks", taskResults.length],
          ].map(([id, label, cnt]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                padding: "5px 12px 8px", borderRadius: "7px 7px 0 0", border: "none",
                background: tab === id ? T.bg : "transparent",
                color: tab === id ? T.brand : T.inkMuted,
                fontSize: 12, fontWeight: tab === id ? 700 : 500,
                cursor: "pointer", fontFamily: F,
                borderBottom: tab === id ? `2px solid ${T.brand}` : "2px solid transparent",
                transition: "all .12s",
              }}>
              {label}
              <span style={{ marginLeft: 5, background: tab === id ? T.brandSubtle : T.surfaceEl, color: tab === id ? T.brand : T.inkMuted, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "0 5px" }}>{cnt}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkMuted }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{q ? `No results for "${q}"` : "Start typing to search"}</div>
              <div style={{ fontSize: 12, marginTop: 5 }}>Search across leads, tasks, and contacts</div>
            </div>
          ) : (
            <>
              {/* Leads section */}
              {(tab === "all" || tab === "leads") && leadResults.length > 0 && (
                <>
                  <div style={{ padding: "4px 18px 4px", fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    LEADS
                  </div>
                  {leadResults.map((f, i) => {
                    const idx = tab === "all" ? i : i;
                    const active = cursor === idx;
                    return (
                      <div key={f.id} data-idx={idx}
                        onClick={() => { onViewLead(f); onClose(); }}
                        style={{
                          padding: "10px 18px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                          background: active ? T.brandSubtle : "transparent", transition: "background .1s",
                        }}
                        onMouseEnter={() => setCursor(idx)}
                      >
                        <Avatar name={f.name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                            {highlightMatch(f.name, q)}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {f.phone && <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{f.phone}</span>}
                            {f.leadSource && <span style={{ fontSize: 10, color: T.inkMuted, background: T.surfaceEl, padding: "1px 6px", borderRadius: 5 }}>{f.leadSource}</span>}
                            {f.cityRegion && <span style={{ fontSize: 11, color: T.inkMuted }}>{f.cityRegion}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          <StatusPill status={f.status} sm T={T} />
                          {f.quoteAmount && <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, fontFamily: F_MONO }}>{inr(f.quoteAmount)}</span>}
                        </div>
                        {active && <Ic d={P.arrowR} sz={12} color={T.brand} />}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Tasks section */}
              {(tab === "all" || tab === "tasks") && taskResults.length > 0 && (
                <>
                  <div style={{ padding: "8px 18px 4px", fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: tab === "all" && leadResults.length > 0 ? 4 : 0, borderTop: tab === "all" && leadResults.length > 0 ? `1px solid ${T.line}` : "none" }}>
                    TASKS
                  </div>
                  {taskResults.map((t, i) => {
                    const idx = tab === "all" ? leadResults.length + i : i;
                    const active = cursor === idx;
                    const taskColor = t.priority === "High" ? T.lost.dot : t.priority === "Medium" ? T.pending.dot : T.won.dot;
                    return (
                      <div key={t.id} data-idx={idx}
                        onClick={() => { onNavigate("tasks"); onClose(); }}
                        style={{
                          padding: "10px 18px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                          background: active ? T.brandSubtle : "transparent", transition: "background .1s",
                        }}
                        onMouseEnter={() => setCursor(idx)}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${taskColor}20`, border: `1px solid ${taskColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Ic d={t.done ? P.check2 : P.check} sz={14} color={taskColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.done ? T.inkMuted : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: t.done ? "line-through" : "none", marginBottom: 2 }}>
                            {highlightMatch(t.title, q)}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {t.dueDate && <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{t.dueDate}</span>}
                            {t.assignedTo && <span style={{ fontSize: 11, color: T.inkMuted }}>→ {t.assignedTo}</span>}
                            <span style={{ fontSize: 10, background: `${taskColor}20`, color: taskColor, padding: "0 6px", borderRadius: 5, fontWeight: 600 }}>{t.priority}</span>
                          </div>
                        </div>
                        {active && <Ic d={P.arrowR} sz={12} color={T.brand} />}
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ padding: "8px 18px", borderTop: `1px solid ${T.line}`, display: "flex", gap: 16, background: T.surfaceEl }}>
          {[["↑↓", "Navigate"], ["↵", "Open"], ["Esc", "Close"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ background: T.surface, border: `1px solid ${T.lineMid}`, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontFamily: F_MONO, color: T.inkSub, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>{key}</kbd>
              <span style={{ fontSize: 11, color: T.inkMuted }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <kbd style={{ background: T.surface, border: `1px solid ${T.lineMid}`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontFamily: F_MONO, color: T.inkSub }}>Ctrl K</kbd>
            <span style={{ fontSize: 11, color: T.inkMuted }}>to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightMatch(text, q) {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#fef08a", color: "#713f12", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
