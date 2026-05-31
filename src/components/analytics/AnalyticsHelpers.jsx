import React from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Dot } from "../ui/index.jsx";
import { big } from "../../utils.js";

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function CardT({ children, title, subtitle, span2, span3, noPad, style: extra, T }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, boxShadow:T.shadowSm, overflow:"hidden", ...(span2?{gridColumn:"span 2"}:{}), ...(span3?{gridColumn:"span 3"}:{}), ...extra }}>
      {(title||subtitle) && (
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {title && <div style={{ fontSize:11, fontWeight:700, color:T.inkMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:F_MONO }}>{title}</div>}
          {subtitle && <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>{subtitle}</div>}
        </div>
      )}
      {noPad ? children : <div style={{ padding:"20px" }}>{children}</div>}
    </div>
  );
}

// ─── DELTA BADGE ──────────────────────────────────────────────────────────────
export function DeltaBadge({ cur, prev, T }) {
  if (!prev || prev === 0) return null;
  const pct = Math.round(((cur-prev)/prev)*100);
  const up = pct >= 0;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:up?T.won.text:T.lost.text, background:up?T.won.bg:T.lost.bg, padding:"2px 8px", borderRadius:20, fontFamily:F }}>
      {up?"↑":"↓"}{Math.abs(pct)}%
    </span>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, cmpValue, rawValue, rawCmpValue, icon, color, bg, compareOn, T }) {
  // icon can be a path string (SVG d attr) or an emoji string
  const isEmoji = icon && !/^[MLHVCSQTAZmlhvcsqtaz\d\s,.\-]/.test(icon);
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"20px", boxShadow:T.shadowSm, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"0 0 0 80px", background:bg||T.brandSubtle, opacity:0.7 }}/>
      {/* Icon — render as SVG if path string, else emoji */}
      <div style={{
        position:"absolute", top:14, right:14,
        width:36, height:36, borderRadius:10,
        background: bg||T.brandSubtle,
        border:`1.5px solid ${color||T.brand}60`,
        boxShadow:`0 2px 8px ${color||T.brand}30`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {isEmoji ? (
          <span style={{ fontSize:18 }}>{icon}</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display:"block" }}>
            <path d={icon} stroke={color||T.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.inkMuted, fontFamily:F_MONO, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</div>
        {compareOn && cmpValue!==undefined && <DeltaBadge cur={rawValue!==undefined?rawValue:(typeof value==="number"?value:0)} prev={rawCmpValue!==undefined?rawCmpValue:(typeof cmpValue==="number"?cmpValue:0)} T={T}/>}
      </div>
      <div style={{ fontSize:30, fontWeight:800, color:T.ink, fontFamily:F, letterSpacing:"-1px", lineHeight:1.1, marginBottom:4 }}>
        {typeof value==="number"&&value>1000?big(value):value}
      </div>
      {compareOn && cmpValue!==undefined && (
        <div style={{ fontSize:11, color:T.inkMuted, fontFamily:F }}>
          vs {typeof cmpValue==="number"&&cmpValue>1000?big(cmpValue):cmpValue} prev
        </div>
      )}
    </div>
  );
}

// ─── HORIZONTAL BAR ───────────────────────────────────────────────────────────
export function HBar({ label, val, max, color, sub, T }) {
  const pct = max>0?Math.round((typeof val==="number"?val:0)/max*100):0;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <span style={{ fontSize:12, color:T.ink, fontFamily:F, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color:T.ink, fontFamily:F, flexShrink:0 }}>{sub||val}</span>
      </div>
      <div style={{ height:7, background:T.surfaceEl, borderRadius:4, overflow:"hidden", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:`${color||T.brand}22`, borderRadius:4 }}/>
        <div style={{ width:`${pct}%`, height:"100%", background:color||T.brand, borderRadius:4, transition:"width .8s cubic-bezier(0.4,0,0.2,1)" }}/>
      </div>
    </div>
  );
}

// ─── SVG CHART UTILITIES ──────────────────────────────────────────────────────
export const svgH=180, svgW=600;
export const pad={ l:44, r:20, t:20, b:36 };
export const innerW=svgW-pad.l-pad.r;
export const innerH=svgH-pad.t-pad.b;

export const polyline=(points,maxV)=>{
  if(points.length<2||maxV===0)return "";
  return points.map((p,i)=>{
    const x=pad.l+(i/(points.length-1))*innerW;
    const y=pad.t+innerH-(p/maxV)*innerH;
    return `${x},${y}`;
  }).join(" ");
};

export const areaPath=(points,maxV)=>{
  if(points.length<2||maxV===0)return "";
  const pts=points.map((p,i)=>({x:pad.l+(i/(points.length-1))*innerW,y:pad.t+innerH-(p/maxV)*innerH}));
  const d=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  return `${d} L${pts[pts.length-1].x},${pad.t+innerH} L${pts[0].x},${pad.t+innerH} Z`;
};

export const donutArc=(cx,cy,r,startPct,endPct)=>{
  const start=(startPct*360-90)*Math.PI/180;
  const end=(endPct*360-90)*Math.PI/180;
  const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start);
  const x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
  const large=endPct-startPct>0.5?1:0;
  return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
};

// Smooth bezier path
export const smoothPath=(points,maxV)=>{
  if(points.length<2||maxV===0)return "";
  const pts=points.map((p,i)=>({x:pad.l+(i/(points.length-1))*innerW,y:pad.t+innerH-(p/maxV)*innerH}));
  if(pts.length===1)return `M${pts[0].x},${pts[0].y}`;
  let d=`M${pts[0].x},${pts[0].y}`;
  for(let i=0;i<pts.length-1;i++){
    const cp1x=pts[i].x+(pts[i+1].x-pts[i].x)*0.4;
    const cp1y=pts[i].y;
    const cp2x=pts[i].x+(pts[i+1].x-pts[i].x)*0.6;
    const cp2y=pts[i+1].y;
    d+=` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i+1].x},${pts[i+1].y}`;
  }
  return d;
};
