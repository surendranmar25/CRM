import React from "react";
import { F } from "../../theme/index.js";
import { Avatar } from "../ui/index.jsx";
import { big } from "../../utils.js";
import { CardT, DeltaBadge } from "./AnalyticsHelpers.jsx";

export function TeamTab({ teamArr, cmpTeamMap, compareOn, T }) {
  const medals = ["🥇", "🥈", "🥉"];
  const totalTeamRev = teamArr.reduce((a,[,d]) => a+d.revenue, 0);
  const totalTeamWon = teamArr.reduce((a,[,d]) => a+d.won, 0);
  const totalTeamLeads = teamArr.reduce((a,[,d]) => a+d.total, 0);
  const avgWr = teamArr.length ? Math.round(teamArr.reduce((a,[,d]) => a+(d.total ? d.won/d.total*100 : 0), 0)/teamArr.length) : 0;

  return (
    <>
      {/* Team Summary */}
      {teamArr.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
          {[
            { label:"Team Size",    value:teamArr.length,   color:"#5B3BE8" },
            { label:"Total Won",    value:totalTeamWon,     color:T.won.dot },
            { label:"Avg Win Rate", value:`${avgWr}%`,      color:T.won.dot },
            { label:"Team Revenue", value:big(totalTeamRev),color:"#5B3BE8" },
          ].map(s => (
            <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:T.r.lg, padding:"16px 18px", boxShadow:T.shadowSm }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:F }}>{s.value}</div>
              <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <CardT title="Team Leaderboard" subtitle="Ranked by total leads handled" T={T}>
        {teamArr.length === 0 ? (
          <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No team data yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {teamArr.map(([name, d], idx) => {
              const wr = d.total ? Math.round(d.won/d.total*100) : 0;
              const cd = cmpTeamMap[name] || { total:0, won:0, revenue:0 };
              return (
                <div key={name} style={{ background:T.surfaceEl, border:`1px solid ${T.line}`, borderRadius:T.r.lg, padding:"14px 16px" }}>
                  {/* Top row: rank + avatar + name + win bar + rev share */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ fontSize:20, flexShrink:0, width:28, textAlign:"center" }}>{medals[idx] || `#${idx+1}`}</div>
                    <Avatar name={name} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{name}</div>
                        {totalTeamRev > 0 && (
                          <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:"#5B3BE8", background:T.brandSubtle, padding:"2px 8px", borderRadius:20 }}>
                            {Math.round(d.revenue/totalTeamRev*100)}% rev
                          </span>
                        )}
                      </div>
                      <div style={{ height:5, background:T.line, borderRadius:3, overflow:"hidden", marginBottom:3 }}>
                        <div style={{ width:`${wr}%`, height:"100%", background:T.won.dot, borderRadius:3, transition:"width .6s" }} />
                      </div>
                      <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F }}>{wr}% win rate</div>
                    </div>
                  </div>
                  {/* Stats row: 5-column grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                    {[
                      { val: d.total,        label:"Total",   color:"#5B3BE8",     delta: compareOn && cd.total   > 0 ? <DeltaBadge cur={d.total}   prev={cd.total}   T={T} /> : null },
                      { val: d.won,          label:"Won",     color:T.won.dot,     delta: compareOn && cd.won     > 0 ? <DeltaBadge cur={d.won}     prev={cd.won}     T={T} /> : null },
                      { val: d.pending,      label:"Pending", color:T.pending.dot, delta: null },
                      { val: d.lost,         label:"Lost",    color:T.lost.dot,    delta: null },
                      { val: big(d.revenue), label:"Revenue", color:"#5B3BE8",     delta: compareOn && cd.revenue > 0 ? <DeltaBadge cur={d.revenue} prev={cd.revenue} T={T} /> : null },
                    ].map(({ val, label, color, delta }) => (
                      <div key={label} style={{ textAlign:"center", background:T.surface, borderRadius:8, padding:"8px 4px", border:`1px solid ${T.line}` }}>
                        <div style={{ fontSize:14, fontWeight:800, color, fontFamily:F, lineHeight:1.2 }}>{val}</div>
                        <div style={{ fontSize:9, color:T.inkMuted, fontFamily:F, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
                        {delta}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardT>

      <CardT title="Team Win vs Loss — Visual" noPad T={T}>
        <div style={{ padding:"16px 20px" }}>
          {teamArr.length === 0 ? (
            <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No data.</div>
          ) : (() => {
            const maxTotal = Math.max(...teamArr.map(([,d]) => d.total), 1);
            return teamArr.map(([name, d]) => (
              <div key={name} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:T.ink, fontFamily:F, fontWeight:500 }}>{name}</span>
                  <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{d.total} leads</span>
                </div>
                <div style={{ height:10, background:T.surfaceEl, borderRadius:5, overflow:"hidden", display:"flex" }}>
                  <div style={{ width:`${(d.won/maxTotal)*100}%`,     background:T.won.dot,     transition:"width .6s" }} />
                  <div style={{ width:`${(d.pending/maxTotal)*100}%`, background:T.pending.dot, transition:"width .6s" }} />
                  <div style={{ width:`${(d.lost/maxTotal)*100}%`,    background:T.lost.dot,    transition:"width .6s" }} />
                  <div style={{ width:`${(d.drop/maxTotal)*100}%`,    background:T.drop.dot,    transition:"width .6s" }} />
                </div>
                <div style={{ display:"flex", gap:12, marginTop:4 }}>
                  {[["Won",d.won,T.won.dot],["Pending",d.pending,T.pending.dot],["Lost",d.lost,T.lost.dot],["Drop",d.drop,T.drop.dot]].map(([l,n,c]) => n > 0 && (
                    <span key={l} style={{ fontSize:10, color:c, fontFamily:F, fontWeight:600 }}>{l}: {n}</span>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </CardT>
    </>
  );
}
