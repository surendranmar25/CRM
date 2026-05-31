import React, { useState, useMemo, useEffect } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, Avatar } from "../ui/index.jsx";
import { today, stamp } from "../../utils.js";
import { FULL, VIEWER } from "../../constants.js";
import { crmService } from "../../services/crmService.js";
import { supabase } from "../../lib/supabase.js";

const PRIORITIES = ["High", "Medium", "Low"];
const TASK_TYPES = ["Call", "Follow-up", "Send Catalogue", "Meeting", "Email", "WhatsApp", "Other"];

// ─── Notification storage (shared key — all roles read it) ───────────────────
const NOTIF_KEY = "ek_task_notifs_v1";
function loadNotifs()       { try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); } catch { return []; } }
function saveNotifs(notifs) { try { localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs)); } catch {} }

function pushNotif(notif) {
  const all = loadNotifs();
  const updated = [{ ...notif, id: Date.now() + Math.random(), createdAt: new Date().toISOString(), read: false }, ...all].slice(0, 100);
  saveNotifs(updated);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const typeIcon = { Call:"📞", "Follow-up":"📅", "Send Catalogue":"📦", Meeting:"🤝", Email:"✉️", WhatsApp:"💬", Other:"📝" };

const priorityDot = (T) => ({
  High:   { text: T.lost.text,    bg: T.lost.bg,    dot: T.lost.dot    },
  Medium: { text: T.pending.text, bg: T.pending.bg, dot: T.pending.dot },
  Low:    { text: T.won.text,     bg: T.won.bg,     dot: T.won.dot     },
});

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Label({ children, T }) {
  return (
    <label style={{ fontSize:10, fontWeight:600, color:T.inkMuted, fontFamily:F_MONO, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:4 }}>
      {children}
    </label>
  );
}

function StatusBadge({ task, T }) {
  if (task.done) return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:T.won.bg, color:T.won.text, border:`1px solid ${T.won.dot}33` }}>
      ✓ Completed
    </span>
  );
  const todayV = today();
  const isOverdue = task.dueDate && task.dueDate < todayV;
  const isToday   = task.dueDate === todayV;
  if (isOverdue) return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:T.lost.bg, color:T.lost.text, border:`1px solid ${T.lost.dot}33` }}>⚠ Overdue</span>;
  if (isToday)   return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:T.pending.bg, color:T.pending.text, border:`1px solid ${T.pending.dot}33` }}>📅 Due Today</span>;
  return <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:10, background:T.surfaceEl, color:T.inkSub, border:`1px solid ${T.line}` }}>Pending</span>;
}

