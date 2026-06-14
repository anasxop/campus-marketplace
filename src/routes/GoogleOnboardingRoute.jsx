import { useState } from "react";
import UniversityDropdown from "../components/UniversityDropdown";

export default function GoogleOnboardingRoute({
  pendingToken,
  profile,
  onComplete,
  onCancel,
  authError,
}) {
  const [college, setCollege] = useState("");
  const [pending, setPending] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleContinue = async () => {
    if (!college.trim()) {
      setValidationError("Please select your university to continue.");
      return;
    }
    setValidationError("");
    setPending(true);
    try {
      await onComplete({ pendingToken, college: college.trim() });
    } finally {
      setPending(false);
    }
  };

  const error = authError || validationError;

  return (
    <div style={{
      minHeight: "100vh",
      minHeight: "100dvh",
      width: "100%",
      display: "flex",
      background: "linear-gradient(135deg, #2d1260 0%, #5c22d4 55%, #7c3aed 100%)",
      position: "relative",
      overflow: "hidden",
      margin: 0,
      padding: 0,
    }}>
      {/* Background decorations — same as Login/Signup */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(252,211,77,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(124,58,237,0.25)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", position: "relative", zIndex: 1 }}>
        <div style={{
          background: "#fff",
          borderRadius: 24,
          padding: "44px 40px",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 24px 80px rgba(14,0,40,0.30)",
          animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: "#5c22d4", marginBottom: 8, letterSpacing: "-0.3px" }}>
              Campus Marketplace
            </div>
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 21, fontWeight: 800, color: "#14141f", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
              Almost there! 🎓
            </h1>
            <p style={{ fontSize: 14, color: "#9898a8" }}>
              Just one more step — tell us your university.
            </p>
          </div>

          {/* Google Profile Card */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg, #f3ecfe, #faf7ff)",
            border: "1.5px solid #e0d0fd",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 24,
          }}>
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #5c22d4",
                  flexShrink: 0,
                }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #5c22d4, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                {(profile?.name || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14141f", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.name || "Google User"}
              </div>
              <div style={{ fontSize: 12, color: "#9898a8", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                {profile?.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                {/* Google G logo */}
                <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span style={{ fontSize: 11, color: "#5c22d4", fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Signed in with Google
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 18, border: "1px solid #fca5a5" }}>
              ⚠️ {error}
            </div>
          )}

          {/* University Dropdown */}
          <UniversityDropdown
            value={college}
            onChange={val => { setCollege(val); setValidationError(""); }}
            disabled={pending}
            label="Your University / College"
            placeholder="Search your university..."
          />

          <p style={{ fontSize: 12, color: "#9898a8", marginBottom: 20, marginTop: -6, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            This helps match you with listings from your campus.
          </p>

          {/* Continue button */}
          <button
            style={{
              width: "100%",
              padding: "13px",
              background: pending ? "#9f67f5" : college ? "#5c22d4" : "#a78bfa",
              color: "#fff",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 12,
              border: "none",
              cursor: pending ? "wait" : college ? "pointer" : "not-allowed",
              marginBottom: 10,
              boxShadow: college ? "0 8px 32px rgba(92,34,212,0.28)" : "none",
              transition: "background 180ms ease, box-shadow 180ms ease",
            }}
            onClick={handleContinue}
            disabled={pending}
            onMouseEnter={e => { if (!pending && college) e.currentTarget.style.background = "#4318a0"; }}
            onMouseLeave={e => { if (!pending) e.currentTarget.style.background = college ? "#5c22d4" : "#a78bfa"; }}
          >
            {pending ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeDasharray="28 14" />
                </svg>
                Creating your account...
              </span>
            ) : "Continue →"}
          </button>

          {/* Cancel / back */}
          <button
            style={{ width: "100%", padding: "12px", background: "#f9f9fb", color: "#9898a8", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 13, borderRadius: 12, border: "1.5px solid #e5e5ec", cursor: "pointer", transition: "background 160ms ease" }}
            onClick={onCancel}
            disabled={pending}
            onMouseEnter={e => e.currentTarget.style.background = "#f3ecfe"}
            onMouseLeave={e => e.currentTarget.style.background = "#f9f9fb"}
          >
            ← Use a different account
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
