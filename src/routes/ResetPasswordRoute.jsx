import { useState } from "react";

const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f97316" };
  if (score <= 3) return { score, label: "Good", color: "#eab308" };
  return { score, label: "Strong", color: "#22c55e" };
};

export default function ResetPasswordRoute({ token, onReset, onGoLogin }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { score, label, color } = getPasswordStrength(password);

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: "#faf7ff", color: "#14141f",
    fontSize: 14, border: "1.5px solid #e5e5ec", borderRadius: 10,
    outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif",
    boxSizing: "border-box", transition: "border-color 180ms ease, box-shadow 180ms ease",
  };

  const handleSubmit = async () => {
    setError("");
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!token) { setError("Invalid reset link. Please request a new one."); return; }
    setPending(true);
    try {
      await onReset(token, password);
      setSuccess("Password reset! You can now log in with your new password.");
    } catch (e) { setError(e.message || "Reset failed. The link may have expired."); }
    finally { setPending(false); }
  };

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
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: "#14141f", margin: "0 0 6px", letterSpacing: "-0.3px" }}>Set a new password 🔒</h1>
            <p style={{ fontSize: 14, color: "#9898a8" }}>Choose a strong password for your account.</p>
          </div>

          {success ? (
            <>
              <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, marginBottom: 20, border: "1px solid #6ee7b7" }}>
                ✅ {success}
              </div>
              <button
                style={{ width: "100%", padding: "13px", background: "#5c22d4", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(92,34,212,0.28)", transition: "background 180ms ease" }}
                onClick={onGoLogin}
                onMouseEnter={e => e.currentTarget.style.background = "#4318a0"}
                onMouseLeave={e => e.currentTarget.style.background = "#5c22d4"}
              >
                Back to Login →
              </button>
            </>
          ) : (
            <>
              {error && (
                <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 18, border: "1px solid #fca5a5" }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    style={{ ...inputStyle, paddingRight: 44 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={pending}
                    placeholder="Min. 6 characters"
                    onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
                    onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9898a8", padding: 0, display: "flex", alignItems: "center" }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: score >= i ? color : "#e5e5ec", transition: "background 200ms ease" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color, margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label} password</p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>Confirm Password</label>
                <input
                  type="password"
                  style={{ ...inputStyle, borderColor: confirm && confirm !== password ? "#ef4444" : "#e5e5ec" }}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  disabled={pending}
                  placeholder="Repeat your password"
                  onFocus={e => Object.assign(e.target.style, { borderColor: confirm && confirm !== password ? "#ef4444" : "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: confirm && confirm !== password ? "#ef4444" : "#e5e5ec", boxShadow: "none" })}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {confirm && confirm !== password && (
                  <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Passwords don't match</p>
                )}
              </div>

              <button
                style={{ width: "100%", padding: "13px", background: pending ? "#9f67f5" : "#5c22d4", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 12, border: "none", cursor: pending ? "wait" : "pointer", marginBottom: 10, boxShadow: "0 8px 32px rgba(92,34,212,0.28)", transition: "background 180ms ease" }}
                onClick={handleSubmit} disabled={pending}
                onMouseEnter={e => { if (!pending) e.currentTarget.style.background = "#4318a0"; }}
                onMouseLeave={e => { if (!pending) e.currentTarget.style.background = "#5c22d4"; }}
              >
                {pending ? "Saving..." : "Set New Password →"}
              </button>

              <button
                style={{ width: "100%", padding: "12px", background: "#f9f9fb", color: "#4b4b5c", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 12, border: "1.5px solid #e5e5ec", cursor: "pointer", transition: "background 160ms ease" }}
                onClick={onGoLogin}
                onMouseEnter={e => e.currentTarget.style.background = "#f3ecfe"}
                onMouseLeave={e => e.currentTarget.style.background = "#f9f9fb"}
              >
                ← Back to Login
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
