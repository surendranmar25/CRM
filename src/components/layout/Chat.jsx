import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Avatar } from "../ui/index.jsx";
import { crmService } from "../../services/crmService.js";
import { supabase } from "../../lib/supabase.js";

const MAX_IMAGE_MB = 10;
const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return t;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${t}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${t}`;
}

function fmtDateDivider(iso) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function extractMentions(text) {
  return [...(text || "").matchAll(/@([\w][\w ]*?)(?=[\s,.]|$)/g)].map(m => m[1].trim());
}

function canEdit(msg) {
  if (!msg.createdAt) return false;
  return Date.now() - new Date(msg.createdAt).getTime() < EDIT_WINDOW_MS;
}

const CHANNEL_META = {
  general:       { icon: "#",  label: "General",       desc: "All team members" },
  announcements: { icon: "📢", label: "Announcements", desc: "Important updates" },
  sales:         { icon: "💼", label: "Sales",          desc: "Deals & pipeline talk" },
};

const ROLE_PILL = {
  CEO:     { bg: "#fef3c7", color: "#92400e" },
  Manager: { bg: "#d1fae5", color: "#065f46" },
  Editor:  { bg: "#ede9fe", color: "#5b21b6" },
  CRE:     { bg: "#dbeafe", color: "#1e40af" },
  Viewer:  { bg: "#f3f4f6", color: "#374151" },
};

// ─── MENTION RENDERER ────────────────────────────────────────────────────────
function MsgText({ text, isMe, T }) {
  if (!text) return null;
  return (
    <span style={{ fontSize: 14, color: isMe ? "#fff" : T.ink, lineHeight: 1.65, fontFamily: F, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
      {text.split(/(@[\w][\w ]*)/g).map((part, i) =>
        part.startsWith("@") ? (
          <mark key={i} style={{ background: isMe ? "rgba(255,255,255,0.25)" : T.brandSubtle, color: isMe ? "#fff" : T.brand, borderRadius: 4, padding: "0 4px", fontWeight: 700 }}>
            {part}
          </mark>
        ) : part
      )}
    </span>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function Message({ msg, prevMsg, isMe, T, onEdit, onDelete, onRetry }) {
  const [hovered, setHovered] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(msg.text || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef(null);

  const withinWindow = canEdit(msg);
  const showActions  = isMe && withinWindow && !msg.pending && !msg.failed && !msg.isDeleted;

  const gap = prevMsg && prevMsg.sender === msg.sender &&
    !prevMsg.pending && !prevMsg.failed &&
    (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 5 * 60 * 1000;

  const newDay = !prevMsg ||
    new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

  const rp = ROLE_PILL[msg.senderRole] || ROLE_PILL.Viewer;

  const saveEdit = () => {
    const t = editText.trim();
    if (!t || t === msg.text) { setEditing(false); return; }
    onEdit(msg.id, t);
    setEditing(false);
  };

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      const len = editRef.current?.value?.length || 0;
      editRef.current?.setSelectionRange(len, len);
    }
  }, [editing]);

  // Deleted message
  if (msg.isDeleted) {
    return (
      <>
        {newDay && <DateDivider iso={msg.createdAt} T={T} />}
        <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, padding: "3px 16px" }}>
          <div style={{ width: 34, flexShrink: 0 }} />
          <div style={{ padding: "8px 14px", background: "transparent", border: `1px dashed ${T.line}`, borderRadius: 12, color: T.inkMuted, fontSize: 12, fontStyle: "italic", fontFamily: F }}>
            🗑 This message was deleted
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {newDay && <DateDivider iso={msg.createdAt} T={T} />}

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
        style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, padding: `${gap ? 2 : 10}px 16px ${gap ? 1 : 2}px`, position: "relative" }}>

        {/* Avatar */}
        <div style={{ width: 34, flexShrink: 0 }}>
          {!gap ? <Avatar name={msg.sender} size={34} /> : <div style={{ width: 34 }} />}
        </div>

        <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3, position: "relative" }}>

          {/* Name / role / time */}
          {!gap && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{msg.sender}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: rp.bg, color: rp.color, fontFamily: F_MONO }}>{msg.senderRole}</span>
              <span style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{fmtTime(msg.createdAt)}</span>
              {msg.editedAt && <span style={{ fontSize: 9, color: T.inkMuted, fontFamily: F_MONO }}>(edited)</span>}
            </div>
          )}

          {/* Action buttons — edit / delete */}
          {showActions && hovered && !editing && (
            <div style={{
              position: "absolute",
              top: gap ? -4 : -32,
              [isMe ? "left" : "right"]: 0,
              display: "flex", gap: 4, zIndex: 10,
              background: T.surface, border: `1px solid ${T.line}`,
              borderRadius: 8, padding: "3px 4px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              animation: "fadeUp .1s ease",
            }}>
              {!confirmDelete ? (
                <>
                  <button
                    onClick={() => { setEditText(msg.text || ""); setEditing(true); }}
                    title="Edit (30 min window)"
                    style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSub, transition: "all .1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.brandSubtle; e.currentTarget.style.color = T.brand; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.inkSub; }}>
                    <Ic d={P.edit} sz={13} color="currentColor" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    title="Delete (30 min window)"
                    style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSub, transition: "all .1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.inkSub; }}>
                    <Ic d={P.trash} sz={13} color="currentColor" />
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: T.ink, padding: "0 6px", lineHeight: "26px", whiteSpace: "nowrap" }}>Delete?</span>
                  <button onClick={() => { onDelete(msg.id); setConfirmDelete(false); }}
                    style={{ padding: "0 8px", height: 26, borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                    Yes
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ padding: "0 8px", height: 26, borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.inkSub, fontSize: 11, cursor: "pointer", fontFamily: F }}>
                    No
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bubble — edit mode */}
          {editing ? (
            <div style={{ width: "100%", minWidth: 200 }}>
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") setEditing(false);
                }}
                style={{
                  width: "100%", padding: "9px 12px", border: `2px solid ${T.brand}`,
                  borderRadius: 12, fontSize: 13, fontFamily: F, color: T.ink,
                  background: T.bg, outline: "none", resize: "none", lineHeight: 1.6,
                  boxSizing: "border-box", minHeight: 60,
                  boxShadow: `0 0 0 3px ${T.brand}22`,
                }}
                rows={2}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 5, justifyContent: "flex-end" }}>
                <button onClick={() => setEditing(false)}
                  style={{ padding: "4px 12px", borderRadius: 7, border: `1px solid ${T.line}`, background: "transparent", cursor: "pointer", fontSize: 12, color: T.inkSub, fontFamily: F }}>
                  Cancel
                </button>
                <button onClick={saveEdit}
                  style={{ padding: "4px 14px", borderRadius: 7, border: "none", background: T.brand, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: F }}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            /* Normal bubble */
            <div style={{
              padding: msg.imageUrl ? "6px" : "10px 14px",
              background: isMe ? `linear-gradient(135deg, ${T.brand}, ${T.brandHover})` : T.surfaceEl,
              borderRadius: 16,
              border: `1px solid ${isMe ? "transparent" : T.line}`,
              boxShadow: isMe ? `0 2px 12px ${T.brand}33` : "0 1px 3px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}>
              {/* Image */}
              {msg.imageUrl && (
                <div style={{ marginBottom: msg.text ? 6 : 0 }}>
                  <img
                    src={msg.imageUrl}
                    alt="shared"
                    onClick={() => window.open(msg.imageUrl, "_blank")}
                    style={{ maxWidth: 260, maxHeight: 200, borderRadius: 10, display: "block", cursor: "pointer", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
              )}
              {/* Text */}
              {msg.text && <MsgText text={msg.text} isMe={isMe} T={T} />}
            </div>
          )}

          {/* Time / pending / failed */}
          {!editing && gap && !msg.pending && !msg.failed && (
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, paddingLeft: 4 }}>{fmtTime(msg.createdAt)}</div>
          )}
          {msg.pending && (
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", border: `1.5px solid ${T.inkMuted}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />
              Sending…
            </div>
          )}
          {msg.failed && (
            <div style={{ fontSize: 10, color: "#ef4444", fontFamily: F_MONO, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>⚠ Failed to send</span>
                {onRetry && <button onClick={() => onRetry(msg)} style={{ background: "none", border: "none", cursor: "pointer", color: T.brand, fontSize: 10, fontFamily: F_MONO, fontWeight: 700, padding: 0 }}>· Retry</button>}
              </div>
              {msg.errMsg && <span style={{ color: T.inkMuted, fontSize: 9, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={msg.errMsg}>{msg.errMsg}</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DateDivider({ iso, T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px 10px" }}>
      <div style={{ flex: 1, height: 1, background: T.line }} />
      <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, padding: "3px 12px", background: T.surface, borderRadius: 20, border: `1px solid ${T.line}`, fontWeight: 600 }}>
        {fmtDateDivider(iso)}
      </span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  );
}

// ─── MESSAGE INPUT ────────────────────────────────────────────────────────────
function MessageInput({ onSend, onSendImage, users, currentUserName, T }) {
  const [text,         setText]         = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [imgPreview,   setImgPreview]   = useState(null); // { file, url }
  const [uploading,    setUploading]    = useState(false);
  const [imgError,     setImgError]     = useState(null);
  const taRef   = useRef(null);
  const fileRef = useRef(null);

  const suggestions = useMemo(() => {
    if (!mentionQuery) return [];
    return users.filter(u => u.name !== currentUserName && u.name.toLowerCase().includes(mentionQuery.q.toLowerCase())).slice(0, 5);
  }, [mentionQuery, users, currentUserName]);

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 148) + "px";
  };

  const handleChange = e => {
    const v = e.target.value;
    setText(v);
    const before = v.slice(0, e.target.selectionStart);
    const m = before.match(/@([\w][\w ]*)$/);
    setMentionQuery(m ? { q: m[1], atIdx: before.lastIndexOf("@") } : null);
    resize();
  };

  const insertMention = name => {
    const before = text.slice(0, mentionQuery.atIdx);
    const after  = text.slice(taRef.current.selectionStart);
    setText(`${before}@${name} ${after}`);
    setMentionQuery(null);
    taRef.current?.focus();
    setTimeout(resize, 0);
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError(null);
    if (!file.type.startsWith("image/")) { setImgError("Only images are allowed."); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setImgError(`Image must be under ${MAX_IMAGE_MB} MB.`); return; }
    const url = URL.createObjectURL(file);
    setImgPreview({ file, url });
    e.target.value = "";
  };

  const cancelImage = () => {
    if (imgPreview?.url) URL.revokeObjectURL(imgPreview.url);
    setImgPreview(null); setImgError(null);
  };

  const submit = async () => {
    if (imgPreview) {
      setUploading(true);
      try {
        await onSendImage(imgPreview.file, text.trim());
        cancelImage();
        setText("");
        if (taRef.current) taRef.current.style.height = "auto";
      } catch (err) {
        setImgError(err?.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
      return;
    }
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setMentionQuery(null);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const canSubmit = (imgPreview || text.trim()) && !uploading;

  return (
    <div style={{ padding: "10px 14px 12px", background: T.surface, borderTop: `1px solid ${T.line}`, flexShrink: 0, position: "relative" }}>

      {/* @mention popup */}
      {mentionQuery && suggestions.length > 0 && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 14, right: 14, background: T.surface, border: `1.5px solid ${T.brand}`, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 60 }}>
          <div style={{ padding: "6px 14px 4px", fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.1em", background: T.surfaceEl, borderBottom: `1px solid ${T.line}` }}>
            Mention teammate
          </div>
          {suggestions.map(u => {
            const rp = ROLE_PILL[u.role] || ROLE_PILL.Viewer;
            return (
              <div key={u.name} onMouseDown={e => { e.preventDefault(); insertMention(u.name); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.brandSubtle}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar name={u.name} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{u.role}</div>
                </div>
                <span style={{ fontSize: 10, background: rp.bg, color: rp.color, padding: "1px 7px", borderRadius: 6, fontWeight: 700 }}>{u.role}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Image preview */}
      {imgPreview && (
        <div style={{ marginBottom: 8, padding: 8, background: T.surfaceEl, borderRadius: 10, border: `1px solid ${T.lineMid}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <img src={imgPreview.url} alt="preview" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imgPreview.file.name}</div>
            <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{(imgPreview.file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <button onClick={cancelImage} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: T.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic d={P.close} sz={11} color={T.inkMuted} />
          </button>
        </div>
      )}

      {/* Error */}
      {imgError && (
        <div style={{ marginBottom: 6, fontSize: 11, color: "#ef4444", fontFamily: F_MONO, display: "flex", alignItems: "center", gap: 5 }}>
          ⚠ {imgError}
          <button onClick={() => setImgError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0 }}>×</button>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: T.bg, border: `1.5px solid ${T.lineMid}`, borderRadius: 14, padding: "6px 8px 6px 12px", transition: "border-color .15s" }}
        onFocusCapture={e => e.currentTarget.style.borderColor = T.brand}
        onBlurCapture={e => e.currentTarget.style.borderColor = T.lineMid}>

        {/* Image button */}
        <button onClick={() => fileRef.current?.click()}
          title="Send image (max 10 MB)"
          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.background = T.brandSubtle; e.currentTarget.style.borderColor = T.brand; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surfaceEl; e.currentTarget.style.borderColor = T.line; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.inkSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        <textarea
          ref={taRef}
          value={text}
          onChange={handleChange}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            if (e.key === "Escape") setMentionQuery(null);
          }}
          placeholder={imgPreview ? "Add a caption… (optional)" : "Message… (@ to mention, Enter to send)"}
          rows={1}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: F, color: T.ink, resize: "none", lineHeight: 1.6, maxHeight: 148, overflowY: "auto", scrollbarWidth: "none", paddingTop: 2, paddingBottom: 2 }}
        />

        <button onClick={submit} disabled={!canSubmit}
          style={{ width: 34, height: 34, borderRadius: 9, border: "none", flexShrink: 0, background: canSubmit ? T.brand : T.surfaceEl, cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", boxShadow: canSubmit ? `0 3px 10px ${T.brand}44` : "none" }}>
          {uploading
            ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} />
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={canSubmit ? "#fff" : T.inkMuted} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          }
        </button>
      </div>
      <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, marginTop: 5, paddingLeft: 2 }}>
        Enter to send · Shift+Enter for new line · @ to mention · 🖼 image up to {MAX_IMAGE_MB} MB
      </div>
    </div>
  );
}

// ─── CHANNEL SIDEBAR ─────────────────────────────────────────────────────────
function Sidebar({ active, onSelect, users, currentUser, unread, T, onClose }) {
  const dmUsers = users.filter(u => u.name !== currentUser.name);
  const NavItem = ({ id, icon, label, sub, count }) => {
    const isActive = active === id;
    return (
      <button onClick={() => { onSelect(id); onClose?.(); }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: isActive ? T.brandSubtle : "transparent", cursor: "pointer", transition: "all .12s", textAlign: "left" }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.surfaceEl; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: isActive ? T.brand : T.surfaceEl, border: `1.5px solid ${isActive ? "transparent" : T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: isActive ? "#fff" : T.inkSub, transition: "all .12s" }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? T.brand : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, marginTop: 1 }}>{sub}</div>}
        </div>
        {count > 0 && !isActive && (
          <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: T.brand, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.surface }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, letterSpacing: "-0.4px" }}>Team Chat</div>
            <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>{users.length} members</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic d={P.close} sz={12} color={T.inkMuted} />
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 8px 8px" }}>Channels</div>
        {Object.entries(CHANNEL_META).map(([id, meta]) => (
          <NavItem key={id} id={id} icon={meta.icon} label={meta.label} sub={meta.desc} count={unread[id] || 0} />
        ))}
        <div style={{ height: 1, background: T.line, margin: "12px 4px" }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 8px 8px" }}>Direct Messages</div>
        {dmUsers.length === 0
          ? <div style={{ padding: "6px 12px", fontSize: 12, color: T.inkMuted }}>No other team members</div>
          : dmUsers.map(u => (
              <NavItem key={u.name} id={crmService.dmChannel(currentUser.name, u.name)} icon={<Avatar name={u.name} size={22} />} label={u.name} sub={u.role} count={unread[crmService.dmChannel(currentUser.name, u.name)] || 0} />
            ))
        }
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ channel, dmPartner, T }) {
  const isDM = channel.startsWith("dm_");
  const meta = CHANNEL_META[channel];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: T.brandSubtle, border: `1.5px solid ${T.brand}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>
        {isDM ? "👋" : meta?.icon || "#"}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: "-0.3px", marginBottom: 6 }}>
        {isDM ? `Message ${dmPartner}` : `Welcome to ${meta?.label || channel}`}
      </div>
      <div style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.7, maxWidth: 300 }}>
        {isDM ? `Private conversation with ${dmPartner}.` : `${meta?.desc}. Say hello!`}
      </div>
    </div>
  );
}

// ─── MAIN CHAT ────────────────────────────────────────────────────────────────
export function Chat({ user, users, T }) {
  const [activeChannel,     setActiveChannel]     = useState("general");
  const [messages,          setMessages]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [dbError,           setDbError]           = useState(null);
  const [unread,            setUnread]            = useState({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const bottomRef  = useRef(null);
  const activeRef  = useRef(activeChannel);
  activeRef.current = activeChannel;

  const isDM = activeChannel.startsWith("dm_");
  const dmPartner = useMemo(() => {
    if (!isDM) return null;
    return activeChannel.replace("dm_", "").split("___").find(n => n !== user.name) || null;
  }, [isDM, activeChannel, user.name]);

  const channelLabel = useMemo(() => {
    if (!isDM) return CHANNEL_META[activeChannel]?.label || activeChannel;
    return dmPartner || activeChannel;
  }, [isDM, activeChannel, dmPartner]);

  const channelDesc = useMemo(() => {
    if (!isDM) return CHANNEL_META[activeChannel]?.desc || "";
    const u = users.find(u => u.name === dmPartner);
    return u ? `${u.role} · Direct message` : "Direct message";
  }, [isDM, activeChannel, dmPartner, users]);

  // Load messages
  const load = useCallback(async ch => {
    setLoading(true); setDbError(null);
    try { setMessages(await crmService.getChatMessages(ch)); }
    catch (err) {
      const m = err?.message || "";
      setDbError(m.includes("does not exist") || m.includes("relation")
        ? "team_messages table not found — run schema.sql in Supabase first."
        : (m || "Could not load messages."));
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(activeChannel);
    crmService.markChannelRead(user.name, activeChannel);
    setUnread(p => ({ ...p, [activeChannel]: 0 }));
  }, [activeChannel, load, user.name]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Real-time: INSERT + UPDATE (edits) + DELETE
  useEffect(() => {
    const ch = supabase
      .channel("team_chat_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, ({ new: row }) => {
        const msg = mapRow(row);
        if (msg.channel === activeRef.current) {
          setMessages(p => {
            if (p.some(m => m.id === msg.id)) return p;
            const ti = p.findIndex(m => m.pending && m.sender === msg.sender && m.text === msg.text);
            if (ti !== -1) { const n = [...p]; n[ti] = { ...msg, pending: false }; return n; }
            return [...p, msg];
          });
          crmService.markChannelRead(user.name, msg.channel);
        } else {
          setUnread(p => ({ ...p, [msg.channel]: (p[msg.channel] || 0) + 1 }));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "team_messages" }, ({ new: row }) => {
        const msg = mapRow(row);
        setMessages(p => p.map(m => m.id === msg.id ? { ...m, text: msg.text, editedAt: msg.editedAt, isDeleted: msg.isDeleted } : m));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user.name]);

  const handleSend = async text => {
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, channel: activeChannel, sender: user.name, senderRole: user.role, text, mentions: extractMentions(text), createdAt: new Date().toISOString(), pending: true };
    setMessages(p => [...p, optimistic]);
    try {
      const saved = await crmService.sendChatMessage(activeChannel, user.name, user.role, text, extractMentions(text));
      setMessages(p => p.map(m => m.id === tempId ? { ...saved, pending: false } : m));
    } catch (err) {
      setMessages(p => p.map(m => m.id === tempId ? { ...m, pending: false, failed: true, errMsg: err?.message } : m));
    }
  };

  const handleSendImage = async (file, caption) => {
    const tempId = `temp_img_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const optimistic = { id: tempId, channel: activeChannel, sender: user.name, senderRole: user.role, text: caption || "", imageUrl: previewUrl, mentions: [], createdAt: new Date().toISOString(), pending: true };
    setMessages(p => [...p, optimistic]);
    try {
      const imageUrl = await crmService.uploadChatImage(file);
      const saved = await crmService.sendChatMessage(activeChannel, user.name, user.role, caption || "", [], imageUrl);
      URL.revokeObjectURL(previewUrl);
      setMessages(p => p.map(m => m.id === tempId ? { ...saved, pending: false } : m));
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setMessages(p => p.map(m => m.id === tempId ? { ...m, pending: false, failed: true, errMsg: err?.message } : m));
      throw err;
    }
  };

  const handleEdit = async (id, newText) => {
    setMessages(p => p.map(m => m.id === id ? { ...m, text: newText, editedAt: new Date().toISOString() } : m));
    try { await crmService.editChatMessage(id, newText); }
    catch (err) { console.error("Edit failed:", err); }
  };

  const handleDelete = async id => {
    setMessages(p => p.map(m => m.id === id ? { ...m, isDeleted: true } : m));
    try { await crmService.deleteChatMessage(id); }
    catch (err) { console.error("Delete failed:", err); }
  };

  const selectChannel = ch => {
    setActiveChannel(ch);
    setUnread(p => ({ ...p, [ch]: 0 }));
    setMobileSidebarOpen(false);
    crmService.markChannelRead(user.name, ch);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", fontFamily: F, position: "relative" }}>

      {/* Desktop sidebar */}
      <div className="ek-chat-sidebar" style={{ width: 256, flexShrink: 0, borderRight: `1px solid ${T.line}`, height: "100%", overflow: "hidden" }}>
        <Sidebar active={activeChannel} onSelect={selectChannel} users={users} currentUser={user} unread={unread} T={T} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div onClick={() => setMobileSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30, backdropFilter: "blur(3px)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 280, background: T.surface, zIndex: 40, boxShadow: "4px 0 24px rgba(0,0,0,0.22)", animation: "slideRight .2s ease" }}>
            <Sidebar active={activeChannel} onSelect={selectChannel} users={users} currentUser={user} unread={unread} T={T} onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden", background: T.bg }}>

        {/* Channel header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.line}`, background: T.surface, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="ek-chat-menu-btn"
            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic d={P.menu} sz={16} color={T.inkSub} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.brandSubtle, border: `1.5px solid ${T.brand}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isDM ? 0 : 18, flexShrink: 0 }}>
            {isDM ? <Avatar name={dmPartner || ""} size={36} /> : (CHANNEL_META[activeChannel]?.icon || "#")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isDM ? channelLabel : `# ${channelLabel}`}
            </div>
            <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 1 }}>{channelDesc}</div>
          </div>
          {!isDM && (
            <div style={{ display: "flex", alignItems: "center", gap: -4 }}>
              {users.slice(0, 4).map((u, i) => (
                <div key={u.name} title={u.name} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                  <Avatar name={u.name} size={26} />
                </div>
              ))}
              {users.length > 4 && (
                <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: "50%", background: T.surfaceEl, border: `2px solid ${T.surface}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: T.inkMuted }}>
                  +{users.length - 4}
                </div>
              )}
              <span style={{ marginLeft: 10, fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{users.length} members</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${T.line}`, borderTopColor: T.brand, animation: "spin .8s linear infinite" }} />
            </div>
          ) : dbError ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Chat not available</div>
              <div style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.7, maxWidth: 340, background: T.surfaceEl, padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.line}`, fontFamily: F_MONO }}>{dbError}</div>
              <div style={{ marginTop: 16, fontSize: 12, color: T.inkMuted }}>Go to <strong>Supabase → SQL Editor</strong> and run <code style={{ background: T.surfaceEl, padding: "1px 6px", borderRadius: 4 }}>schema.sql</code></div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState channel={activeChannel} dmPartner={dmPartner} T={T} />
          ) : (
            <>
              <div style={{ flex: 1 }} />
              {messages.map((msg, i) => (
                <Message
                  key={msg.id}
                  msg={msg}
                  prevMsg={messages[i - 1] || null}
                  isMe={msg.sender === user.name}
                  T={T}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRetry={msg.failed ? m => { setMessages(p => p.filter(x => x.id !== m.id)); handleSend(m.text); } : null}
                />
              ))}
              <div ref={bottomRef} style={{ height: 4 }} />
            </>
          )}
        </div>

        <MessageInput onSend={handleSend} onSendImage={handleSendImage} users={users} currentUserName={user.name} T={T} />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .ek-chat-sidebar { display: none !important; }
          .ek-chat-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─── DB ROW MAPPER ────────────────────────────────────────────────────────────
function mapRow(row) {
  return {
    id:         row.id,
    channel:    row.channel,
    sender:     row.sender,
    senderRole: row.sender_role,
    text:       row.text || "",
    imageUrl:   row.image_url || null,
    mentions:   row.mentions || [],
    createdAt:  row.created_at,
    editedAt:   row.edited_at || null,
    isDeleted:  row.is_deleted || false,
  };
}
