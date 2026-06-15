import { useState, useEffect, useRef } from "react";
import UniversityDropdown from "../components/UniversityDropdown";

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "#faf7ff",
  color: "#14141f",
  fontSize: 14,
  border: "1.5px solid #e5e5ec",
  borderRadius: 10,
  outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  boxSizing: "border-box",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
};

// ── Password Strength ──────────────────────────────────────────────────────
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

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 6, marginBottom: 2 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: score >= i ? color : "#e5e5ec", transition: "background 200ms ease" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color, margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label} password</p>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder, disabled }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>{label}</label>
    <input
      type={type}
      style={inputStyle}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
      onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
    />
  </div>
);

export default function SignupRoute({ authError, authLoading, signupPending, signupForm, setSignupForm, handleSignup, goToLogin, handleGoogleAuth, googlePending }) {
  const isDisabled = authLoading || signupPending || googlePending;
  const googleBtnRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) handleGoogleAuth(response.credential);
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          width: googleBtnRef.current.offsetWidth || 368,
          logo_alignment: "left",
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", initGoogle);
      } else {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
      }
    }
  }, [handleGoogleAuth]);

  return (
    <div style={{
      minHeight: "100vh",
      minHeight: "100dvh",
      width: "100%",
      display: "flex",
      background: "linear-gradient(135deg, #2d1260 0%, #5c22d4 55%, #7c3aed 100%)",
      position: "relative", overflow: "hidden",
      margin: 0,
      padding: 0,
    }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(252,211,77,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(124,58,237,0.25)", pointerEvents: "none" }} />

      <div className="auth-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", position: "relative", zIndex: 1 }}>
        <div className="auth-card" style={{
          background: "#fff",
          borderRadius: 24,
          padding: "40px 36px",
          width: "100%", maxWidth: 440,
          boxShadow: "0 24px 80px rgba(14,0,40,0.30)",
          animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: "#5c22d4", marginBottom: 8, letterSpacing: "-0.3px" }}>Campus Marketplace</div>
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 21, fontWeight: 800, color: "#14141f", margin: "0 0 6px", letterSpacing: "-0.3px" }}>Create your account ✨</h1>
            <p style={{ fontSize: 14, color: "#9898a8" }}>Join thousands of students buying and selling.</p>
          </div>

          {authError && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 18, border: "1px solid #fca5a5" }}>⚠️ {authError}</div>
          )}

          <Field label="Email address" value={signupForm.email} onChange={e => setSignupForm(s => ({ ...s, email: e.target.value }))} placeholder="you@university.edu" disabled={isDisabled} />
          {/* Password field with strength meter */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4b4b5c", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: 44 }}
                value={signupForm.password}
                onChange={e => setSignupForm(s => ({ ...s, password: e.target.value }))}
                disabled={isDisabled}
                placeholder="Min. 6 characters"
                onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 3px rgba(92,34,212,0.10)" })}
                onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e5ec", boxShadow: "none" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9898a8", padding: 0, display: "flex", alignItems: "center" }}
              >
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <PasswordStrengthBar password={signupForm.password} />
          </div>
          <Field label="Display name" value={signupForm.name} onChange={e => setSignupForm(s => ({ ...s, name: e.target.value }))} placeholder="Your name" disabled={isDisabled} />

          <UniversityDropdown
            value={signupForm.college}
            onChange={val => setSignupForm(s => ({ ...s, college: val }))}
            disabled={isDisabled}
          />

          <button
            style={{ width: "100%", padding: "13px", background: signupPending ? "#9f67f5" : "#5c22d4", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 12, border: "none", cursor: signupPending ? "wait" : "pointer", marginBottom: 10, boxShadow: "0 8px 32px rgba(92,34,212,0.28)", transition: "background 180ms ease" }}
            onClick={handleSignup} disabled={isDisabled}
            onMouseEnter={e => { if (!signupPending) e.currentTarget.style.background = "#4318a0"; }}
            onMouseLeave={e => { if (!signupPending) e.currentTarget.style.background = "#5c22d4"; }}
          >
            {signupPending ? "Creating account..." : "Create account →"}
          </button>

          {/* OR Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e5e5ec" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9898a8", letterSpacing: "0.5px" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e5e5ec" }} />
          </div>

          {/* Google Sign-Up Button */}
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
            onClick={goToLogin}
            onMouseEnter={e => e.currentTarget.style.background = "#f3ecfe"}
            onMouseLeave={e => e.currentTarget.style.background = "#f9f9fb"}
          >
            Already have an account? Login
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
