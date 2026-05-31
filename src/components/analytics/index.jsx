import React, { useState, useEffect } from "react";
import { F } from "../../theme/index.js";
import { today } from "../../utils.js";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar.jsx";
import { OverviewTab }        from "./OverviewTab.jsx";
import { PipelineTab }        from "./PipelineTab.jsx";
import { TeamTab }            from "./TeamTab.jsx";
import { ProductsTab }        from "./ProductsTab.jsx";

// ─── DATE RANGE HELPERS ───────────────────────────────────────────────────────
function getRange(p) {
  const now = new Date();
  const fmt = d => d.toISOString().split("T")[0];
  const startOf = unit => {
    const d = new Date(now);
    if (unit==="week")  { d.setDate(d.getDate()-d.getDay()); }
    if (unit==="month") { d.setDate(1); }
    if (unit==="year")  { d.setMonth(0); d.setDate(1); }
    return d;
  };
  switch (p) {
    case "today":  return { from:fmt(now), to:fmt(now) };
    case "week":   return { from:fmt(startOf("week")), to:fmt(now) };
    case "month":  return { from:fmt(startOf("month")), to:fmt(now) };
    case "last30": { const d=new Date(now); d.setDate(d.getDate()-30); return { from:fmt(d), to:fmt(now) }; }
    case "last3m": { const d=new Date(now); d.setMonth(d.getMonth()-3); return { from:fmt(d), to:fmt(now) }; }
    case "year":   return { from:fmt(startOf("year")), to:fmt(now) };
    default:       return { from:"", to:"" };
  }
}

function getAutoCompare(from, to) {
  if (!from || !to) return { from:"", to:"" };
  const f=new Date(from), t=new Date(to), diff=t-f;
  const cf=new Date(f-diff-86400000), ct=new Date(f-86400000);
  const fmt = d => d.toISOString().split("T")[0];
  return { from:fmt(cf), to:fmt(ct) };
}

function filterByRange(arr, from, to) {
  if (!from && !to) return arr;
  return arr.filter(f => {
    try {
      const d = new Date(f.createdAt).toISOString().split("T")[0];
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    } catch { return false; }
  });
}

function computeMetrics(arr, todayV) {
  const won     = arr.filter(f => f.status==="Won");
  const pending = arr.filter(f => f.status==="Pending");
  const lost    = arr.filter(f => f.status==="Lost");
  const drop    = arr.filter(f => f.status==="Drop");
  const wonRev  = won.reduce((a,f) => a+(Number(f.quoteAmount)||0), 0);
  const pendRev = pending.reduce((a,f) => a+(Number(f.quoteAmount)||0), 0);
  const lostRev = lost.reduce((a,f) => a+(Number(f.quoteAmount)||0), 0);
  const dropRev = drop.reduce((a,f) => a+(Number(f.quoteAmount)||0), 0);
  const totalRev= arr.reduce((a,f) => a+(Number(f.quoteAmount)||0), 0);
  const wr      = arr.length ? Math.round(won.length/arr.length*100) : 0;
  const lossRate= arr.length ? Math.round(lost.length/arr.length*100) : 0;
  const dropRate= arr.length ? Math.round(drop.length/arr.length*100) : 0;
  const avgDeal = won.length ? wonRev/won.length : 0;
  const revPerLead = arr.length ? Math.round(totalRev/arr.length) : 0;
  const overdue = pending.filter(f => f.nextFollowUp && f.nextFollowUp < todayV).length;
  const todayF  = pending.filter(f => f.nextFollowUp === todayV).length;
  const upcoming = pending.filter(f => f.nextFollowUp && f.nextFollowUp > todayV).length;
  const noFollowUp = pending.filter(f => !f.nextFollowUp).length;
  const withOrderNum = arr.filter(f => f.orderNumber).length;
  const closedDeals = won.length + lost.length + drop.length;
  const closeRate = arr.length ? Math.round(closedDeals/arr.length*100) : 0;
  return { total:arr.length, won:won.length, pending:pending.length, lost:lost.length, drop:drop.length,
    wonRev, pendRev, lostRev, dropRev, totalRev, wr, lossRate, dropRate, avgDeal, revPerLead,
    overdue, todayF, upcoming, noFollowUp, withOrderNum, closedDeals, closeRate };
}

