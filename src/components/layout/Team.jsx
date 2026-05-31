import React, { useState, useEffect } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, FInput, FSelect, Avatar, Dot } from "../ui/index.jsx";
import { PresencePanel } from "./PresencePanel.jsx";
import { ROLES } from "../../constants.js";

export function Team({ users, onSave, onlineUsers = [], presenceMap = {}, currentUser, T }) {
  const [list, setList]       = useState(users);
  const [form, setForm]       = useState({ name:"", username:"", password:"", role:"CRE" });
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [err, setErr]         = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => setList(users), [users]);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const se = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const roleColor = { CEO: T.high, Manager: T.won, CRE: T.pending, Editor: T.cold, Viewer: T.drop };

  const add = () => {
    if (!form.name || !form.username || !form.password) { setErr("All fields required."); return; }
    if (list.find(u => u.username === form.username)) { setErr("Username already taken."); return; }
    const updated = [...list, { ...form, id: Date.now() }];
    setList(updated); onSave(updated);
    setForm({ name:"", username:"", password:"", role:"CRE" }); setErr("");
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setEditForm({ name: u.name, username: u.username, password: u.password, role: u.role });
    setErr("");
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.username || !editForm.password) { setErr("All fields required."); return; }
    const dup = list.find(u => u.username === editForm.username && u.id !== editId);
    if (dup) { setErr("Username already taken."); return; }
    const updated = list.map(u => u.id === editId ? { ...u, ...editForm } : u);
    setList(updated); onSave(updated); setEditId(null); setErr("");
  };

  const remove = (id) => {
    const updated = list.filter(u => u.id !== id);
    setList(updated); onSave(updated); setConfirmDel(null);
  };

  return (
    <div style={{ padding: "clamp(12px,3vw,16px)", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.ink, fontFamily: F, margin: "0 0 4px" }}>Team Management</h2>
        <p style={{ fontSize: 13, color: T.inkMuted, fontFamily: F, margin: 0 }}>Add, edit or remove team members. Changes take effect immediately.</p>
      </div>

      {/* Live Presence Panel */}
      <div style={{ marginBottom: 20 }}>
        <PresencePanel onlineUsers={onlineUsers} allUsers={list} currentUser={currentUser} T={T} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }} className="ek-team-grid">

        {/* Add member card */}
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: 22, boxShadow: T.shadowSm, height: "fit-content" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 3, fontFamily: F }}>Add Team Member</div>
          <div style={{ fontSize: 12, color: T.inkSub, marginBottom: 18, fontFamily: F }}>Access granted immediately on creation</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FInput label="Full name" value={form.name} onChange={v=>sf("name",v)} placeholder="e.g. Priya Sharma" T={T} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FInput label="Username" value={form.username} onChange={v=>sf("username",v)} placeholder="priya" T={T} required />
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Password <span style={{ color: "#DC2626" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e=>sf("password",e.target.value)} placeholder="••••••"
                    style={{ width: "100%", padding: "8px 36px 8px 11px", border: `1px solid ${T.lineMid}`, borderRadius: 4, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none", boxSizing: "border-box" }} />
                  <button onClick={() => setShowPw(x => !x)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.inkMuted, padding: 2, fontSize: 12 }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>
            <FSelect label="Role" value={form.role} onChange={v=>sf("role",v)} options={ROLES} T={T} />
            {err && <div style={{ fontSize: 12, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", padding: "8px 11px", borderRadius: 6 }}>{err}</div>}
            <Btn primary full icon={P.plus} label="Add Member" onClick={add} T={T} />
          </div>

          {/* Role legend */}
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { role: "CEO",     desc: "Full access to everything + team management" },
              { role: "Manager", desc: "Full access + team management" },
              { role: "Editor",  desc: "Full CRM access + app update management (push updates to all users)" },
              { role: "CRE",     desc: "Create, export, limited edit" },
              { role: "Viewer",  desc: "Read-only access" },
            ].map(r => {
              const c = roleColor[r.role] || T.drop;
              return (
                <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: c.bg, borderRadius: 6, border: `1px solid ${c.dot}22` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.text, minWidth: 58 }}>{r.role}</span>
                  <span style={{ fontSize: 11, color: c.text, opacity: 0.8 }}>— {r.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team list */}
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, boxShadow: T.shadowSm, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: F }}>Team Members</div>
            <span style={{ fontSize: 12, fontWeight: 600, background: T.brandSubtle, color: "#5B3BE8", padding: "3px 10px", borderRadius: 10, fontFamily: F }}>{list.length} members</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {list.map((u, i) => {
              const c = roleColor[u.role] || T.drop;
              const isEditing = editId === u.id;
              return (
                <div key={u.id} style={{ borderBottom: i < list.length - 1 ? `1px solid ${T.line}` : "none" }}>
                  {isEditing ? (
                    /* ── Edit row ── */
                    <div style={{ padding: "16px 20px", background: T.brandSubtle, borderLeft: "3px solid #5B3BE8" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#5B3BE8", marginBottom: 12, fontFamily: F }}>Editing: {u.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <FInput label="Full name" value={editForm.name} onChange={v=>se("name",v)} placeholder="Full name" T={T} />
                        <FInput label="Username" value={editForm.username} onChange={v=>se("username",v)} placeholder="username" T={T} />
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 500, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Password</label>
                          <div style={{ position: "relative" }}>
                            <input type={showEditPw ? "text" : "password"} value={editForm.password} onChange={e=>se("password",e.target.value)}
                              style={{ width: "100%", padding: "8px 32px 8px 11px", border: `1px solid ${T.lineMid}`, borderRadius: 4, fontSize: 13, fontFamily: F, color: T.ink, background: T.surface, outline: "none", boxSizing: "border-box" }} />
                            <button onClick={() => setShowEditPw(x => !x)} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>
                              {showEditPw ? "🙈" : "👁"}
                            </button>
                          </div>
                        </div>
                        <FSelect label="Role" value={editForm.role} onChange={v=>se("role",v)} options={ROLES} T={T} />
                      </div>
                      {err && <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 10 }}>{err}</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn primary sm icon={P.check} label="Save changes" onClick={saveEdit} T={T} />
                        <Btn ghost sm label="Cancel" onClick={() => { setEditId(null); setErr(""); }} T={T} />
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ── */
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Avatar name={u.name} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: F }}>{u.name}</span>
                          {(presenceMap[u.username] || (currentUser && u.username === currentUser.username)) && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "JetBrains Mono,monospace", color: "#10b981", background: "#10b98112", padding: "1px 7px", borderRadius: 10, border: "1px solid #10b98130", fontWeight: 600 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                              ONLINE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F, marginTop: 2 }}>
                          @{u.username}
                          {presenceMap[u.username] && u.username !== currentUser?.username && (
                            <span style={{ marginLeft: 6, color: T.inkMuted }}>
                              · {presenceMap[u.username].funnelName
                                ? `Viewing "${presenceMap[u.username].funnelName}"`
                                : `On ${presenceMap[u.username].pageLabel || presenceMap[u.username].view}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.dot}33`, fontFamily: F, flexShrink: 0 }}>
                        {u.role}
                      </span>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => startEdit(u)}
                          style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.inkSub, fontSize: 12, fontFamily: F, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.surfaceEl; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <Ic d={P.edit} sz={11} color={T.inkSub} /> Edit
                        </button>
                        {u.id !== 1 && (
                          confirmDel === u.id ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: T.lost.text, fontFamily: F }}>Sure?</span>
                              <button onClick={() => remove(u.id)} style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.lost.dot}`, background: T.lost.bg, color: T.lost.text, fontSize: 12, cursor: "pointer", fontFamily: F }}>Yes</button>
                              <button onClick={() => setConfirmDel(null)} style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.line}`, background: "transparent", color: T.inkSub, fontSize: 12, cursor: "pointer", fontFamily: F }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDel(u.id)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.lost.text, fontSize: 12, fontFamily: F, cursor: "pointer" }}
                              onMouseEnter={e => { e.currentTarget.style.background = T.lost.bg; e.currentTarget.style.borderColor = T.lost.dot; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.line; }}>
                              Remove
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
