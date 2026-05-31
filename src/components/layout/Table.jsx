import React, { useState, useEffect } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Ic, P, Dot, Avatar, StatusPill, SourcePill, SkeletonRow } from "../ui/index.jsx";
import { FULL, VIEWER, can } from "../../constants.js";
import { today, inr } from "../../utils.js";
import { PhoneActionModal } from "../modals/PhoneActionModal.jsx";
import { FunnelViewers } from "./PresencePanel.jsx";

export function Table({ rows, user, onView, onEdit, onCreEdit, onDelete, onLogFollowup, onAddProof, loading, T, selectedIds = new Set(), toggleSelect, toggleSelectAll, viewersOf }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [phoneModal, setPhoneModal] = useState(null);
  const [sortCol, setSortCol] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const todayV = today();

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  if (loading) return (
    <div className="ek-table-wrap" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F_BODY }}>
        <tbody>{[...Array(8)].map((_, i) => <SkeletonRow key={i} T={T} />)}</tbody>
      </table>
    </div>
  );

  if (!rows.length) return (
    <div style={{ textAlign: "center", padding: "80px 24px", fontFamily: F_BODY }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: T.surfaceEl, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.inkMuted} strokeWidth="1.5" strokeLinecap="round"><path d={P.list} /></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8, letterSpacing: "-0.3px" }}>No leads found</div>
      <p style={{ fontSize: 13, color: T.inkMuted, margin: 0, maxWidth: 320, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>Adjust your filters or add a new lead to get started.</p>
    </div>
  );

  // Mobile card view
  if (isMobile) return (
    <div>
      {rows.map((f, i) => {
        const over = f.nextFollowUp && f.nextFollowUp < todayV && f.status === "Pending";
        const tod  = f.nextFollowUp === todayV && f.status === "Pending";
        const isViewer = VIEWER.includes(user.role);
        const showLog  = (over || tod) && f.status !== "Won" && !isViewer;
        const canCreEdit = !FULL.includes(user.role) && !isViewer && (f.createdBy === user.name || f.assignedTo === user.name);
        return (
          <div key={f.id} onClick={() => onView(f)}
            style={{
              padding: "14px 16px", borderBottom: `1px solid ${T.line}`,
              background: over ? `${T.lost.dot}06` : T.surface,
              cursor: "pointer", transition: "background .12s",
              animation: `fadeUp .22s ease ${Math.min(i, 6) * 0.04}s both`,
              borderLeft: over ? `3px solid ${T.lost.dot}` : tod ? `3px solid ${T.pending.dot}` : `3px solid transparent`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
            onMouseLeave={e => e.currentTarget.style.background = over ? `${T.lost.dot}06` : T.surface}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div onClick={e => e.stopPropagation()} style={{ paddingTop: 3 }}>
                {!isViewer && <input type="checkbox" checked={selectedIds.has(f.id)} onChange={() => toggleSelect(f.id)} style={{ accentColor: T.brand, width: 14, height: 14, cursor: "pointer" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Avatar name={f.name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "—"}</div>
                    <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted, display: "flex", gap: 5 }}>
                      <span>{f.createdBy}</span>
                      {f.assignedTo && <><span>·</span><span style={{ color: T.brand }}>→ {f.assignedTo}</span></>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {f.leadSource && <SourcePill source={f.leadSource} T={T} />}
                  {f.cityRegion && <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{f.cityRegion}</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <StatusPill status={f.status} sm T={T} />
                {f.nextFollowUp && f.status === "Pending" && (
                  <div style={{ fontSize: 9, fontFamily: F_MONO, color: over ? T.lost.text : tod ? T.pending.text : T.inkMuted, fontWeight: over || tod ? 700 : 400, marginTop: 4, textAlign: "right" }}>
                    {over ? "⚠ Overdue" : tod ? "📅 Today" : f.nextFollowUp}
                  </div>
                )}
              </div>
            </div>
            {f.quoteAmount && (
              <div style={{ fontSize: 12, fontWeight: 700, color: T.brand, fontFamily: F_MONO, marginBottom: 8 }}>{inr(f.quoteAmount)}</div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
              {showLog && <button onClick={() => onLogFollowup(f)} style={{ background: T.pending.bg, border: `1px solid ${T.pending.dot}44`, borderRadius: 6, padding: "5px 10px", fontSize: 10, fontWeight: 600, fontFamily: F_MONO, letterSpacing: "0.05em", color: T.pending.text, cursor: "pointer" }}>Log Follow-up</button>}
              {FULL.includes(user.role) && <button onClick={() => onEdit(f)} style={{ background: T.surface, border: `1px solid ${T.lineMid}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: F_MONO, color: T.inkSub }}>Edit</button>}
              {canCreEdit && <button onClick={() => onCreEdit(f)} style={{ background: T.brandSubtle, border: `1px solid ${T.brand}33`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: F_MONO, color: T.brand }}>Edit</button>}
              {FULL.includes(user.role) && <button onClick={() => onDelete(f.id)} style={{ background: T.lost.bg, border: `1px solid ${T.lost.dot}44`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: F_MONO, color: T.lost.text }}>Delete</button>}
            </div>
          </div>
        );
      })}
      {phoneModal && <PhoneActionModal phone={phoneModal.phone} name={phoneModal.name} onClose={() => setPhoneModal(null)} T={T} />}
    </div>
  );

  // Desktop table
  const SortTH = ({ col, children, style = {} }) => {
    const active = sortCol === col;
    return (
      <th onClick={() => handleSort(col)} style={{
        padding: "0 14px", textAlign: "left",
        fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: active ? T.brand : T.inkMuted,
        letterSpacing: "0.08em", textTransform: "uppercase",
        borderBottom: `1px solid ${T.lineMid}`, height: 38,
        background: T.surfaceEl, cursor: "pointer",
        whiteSpace: "nowrap", userSelect: "none", transition: "color .12s",
        ...style,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {children}
          {active && <span style={{ fontSize: 9 }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
        </div>
      </th>
    );
  };
  const TH = ({ children, style = {} }) => (
    <th style={{
      padding: "0 14px", textAlign: "left",
      fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: T.inkMuted,
      letterSpacing: "0.08em", textTransform: "uppercase",
      borderBottom: `1px solid ${T.lineMid}`, height: 38,
      background: T.surfaceEl, whiteSpace: "nowrap", ...style,
    }}>{children}</th>
  );

  return (
    <>
      <div className="ek-table-wrap" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F_BODY, tableLayout: "auto" }}>
          <colgroup>
            <col style={{width:"40px"}}/>
            <col style={{width:"36px"}}/>
            <col style={{width:"22%"}}/>
            <col style={{width:"12%"}}/>
            <col style={{width:"12%"}}/>
            <col style={{width:"11%"}}/>
            <col style={{width:"10%"}}/>
            <col style={{width:"10%"}}/>
            <col style={{width:"9%"}}/>
            <col style={{width:"90px"}}/>
            <col style={{width:"100px"}}/>
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: 40, padding: "0 14px", background: T.surfaceEl, borderBottom: `1px solid ${T.lineMid}`, height: 38 }}>
                {!VIEWER.includes(user.role) && <input type="checkbox" checked={rows.length > 0 && selectedIds.size === rows.length} onChange={toggleSelectAll} style={{ accentColor: T.brand, width: 14, height: 14, cursor: "pointer" }} />}
              </th>
              <TH style={{ width: 36 }}>#</TH>
              <SortTH col="name">Name</SortTH>
              <TH>Source</TH>
              <TH>Category</TH>
              <SortTH col="nextFollowUp">Follow-up</SortTH>
              <TH>Status</TH>
              <TH>Order No.</TH>
              <SortTH col="quoteAmount">Quote</SortTH>
              <SortTH col="createdAt">Added</SortTH>
              <TH style={{ textAlign: "right" }}>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const over = f.nextFollowUp && f.nextFollowUp < todayV && f.status === "Pending";
              const tod  = f.nextFollowUp === todayV && f.status === "Pending";
              const isViewer = VIEWER.includes(user.role);
              const showLog  = (over || tod) && f.status !== "Won" && !isViewer;
              const cats = [...new Set((f.products || []).map(p => p.category).filter(Boolean))].join(", ") || "—";
              const canCreEdit = !FULL.includes(user.role) && !isViewer && (f.createdBy === user.name || f.assignedTo === user.name);
              return (
                <tr key={f.id} className="ek-tr"
                  onClick={() => onView(f)}
                  style={{
                    borderBottom: `1px solid ${T.line}`, cursor: "pointer",
                    background: over ? `${T.lost.dot}04` : i % 2 === 0 ? T.surface : T.surfaceEl,
                    animation: `fadeUp .18s ease ${Math.min(i, 10) * 0.025}s both`,
                  }}>
                  {/* Checkbox */}
                  <td style={{ padding: "0 14px", height: 48, verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                    {!isViewer && <input type="checkbox" checked={selectedIds.has(f.id)} onChange={() => toggleSelect(f.id)} style={{ accentColor: T.brand, width: 14, height: 14, cursor: "pointer" }} />}
                  </td>
                  {/* # */}
                  <td style={{ padding: "0 14px", fontFamily: F_MONO, fontSize: 10, color: T.inkMuted }}>
                    {i + 1}
                  </td>
                  {/* Name */}
                  <td style={{ padding: "0 14px", minWidth: 180, maxWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={f.name} size={28} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "—"}</div>
                          {viewersOf && <FunnelViewers viewers={viewersOf(f.id)} T={T} />}
                        </div>
                        <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.createdBy}{f.assignedTo ? ` → ${f.assignedTo}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Source */}
                  <td style={{ padding: "0 14px", whiteSpace: "nowrap" }}>
                    {f.leadSource ? <SourcePill source={f.leadSource} T={T} /> : <span style={{ color: T.inkMuted, fontSize: 12 }}>—</span>}
                  </td>
                  {/* Category */}
                  <td style={{ padding: "0 14px", fontSize: 12, color: T.inkSub, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cats}</td>
                  {/* Follow-up */}
                  <td style={{ padding: "0 14px", whiteSpace: "nowrap" }}>
                    {f.nextFollowUp && f.status === "Pending" ? (
                      <span style={{
                        fontSize: 11, fontFamily: F_MONO, fontWeight: over || tod ? 700 : 400,
                        color: over ? T.lost.text : tod ? T.pending.text : T.inkSub,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {over ? "⚠" : tod ? "📅" : ""} {f.nextFollowUp}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontFamily: F_MONO, color: T.inkMuted }}>
                        {f.nextFollowUp || "—"}
                      </span>
                    )}
                  </td>
                  {/* Status */}
                  <td style={{ padding: "0 14px", whiteSpace: "nowrap" }}>
                    <StatusPill status={f.status} sm T={T} />
                  </td>
                  {/* Order No. */}
                  <td style={{ padding: "0 14px", fontSize: 11, fontFamily: F_MONO, color: T.inkSub, whiteSpace: "nowrap" }}>
                    {f.orderNumber || <span style={{ color: T.inkMuted }}>—</span>}
                  </td>
                  {/* Quote */}
                  <td style={{ padding: "0 14px", whiteSpace: "nowrap" }}>
                    {f.quoteAmount ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.won.text, fontFamily: F_MONO }}>{inr(f.quoteAmount)}</span>
                    ) : <span style={{ color: T.inkMuted, fontSize: 12 }}>—</span>}
                  </td>
                  {/* Added */}
                  <td style={{ padding: "0 14px", fontSize: 11, fontFamily: F_MONO, color: T.inkMuted, whiteSpace: "nowrap", minWidth: 80 }}>
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "0 10px 0 0", textAlign: "right", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      {showLog && (
                        <ActionBtn onClick={() => onLogFollowup(f)} color={T.pending.dot} bg={T.pending.bg} title="Log follow-up" T={T}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={P.clock} /></svg>
                        </ActionBtn>
                      )}
                      {f.status === "Won" && FULL.includes(user.role) && (
                        <ActionBtn onClick={() => onAddProof(f)} color={T.won.dot} bg={T.won.bg} title="Upload proof" T={T}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={P.up} /></svg>
                        </ActionBtn>
                      )}
                      {FULL.includes(user.role) && (
                        <ActionBtn onClick={() => onEdit(f)} color={T.brand} bg={T.brandSubtle} title="Edit lead" T={T}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={P.edit} /></svg>
                        </ActionBtn>
                      )}
                      {canCreEdit && (
                        <ActionBtn onClick={() => onCreEdit(f)} color={T.brand} bg={T.brandSubtle} title="Edit" T={T}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={P.edit} /></svg>
                        </ActionBtn>
                      )}
                      {FULL.includes(user.role) && (
                        <ActionBtn onClick={() => onDelete(f.id)} color={T.lost.dot} bg={T.lost.bg} title="Delete" T={T}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={P.trash} /></svg>
                        </ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {phoneModal && <PhoneActionModal phone={phoneModal.phone} name={phoneModal.name} onClose={() => setPhoneModal(null)} T={T} />}
    </>
  );
}

function ActionBtn({ onClick, color, bg, title, children, T }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 7, cursor: "pointer",
        background: hov ? `${color}18` : T.surfaceEl,
        color: hov ? color : T.inkMuted,
        border: `1px solid ${hov ? color+"33" : T.line}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .12s",
      }}>
      {children}
    </button>
  );
}
