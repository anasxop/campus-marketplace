import { useEffect, useRef, useState } from "react";

export default function LoginRoute({
  authError,
  authLoading,
  loginPending,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  handleLogin,
  goToSignup,
  handleGoogleAuth,
  googlePending,
  onForgotPassword,
}) {
  const googleBtnRef = useRef(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => { if (response.credential) handleGoogleAuth(response.credential); },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard", theme: "outline", size: "large",
          text: "continue_with", shape: "rectangular",
          width: googleBtnRef.current.offsetWidth || 340, logo_alignment: "left",
        });
      }
    };
    if (window.google?.accounts?.id) { initGoogle(); }
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true; script.defer = true; script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [handleGoogleAuth]);

  const inputStyle = (focused) => ({
    width: "100%", padding: "11px 14px", background: "#faf7ff", color: "#14141f",
    fontSize: 14, border: `1.5px solid ${focused ? "#5c22d4" : "#e5e5ec"}`, borderRadius: 10,
    outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
    boxShadow: focused ? "0 0 0 3px rgba(92,34,212,0.10)" : "none", marginBottom: 0,
  });

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim()) { setForgotErr("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) { setForgotErr("Please enter a valid email address."); return; }
    setForgotPending(true); setForgotErr(""); setForgotMsg("");
    try {
      const data = await onForgotPassword(forgotEmail.trim());
      // Use the server's actual success message, not a hardcoded string
      setForgotMsg(data?.message || "Reset link sent! Check your inbox and spam folder.");
    } catch (e) {
      setForgotErr(e.message || "Something went wrong. Please try again.");
    }
    finally { setForgotPending(false); }
  };



  // ── Forgot Password screen ──────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div style={{ minHeight: "100vh", minHeight: "100dvh", width: "100%", display: "flex",
        background: "linear-gradient(135deg, #2d1260 0%, #5c22d4 55%, #7c3aed 100%)",
        position: "relative", overflow: "hidden", margin: 0, padding: 0 }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(252,211,77,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", position: "relative", zIndex: 1 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "44px 40px", width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(14,0,40,0.30)", animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: "#5c22d4", marginBottom: 8, letterSpacing: "-0.3px" }}>Campus Marketplace</div>
              <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: "#14141f", margin: "0 0 6px", letterSpacing: "-0.3px" }}>Reset your password 🔑</h1>
              <p style={{ fontSize: 14, color: "#9898a8" }}>Enter your email and we'll send you a reset link.</p>
            </div>

            {forgotMsg && (
              <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "14px 16px", fontSize: 13, fontWeight: 600, marginBottom: 18, border: "1px solid #6ee7b7", lineHeight: 1.6 }}>
                ✅ {forgotMsg}
                <p style={{ marginTop: 8, fontSize: 12, fontWeight: 400, color: "#047857" }}>
                  Don't see it? Check your <strong>spam or junk folder</strong>. The link expires in 1 hour.
                </p>
              </div>
            )}
            {forgotErr && (
              <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "14px 16px", fontSize: 13, fontWeight: 500, marginBottom: 18, border: "1px solid #fca5a5", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Could not send reset email</div>
                <div style={{ fontSize: 12, color: "#b91c1c" }}>{forgotErr}</div>
              </div>
            )}

            {!forgotMsg && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>Email address</label>
                <input
                  style={inputStyle(false)} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@university.edu" disabled={forgotPending}
                  onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
                  onKeyDown={e => e.key === "Enter" && handleForgotSubmit()}
                />
              </div>
            )}

            {!forgotMsg && (
              <button
                style={{ width: "100%", padding: "13px", background: forgotPending ? "#9f67f5" : "#5c22d4", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 12, border: "none", cursor: forgotPending ? "wait" : "pointer", marginBottom: 10, boxShadow: "0 8px 32px rgba(92,34,212,0.28)", transition: "background 180ms ease" }}
                onClick={handleForgotSubmit} disabled={forgotPending}
                onMouseEnter={e => { if (!forgotPending) e.currentTarget.style.background = "#4318a0"; }}
                onMouseLeave={e => { if (!forgotPending) e.currentTarget.style.background = "#5c22d4"; }}
              >
                {forgotPending ? "Sending..." : "Send reset link →"}
              </button>
            )}

            <button
              style={{ width: "100%", padding: "12px", background: "#f9f9fb", color: "#4b4b5c", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 12, border: "1.5px solid #e5e5ec", cursor: "pointer", transition: "background 160ms ease" }}
              onClick={() => { setShowForgot(false); setForgotMsg(""); setForgotErr(""); setForgotEmail(""); }}
              onMouseEnter={e => e.currentTarget.style.background = "#f3ecfe"}
              onMouseLeave={e => e.currentTarget.style.background = "#f9f9fb"}
            >
              ← Back to login
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  // ── Main Login screen ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", width: "100%", display: "flex",
      background: "linear-gradient(135deg, #2d1260 0%, #5c22d4 55%, #7c3aed 100%)",
      position: "relative", overflow: "hidden", margin: 0, padding: 0 }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(252,211,77,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "44px 40px", width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(14,0,40,0.30)", animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: "#5c22d4", marginBottom: 8, letterSpacing: "-0.3px" }}>Campus Marketplace</div>
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: "#14141f", margin: "0 0 6px", letterSpacing: "-0.3px" }}>Welcome back 👋</h1>
            <p style={{ fontSize: 14, color: "#9898a8" }}>Login to browse and sell student essentials.</p>
          </div>

          {authError && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 18, border: "1px solid #fca5a5" }}>⚠️ {authError}</div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>Email address</label>
            <input
              style={inputStyle(false)} value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              disabled={authLoading || loginPending || googlePending} placeholder="you@university.edu"
              onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
              onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>Password</label>
            <input
              type="password" style={inputStyle(false)} value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              disabled={authLoading || loginPending || googlePending} placeholder="••••••••"
              onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
              onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button
              style={{ background: "none", border: "none", color: "#5c22d4", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "underline", textUnderlineOffset: 3 }}
              onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); }}
            >
              Forgot password?
            </button>
          </div>

          <button
            style={{ width: "100%", padding: "13px", background: loginPending ? "#9f67f5" : "#5c22d4", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 12, border: "none", cursor: loginPending ? "wait" : "pointer", marginBottom: 10, boxShadow: "0 8px 32px rgba(92,34,212,0.28)", transition: "background 180ms ease, transform 120ms ease" }}
            onClick={handleLogin} disabled={authLoading || loginPending || googlePending}
            onMouseEnter={e => { if (!loginPending) e.currentTarget.style.background = "#4318a0"; }}
            onMouseLeave={e => { if (!loginPending) e.currentTarget.style.background = "#5c22d4"; }}
          >
            {loginPending ? "Logging in..." : "Login →"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e5e5ec" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9898a8", letterSpacing: "0.5px" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e5e5ec" }} />
          </div>

          {googlePending ? (
            <div style={{ width: "100%", padding: "13px", background: "#f9f9fb", borderRadius: 12, border: "1.5px solid #e5e5ec", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, color: "#4b4b5c", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}><circle cx="12" cy="12" r="9" stroke="#9898a8" strokeWidth="2.5" strokeDasharray="28 14" /></svg>
              Signing in with Google...
            </div>
          ) : (
            <div ref={googleBtnRef} style={{ width: "100%", marginBottom: 10, display: "flex", justifyContent: "center" }} />
          )}

          <button
            style={{ width: "100%", padding: "12px", background: "#f9f9fb", color: "#4b4b5c", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 12, border: "1.5px solid #e5e5ec", cursor: "pointer", transition: "background 160ms ease" }}
            onClick={goToSignup}
            onMouseEnter={e => e.currentTarget.style.background = "#f3ecfe"}
            onMouseLeave={e => e.currentTarget.style.background = "#f9f9fb"}
          >
            New here? Create an account
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
