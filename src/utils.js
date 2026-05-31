// ─── DATE / FORMAT HELPERS ────────────────────────────────────────────────────
export const today = () => new Date().toISOString().split("T")[0];

export const stamp = () => {
  const n = new Date();
  return n.toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})
    +" "+n.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
};

export const inr  = n => n ? "₹"+Number(n).toLocaleString("en-IN") : null;

export const big  = n => {
  if (!n) return "₹0";
  if (n>=1e7) return `₹${(n/1e7).toFixed(2)}Cr`;
  if (n>=1e5) return `₹${(n/1e5).toFixed(1)}L`;
  return "₹"+Number(n).toLocaleString("en-IN");
};

export const greeting = (name) => {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${g}, ${name}`;
};

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export function xls(data, name) {
  const e = v => String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const H = ["#","Name","Lead Source","Phone","Email","Enquiry","Type","Follow-up","Status","City/Region","Delivery Details","Payment Terms","Products","Order Number","Qty","Quote Amt","Remarks","Created","By","Assigned To"];
  const hRow = `<Row ss:StyleID="h">${H.map(h=>`<Cell><Data ss:Type="String">${e(h)}</Data></Cell>`).join("")}</Row>`;
  const rows = data.map((f,i)=>{
    const prod=(f.products||[]).map(p=>`${p.desc}(${p.category},×${p.qty},₹${p.price})`).join("|");
    return `<Row>${[[i+1,"Number"],[f.name||""],[f.leadSource||""],[f.phone||""],[f.email||""],[f.enquiryType||""],[f.funnelType||""],[f.nextFollowUp||""],[f.status],[f.cityRegion||""],[f.deliveryDetails||""],[f.paymentTerms||""],[prod],[f.orderNumber||""],[f.quoteQty||"",f.quoteQty?"Number":"String"],[f.quoteAmount||"",f.quoteAmount?"Number":"String"],[f.remarks||""],[f.createdAt],[f.createdBy],[f.assignedTo||""]].map(([v,t="String"])=>`<Cell><Data ss:Type="${t}">${e(v)}</Data></Cell>`).join("")}</Row>`;
  }).join("");
  const xml=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/><Interior ss:Color="#9a7a45" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Funnels"><Table>${hRow}${rows}</Table></Worksheet></Workbook>`;
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"}));
  a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