function buildTimeSeries(arr, from, to, gran) {
  if (!from || !to) {
    const buckets = {};
    arr.forEach(f => {
      try {
        const key = new Date(f.createdAt).toISOString().slice(0,7);
        if (!buckets[key]) buckets[key]={ count:0, revenue:0 };
        buckets[key].count++;
        if (f.status==="Won") buckets[key].revenue += Number(f.quoteAmount)||0;
      } catch {}
    });
    return Object.entries(buckets).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8).map(([k,v])=>({
      label: new Date(k+"-01").toLocaleString("en-IN",{month:"short",year:"2-digit"}), ...v
    }));
  }
  const points=[], f=new Date(from), t=new Date(to);
  let cur=new Date(f);
  while (cur<=t) {
    let key, label, next;
    if (gran==="daily") {
      key=cur.toISOString().split("T")[0];
      label=cur.toLocaleString("en-IN",{day:"numeric",month:"short"});
      next=new Date(cur); next.setDate(next.getDate()+1);
    } else if (gran==="weekly") {
      key=cur.toISOString().split("T")[0];
      label=`${cur.getDate()} ${cur.toLocaleString("en-IN",{month:"short"})}`;
      next=new Date(cur); next.setDate(next.getDate()+7);
    } else {
      key=cur.toISOString().slice(0,7);
      label=cur.toLocaleString("en-IN",{month:"short",year:"2-digit"});
      next=new Date(cur); next.setMonth(next.getMonth()+1);
    }
    const bucket=arr.filter(item=>{
      try {
        const d=new Date(item.createdAt).toISOString();
        const dk=gran==="monthly"?d.slice(0,7):d.split("T")[0];
        if (gran==="monthly") return dk===key;
        if (gran==="daily")   return dk===key;
        return dk>=key && dk<next.toISOString().split("T")[0];
      } catch { return false; }
    });
    points.push({ label, count:bucket.length, revenue:bucket.filter(f=>f.status==="Won").reduce((a,f)=>a+(Number(f.quoteAmount)||0),0) });
    cur=next;
    if (points.length>24) break;
  }
  return points;
}

