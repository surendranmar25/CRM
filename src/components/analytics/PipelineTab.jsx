import React from "react";
import { F } from "../../theme/index.js";
import { today } from "../../utils.js";
import { big } from "../../utils.js";
import { ENQS, FTYPES, CATS } from "../../constants.js";
import { CardT, HBar, smoothPath, areaPath, svgH, svgW, pad, innerW, innerH } from "./AnalyticsHelpers.jsx";

export function PipelineTab({ M, curr, pending, compareOn, cmpSeries, currSeries, rangeLabel, srcPerfArr, T }) {
  const todayV = today();
  const seriesRevMax = Math.max(...currSeries.map(p=>p.revenue), ...cmpSeries.map(p=>p.revenue), 1);

  const srcMap = {};
  curr.forEach(f => { if (f.leadSource) srcMap[f.leadSource] = (srcMap[f.leadSource] || 0) + 1; });
  const srcArr = Object.entries(srcMap).sort((a,b) => b[1]-a[1]);
  const maxSrc = Math.max(...srcArr.map(x=>x[1]), 1);

  const cityMap = {};
  curr.forEach(f => { if (f.cityRegion) cityMap[f.cityRegion] = (cityMap[f.cityRegion] || 0) + 1; });
  const cityArr = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0,8);
  const maxCity = Math.max(...cityArr.map(x=>x[1]), 1);

  const overdueList  = pending.filter(f => f.nextFollowUp && f.nextFollowUp < todayV).sort((a,b)=>a.nextFollowUp.localeCompare(b.nextFollowUp)).slice(0,5);
  const upcomingList = pending.filter(f => f.nextFollowUp && f.nextFollowUp >= todayV).sort((a,b)=>a.nextFollowUp.localeCompare(b.nextFollowUp)).slice(0,5);

  return (
    <>
      {/* Revenue Area Chart */}
      <CardT title="Revenue Trend" subtitle={rangeLabel} noPad T={T}>
        <div style={{ padding:"16px 20px 0" }}>
          <div style={{ fontSize:26, fontWeight:700, color:T.ink, fontFamily:F, letterSpacing:"-0.8px" }}>{big(M.wonRev)}</div>
          <div style={{ fontSize:12, color:T.inkSub, fontFamily:F, marginBottom:12 }}>Won revenue {rangeLabel}</div>
        </div>
        <div style={{ overflowX:"auto", padding:"0 20px 16px" }}>
          {currSeries.length === 0 ? (
            <div style={{ height:svgH, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:32 }}>📊</div>
              <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No revenue data for selected period</div>
            </div>
          ) : currSeries.length === 1 ? (
            <div style={{ height:svgH, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:56, fontWeight:700, color:T.won.dot, fontFamily:F, letterSpacing:"-2px", lineHeight:1 }}>{big(currSeries[0].revenue)}</div>
                <div style={{ fontSize:13, color:T.inkSub, fontFamily:F, marginTop:8 }}>won revenue this period</div>
              </div>
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display:"block", minWidth:300 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.won.dot} stopOpacity="0.2"/>
                  <stop offset="100%" stopColor={T.won.dot} stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="revCmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[0,0.25,0.5,0.75,1].map(r => (
                <g key={r}>
                  <line x1={pad.l} y1={pad.t+innerH*(1-r)} x2={pad.l+innerW} y2={pad.t+innerH*(1-r)} stroke={T.line} strokeWidth="1"/>
                  <text x={pad.l-4} y={pad.t+innerH*(1-r)+4} textAnchor="end" fontSize="9" fill={T.inkMuted} fontFamily={F}>{big(seriesRevMax*r)}</text>
                </g>
              ))}
              {compareOn && cmpSeries.length > 1 && (
                <>
                  <path d={areaPath(cmpSeries.map(p=>p.revenue), seriesRevMax)} fill="url(#revCmpGrad)"/>
                  <path d={smoothPath(cmpSeries.map(p=>p.revenue), seriesRevMax)} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="5,3"/>
                </>
              )}
              <path d={areaPath(currSeries.map(p=>p.revenue), seriesRevMax)} fill="url(#revGrad)"/>
              <path d={smoothPath(currSeries.map(p=>p.revenue), seriesRevMax)} fill="none" stroke={T.won.dot} strokeWidth="2"/>
              {currSeries.map((p,i) => {
                const x = pad.l+(i/(currSeries.length-1||1))*innerW;
                const y = pad.t+innerH-(p.revenue/seriesRevMax)*innerH;
                return <circle key={i} cx={x} cy={y} r="3" fill={T.won.dot} stroke={T.surface} strokeWidth="1.5"/>;
              })}
              {currSeries.map((p,i) => (
                <text key={i} x={pad.l+(i/(currSeries.length-1||1))*innerW} y={svgH-6} textAnchor="middle" fontSize="9" fill={T.inkMuted} fontFamily={F}>{p.label}</text>
              ))}
            </svg>
          )}
        </div>
      </CardT>

      {/* Source Performance Table */}
      <CardT title="Source Performance" subtitle="Conversion rate & revenue won by channel" T={T}>
        {(!srcPerfArr || srcPerfArr.length === 0) ? (
          <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No source data.</div>
        ) : (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 52px 1fr 90px 90px", gap:10, paddingBottom:8, marginBottom:2 }}>
              {["Source","Leads","Win Rate","Won Rev","Total Quoted"].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:T.inkMuted, fontFamily:F, textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</div>
              ))}
            </div>
            {srcPerfArr.map(([src, d]) => {
              const wr = d.total ? Math.round(d.won/d.total*100) : 0;
              const wrColor = wr >= 60 ? T.won.dot : wr >= 35 ? T.pending.dot : T.lost.dot;
              const wrBg    = wr >= 60 ? T.won.bg  : wr >= 35 ? T.pending.bg  : T.lost.bg;
              const wrText  = wr >= 60 ? T.won.text : wr >= 35 ? T.pending.text : T.lost.text;
              return (
                <div key={src} style={{ display:"grid", gridTemplateColumns:"1fr 52px 1fr 90px 90px", gap:10, padding:"9px 0", borderTop:`1px solid ${T.line}`, alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{src}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#5B3BE8", fontFamily:F }}>{d.total}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ flex:1, height:5, background:T.surfaceEl, borderRadius:3, overflow:"hidden", minWidth:40 }}>
                      <div style={{ width:`${wr}%`, height:"100%", background:wrColor, borderRadius:3, transition:"width .7s ease" }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:wrText, background:wrBg, padding:"2px 7px", borderRadius:20, flexShrink:0 }}>{wr}%</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:T.won.dot, fontFamily:F }}>{big(d.wonRev)}</span>
                  <span style={{ fontSize:12, color:T.inkSub, fontFamily:F }}>{big(d.revenue)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardT>

      <div className="ek-analytics-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <CardT title="Leads by Source" T={T}>
          {srcArr.length === 0 ? <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No source data.</div> :
            srcArr.map(([src,n]) => <HBar key={src} label={src} val={n} max={maxSrc} color="#5B3BE8" sub={`${n} (${Math.round(n/maxSrc*100)}%)`} T={T} />)
          }
        </CardT>

        <CardT title="Leads by Enquiry Type" T={T}>
          {ENQS.map((e,i) => {
            const n = curr.filter(f => f.enquiryType === e).length;
            if (!n) return null;
            const pct = curr.length ? Math.round(n/curr.length*100) : 0;
            const colors = [T.new.dot, T.won.dot, T.bulk.dot, T.high.dot, T.premium.dot, T.drop.dot, "#5B3BE8", "#0891b2", "#d97706", "#7c3aed", "#059669", "#f43f5e", "#64748b", "#ec4899"];
            return <HBar key={e} label={e} val={n} max={curr.length || 1} color={colors[i] || "#5B3BE8"} sub={`${n} (${pct}%)`} T={T} />;
          })}
        </CardT>

        <CardT title="Leads by Funnel Type" T={T}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:8 }}>
            {FTYPES.map((t,i) => {
              const n = curr.filter(f => f.funnelType === t).length;
              const colors = ["#5B3BE8", T.won.dot, T.pending.dot, T.premium.dot, T.drop.dot, T.new.dot, T.high.dot, T.bulk.dot, "#0891b2", T.cold.dot];
              return (
                <div key={t} style={{ textAlign:"center", padding:"12px 8px", background:T.surfaceEl, borderRadius:T.r.md, border:`1px solid ${T.line}` }}>
                  <div style={{ fontSize:20, fontWeight:700, color:colors[i]||"#5B3BE8", fontFamily:F }}>{n}</div>
                  <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F, marginTop:3, lineHeight:1.3 }}>{t}</div>
                </div>
              );
            })}
          </div>
        </CardT>

        <CardT title="Leads by City / Region" T={T}>
          {cityArr.length === 0 ? <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No city data.</div> :
            cityArr.map(([city,n]) => <HBar key={city} label={city} val={n} max={maxCity} color="#5B3BE8" sub={`${n}`} T={T} />)
          }
        </CardT>
      </div>

      {/* Follow-up health */}
      <div className="ek-analytics-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
        <CardT title="Follow-up Summary" T={T}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
            {[
              { label:"Overdue",  n:M.overdue, color:T.lost.text,    bg:T.lost.bg },
              { label:"Today",    n:M.todayF,  color:T.pending.text, bg:T.pending.bg },
              { label:"Upcoming", n:pending.filter(f=>f.nextFollowUp&&f.nextFollowUp>todayV).length, color:T.new.text, bg:T.new.bg },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"10px 6px", background:s.bg, borderRadius:T.r.md, border:`1px solid ${T.line}` }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:F }}>{s.n}</div>
                <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {[
            ["With order number",  curr.filter(f=>f.orderNumber).length,  "#5B3BE8"],
            ["Without order",      curr.filter(f=>!f.orderNumber).length, T.inkMuted],
            ["Total units quoted", curr.reduce((a,f)=>a+(Number(f.quoteQty)||0),0), T.ink],
          ].map(([label,val,color]) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:F, marginBottom:8 }}>
              <span style={{ color:T.inkSub }}>{label}</span>
              <span style={{ fontWeight:700, color }}>{val}</span>
            </div>
          ))}
        </CardT>

        <CardT title="Overdue Follow-ups" subtitle="Oldest first" T={T}>
          {overdueList.length === 0 ? <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>🎉 No overdue follow-ups!</div> :
            overdueList.map((f,i) => (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom: i < overdueList.length-1 ? `1px solid ${T.line}` : "none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:T.lost.dot, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                  <div style={{ fontSize:10, color:T.lost.text, fontFamily:F, fontWeight:600 }}>Due {f.nextFollowUp}</div>
                </div>
              </div>
            ))
          }
        </CardT>

        <CardT title="Upcoming Follow-ups" T={T}>
          {upcomingList.length === 0 ? <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No upcoming follow-ups.</div> :
            upcomingList.map((f,i) => (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom: i < upcomingList.length-1 ? `1px solid ${T.line}` : "none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:T.new.dot, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                  <div style={{ fontSize:10, color:T.new.text, fontFamily:F, fontWeight:600 }}>Due {f.nextFollowUp}</div>
                </div>
              </div>
            ))
          }
        </CardT>
      </div>
    </>
  );
}