// ─── Task Form (shared for Add + Edit) ───────────────────────────────────────
function TaskForm({ form, setForm, users, funnels, currentUser, onSave, onCancel, T, isEdit }) {
  const todayV = today();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Assignable users: all users except the current user (can assign to anyone)
  const assignableUsers = users.filter(u => u.name !== currentUser.name);

  return (
    <div style={{ background:T.surface, border:`1.5px solid ${T.brand}55`, borderRadius:12, padding:20, marginBottom:16, boxShadow:T.shadowMd, animation:"fadeUp .18s ease" }}>
      <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontFamily:F, marginBottom:16 }}>
        {isEdit ? "✏️ Edit Task" : "➕ New Task"}
      </div>

      {/* Row 1 — title, type, priority */}
      <div className="ek-tasks-form-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <Label T={T}>Task Title *</Label>
          <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Call back Priya about silk saree order"
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", boxSizing:"border-box", fontFamily:F }}
            onFocus={e=>e.currentTarget.style.borderColor=T.brand}
            onBlur={e=>e.currentTarget.style.borderColor=T.line} />
        </div>
        <div>
          <Label T={T}>Type</Label>
          <select value={form.type} onChange={e=>set("type",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", appearance:"none", boxSizing:"border-box", fontFamily:F }}>
            {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label T={T}>Priority</Label>
          <select value={form.priority} onChange={e=>set("priority",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", appearance:"none", boxSizing:"border-box", fontFamily:F }}>
            {PRIORITIES.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 — assign to, due date, due time */}
      <div className="ek-tasks-form-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <Label T={T}>Assign To</Label>
          <select value={form.assignedTo} onChange={e=>set("assignedTo",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${form.assignedTo ? T.brand : T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", appearance:"none", boxSizing:"border-box", fontFamily:F }}>
            <option value="">— Assign to yourself —</option>
            {assignableUsers.map(u=>(
              <option key={u.username} value={u.name}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div>
          <Label T={T}>Due Date</Label>
          <input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", boxSizing:"border-box", fontFamily:F }} />
        </div>
        <div>
          <Label T={T}>Due Time (optional)</Label>
          <input type="time" value={form.dueTime||""} onChange={e=>set("dueTime",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", boxSizing:"border-box", fontFamily:F }} />
        </div>
      </div>

      {/* Row 3 — link lead, note */}
      <div className="ek-tasks-form-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <Label T={T}>Link to Lead (optional)</Label>
          <select value={form.linkedFunnel||""} onChange={e=>set("linkedFunnel",e.target.value)}
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", appearance:"none", boxSizing:"border-box", fontFamily:F }}>
            <option value="">No lead linked</option>
            {funnels.filter(f=>f.status==="Pending").map(f=><option key={f.id} value={f.id}>{f.name} — {f.phone}</option>)}
          </select>
        </div>
        <div>
          <Label T={T}>Note (optional)</Label>
          <input value={form.note||""} onChange={e=>set("note",e.target.value)} placeholder="Additional details…"
            style={{ width:"100%", height:38, borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"0 11px", outline:"none", boxSizing:"border-box", fontFamily:F }}
            onFocus={e=>e.currentTarget.style.borderColor=T.brand}
            onBlur={e=>e.currentTarget.style.borderColor=T.line} />
        </div>
      </div>

      {/* Assigned-to preview */}
      {form.assignedTo && (
        <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:8, background:T.brandSubtle, border:`1px solid ${T.brand}33`, fontSize:12, color:T.brand, fontWeight:500 }}>
          🔔 <strong>{form.assignedTo}</strong> will receive a notification when this task is created
          {isEdit ? " (updated)" : ""}.
        </div>
      )}

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
        <Btn ghost label="Cancel" onClick={onCancel} T={T} />
        <Btn primary icon={P.check} label={isEdit ? "Save Changes" : "Create Task"} onClick={onSave} T={T} />
      </div>
    </div>
  );
}

// ─── Update Modal — mark done / in-progress with note ─────────────────────────
function UpdateModal({ task, onClose, onUpdate, T }) {
  const [status, setStatus] = useState(task.done ? "done" : "inprogress");
  const [note, setNote]     = useState("");
  const [pct, setPct]       = useState(task.progressPct || 0);

  const save = () => {
    const done = status === "done";
    const now  = new Date().toISOString();
    onUpdate({
      ...task,
      done,
      status,
      progressPct: done ? 100 : pct,
      doneAt: done ? stamp() : null,
      doneAtIso: done ? now : null,
      updates: [
        ...(task.updates || []),
        {
          id: Date.now(),
          by: "self", // resolved in parent
          status,
          progressPct: done ? 100 : pct,
          note: note.trim(),
          at: fmtDate(now),
          atIso: now,
        }
      ]
    });
    onClose();
  };

  const opts = [
    { id:"inprogress", label:"🔄 In Progress", desc:"Still working on it" },
    { id:"done",       label:"✅ Completed",   desc:"Task is fully done" },
    { id:"blocked",    label:"🚫 Blocked",     desc:"Cannot proceed — needs help" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(3px)", animation:"fadeIn .15s ease" }}>
      <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.lineMid}`, width:"100%", maxWidth:460, boxShadow:T.shadowXl, animation:"fadeUp .2s ease", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 22px 14px", borderBottom:`1px solid ${T.line}` }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.inkMuted, fontFamily:F_MONO, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Update Task</div>
          <div style={{ fontSize:15, fontWeight:700, color:T.ink }}>{task.title}</div>
          <div style={{ fontSize:11, color:T.inkMuted, marginTop:3 }}>Assigned by {task.createdBy} · Due {task.dueDate || "no date"}{task.dueTime ? " " + task.dueTime : ""}</div>
        </div>

        <div style={{ padding:"16px 22px" }}>
          {/* Status options */}
          <Label T={T}>Update Status</Label>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {opts.map(o=>(
              <button key={o.id} onClick={()=>setStatus(o.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`2px solid ${status===o.id ? T.brand : T.line}`, background:status===o.id ? T.brandSubtle : T.surfaceEl, cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{o.label.split(" ")[0]}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:status===o.id ? T.brand : T.ink }}>{o.label.split(" ").slice(1).join(" ")}</div>
                  <div style={{ fontSize:11, color:T.inkMuted }}>{o.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Progress slider (only when in-progress) */}
          {status === "inprogress" && (
            <div style={{ marginBottom:14 }}>
              <Label T={T}>Progress — {pct}%</Label>
              <input type="range" min={0} max={100} step={5} value={pct} onChange={e=>setPct(Number(e.target.value))}
                style={{ width:"100%", accentColor:T.brand }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.inkMuted, marginTop:2 }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom:16 }}>
            <Label T={T}>Update Note (optional)</Label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a status update, blocker, or completion note…" rows={3}
              style={{ width:"100%", borderRadius:8, border:`1.5px solid ${T.line}`, background:T.surface, color:T.ink, fontSize:13, padding:"9px 12px", outline:"none", resize:"vertical", fontFamily:F, boxSizing:"border-box" }}
              onFocus={e=>e.currentTarget.style.borderColor=T.brand}
              onBlur={e=>e.currentTarget.style.borderColor=T.line} />
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <Btn ghost label="Cancel" onClick={onClose} T={T} />
            <button onClick={save}
              style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:T.brand, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Save Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, currentUser, onToggleDone, onDelete, onEdit, onUpdate, funnels, T }) {
  const todayV = today();
  const isOverdue  = !task.done && task.dueDate && task.dueDate < todayV;
  const isToday    = !task.done && task.dueDate === todayV;
  const isMine     = task.assignedTo === currentUser.name || (!task.assignedTo && task.createdBy === currentUser.name);
  const isAssigned = task.assignedTo && task.assignedTo !== currentUser.name && task.createdBy === currentUser.name;
  const linked     = funnels.find(f => f.id === task.linkedFunnel);
  const pColors    = priorityDot(T);
  const pc         = pColors[task.priority] || pColors.Medium;
  const lastUpdate = task.updates?.slice(-1)[0];
  const pct        = task.progressPct || 0;

  const borderColor = task.done ? T.line : isOverdue ? T.lost.dot + "66" : isToday ? T.pending.dot + "66" : T.line;

  return (
    <div style={{ background:T.surface, border:`1px solid ${borderColor}`, borderLeft:`3px solid ${task.done ? T.won.dot : isOverdue ? T.lost.dot : isToday ? T.pending.dot : T.brand}`, borderRadius:10, padding:"13px 15px", boxShadow:T.shadowSm, opacity:task.done ? 0.72 : 1, transition:"all .15s" }}>
      {/* Top row */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        {/* Checkbox */}
        <button onClick={()=>onToggleDone(task.id)}
          style={{ width:20, height:20, borderRadius:6, border:`2px solid ${task.done ? T.won.dot : T.lineMid}`, background:task.done ? T.won.dot : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, transition:"all .15s" }}>
          {task.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        {/* Main content */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Title + priority */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontSize:14 }}>{typeIcon[task.type]||"📝"}</span>
            <span style={{ fontSize:13, fontWeight:700, color:T.ink, textDecoration:task.done?"line-through":"none", flex:1 }}>{task.title}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10, background:pc.bg, color:pc.text, border:`1px solid ${pc.dot}33`, flexShrink:0 }}>{task.priority}</span>
            <StatusBadge task={task} T={T} />
          </div>

          {/* Meta row */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:4 }}>
            {/* Who created */}
            <span style={{ fontSize:11, color:T.inkMuted, display:"flex", alignItems:"center", gap:4 }}>
              <Avatar name={task.createdBy} size={14} />
              {task.createdBy}
            </span>
            {/* Arrow to assigned */}
            {task.assignedTo && (
              <>
                <span style={{ fontSize:11, color:T.inkMuted }}>→</span>
                <span style={{ fontSize:11, color:T.brand, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  <Avatar name={task.assignedTo} size={14} />
                  {task.assignedTo}
                </span>
              </>
            )}
            {/* Due */}
            {task.dueDate && (
              <span style={{ fontSize:11, color:isOverdue?T.lost.text:isToday?T.pending.text:T.inkMuted, fontWeight:isOverdue||isToday?600:400 }}>
                📅 {task.dueDate}{task.dueTime ? " " + task.dueTime : ""}
              </span>
            )}
            {/* Type */}
            <span style={{ fontSize:11, color:T.inkMuted }}>{task.type}</span>
            {/* Linked lead */}
            {linked && (
              <span style={{ fontSize:10, background:T.brandSubtle, color:T.brand, padding:"1px 7px", borderRadius:10, fontWeight:500 }}>
                🔗 {linked.name}
              </span>
            )}
          </div>

          {/* Progress bar (if in-progress) */}
          {!task.done && pct > 0 && (
            <div style={{ marginBottom:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.inkMuted, marginBottom:3 }}>
                <span>Progress</span><span style={{ fontWeight:700, color:T.brand }}>{pct}%</span>
              </div>
              <div style={{ height:5, background:T.surfaceEl, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:T.brand, borderRadius:3, transition:"width .4s ease" }} />
              </div>
            </div>
          )}

          {/* Note */}
          {task.note && <div style={{ fontSize:12, color:T.inkSub, fontStyle:"italic", marginBottom:4 }}>{task.note}</div>}

          {/* Last update */}
          {lastUpdate && (
            <div style={{ fontSize:11, color:T.inkMuted, background:T.surfaceEl, borderRadius:6, padding:"5px 9px", display:"inline-flex", alignItems:"center", gap:6, marginTop:2 }}>
              <span>🕐</span>
              <span style={{ fontWeight:600, color:lastUpdate.status==="done"?T.won.text:lastUpdate.status==="blocked"?T.lost.text:T.pending.text }}>
                {lastUpdate.status==="done"?"Completed":lastUpdate.status==="blocked"?"Blocked":"In Progress"}
              </span>
              {lastUpdate.note && <span>· {lastUpdate.note}</span>}
              <span>· {lastUpdate.at}</span>
            </div>
          )}

          {/* Done time */}
          {task.done && task.doneAt && (
            <div style={{ fontSize:11, color:T.won.text, marginTop:4, fontWeight:500 }}>✓ Completed {task.doneAt}</div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"flex-start" }}>
          {/* Update button — assignee OR creator can update */}
          {(isMine || task.createdBy === currentUser.name) && (
            <button onClick={()=>onUpdate(task)} title="Update status"
              style={{ height:28, padding:"0 10px", borderRadius:7, border:`1px solid ${T.brand}44`, background:T.brandSubtle, color:T.brand, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
              Update
            </button>
          )}
          {/* Edit — only creator */}
          {task.createdBy === currentUser.name && (
            <button onClick={()=>onEdit(task)} title="Edit task"
              style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.line}`, background:T.surfaceEl, color:T.inkSub, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✏️
            </button>
          )}
          {/* Delete — only creator or FULL role */}
          {(task.createdBy === currentUser.name || FULL.includes(currentUser.role)) && (
            <button onClick={()=>onDelete(task.id)} title="Delete task"
              style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.line}`, background:T.surfaceEl, color:T.lost.text, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.lost.bg;e.currentTarget.style.borderColor=T.lost.dot;}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.surfaceEl;e.currentTarget.style.borderColor=T.line;}}>
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Update History Panel ─────────────────────────────────────────────────────
function HistoryPanel({ task, onClose, T }) {
  const updates = task.updates || [];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(2px)", animation:"fadeIn .15s ease" }}>
      <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.lineMid}`, width:"100%", maxWidth:440, maxHeight:"80vh", boxShadow:T.shadowXl, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeUp .2s ease" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>Update History</div>
            <div style={{ fontSize:11, color:T.inkMuted, marginTop:2 }}>{task.title}</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.line}`, background:T.surfaceEl, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 20px" }}>
          {updates.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:T.inkMuted, fontSize:13 }}>No updates yet</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...updates].reverse().map((u,i)=>(
                <div key={i} style={{ padding:"10px 12px", borderRadius:10, background:T.surfaceEl, border:`1px solid ${T.line}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:u.status==="done"?T.won.text:u.status==="blocked"?T.lost.text:T.pending.text }}>
                      {u.status==="done"?"✅ Completed":u.status==="blocked"?"🚫 Blocked":"🔄 In Progress"}
                    </span>
                    <span style={{ fontSize:10, color:T.inkMuted, fontFamily:F_MONO }}>{u.at}</span>
                  </div>
                  {u.progressPct!==undefined && u.status!=="done" && (
                    <div style={{ fontSize:11, color:T.brand, marginBottom:3 }}>Progress: {u.progressPct}%</div>
                  )}
                  {u.note && <div style={{ fontSize:12, color:T.inkSub, fontStyle:"italic" }}>{u.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN Tasks component ─────────────────────────────────────────────────────
export function Tasks({ user, users = [], funnels, T, onTaskNotif }) {
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [updateTask,  setUpdateTask]  = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");

  const BLANK = { title:"", type:"Call", priority:"Medium", dueDate:"", dueTime:"", note:"", linkedFunnel:"", assignedTo:"" };
  const [form, setForm] = useState(BLANK);
  const todayV = today();

  // ── Load tasks from Supabase on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    crmService.getAllTasks()
      .then(list => { if (!cancelled) { setTasks(list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Real-time sync: updates from other users appear instantly ─────────────────
  useEffect(() => {
    const ch = supabase
      .channel("tasks_realtime")
      .on("postgres_changes", { event:"*", schema:"public", table:"tasks" }, payload => {
        if (payload.eventType === "INSERT") {
          const t = crmService.mapTaskFromDb(payload.new);
          setTasks(prev => prev.find(x => x.id === t.id) ? prev : [t, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const t = crmService.mapTaskFromDb(payload.new);
          setTasks(prev => prev.map(x => x.id === t.id ? t : x));
        } else if (payload.eventType === "DELETE") {
          setTasks(prev => prev.filter(x => x.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Add Task ─────────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!form.title.trim()) return;
    const taskData = {
      title:        form.title.trim(),
      type:         form.type,
      priority:     form.priority,
      dueDate:      form.dueDate      || null,
      dueTime:      form.dueTime      || null,
      note:         form.note         || null,
      linkedFunnel: form.linkedFunnel || null,
      assignedTo:   form.assignedTo   || null,
      createdBy:    user.name,
      done:         false,
      progressPct:  0,
      updates:      [],
    };
    // Optimistic: add with temp ID immediately
    const tempId   = `temp_${Date.now()}`;
    const tempTask = { ...taskData, id:tempId, createdAt:new Date().toISOString() };
    setTasks(prev => [tempTask, ...prev]);
    if (form.assignedTo) {
      pushNotif({ type:"task_assigned", for:form.assignedTo, by:user.name, taskId:tempId, taskTitle:form.title, dueDate:form.dueDate, dueTime:form.dueTime, priority:form.priority, message:`${user.name} assigned you a task: "${form.title}"` });
      onTaskNotif && onTaskNotif();
    }
    setForm(BLANK);
    setShowForm(false);
    try {
      const saved = await crmService.createTask(taskData);
      setTasks(prev => prev.map(t => t.id === tempId ? saved : t));
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      console.error("Failed to create task:", e);
    }
  };

  // ── Edit Task ─────────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!form.title.trim()) return;
    const prev    = tasks.find(t => t.id === editTask.id);
    const changes = { ...editTask, ...form, dueDate:form.dueDate||null, dueTime:form.dueTime||null, linkedFunnel:form.linkedFunnel||null, assignedTo:form.assignedTo||null, updatedAt:new Date().toISOString() };
    setTasks(list => list.map(t => t.id === editTask.id ? changes : t));
    if (form.assignedTo && form.assignedTo !== editTask.assignedTo) {
      pushNotif({ type:"task_updated", for:form.assignedTo, by:user.name, taskId:editTask.id, taskTitle:form.title, dueDate:form.dueDate, priority:form.priority, message:`${user.name} updated & assigned you a task: "${form.title}"` });
      onTaskNotif && onTaskNotif();
    }
    setEditTask(null);
    setForm(BLANK);
    try {
      await crmService.updateTask(editTask.id, changes);
    } catch (e) {
      if (prev) setTasks(list => list.map(t => t.id === editTask.id ? prev : t));
      console.error("Failed to update task:", e);
    }
  };

  // ── Toggle Done ───────────────────────────────────────────────────────────────
  const toggleDone = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const now     = new Date().toISOString();
    const nowDone = !task.done;
    const updated = { ...task, done:nowDone, progressPct:nowDone?100:task.progressPct, status:nowDone?"done":null, doneAt:nowDone?stamp():null, doneAtIso:nowDone?now:null, updates:nowDone?[...(task.updates||[]),{id:Date.now(),status:"done",progressPct:100,note:"Marked complete",at:fmtDate(now),atIso:now}]:task.updates };
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    if (task.assignedTo === user.name && task.createdBy !== user.name) {
      pushNotif({ type:"task_done", for:task.createdBy, by:user.name, taskId:task.id, taskTitle:task.title, message:`${user.name} completed your task: "${task.title}"` });
      onTaskNotif && onTaskNotif();
    }
    try {
      await crmService.updateTask(id, updated);
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === id ? task : t));
      console.error("Failed to toggle task:", e);
    }
  };

  // ── Update from modal ─────────────────────────────────────────────────────────
  const handleUpdate = async (updated) => {
    const lastIdx = updated.updates.length - 1;
    if (lastIdx >= 0) updated.updates[lastIdx].by = user.name;
    const prev = tasks.find(t => t.id === updated.id);
    setTasks(list => list.map(t => t.id === updated.id ? updated : t));
    if (updated.assignedTo === user.name && updated.createdBy !== user.name) {
      const sl = updated.status==="done"?"completed":updated.status==="blocked"?"marked as blocked":"updated";
      pushNotif({ type:"task_update", for:updated.createdBy, by:user.name, taskId:updated.id, taskTitle:updated.title, message:`${user.name} ${sl} task: "${updated.title}"` });
      onTaskNotif && onTaskNotif();
    }
    try {
      await crmService.updateTask(updated.id, updated);
    } catch (e) {
      if (prev) setTasks(list => list.map(t => t.id === updated.id ? prev : t));
      console.error("Failed to update task:", e);
    }
  };

  // ── Delete Task ───────────────────────────────────────────────────────────────
  const deleteTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await crmService.deleteTask(id);
    } catch (e) {
      if (task) setTasks(prev => [task, ...prev]);
      console.error("Failed to delete task:", e);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = tasks;

    // Role-based scoping: only CEO/Manager/Editor see ALL tasks; everyone else sees only their own
    if (!FULL.includes(user.role)) {
      list = list.filter(t => t.createdBy === user.name || t.assignedTo === user.name);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.note||"").toLowerCase().includes(q) || (t.assignedTo||"").toLowerCase().includes(q) || t.createdBy.toLowerCase().includes(q));
    }

    // Tab filter
    if (filter === "mine")     return list.filter(t => !t.done && (t.assignedTo === user.name || (!t.assignedTo && t.createdBy === user.name)));
    if (filter === "assigned") return list.filter(t => !t.done && t.createdBy === user.name && t.assignedTo);
    if (filter === "today")    return list.filter(t => !t.done && t.dueDate === todayV);
    if (filter === "overdue")  return list.filter(t => !t.done && t.dueDate && t.dueDate < todayV);
    if (filter === "done")     return list.filter(t => t.done);
    return list.filter(t => !t.done); // "all" = pending only
  }, [tasks, filter, search, user, todayV]);

  const counts = useMemo(() => {
    const base = FULL.includes(user.role)
      ? tasks
      : tasks.filter(t => t.createdBy === user.name || t.assignedTo === user.name);
    return {
      all:      base.filter(t => !t.done).length,
      mine:     base.filter(t => !t.done && (t.assignedTo===user.name||(!t.assignedTo&&t.createdBy===user.name))).length,
      assigned: base.filter(t => !t.done && t.createdBy===user.name && t.assignedTo).length,
      today:    base.filter(t => !t.done && t.dueDate===todayV).length,
      overdue:  base.filter(t => !t.done && t.dueDate && t.dueDate<todayV).length,
      done:     base.filter(t => t.done).length,
    };
  }, [tasks, user, todayV]);

  const TABS = [
    { id:"all",      label:"All Pending" },
    { id:"mine",     label:"My Tasks"    },
    { id:"assigned", label:"I Assigned"  },
    { id:"today",    label:"Today"       },
    { id:"overdue",  label:"Overdue"     },
    { id:"done",     label:"Done"        },
  ];

  return (
    <div style={{ padding:"clamp(14px,3vw,20px) clamp(14px,4vw,24px)", maxWidth:860, margin:"0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:T.ink, fontFamily:F, margin:"0 0 4px", letterSpacing:"-0.4px" }}>Tasks</h2>
          <p style={{ fontSize:13, color:T.inkMuted, margin:0 }}>Create, assign, and track tasks across your entire team</p>
        </div>
        {!VIEWER.includes(user.role) && (
          <Btn primary icon={P.plus} label="New Task" onClick={() => { setEditTask(null); setForm(BLANK); setShowForm(true); }} T={T} />
        )}
      </div>

      {/* ── Search + filters ── */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.surface, border:`1.5px solid ${T.line}`, borderRadius:10, padding:"0 12px", height:36, flex:1, minWidth:180 }}>
          <Ic d={P.search} sz={13} color={T.inkMuted} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…"
            style={{ border:"none", outline:"none", background:"transparent", color:T.ink, fontSize:13, fontFamily:F, width:"100%" }} />
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setFilter(tab.id)}
              style={{ padding:"6px 12px", borderRadius:20, border:`1.5px solid ${filter===tab.id?T.brand:T.line}`, background:filter===tab.id?T.brand:T.surface, color:filter===tab.id?"#fff":T.inkSub, fontSize:12, fontWeight:filter===tab.id?700:500, cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all .15s" }}>
              {tab.label}
              {counts[tab.id] > 0 && (
                <span style={{ fontSize:10, fontWeight:700, background:filter===tab.id?"rgba(255,255,255,0.25)":T.surfaceEl, color:filter===tab.id?"#fff":tab.id==="overdue"?T.lost.text:T.brand, padding:"0 5px", borderRadius:8, lineHeight:"16px" }}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add form ── */}
      {showForm && !editTask && (
        <TaskForm form={form} setForm={setForm} users={users} funnels={funnels} currentUser={user}
          onSave={addTask} onCancel={()=>setShowForm(false)} T={T} isEdit={false} />
      )}

      {/* ── Edit form ── */}
      {editTask && (
        <TaskForm form={form} setForm={setForm} users={users} funnels={funnels} currentUser={user}
          onSave={saveEdit} onCancel={()=>{setEditTask(null);setForm(BLANK);}} T={T} isEdit={true} />
      )}

      {/* ── Task list ── */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="ek-skeleton" style={{ height:80, borderRadius:10 }}/>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 20px", color:T.inkMuted, fontFamily:F }}>
          <div style={{ fontSize:36, marginBottom:12 }}>{filter==="done"?"✅":"📋"}</div>
          <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:6 }}>
            {filter==="done"?"No completed tasks yet":"No tasks here"}
          </div>
          <div style={{ fontSize:13 }}>
            {filter==="overdue"?"Great — no overdue tasks!":filter==="done"?"Complete a task and it will show here":"Create a new task using the button above"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {visible.map(task => (
            <div key={task.id}>
              <TaskCard
                task={task}
                currentUser={user}
                funnels={funnels}
                T={T}
                onToggleDone={toggleDone}
                onDelete={deleteTask}
                onEdit={t => { setEditTask(t); setForm({ title:t.title, type:t.type, priority:t.priority, dueDate:t.dueDate||"", dueTime:t.dueTime||"", note:t.note||"", linkedFunnel:t.linkedFunnel||"", assignedTo:t.assignedTo||"" }); setShowForm(false); }}
                onUpdate={t => setUpdateTask(t)}
              />
              {/* History link */}
              {(task.updates||[]).length > 0 && (
                <button onClick={()=>setHistoryTask(task)}
                  style={{ marginTop:4, marginLeft:30, fontSize:11, color:T.brand, background:"none", border:"none", cursor:"pointer", fontFamily:F, padding:0 }}>
                  📋 {task.updates.length} update{task.updates.length!==1?"s":""} — view history
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {updateTask  && <UpdateModal  task={updateTask}  onClose={()=>setUpdateTask(null)}  onUpdate={handleUpdate}    T={T} />}
      {historyTask && <HistoryPanel task={historyTask} onClose={()=>setHistoryTask(null)}                            T={T} />}
    </div>
  );
}

// ─── TASK NOTIFICATION COUNT (for bell badge) ─────────────────────────────────
export function getTaskNotifCount(userName) {
  try {
    const notifs = loadNotifs();
    return notifs.filter(n => n.for === userName && !n.read).length;
  } catch { return 0; }
}

// ─── TASK NOTIFICATION PANEL (shown inside NotificationCenter) ────────────────
export function TaskNotifPanel({ userName, onDismiss, T }) {
  const [notifs, setNotifs] = useState(() => loadNotifs().filter(n => n.for === userName));

  const markAllRead = () => {
    const all = loadNotifs().map(n => n.for === userName ? { ...n, read:true } : n);
    saveNotifs(all);
    setNotifs(all.filter(n => n.for === userName));
    onDismiss && onDismiss();
  };

  const dismiss = (id) => {
    const all = loadNotifs().filter(n => n.id !== id);
    saveNotifs(all);
    setNotifs(all.filter(n => n.for === userName));
  };

  if (notifs.length === 0) return null;

  const typeEmoji = { task_assigned:"📋", task_updated:"✏️", task_done:"✅", task_update:"🔄" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:`1px solid ${T.line}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>🔔 Task Notifications ({notifs.filter(n=>!n.read).length} new)</div>
        <button onClick={markAllRead} style={{ fontSize:11, color:T.brand, background:"none", border:"none", cursor:"pointer", fontFamily:F }}>Mark all read</button>
      </div>
      {notifs.slice(0,5).map(n=>(
        <div key={n.id} style={{ padding:"10px 16px", borderBottom:`1px solid ${T.line}`, background:n.read?T.surface:T.brandSubtle, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{typeEmoji[n.type]||"🔔"}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:n.read?500:700, color:T.ink, lineHeight:1.4 }}>{n.message}</div>
            {n.dueDate && <div style={{ fontSize:11, color:T.inkMuted, marginTop:2 }}>Due: {n.dueDate}{n.dueTime?" "+n.dueTime:""} · {n.priority} priority</div>}
            <div style={{ fontSize:10, color:T.inkMuted, marginTop:2, fontFamily:F_MONO }}>{n.createdAt ? fmtDate(n.createdAt) : ""}</div>
          </div>
          <button onClick={()=>dismiss(n.id)} style={{ fontSize:14, color:T.inkMuted, background:"none", border:"none", cursor:"pointer", flexShrink:0 }}>✕</button>
        </div>
      ))}
    </div>
  );
}
