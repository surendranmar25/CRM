const USER_COLORS = ["#4d7cfe","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
function stableColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}

import React, { useState } from "react";
import { F_BODY, F_MONO, F } from "../../theme/index.js";
import { Avatar } from "../ui/index.jsx";

// ─── Pulsing online dot ────────────────────────────────────────────────────────
function OnlineDot({ color = "#10b981", size = 8, pulse = true }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0 }}>
      {pulse && (
        <span style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          background: color, opacity: 0.25,
          animation: "pulse 2s ease infinite",
        }} />
      )}
      <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "block" }} />
    </span>
  );
}

// ─── Single user presence avatar with tooltip ─────────────────────────────────
function PresenceAvatar({ user, size = 28, T }) {
  const [hov, setHov] = useState(false);

  const statusText = user.funnelName
    ? `Viewing "${user.funnelName}"`
    : `On ${user.pageLabel || user.view}`;

  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {/* Avatar with colored ring */}
      <div style={{
        width: size + 4, height: size + 4, borderRadius: "50%",
        background: user.color, padding: 2,
        boxShadow: `0 0 0 2px ${T.surface}`,
      }}>
        <Avatar name={user.name} size={size} />
      </div>
      {/* Online dot */}
      <span style={{ position: "absolute", bottom: 0, right: 0 }}>
        <OnlineDot color={user.color} size={7} />
      </span>
      {/* Tooltip */}
      {hov && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: T.ink, color: T.inkInvert, borderRadius: 8, padding: "7px 12px",
          fontSize: 11, fontFamily: F_BODY, whiteSpace: "nowrap", zIndex: 999,
          boxShadow: T.shadowLg, pointerEvents: "none",
          animation: "fadeDown .15s ease",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
          <div style={{ opacity: 0.75, fontFamily: F_MONO, fontSize: 10 }}>{user.role} · {statusText}</div>
          {/* Arrow */}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: `5px solid ${T.ink}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Compact cluster of online avatars (for Topbar) ───────────────────────────
export function OnlineAvatarCluster({ users, T }) {
  if (!users.length) return null;
  const show = users.slice(0, 4);
  const extra = users.length - show.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {show.map((u, i) => (
        <div key={u.username} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: show.length - i }}>
          <PresenceAvatar user={u} size={26} T={T} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8, width: 30, height: 30, borderRadius: "50%",
          background: T.surfaceEl, border: `2px solid ${T.surface}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: T.inkSub, fontFamily: F_MONO,
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ─── Full Presence Panel (for Team page) ──────────────────────────────────────
export function PresencePanel({ onlineUsers, allUsers = [], currentUser, T }) {
  // Merge current user into online list so they appear as online too
  const selfEntry = currentUser ? {
    username:  currentUser.username,
    name:      currentUser.name,
    role:      currentUser.role,
    view:      "current",
    pageLabel: "Active (you)",
    funnelId:  null,
    funnelName: null,
    color:     stableColor(currentUser.name || ""),
  } : null;

  const allOnline = selfEntry
    ? [selfEntry, ...onlineUsers]
    : onlineUsers;

  const onlineKeys = new Set(allOnline.map(u => u.username));

  // Page icon mapping
  const pageIcon = {
    dashboard: "📊", funnels: "📋", contacts: "👥",
    tasks: "✅", analytics: "📈", team: "👤", settings: "⚙️",
  };

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: 12, overflow: "hidden", boxShadow: T.shadowSm,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${T.line}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: F }}>Live Activity</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontFamily: F_MONO, color: T.inkMuted }}>{allOnline.length} online</span>
          <span style={{ fontSize: 11, color: T.inkMuted }}>·</span>
          <span style={{ fontSize: 12, fontFamily: F_MONO, color: T.inkMuted }}>{allUsers.length} total</span>
        </div>
      </div>

      {/* Online users */}
      {allOnline.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌙</div>
          <div style={{ fontSize: 13, color: T.inkMuted, fontFamily: F }}>No other users online right now</div>
          <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 4 }}>You're the only one here</div>
        </div>
      ) : (
        <div style={{ padding: "8px 0" }}>
          {allOnline.map((u, i) => (
            <div key={u.username} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "10px 20px",
              borderBottom: i < allOnline.length - 1 ? `1px solid ${T.line}` : "none",
              animation: `fadeUp .2s ease ${i * 0.05}s both`,
            }}>
              {/* Avatar with colored ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.color, padding: 2 }}>
                  <Avatar name={u.name} size={34} />
                </div>
                <span style={{ position: "absolute", bottom: 0, right: 0 }}>
                  <OnlineDot color="#10b981" size={9} />
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: F }}>{u.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: F_MONO, letterSpacing: "0.08em",
                    padding: "1px 7px", borderRadius: 10,
                    background: `${u.color}18`, color: u.color, border: `1px solid ${u.color}30`,
                  }}>{u.role}</span>
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13 }}>{pageIcon[u.view] || "📄"}</span>
                  {u.funnelName ? (
                    <>Viewing <strong style={{ color: T.ink }}>"{u.funnelName}"</strong></>
                  ) : (
                    <>On <strong style={{ color: T.ink }}>{u.pageLabel || u.view}</strong></>
                  )}
                </div>
              </div>

              {/* Live indicator */}
              <div style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: u.pageLabel === "Active (you)" ? "#4d7cfe18" : "#10b98112",
                border: `1px solid ${u.pageLabel === "Active (you)" ? "#4d7cfe40" : "#10b98130"}`,
              }}>
                <OnlineDot color={u.pageLabel === "Active (you)" ? "#4d7cfe" : "#10b981"} size={6} />
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: F_MONO, color: u.pageLabel === "Active (you)" ? "#4d7cfe" : "#10b981", letterSpacing: "0.06em" }}>
                  {u.pageLabel === "Active (you)" ? "YOU" : "LIVE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline users */}
      {allUsers.filter(u => !onlineKeys.has(u.username)).length > 0 && (
        <>
          <div style={{ padding: "10px 20px 6px", borderTop: `1px solid ${T.line}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: F_MONO, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkMuted }}>Offline</span>
          </div>
          {allUsers.filter(u => !onlineKeys.has(u.username)).map((u, i) => (
            <div key={u.username} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "9px 20px", opacity: 0.5,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar name={u.name} size={32} />
                <span style={{ position: "absolute", bottom: 0, right: 0 }}>
                  <OnlineDot color="#9ca3af" size={8} pulse={false} />
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.inkMuted, fontFamily: F }}>{u.name}</div>
                <div style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted }}>@{u.username} · {u.role}</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: F_MONO, color: T.inkMuted }}>Offline</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Viewer badges on a funnel row (Table use) ────────────────────────────────
export function FunnelViewers({ viewers, T }) {
  if (!viewers.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: -4 }}>
      {viewers.slice(0, 3).map((v, i) => (
        <div key={v.username} title={`${v.name} is viewing this`}
          style={{
            width: 18, height: 18, borderRadius: "50%",
            background: v.color, marginLeft: i === 0 ? 0 : -5,
            border: `1.5px solid ${T.surface}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: F_MONO,
            zIndex: viewers.length - i, flexShrink: 0,
          }}>
          {(v.name || "?")[0].toUpperCase()}
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar online dot per user ─────────────────────────────────────────────
export function SidebarOnlineDot({ username, presenceMap, T }) {
  const isOnline = !!presenceMap[username];
  if (!isOnline) return null;
  return <OnlineDot color="#10b981" size={7} />;
}
