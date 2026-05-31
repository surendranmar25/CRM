import React, { useState } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P } from "../ui/index.jsx";
import { inr, today } from "../../utils.js";

const COMPANY = {
  name: "Suntronix",
  address: "Chennai, Tamil Nadu, India",
  phone: "+91 99999 99999",
  email: "sales@suntronix.com",
  gstin: "33XXXXX0000X1ZX",
};

function pad(n) { return String(n).padStart(2, "0"); }

function genInvoiceNo(quotationNo, id) {
  if (quotationNo) return quotationNo;
  const d = new Date();
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(id).slice(-4).toUpperCase()}`;
}

export function InvoiceModal({ funnel, onClose, T }) {
  const [companyInfo, setCompanyInfo] = useState(COMPANY);
  const [editingCompany, setEditingCompany] = useState(false);
  const [taxRate, setTaxRate] = useState(18);
  const [includeGST, setIncludeGST] = useState(true);
  const [invoiceDate] = useState(today());
  const invoiceNo = genInvoiceNo(funnel.quotationNo, funnel.id);

  const products = (funnel.products || []).filter(p => p.desc || p.qty || p.price);
  const subtotal = products.reduce((a, p) => a + (Number(p.qty) || 1) * (Number(p.price) || 0), 0);
  const quoteSubtotal = Number(funnel.quoteAmount) || subtotal;
  const gstAmount = includeGST ? Math.round(quoteSubtotal * taxRate / 100) : 0;
  const grandTotal = quoteSubtotal + gstAmount;

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=1100");
    const prodRows = products.length > 0 ? products.map((p, i) => {
      const qty = Number(p.qty) || 1;
      const price = Number(p.price) || 0;
      const total = qty * price;
      return `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${p.desc || "—"}${p.category ? `<br><small style="color:#888">${p.category}</small>` : ""}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">₹${price.toLocaleString("en-IN")}</td>
        <td style="text-align:right">₹${total.toLocaleString("en-IN")}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">No product lines added</td></tr>`;

    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quotation / Invoice — ${funnel.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #4361ee; }
  .company-name { font-size: 26px; font-weight: 900; color: #4361ee; letter-spacing: -0.5px; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 6px 16px; background: #4361ee; color: #fff; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .inv-no { font-size: 18px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .info-box { background: #f8f9ff; border-radius: 10px; padding: 16px; }
  .info-label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
  .info-value { font-size: 13px; color: #1a1a2e; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #4361ee; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 10px 12px; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-box { min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .total-row.grand { border-top: 2px solid #4361ee; border-bottom: none; font-size: 16px; font-weight: 800; color: #4361ee; padding-top: 10px; margin-top: 6px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .status-Won { background: #d1fae5; color: #065f46; }
  .status-Pending { background: #fef3c7; color: #92400e; }
  .status-Lost { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; color: #888; font-size: 11px; }
  .terms { background: #f8f9ff; border-radius: 8px; padding: 12px 16px; margin-top: 20px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${companyInfo.name}</div>
      <div style="color:#666; font-size:12px; line-height:1.6">${companyInfo.address}<br>${companyInfo.phone} · ${companyInfo.email}</div>
      ${companyInfo.gstin ? `<div style="font-size:11px;color:#888;margin-top:4px">GSTIN: ${companyInfo.gstin}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div class="badge">${funnel.status === "Won" ? "TAX INVOICE" : "QUOTATION"}</div>
      <div class="inv-no" style="margin-top:10px">${invoiceNo}</div>
      <div style="color:#888; font-size:12px">Date: ${invoiceDate}</div>
      ${funnel.orderNumber ? `<div style="color:#888; font-size:12px">Order: ${funnel.orderNumber}</div>` : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="section-title">Bill To</div>
      <div style="font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:6px">${funnel.name || "—"}</div>
      ${funnel.phone ? `<div class="info-label">Phone</div><div class="info-value">${funnel.phone}</div>` : ""}
      ${funnel.email ? `<div class="info-label" style="margin-top:4px">Email</div><div class="info-value">${funnel.email}</div>` : ""}
      ${funnel.cityRegion ? `<div class="info-label" style="margin-top:4px">Location</div><div class="info-value">${funnel.cityRegion}</div>` : ""}
    </div>
    <div class="info-box">
      <div class="section-title">Deal Info</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="status-badge status-${funnel.status}">${funnel.status}</span>
        ${funnel.assignedTo ? `<span style="font-size:12px;color:#666">→ ${funnel.assignedTo}</span>` : ""}
      </div>
      ${funnel.enquiryType ? `<div class="info-label">Type</div><div class="info-value">${funnel.enquiryType}</div>` : ""}
      ${funnel.leadSource ? `<div class="info-label" style="margin-top:4px">Source</div><div class="info-value">${funnel.leadSource}</div>` : ""}
      ${funnel.createdAt ? `<div class="info-label" style="margin-top:4px">Created</div><div class="info-value">${new Date(funnel.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}</div>` : ""}
    </div>
  </div>

  <div class="section-title" style="margin-bottom:10px">Products / Services</div>
  <table>
    <thead><tr>
      <th style="width:40px">#</th>
      <th>Description</th>
      <th style="width:60px;text-align:center">Qty</th>
      <th style="width:100px;text-align:right">Unit Price</th>
      <th style="width:100px;text-align:right">Amount</th>
    </tr></thead>
    <tbody>${prodRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>₹${quoteSubtotal.toLocaleString("en-IN")}</span></div>
      ${includeGST ? `<div class="total-row"><span>GST (${taxRate}%)</span><span>₹${gstAmount.toLocaleString("en-IN")}</span></div>` : ""}
      <div class="total-row grand"><span>Grand Total</span><span>₹${grandTotal.toLocaleString("en-IN")}</span></div>
    </div>
  </div>

  ${funnel.quoteDesc ? `<div class="terms"><div class="section-title" style="margin-bottom:6px">Description / Notes</div><div style="font-size:12px;color:#555;line-height:1.6">${funnel.quoteDesc}</div></div>` : ""}
  ${funnel.deliveryDetails ? `<div class="terms" style="margin-top:10px"><div class="section-title" style="margin-bottom:6px">Delivery Details</div><div style="font-size:12px;color:#555">${funnel.deliveryDetails}</div></div>` : ""}
  ${funnel.paymentTerms ? `<div class="terms" style="margin-top:10px"><div class="section-title" style="margin-bottom:6px">Payment Terms</div><div style="font-size:12px;color:#555">${funnel.paymentTerms}</div></div>` : ""}

  <div class="footer">
    <div>This is a computer-generated document. No signature required.</div>
    <div>Generated by Suntronix CRM · ${invoiceDate}</div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: F }}>
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.lineMid}`, width: "min(580px, 100%)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.brand}, ${T.brandHover})`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Generate</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{funnel.status === "Won" ? "Tax Invoice" : "Quotation"}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={P.close} sz={14} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Invoice preview info */}
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Invoice No.</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{invoiceNo}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{funnel.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.inkMuted, fontFamily: F_MONO, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Date</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{invoiceDate}</div>
            </div>
          </div>

          {/* GST options */}
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Tax Settings</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: T.brand }} />
                <span style={{ fontSize: 13, color: T.ink }}>Include GST</span>
              </label>
              {includeGST && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.inkMuted }}>Rate:</span>
                  <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.lineMid}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: F }}>
                    {[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Products summary */}
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Products ({products.length} items)</div>
            </div>
            {products.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: T.inkMuted, fontSize: 12 }}>No product lines — using quote amount</div>
            ) : (
              products.map((p, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < products.length - 1 ? `1px solid ${T.line}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{p.desc || "—"}</div>
                    {p.category && <div style={{ fontSize: 11, color: T.inkMuted }}>{p.category}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.inkMuted }}>Qty: {p.qty || 1} × ₹{p.price || 0}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>{inr((Number(p.qty) || 1) * (Number(p.price) || 0))}</div>
                  </div>
                </div>
              ))
            )}
            {/* Totals */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.lineMid}`, background: T.surfaceEl }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.inkMuted }}>Subtotal</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{inr(quoteSubtotal)}</span>
              </div>
              {includeGST && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.inkMuted }}>GST ({taxRate}%)</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{inr(gstAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Grand Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.brand, fontFamily: F_MONO }}>{inr(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Company info */}
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Company Details</div>
              <button onClick={() => setEditingCompany(x => !x)} style={{ fontSize: 11, color: T.brand, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
                {editingCompany ? "Done" : "Edit"}
              </button>
            </div>
            {editingCompany ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["name", "Company Name"], ["address", "Address"], ["phone", "Phone"], ["email", "Email"], ["gstin", "GSTIN"]].map(([k, label]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, color: T.inkMuted, display: "block", marginBottom: 3 }}>{label}</label>
                    <input value={companyInfo[k] || ""} onChange={e => setCompanyInfo(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", border: `1px solid ${T.lineMid}`, borderRadius: 6, fontSize: 12, fontFamily: F, color: T.ink, background: T.surface, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.7 }}>
                <strong style={{ color: T.ink }}>{companyInfo.name}</strong><br />
                {companyInfo.address}<br />
                {companyInfo.phone} · {companyInfo.email}
                {companyInfo.gstin && <><br />GSTIN: {companyInfo.gstin}</>}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.line}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.line}`, background: "transparent", cursor: "pointer", fontSize: 13, color: T.inkSub, fontFamily: F }}>Cancel</button>
          <button onClick={handlePrint}
            style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: T.brand, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: F, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 14px ${T.brand}44` }}>
            <Ic d={P.dl} sz={14} color="#fff" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
