import React, { useMemo, useState } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Avatar, StatusPill } from "../ui/index.jsx";
import { today, inr } from "../../utils.js";

const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function fmtKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function DayCell({ day, year, month, leads, todayV, onSelect, selected, T }) {
  if (!day) return <div style={{ minHeight: 90 }} />;
  const key = fmtKey(year, month, day);
  const isToday = key === todayV;
  const isPast = key < todayV;
  const isSelected = selected === key;
  const dayLeads = leads[key] || [];
  const overdue = dayLeads.filter(f => f.status === "Pending" && isPast);
  const won = dayLeads.filter(f => f.status === "Won");
  const pending = dayLeads.filter(f => f.status === "Pending" && !isPast);

  const dotColor = overdue.length > 0 ? T.lost.dot : isToday && pending.length > 0 ? T.pending.dot : won.length > 0 ? T.won.dot : T.brand;
  const hasDot = dayLeads.length > 0;

  return (
    <div
      onClick={() => onSelect(key, dayLeads)}
      style={{
        minHeight: 90, borderRadius: 10, padding: "8px 6px 6px",
        background: isSelected ? `${T.brand}12` : isToday ? `${T.brand}08` : T.surface,
        border: `1.5px solid ${isSelected ? T.brand : isToday ? T.brand + "55" : T.line}`,
        cursor: dayLeads.length > 0 ? "pointer" : "default",
        transition: "all .14s", position: "relative",
        boxShadow: isSelected ? `0 4px 14px ${T.brand}22` : "none",
      }}
      onMouseEnter={e => { if (dayLeads.length > 0 && !isSelected) e.currentTarget.style.background = T.surfaceEl; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? `${T.brand}08` : T.surface; }}
    >
      {/* Day number */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: isToday ? T.brand : "transparent",
        color: isToday ? "#fff" : isPast && day ? T.inkMuted : T.ink,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: isToday ? 700 : 500, fontFamily: F_MONO,
        marginBottom: 6, flexShrink: 0,
      }}>{day}</div>

      {/* Lead dots */}
      {dayLeads.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {dayLeads.slice(0, 3).map((f, i) => {
            const c = f.status === "Won" ? T.won.dot : f.status === "Lost" ? T.lost.dot : key < todayV ? T.lost.dot : key === todayV ? T.pending.dot : T.brand;
            return (
              <div key={f.id} style={{
                fontSize: 10, fontWeight: 600, color: c,
                background: `${c}15`, borderRadius: 4,
                padding: "1px 5px", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: "100%",
                fontFamily: F,
              }}>
                {f.name}
              </div>
            );
          })}
          {dayLeads.length > 3 && (
            <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, paddingLeft: 4 }}>
              +{dayLeads.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Calendar({ funnels, user, onView, T }) {
  const todayV = today();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [viewMode, setViewMode] = useState("month"); // month | week

  // Group leads by follow-up date
  const followupMap = useMemo(() => {
    const map = {};
    funnels.forEach(f => {
      if (f.nextFollowUp && f.status !== "Won" && f.status !== "Lost" && f.status !== "Drop") {
        if (!map[f.nextFollowUp]) map[f.nextFollowUp] = [];
        map[f.nextFollowUp].push(f);
      }
      // Also show won/lost in the calendar on their creation date
    });
    return map;
  }, [funnels]);

  const calDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const handleSelect = (key, leads) => {
    if (leads.length === 0) { setSelected(null); setSelectedLeads([]); return; }
    setSelected(key === selected ? null : key);
    setSelectedLeads(key === selected ? [] : leads);
  };

  // Monthly stats
  const monthLeads = useMemo(() => {
    const mKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    return Object.entries(followupMap)
      .filter(([k]) => k.startsWith(mKey))
      .reduce((a, [, v]) => a + v.length, 0);
  }, [followupMap, year, month]);

  const overdueCount = useMemo(() =>
    Object.entries(followupMap)
      .filter(([k]) => k < todayV)
      .reduce((a, [, v]) => a + v.length, 0),
    [followupMap, todayV]);

  const todayCount = (followupMap[todayV] || []).length;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, fontFamily: F }}>
      {/* Main Calendar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "20px 24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: "-0.5px" }}>
                {MONTHS[month]} {year}
              </h2>
              <div style={{ fontSize: 12, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>
                {monthLeads} follow-up{monthLeads !== 1 ? "s" : ""} this month
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Stats pills */}
            {overdueCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: T.lost.bg, border: `1px solid ${T.lost.dot}33` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.lost.dot }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.lost.text }}>{overdueCount} overdue</span>
              </div>
            )}
            {todayCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: T.pending.bg, border: `1px solid ${T.pending.dot}33` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.pending.dot }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.pending.text }}>{todayCount} today</span>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: T.surfaceEl, border: `1px solid ${T.line}`, borderRadius: 9, padding: "3px" }}>
              <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSub, transition: "all .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surface}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Ic d={P.chevL} sz={14} color="currentColor" />
              </button>
              <button onClick={goToday} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.brand, fontFamily: F, transition: "all .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.brandSubtle}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                Today
              </button>
              <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSub, transition: "all .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surface}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Ic d={P.chevR} sz={14} color="currentColor" />
              </button>
            </div>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.inkMuted, fontFamily: F_MONO, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, flex: 1 }}>
          {calDays.map((day, i) => (
            <DayCell
              key={i} day={day} year={year} month={month}
              leads={followupMap} todayV={todayV}
              onSelect={handleSelect} selected={selected}
              T={T}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}`, flexWrap: "wrap" }}>
          {[
            { color: T.lost.dot, label: "Overdue" },
            { color: T.pending.dot, label: "Due today" },
            { color: T.brand, label: "Upcoming" },
            { color: T.won.dot, label: "Won" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel: selected day leads */}
      <div style={{
        width: selected ? 320 : 0,
        transition: "width .22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", borderLeft: `1px solid ${T.line}`,
        background: T.surface, flexShrink: 0,
        display: "flex", flexDirection: "column",
      }}>
        {selected && selectedLeads.length > 0 && (
          <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {new Date(selected + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: F_MONO, marginTop: 2 }}>
                  {selectedLeads.length} follow-up{selectedLeads.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setSelectedLeads([]); }}
                style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.line}`, background: T.surfaceEl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic d={P.close} sz={11} color={T.inkMuted} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedLeads.map(f => {
                const isOver = f.nextFollowUp < todayV;
                const isToday = f.nextFollowUp === todayV;
                return (
                  <div key={f.id}
                    onClick={() => onView(f)}
                    style={{
                      background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10,
                      padding: "12px 14px", cursor: "pointer", transition: "all .12s",
                      borderLeft: `3px solid ${isOver ? T.lost.dot : isToday ? T.pending.dot : T.brand}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceEl}
                    onMouseLeave={e => e.currentTarget.style.background = T.bg}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Avatar name={f.name} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO }}>{f.phone || "—"}</div>
                      </div>
                      <StatusPill status={f.status} sm T={T} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {f.assignedTo && (
                        <span style={{ fontSize: 10, color: T.inkMuted, background: T.surfaceEl, padding: "1px 7px", borderRadius: 6 }}>→ {f.assignedTo}</span>
                      )}
                      {f.quoteAmount && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, fontFamily: F_MONO }}>{inr(f.quoteAmount)}</span>
                      )}
                      {isOver && <span style={{ fontSize: 10, fontWeight: 700, color: T.lost.text, background: T.lost.bg, padding: "1px 7px", borderRadius: 6 }}>Overdue</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
