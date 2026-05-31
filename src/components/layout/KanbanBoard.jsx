import React, { useState, useRef } from "react";
import { F } from "../../theme/index.js";
import { Dot, StatusPill, SourcePill, Avatar, Ic, P } from "../ui/index.jsx";
import { inr, today } from "../../utils.js";
import { FULL, VIEWER } from "../../constants.js";

const COLS = [
  { id: "Pending", label: "Pending",  color: "#D97706", bg: "rgba(217,119,6,0.08)"  },
  { id: "Won",     label: "Won",      color: "#059669", bg: "rgba(5,150,105,0.08)"  },
  { id: "Lost",    label: "Lost",     color: "#DC2626", bg: "rgba(220,38,38,0.08)"  },
  { id: "Drop",    label: "Drop",     color: "#6B7280", bg: "rgba(107,114,128,0.08)"},
];

function KanbanCard({ f, onView, onEdit, onLogFollowup, user, T, onDragStart }) {
  const todayV = today();
  const over = f.nextFollowUp && f.nextFollowUp < todayV && f.status === "Pending";
  const tod  = f.nextFollowUp === todayV && f.status === "Pending";
  const isViewer = VIEWER.includes(user.role);

  // Lead aging
  let ageDays = null;
  try {
    ageDays = Math.floor((Date.now() - new Date(f.createdAt)) / 86400000);
  } catch {}

  const ageBg   = ageDays > 30 ? T.lost.bg   : ageDays > 14 ? T.pending.bg : T.won.bg;
  const ageColor = ageDays > 30 ? T.lost.text : ageDays > 14 ? T.pending.text : T.won.text;

  return (
    <div
      draggable={!isViewer}
      onDragStart={e => onDragStart(e, f)}
      onClick={() => onView(f)}
      style={{
        background: T.surface,
        border: `1px solid ${over ? T.lost.dot + "66" : T.line}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "grab",
        boxShadow: T.shadowSm,
        transition: "box-shadow .15s, transform .15s",
        userSelect: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadowSm; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: T.ink, fontFamily: F, lineHeight: 1.3, flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.name}
        </div>
        {f.quoteAmount && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5B3BE8", fontFamily: F, flexShrink: 0 }}>
            {inr(f.quoteAmount)}
          </div>
        )}
      </div>

      {/* Source + Type */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
        {f.leadSource && <SourcePill source={f.leadSource} T={T} />}
        {f.enquiryType && (
          <span style={{ fontSize: 10, color: T.inkMuted, background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 3, padding: "1px 6px", fontFamily: F }}>
            {f.enquiryType}
          </span>
        )}
      </div>

      {/* Follow-up date */}
      {f.nextFollowUp && f.status === "Pending" && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <Dot color={over ? T.lost.dot : tod ? T.pending.dot : T.inkMuted} size={5} />
          <span style={{ fontSize: 11, color: over ? T.lost.text : tod ? T.pending.text : T.inkSub, fontFamily: F, fontWeight: over || tod ? 600 : 400 }}>
            {over ? "Overdue · " : tod ? "Today · " : ""}{f.nextFollowUp}
          </span>
        </div>
      )}

      {/* Lead age badge */}
      {ageDays !== null && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: ageBg, color: ageColor, fontSize: 10, fontFamily: F, padding: "2px 7px", borderRadius: 10, marginBottom: 8, fontWeight: 600 }}>
          ⏱ {ageDays}d old
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Avatar name={f.assignedTo || f.createdBy} size={18} />
          <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F }}>{f.assignedTo || f.createdBy}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          {(over || tod) && !isViewer && (
            <button onClick={() => onLogFollowup(f)}
              style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, border: `1px solid ${T.pending.dot}55`, background: T.pending.bg, color: T.pending.text, cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
              Log
            </button>
          )}
          {FULL.includes(user.role) && (
            <button onClick={() => onEdit(f)}
              style={{ background: "transparent", border: `1px solid ${T.line}`, borderRadius: 4, padding: "2px 5px", cursor: "pointer", display: "flex" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Ic d={P.edit} sz={12} color={T.ink} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({ rows, user, onView, onEdit, onLogFollowup, onStatusChange, T }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver]  = useState(null);
  const isViewer = VIEWER.includes(user.role);

  const handleDragStart = (e, funnel) => {
    setDragging(funnel);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (dragging && dragging.status !== colId && !isViewer) {
      const confirmed = window.confirm(`Move "${dragging.name}" from ${dragging.status} → ${colId}?`);
      if (confirmed) onStatusChange(dragging.id, colId);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(240px, 1fr))", gap: 12, padding: "16px", minHeight: "calc(100vh - 280px)", alignItems: "start", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      {COLS.map(col => {
        const cards = rows.filter(f => f.status === col.id);
        const colRev = cards.reduce((a, f) => a + (Number(f.quoteAmount) || 0), 0);
        const isDragTarget = dragOver === col.id;
        return (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col.id)}
            style={{
              background: isDragTarget ? col.bg : T.surfaceEl,
              border: `2px dashed ${isDragTarget ? col.color : "transparent"}`,
              borderRadius: 10,
              padding: "12px 10px",
              minHeight: 200,
              transition: "all .15s",
            }}>
            {/* Column header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Dot color={col.color} size={8} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: F, letterSpacing: "0.01em" }}>{col.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: col.bg, color: col.color, padding: "1px 8px", borderRadius: 10, fontFamily: F, border: `1px solid ${col.color}33` }}>
                  {cards.length}
                </span>
              </div>
              {colRev > 0 && (
                <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F, fontWeight: 500 }}>
                  {inr(colRev)}
                </span>
              )}
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 12px", color: T.inkMuted, fontSize: 12, fontFamily: F }}>
                  {isDragTarget ? "Drop here" : "No leads"}
                </div>
              ) : (
                cards.map(f => (
                  <KanbanCard key={f.id} f={f} user={user} T={T}
                    onView={onView} onEdit={onEdit} onLogFollowup={onLogFollowup}
                    onDragStart={handleDragStart} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
