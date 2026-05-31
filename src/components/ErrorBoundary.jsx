import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const T = this.props.T || {};
    const bg      = T.bg      || "#f5f1eb";
    const surface = T.surface || "#fff";
    const ink     = T.ink     || "#111";
    const inkMuted= T.inkMuted|| "#666";
    const brand   = T.brand   || "#9a7a45";
    const line    = T.line    || "#e0d9ce";

    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:bg, padding:24, fontFamily:"'DM Sans', system-ui, sans-serif" }}>
        <div style={{ background:surface, border:`1px solid ${line}`, borderRadius:12, padding:"40px 48px", maxWidth:460, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:ink, margin:"0 0 10px" }}>Something went wrong</h2>
          <p style={{ fontSize:13, color:inkMuted, lineHeight:1.7, margin:"0 0 24px" }}>
            An unexpected error occurred. Your data is safe — this is a display issue only.
          </p>
          {this.state.error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:20, textAlign:"left" }}>
              <div style={{ fontFamily:"monospace", fontSize:11, color:"#b91c1c", wordBreak:"break-all", lineHeight:1.6 }}>
                {this.state.error.message}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button
              onClick={() => this.setState({ hasError:false, error:null })}
              style={{ padding:"9px 20px", background:brand, color:"#fff", border:"none", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer" }}>
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding:"9px 20px", background:"transparent", color:inkMuted, border:`1px solid ${line}`, borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer" }}>
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
