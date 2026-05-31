import React from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Avatar, Dot, StatusPill } from "../ui/index.jsx";
import { big, inr } from "../../utils.js";
import { CardT, KpiCard, DeltaBadge, HBar, donutArc, smoothPath, areaPath, svgH, svgW, pad, innerW, innerH } from "./AnalyticsHelpers.jsx";

export function OverviewTab({ M, CM, compareOn, curr, cmp, currSeries, cmpSeries, granularity, rangeLabel, T }) {
  const seriesCountMax = Math.max(...currSeries.map(p=>p.count), ...cmpSeries.map(p=>p.count), 1);
  const seriesRevMax   = Math.max(...currSeries.map(p=>p.revenue), ...cmpSeries.map(p=>p.revenue), 1);

  const donutData = [
    { label:"Won",     n:M.won,     color:T.won.dot },
    { label:"Pending", n:M.pending, color:T.pending.dot },
    { label:"Lost",    n:M.lost,    color:T.lost.dot },
    { label:"Drop",    n:M.drop,    color:T.drop.dot },
  ].filter(d => d.n > 0);

  const stageData = [
    { label:"Total Leads", n:M.total,   color:"#5B3BE8", pct:100 },
    { label:"Pending",     n:M.pending, color:T.pending.dot, pct:M.total ? Math.round(M.pending/M.total*100) : 0 },
    { label:"Won",         n:M.won,     color:T.won.dot,     pct:M.total ? Math.round(M.won/M.total*100)     : 0 },
    { label:"Lost",        n:M.lost,    color:T.lost.dot,    pct:M.total ? Math.round(M.lost/M.total*100)    : 0 },
  ];

  const topCustomers = [...curr].filter(f => f.quoteAmount).sort((a,b) => (Number(b.quoteAmount)||0)-(Number(a.quoteAmount)||0)).slice(0,5);

  return (
    <>
      {/* KPI Strip */}
      <div className="ek-analytics-stat-row" style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <KpiCard label="Total Leads"      value={M.total}   cmpValue={CM?.total}   icon={P.list}     color="#5B3BE8"       bg={T.brandSubtle}  compareOn={compareOn} T={T} />
        <KpiCard label="Won Deals"        value={M.won}     cmpValue={CM?.won}     icon={P.award}    color={T.won.dot}     bg={T.won.bg}       compareOn={compareOn} T={T} />
        <KpiCard label="Win Rate"         value={`${M.wr}%`} cmpValue={CM?`${CM.wr}%`:undefined} rawValue={M.wr} rawCmpValue={CM?.wr} icon={P.chart} color={T.won.dot} bg={T.won.bg} compareOn={compareOn} T={T} />
        <KpiCard label="Won Revenue"      value={M.wonRev}  cmpValue={CM?.wonRev}  icon={P.trend}    color="#5B3BE8"       bg={T.brandSubtle}  compareOn={compareOn} T={T} />
        <KpiCard label="Avg Deal Size"    value={M.avgDeal} cmpValue={CM?.avgDeal} icon={P.activity} color={T.pending.dot} bg={T.pending.bg}   compareOn={compareOn} T={T} />
        <KpiCard label="Pipeline"         value={M.pendRev} cmpValue={CM?.pendRev} icon={P.filter}   color={T.pending.dot} bg={T.pending.bg}   compareOn={compareOn} T={T} />
        <KpiCard label="Overdue"          value={M.overdue} cmpValue={CM?.overdue} icon={P.bell}     color={T.lost.dot}    bg={T.lost.bg}      compareOn={compareOn} T={T} />
        <KpiCard label="Today Follow-ups" value={M.todayF}   cmpValue={CM?.todayF}   icon={P.calendar} color={T.pending.dot} bg={T.pending.bg}   compareOn={compareOn} T={T} />
        <KpiCard label="Lost Revenue"     value={M.lostRev}  cmpValue={CM?.lostRev}  icon={P.close}    color={T.lost.dot}    bg={T.lost.bg}      compareOn={compareOn} T={T} />
        <KpiCard label="Revenue / Lead"   value={M.revPerLead} cmpValue={CM?.revPerLead} icon={P.trend} color="#059669"     bg="#d1fae5"         compareOn={compareOn} T={T} />
        <KpiCard label="Close Rate"       value={`${M.closeRate}%`} rawValue={M.closeRate} rawCmpValue={CM?.closeRate} cmpValue={CM?`${CM.closeRate}%`:undefined} icon={P.target} color="#7c3aed" bg="#ede9fd" compareOn={compareOn} T={T} />
        <KpiCard label="Orders Confirmed" value={M.withOrderNum} cmpValue={CM?.withOrderNum} icon={P.package} color="#d97706" bg="#fef3c7" compareOn={compareOn} T={T} />
      </div>

      {/* Trend Chart */}
      <CardT title="Leads & Revenue Trend" subtitle={`${granularity.charAt(0).toUpperCase()+granularity.slice(1)} · ${rangeLabel}`} noPad T={T}>
        <div style={{ padding:"16px 20px 8px" }}>
          <div style={{ display:"flex", gap:16, marginBottom:12, flexWrap:"wrap" }}>
            {[
              { label:"Leads (count)", color:"#5B3BE8" },
              { label:"Won revenue", color:"#10b981" },
              ...(compareOn ? [{ label:"Compare period", color:"#D97706", dashed:true }] : []),
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed?"4,3":""}/></svg>
                <span style={{ fontSize:11, color:T.inkSub, fontFamily:F }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ overflowX:"auto", padding:"0 20px 16px" }}>
          {currSeries.length === 0 ? (
            <div style={{ height:svgH, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:32 }}>📊</div>
              <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No data for selected period</div>
            </div>
          ) : currSeries.length === 1 ? (
            <div style={{ height:svgH, display:"flex", alignItems:"center", justifyContent:"center", gap:48 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:56, fontWeight:700, color:"#5B3BE8", fontFamily:F, letterSpacing:"-2px", lineHeight:1 }}>{currSeries[0].count}</div>
                <div style={{ fontSize:13, color:T.inkSub, fontFamily:F, marginTop:8 }}>leads this period</div>
              </div>
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display:"block", minWidth:300 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B3BE8" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#5B3BE8" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="cmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.14"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[0,0.25,0.5,0.75,1].map(r => (
                <g key={r}>
                  <line x1={pad.l} y1={pad.t+innerH*(1-r)} x2={pad.l+innerW} y2={pad.t+innerH*(1-r)} stroke={T.line} strokeWidth="1"/>
                  <text x={pad.l-4} y={pad.t+innerH*(1-r)+4} textAnchor="end" fontSize="9" fill={T.inkMuted} fontFamily={F}>{Math.round(seriesCountMax*r)}</text>
                </g>
              ))}
              {[0.5,1].map(r => (
                <text key={`rv-${r}`} x={pad.l+innerW+4} y={pad.t+innerH*(1-r)+4} textAnchor="start" fontSize="9" fill="#10b981" fontFamily={F} opacity="0.7">{big(seriesRevMax*r)}</text>
              ))}
              {compareOn && cmpSeries.length > 1 && (
                <>
                  <path d={areaPath(cmpSeries.map(p=>p.count), seriesCountMax)} fill="url(#cmpGrad)"/>
                  <path d={smoothPath(cmpSeries.map(p=>p.count), seriesCountMax)} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="5,3"/>
                </>
              )}
              <path d={areaPath(currSeries.map(p=>p.revenue), seriesRevMax)} fill="url(#revAreaGrad)"/>
              <path d={smoothPath(currSeries.map(p=>p.revenue), seriesRevMax)} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.8"/>
              <path d={areaPath(currSeries.map(p=>p.count), seriesCountMax)} fill="url(#areaGrad)"/>
              <path d={smoothPath(currSeries.map(p=>p.count), seriesCountMax)}  fill="none" stroke={T.brand} strokeWidth="2.5"/>
              {currSeries.map((p,i) => (
                <text key={i} x={pad.l+(i/(currSeries.length-1||1))*innerW} y={svgH-6} textAnchor="middle" fontSize="9" fill={T.inkMuted} fontFamily={F}>{p.label}</text>
              ))}
              {currSeries.map((p,i) => {
                const x = pad.l+(i/(currSeries.length-1||1))*innerW;
                const y = pad.t+innerH-(p.count/seriesCountMax)*innerH;
                return <circle key={i} cx={x} cy={y} r="3" fill="#5B3BE8" stroke={T.surface} strokeWidth="1.5"/>;
              })}
              {currSeries.map((p,i) => {
                if (!p.revenue) return null;
                const x = pad.l+(i/(currSeries.length-1||1))*innerW;
                const y = pad.t+innerH-(p.revenue/seriesRevMax)*innerH;
                return <circle key={`rv-${i}`} cx={x} cy={y} r="2.5" fill="#10b981" stroke={T.surface} strokeWidth="1.5"/>;
              })}
            </svg>
          )}
        </div>
      </CardT>

      {/* Status + Revenue */}
      <div className="ek-analytics-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Status Donut */}
        <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:T.r.lg, boxShadow:T.shadowSm, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:F }}>Status Breakdown</div>
            <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{M.total} total leads</div>
          </div>
          <div style={{ padding:"20px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{ position:"relative", width:150, height:150 }}>
                <svg width="150" height="150" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="52" fill="none" stroke={T.surfaceEl} strokeWidth="20"/>
                  {(() => {
                    const total = donutData.reduce((a,d) => a+d.n, 0) || 1;
                    let cumPct = 0;
                    return donutData.map((d, i) => {
                      const startPct = cumPct / total;
                      cumPct += d.n;
                      const endPct = cumPct / total;
                      return <path key={i} d={donutArc(75,75,52,startPct,endPct)} fill="none" stroke={d.color} strokeWidth="20" strokeLinecap="butt"/>;
                    });
                  })()}
                  <circle cx="75" cy="75" r="36" fill={T.surface}/>
                  <text x="75" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill={T.ink} fontFamily={F}>{M.wr}%</text>
                  <text x="75" y="83" textAnchor="middle" fontSize="10" fill={T.inkMuted} fontFamily={F}>win rate</text>
                  <text x="75" y="97" textAnchor="middle" fontSize="9" fill={T.inkMuted} fontFamily={F}>{M.won} of {M.total} won</text>
                </svg>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {donutData.map(d => {
                const pct = M.total ? Math.round(d.n/M.total*100) : 0;
                const bgMap = { [T.won.dot]:T.won.bg, [T.pending.dot]:T.pending.bg, [T.lost.dot]:T.lost.bg, [T.drop.dot]:T.drop.bg };
                const bg = bgMap[d.color] || T.surfaceEl;
                return (
                  <div key={d.label} style={{ background:bg, borderRadius:T.r.md, padding:"10px 12px", border:`1px solid ${d.color}22` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, boxShadow:`0 0 6px ${d.color}66` }} />
                        <span style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:F }}>{d.label}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {compareOn && CM && <DeltaBadge cur={d.n} prev={CM[d.label.toLowerCase()]} T={T} />}
                        <span style={{ fontSize:15, fontWeight:800, color:d.color, fontFamily:F }}>{d.n}</span>
                        <span style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:5, background:`${d.color}22`, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:d.color, borderRadius:3, transition:"width .8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:T.r.lg, boxShadow:T.shadowSm, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${T.line}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:F }}>Revenue Breakdown</div>
          </div>
          <div style={{ padding:"20px 20px 0" }}>
            <div style={{ background:T.won.bg, border:`1px solid ${T.won.dot}33`, borderRadius:T.r.lg, padding:"16px 18px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:10, fontWeight:600, color:T.won.text, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:F, marginBottom:4 }}>Won Revenue</div>
                <div style={{ fontSize:28, fontWeight:800, color:T.won.dot, fontFamily:F, letterSpacing:"-1px", lineHeight:1 }}>{big(M.wonRev)}</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:"50%", background:T.won.dot, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Ic d={P.check} sz={18} color="#fff" sw={2.5}/>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0, paddingBottom:8 }}>
              {[
                { label:"Pending Pipeline", value:M.pendRev, color:T.pending.dot, bg:T.pending.bg, icon:"⏳", cmp:CM?.pendRev },
                { label:"Lost Revenue",     value:M.lostRev, color:T.lost.dot,    bg:T.lost.bg,    icon:"✕",  cmp:CM?.lostRev },
                { label:"Avg Deal (Won)",   value:M.avgDeal, color:"#5B3BE8",     bg:T.brandSubtle,icon:"◈",  cmp:CM?.avgDeal },
                { label:"Total Quoted",     value:M.totalRev,color:T.inkSub,      bg:T.surfaceEl,  icon:"∑",  cmp:CM?.totalRev },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 4px", borderBottom: i < arr.length-1 ? `1px solid ${T.line}` : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:row.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:row.color, fontWeight:700, border:`1px solid ${row.color}22`, flexShrink:0 }}>{row.icon}</div>
                    <span style={{ fontSize:12, color:T.inkSub, fontFamily:F }}>{row.label}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {compareOn && row.cmp !== undefined && <DeltaBadge cur={row.value} prev={row.cmp} T={T} />}
                    <span style={{ fontSize:14, fontWeight:700, color:row.color, fontFamily:F }}>{big(row.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Stage Flow */}
      <CardT title="Conversion Funnel" subtitle="Lead stage drop-off visualization" T={T}>
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
          {stageData.map((stage, i) => (
            <React.Fragment key={stage.label}>
              <div style={{ flex:1, position:"relative" }}>
                <div style={{ background:`${stage.color}22`, border:`1.5px solid ${stage.color}44`, borderRadius:T.r.md, padding:"14px 12px", textAlign:"center", margin:"0 4px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${stage.pct}%`, background:`${stage.color}18`, transition:"height .6s ease" }} />
                  <div style={{ fontSize:24, fontWeight:700, color:stage.color, fontFamily:F, letterSpacing:"-0.5px", position:"relative" }}>{stage.n}</div>
                  <div style={{ fontSize:10, color:T.inkMuted, fontFamily:F, marginTop:3, position:"relative" }}>{stage.label}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:stage.color, fontFamily:F, position:"relative" }}>{stage.pct}%</div>
                </div>
              </div>
              {i < stageData.length-1 && <div style={{ color:T.inkMuted, fontSize:18, flexShrink:0 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          {M.total > 0 && [
            { label:"Pending rate", pct:Math.round(M.pending/M.total*100), color:T.pending.dot },
            { label:"Win rate",     pct:M.wr,                               color:T.won.dot },
            { label:"Lost rate",    pct:Math.round(M.lost/M.total*100),    color:T.lost.dot },
            { label:"Drop rate",    pct:Math.round(M.drop/M.total*100),    color:T.drop.dot },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:T.surfaceEl, borderRadius:20, border:`1px solid ${T.line}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:item.color }} />
              <span style={{ fontSize:11, color:T.inkSub, fontFamily:F }}>{item.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:item.color, fontFamily:F }}>{item.pct}%</span>
            </div>
          ))}
        </div>
      </CardT>

      {/* Top Customers */}
      <CardT title="Top Customers by Quote Value" T={T}>
        {topCustomers.length === 0 ? (
          <div style={{ fontSize:12, color:T.inkMuted, fontFamily:F }}>No data yet.</div>
        ) : topCustomers.map((f, i) => (
          <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < topCustomers.length-1 ? `1px solid ${T.line}` : "none" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:T.brandSubtle, color:"#5B3BE8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:F, flexShrink:0 }}>{i+1}</div>
            <Avatar name={f.name} size={32} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
              <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{f.cityRegion || f.phone || "—"} · {f.enquiryType || "—"}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#5B3BE8", fontFamily:F }}>{inr(f.quoteAmount)}</div>
              <StatusPill status={f.status} sm T={T} />
            </div>
          </div>
        ))}
      </CardT>
    </>
  );
}
