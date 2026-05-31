import React, { useState, useRef, useCallback } from "react";
import { F, F_MONO } from "../../theme/index.js";
import { Ic, P, Btn, Dot } from "../ui/index.jsx";
import { crmService } from "../../services/crmService.js";

export function WonProofModal({ funnel, onClose, onSave, T }) {
  const [tab,        setTab]        = useState("upload");
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(funnel.wonProofUrl || null);
  const [isExisting, setIsExisting] = useState(!!funnel.wonProofUrl);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [dragOver,   setDragOver]   = useState(false);
  const [cameraOn,   setCameraOn]   = useState(false);
  const [stream,     setStream]     = useState(null);

  const fileRef   = useRef();
  const videoRef  = useRef();
  const canvasRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.name.match(/\.(jpg|jpeg|png|webp|gif|heic)$/i)) {
      setError("Please select an image file (JPG, PNG, WEBP, GIF)"); return;
    }
    if (f.size > 10 * 1024 * 1024) { setError("File too large — max 10 MB"); return; }
    setError(""); setFile(f); setIsExisting(false);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const startCamera = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(s); setCameraOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = s; } }, 100);
    } catch { setError("Camera access denied. Allow camera permission in browser settings."); }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null); setCameraOn(false);
  };

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => {
      const f = new File([blob], `proof_${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFile(f); stopCamera(); setTab("upload");
    }, "image/jpeg", 0.92);
  };

  const submit = async () => {
    setSaving(true); setError("");
    try {
      let url = isExisting ? preview : null;
      if (file) url = await crmService.uploadProofImage(funnel.id, file);
      await onSave(url || ""); onClose();
    } catch (err) {
      setError(err.message || "Upload failed. Check Supabase storage bucket 'ekanta-proofs'.");
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try { await onSave(""); onClose(); }
    catch (e) { setError(e.message); setSaving(false); }
  };

  const clearSelection = () => { setFile(null); setPreview(funnel.wonProofUrl||null); setIsExisting(!!funnel.wonProofUrl); setError(""); };

  // Paste from clipboard
  React.useEffect(() => {
    const handler = (e) => {
      const item = [...(e.clipboardData?.items||[])].find(i=>i.type.startsWith("image/"));
      if (item) { const f = item.getAsFile(); if (f) handleFile(f); }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [handleFile]);

  const canSave = (file || isExisting) && !saving;

  const tabBtn = (id, label, sub) => (
    <button key={id} onClick={() => { setTab(id); if(id==="camera") startCamera(); else stopCamera(); }}
      style={{ flex:1, padding:"12px 16px", border:"none", borderBottom:`2.5px solid ${tab===id?T.brand:"transparent"}`, background:"transparent", color:tab===id?T.brand:T.inkSub, fontFamily:F, fontSize:13, fontWeight:tab===id?700:400, cursor:"pointer", transition:"all .15s", textAlign:"center" }}>
      {label}
      <div style={{ fontSize:10, color:T.inkMuted, marginTop:2 }}>{sub}</div>
    </button>
  );

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 8px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)" }} onClick={onClose}>
      <div style={{ background:T.surface,borderRadius:16,width:"100%",maxWidth:"min(500px,calc(100vw - 16px))",boxShadow:T.shadowXl,animation:"scaleIn .2s ease",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"94dvh" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 22px",borderBottom:`1px solid ${T.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:42,height:42,borderRadius:12,background:T.won.bg,border:`2px solid ${T.won.dot}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🏆</div>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:F }}>Upload Won Proof</div>
              <div style={{ fontSize:11,color:T.inkMuted,fontFamily:F,marginTop:1 }}>{funnel.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,border:`1px solid ${T.line}`,borderRadius:8,background:T.surfaceEl,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ic d={P.close} sz={12} color={T.inkSub}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:`1px solid ${T.line}`,flexShrink:0 }}>
          {tabBtn("upload","📁 Upload / Paste","File, drag & drop, or Ctrl+V")}
          {tabBtn("camera","📷 Camera","Take a photo now")}
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"20px 22px",display:"flex",flexDirection:"column",gap:14 }}>

          {/* UPLOAD TAB */}
          {tab==="upload" && (<>
            {!preview && (
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={onDrop}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2.5px dashed ${dragOver?T.brand:T.lineMid}`,borderRadius:12,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:dragOver?T.brandSubtle:"transparent",transition:"all .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.brand;e.currentTarget.style.background=T.brandSubtle;}}
                onMouseLeave={e=>{if(!dragOver){e.currentTarget.style.borderColor=T.lineMid;e.currentTarget.style.background="transparent";}}}>
                <div style={{ fontSize:48,marginBottom:12 }}>🖼️</div>
                <div style={{ fontSize:14,fontWeight:700,color:T.ink,fontFamily:F,marginBottom:6 }}>
                  {dragOver?"Drop it here!":"Drop image or click to browse"}
                </div>
                <div style={{ fontSize:11,color:T.inkMuted,fontFamily:F,marginBottom:10 }}>JPG, PNG, WEBP, GIF · max 10 MB</div>
                <div style={{ fontSize:11,color:T.brand,fontFamily:F,fontWeight:500 }}>💡 Tip: Ctrl+V to paste a screenshot directly</div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e=>handleFile(e.target.files[0])} style={{ display:"none" }}/>
              </div>
            )}

            {preview && (
              <div style={{ position:"relative",borderRadius:12,overflow:"hidden",border:`2px solid ${file?T.won.dot:T.line}`,background:"#000" }}>
                <img src={preview} alt="Proof" style={{ width:"100%",maxHeight:300,objectFit:"contain",display:"block" }}
                  onError={()=>{setPreview(null);setFile(null);setIsExisting(false);setError("Could not display image");}}/>
                <button onClick={clearSelection}
                  style={{ position:"absolute",top:8,right:8,width:30,height:30,borderRadius:"50%",background:"rgba(0,0,0,0.65)",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700 }}>✕</button>
                <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.65))",padding:"24px 12px 10px",display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
                  <span style={{ fontSize:11,color:"#fff",fontFamily:F,fontWeight:600 }}>
                    {file ? `📎 ${file.name} · ${(file.size/1024).toFixed(0)} KB` : "✅ Saved proof"}
                  </span>
                  {!file && (
                    <button onClick={()=>fileRef.current?.click()}
                      style={{ fontSize:11,color:"#fff",background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:F }}>
                      Replace
                    </button>
                  )}
                </div>
              </div>
            )}
          </>)}

          {/* CAMERA TAB */}
          {tab==="camera" && (<>
            {cameraOn ? (
              <div style={{ display:"flex",flexDirection:"column",gap:12,alignItems:"center" }}>
                <div style={{ borderRadius:12,overflow:"hidden",background:"#000",width:"100%",position:"relative" }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%",display:"block",minHeight:200 }}/>
                  <div style={{ position:"absolute",inset:0,border:"2px solid rgba(255,255,255,0.3)",borderRadius:12,pointerEvents:"none" }}/>
                </div>
                <canvas ref={canvasRef} style={{ display:"none" }}/>
                <div style={{ display:"flex",gap:10,width:"100%" }}>
                  <button onClick={stopCamera}
                    style={{ flex:1,padding:"12px",borderRadius:10,border:`1px solid ${T.line}`,background:T.surfaceEl,color:T.inkSub,fontSize:13,fontFamily:F,cursor:"pointer",fontWeight:500 }}>
                    ✕ Cancel
                  </button>
                  <button onClick={capture}
                    style={{ flex:2,padding:"12px",borderRadius:10,border:"none",background:T.brand,color:"#fff",fontSize:15,fontFamily:F,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 16px ${T.brand}55` }}>
                    📸 Capture
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:"center",padding:"40px 20px" }}>
                <div style={{ fontSize:64,marginBottom:16 }}>📷</div>
                <div style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:F,marginBottom:8 }}>Take a photo of the proof</div>
                <div style={{ fontSize:12,color:T.inkMuted,fontFamily:F,marginBottom:24,lineHeight:1.7 }}>
                  Payment receipt, WhatsApp confirmation,<br/>order screenshot — anything that confirms the deal
                </div>
                <button onClick={startCamera}
                  style={{ padding:"13px 32px",borderRadius:12,border:"none",background:T.brand,color:"#fff",fontSize:14,fontFamily:F,cursor:"pointer",fontWeight:700,boxShadow:`0 4px 16px ${T.brand}44` }}>
                  📷 Open Camera
                </button>
              </div>
            )}
          </>)}

          {error && (
            <div style={{ padding:"10px 14px",background:T.lost.bg,border:`1px solid ${T.lost.dot}44`,borderRadius:8,fontSize:12,color:T.lost.text,fontFamily:F,lineHeight:1.6 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ fontSize:10,color:T.inkMuted,fontFamily:F,lineHeight:1.6,padding:"8px 12px",background:T.surfaceEl,borderRadius:7,border:`1px solid ${T.line}` }}>
            Images upload to Supabase Storage. Create a <strong>public bucket named "ekanta-proofs"</strong> in your Supabase project → Storage → New bucket.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
          <div>
            {funnel.wonProofUrl && (
              <button onClick={remove} disabled={saving}
                style={{ fontSize:12,color:T.lost.text,background:"none",border:"none",cursor:"pointer",fontFamily:F,textDecoration:"underline",opacity:saving?0.5:1 }}>
                Remove proof
              </button>
            )}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn ghost label="Cancel" onClick={onClose} T={T}/>
            <Btn primary icon={P.check}
              label={saving?"Uploading…":file?"Upload & Save":"Save"}
              onClick={submit} disabled={!canSave} T={T}/>
          </div>
        </div>
      </div>
    </div>
  );
}