// ─── ANALYTICS ROOT ──────────────────────────────────────────────────────────
export function Analytics({ funnels, T }) {
  const todayV = today();

  const [preset,      setPreset]      = useState("all");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");
  const [compareOn,   setCompareOn]   = useState(false);
  const [cmpFrom,     setCmpFrom]     = useState("");
  const [cmpTo,       setCmpTo]       = useState("");
  const [granularity, setGranularity] = useState("monthly");
  const [activeTab,   setActiveTab]   = useState("overview");

  const activeFrom = preset==="custom" ? customFrom : getRange(preset).from;
  const activeTo   = preset==="custom" ? customTo   : getRange(preset).to;

  useEffect(() => {
    if (compareOn && activeFrom && activeTo) {
      const auto = getAutoCompare(activeFrom, activeTo);
      setCmpFrom(auto.from); setCmpTo(auto.to);
    }
  }, [preset, activeFrom, activeTo, compareOn]);

  // Auto-set granularity only when preset changes (not on manual granularity change)
  useEffect(() => {
    if (!activeFrom || !activeTo) { setGranularity("monthly"); return; }
    const diff = (new Date(activeTo)-new Date(activeFrom))/86400000;
    if (diff<=2)   setGranularity("daily");
    else if (diff<=60) setGranularity("weekly");
    else setGranularity("monthly");
  }, [preset, customFrom, customTo]);

  const curr = filterByRange(funnels, activeFrom, activeTo);
  const cmp  = compareOn ? filterByRange(funnels, cmpFrom, cmpTo) : [];

  const M  = computeMetrics(curr, todayV);
  const CM = compareOn ? computeMetrics(cmp, todayV) : null;

  const currSeries = buildTimeSeries(curr, activeFrom, activeTo, granularity);
  const cmpSeries  = compareOn ? buildTimeSeries(cmp, cmpFrom, cmpTo, granularity) : [];

  const pending = curr.filter(f => f.status==="Pending");

  // Source performance metrics
  const srcPerfMap = {};
  curr.forEach(f => {
    const src = f.leadSource || "Unknown";
    if (!srcPerfMap[src]) srcPerfMap[src] = { total:0, won:0, revenue:0, wonRev:0 };
    srcPerfMap[src].total++;
    srcPerfMap[src].revenue += Number(f.quoteAmount)||0;
    if (f.status==="Won") { srcPerfMap[src].won++; srcPerfMap[src].wonRev += Number(f.quoteAmount)||0; }
  });
  const srcPerfArr = Object.entries(srcPerfMap).sort((a,b) => b[1].total - a[1].total);

  // Team maps
  const teamMap = {};
  curr.forEach(f => {
    const p = f.assignedTo || f.createdBy; if (!p) return;
    if (!teamMap[p]) teamMap[p]={ total:0, won:0, revenue:0, pending:0, lost:0, drop:0 };
    teamMap[p].total++;
    if (f.status==="Won")     { teamMap[p].won++;     teamMap[p].revenue += Number(f.quoteAmount)||0; }
    if (f.status==="Pending") teamMap[p].pending++;
    if (f.status==="Lost")    teamMap[p].lost++;
    if (f.status==="Drop")    teamMap[p].drop++;
  });
  const cmpTeamMap = {};
  cmp.forEach(f => {
    const p = f.assignedTo || f.createdBy; if (!p) return;
    if (!cmpTeamMap[p]) cmpTeamMap[p]={ total:0, won:0, revenue:0 };
    cmpTeamMap[p].total++;
    if (f.status==="Won") { cmpTeamMap[p].won++; cmpTeamMap[p].revenue += Number(f.quoteAmount)||0; }
  });
  const teamArr = Object.entries(teamMap).sort((a,b) => b[1].total-a[1].total);

  const rangeLabel = activeFrom && activeTo ? `${activeFrom} → ${activeTo}` : "All time";

  return (
    <div style={{ fontFamily:F, minHeight:"100%" }}>
      <AnalyticsFilterBar
        preset={preset} setPreset={setPreset}
        customFrom={customFrom} setCustomFrom={setCustomFrom}
        customTo={customTo} setCustomTo={setCustomTo}
        compareOn={compareOn} setCompareOn={setCompareOn}
        cmpFrom={cmpFrom} setCmpFrom={setCmpFrom}
        cmpTo={cmpTo} setCmpTo={setCmpTo}
        granularity={granularity} setGranularity={setGranularity}
        activeTab={activeTab} setActiveTab={setActiveTab}
        curr={curr} cmp={cmp} CM={CM} rangeLabel={rangeLabel}
        T={T}
      />

      <div style={{ padding:"clamp(12px,2.5vw,16px) clamp(12px,3vw,16px)", display:"flex", flexDirection:"column", gap:16, animation:"fadeUp .2s ease both" }}>
        {activeTab==="overview" && (
          <OverviewTab
            M={M} CM={CM} compareOn={compareOn}
            curr={curr} cmp={cmp}
            currSeries={currSeries} cmpSeries={cmpSeries}
            granularity={granularity} rangeLabel={rangeLabel}
            T={T}
          />
        )}
        {activeTab==="pipeline" && (
          <PipelineTab
            M={M} curr={curr} pending={pending}
            compareOn={compareOn} cmpSeries={cmpSeries}
            currSeries={currSeries} rangeLabel={rangeLabel}
            srcPerfArr={srcPerfArr}
            T={T}
          />
        )}
        {activeTab==="team" && (
          <TeamTab teamArr={teamArr} cmpTeamMap={cmpTeamMap} compareOn={compareOn} T={T} />
        )}
        {activeTab==="products" && (
          <ProductsTab curr={curr} T={T} />
        )}
      </div>
    </div>
  );
}
