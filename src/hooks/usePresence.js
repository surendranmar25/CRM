import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const CHANNEL_NAME = "suntronix-presence";

const USER_COLORS = [
  "#4d7cfe","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16",
];

function stableColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}

// ── Heartbeat interval ────────────────────────────────────────────────────────
// Was 20 s (3×/min per user). Now 45 s (1.3×/min per user).
// At 20 concurrent users: 20×(1.3 + 3 channels) ≈ 86 msgs/min → well under limits.
const HEARTBEAT_MS = 45_000;

export function usePresence(user, view, viewingFunnel = null) {
  const [presenceMap, setPresenceMap] = useState({});
  const channelRef = useRef(null);
  const hbRef      = useRef(null);
  const myKey      = user?.username || "anon";

  // Build a small, lean payload — omit the full funnel object to avoid
  // serialising large data structures through the presence channel.
  const buildPayload = useCallback(() => ({
    username:   user?.username  || "",
    name:       user?.name      || "",
    role:       user?.role      || "",
    color:      stableColor(user?.name || ""),
    view:       view            || "dashboard",
    funnelId:   viewingFunnel?.id   || null,
    funnelName: viewingFunnel?.name || null,
    // Use a compact timestamp — seconds (not ms) is enough for "last seen".
    ts: Math.floor(Date.now() / 1000),
  }), [user?.username, user?.name, user?.role, view, viewingFunnel?.id, viewingFunnel?.name]);

  // ── Subscribe once per user session ──────────────────────────────────────
  useEffect(() => {
    if (!user?.username) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: myKey } },
    });

    const syncState = () => {
      const state = channel.presenceState();
      const map   = {};
      Object.entries(state).forEach(([key, presences]) => {
        if (key === myKey) return;
        const p = presences?.[0];
        if (p) map[key] = p;
      });
      setPresenceMap(map);
    };

    channel
      .on("presence", { event: "sync"  }, syncState)
      .on("presence", { event: "join"  }, ({ key, newPresences }) => {
        if (key === myKey) return;
        setPresenceMap(prev => ({ ...prev, [key]: newPresences[0] }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === myKey) return;
        setPresenceMap(prev => { const n = { ...prev }; delete n[key]; return n; });
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") channel.track(buildPayload());
      });

    channelRef.current = channel;

    // Slow heartbeat — keeps the presence alive without hammering the server.
    hbRef.current = setInterval(() => {
      channelRef.current?.track(buildPayload());
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(hbRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]); // reconnect only when the logged-in user changes

  // ── Re-track on view / funnel change (no re-subscription needed) ──────────
  useEffect(() => {
    // Only track if the channel is already open — avoids race conditions
    // during initial mount before the SUBSCRIBED callback fires.
    const ch = channelRef.current;
    if (ch && ch.state === "joined") {
      ch.track(buildPayload());
    }
  }, [view, viewingFunnel?.id, buildPayload]);

  const onlineUsers = Object.values(presenceMap);
  const viewersOf   = useCallback(
    (funnelId) => onlineUsers.filter(u => u.funnelId === funnelId),
    [onlineUsers]
  );

  return { onlineUsers, viewersOf, presenceMap };
}
