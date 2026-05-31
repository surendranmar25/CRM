// ─── RBAC ─────────────────────────────────────────────────────────────────────
export const FULL   = ["CEO", "Manager", "Editor"];
export const VIEWER = ["Viewer"];
export const can    = (u, a) => {
  if (VIEWER.includes(u?.role)) return false;
  if (a === "export-all") return FULL.includes(u?.role) || u?.role === "CRE"; // CRE can export their own scoped leads
  if (a === "export")     return FULL.includes(u?.role);                      // filtered export: FULL only
  return FULL.includes(u?.role) || a === "create";
};

// ─── PIPELINE STAGES (customizable via localStorage) ─────────────────────────
const STAGES_KEY = "ek_pipeline_stages_v1";
const DEFAULT_STAGES = ["Pending", "Won", "Lost", "Drop"];
export const getStages = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STAGES_KEY) || "null");
    return saved?.length ? saved : DEFAULT_STAGES;
  } catch { return DEFAULT_STAGES; }
};
export const saveStages = (stages) => {
  try { localStorage.setItem(STAGES_KEY, JSON.stringify(stages)); } catch {}
};

// ─── DROPDOWN OPTION LISTS ────────────────────────────────────────────────────
export const CATS         = ["Laptop","Desktop","Mac","Mobiles & Wearables","Printers & Scanners","Earbuds","Headphones","Accessories","Audio & Video","Others"];
export const ENQS         = ["Sales Enquiry","Product Information","Pricing Request","Bulk Order Request","Technical Support","Service Request","Warranty Support","Product Availability","Partnership Opportunity","Business Consultation","Custom Requirement","Feedback & Suggestions","Complaint","General Enquiry"];
export const FTYPES       = ["Normal","High Value","Bulk","Priority","Enterprise","Government","Corporate","Repeat Customer","Partner Referral","Others"];
export const ROLES        = ["CEO","Manager","CRE","Editor","Viewer"];
export const STATUS       = ["Pending","Won","Lost","Drop"];
export const LEAD_SOURCES = ["Website","Google Search","Google Ads","Social Media","WhatsApp","Referral","Existing Customer","Direct Call","Email","Walk-in","Partner","Other"];
export const OUTCOMES     = ["Interested","Needs Time","Callback Requested","Not Interested","Rescheduled","Order Confirmed","Other"];

// ─── SEED USERS ───────────────────────────────────────────────────────────────
export const SEED_USERS = [
  {id:1,name:"Admin",       role:"CEO",     username:"admin",     password:"admin123"},
  {id:2,name:"Vinodhini",   role:"CRE",     username:"vinodhini", password:"pass123" },
  {id:3,name:"Arjun Kumar", role:"Manager", username:"arjun",     password:"pass123" },
  {id:4,name:"Editor",      role:"Editor",  username:"editor",    password:"editor123"},
];
