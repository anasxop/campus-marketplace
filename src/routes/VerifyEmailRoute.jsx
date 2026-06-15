import { useEffect, useState } from "react";

/**
 * VerifyEmailRoute
 *
 * Public route — accessible whether or not the user is logged in.
 * Reads the `token` prop (extracted from `?token=…` in the URL hash),
 * calls the `onVerify(token)` API function, and renders the appropriate
 * success / error / loading state.
 *
 * Lifecycle:
 *   mount → "verifying" (spinner)
 *     ↓ success → "success" (✅ + CTA buttons)
 *     ↓ failure  → "error"   (⚠️ + error message + back button)
 *
 * If no token is present at all, we skip the API call and immediately
 * show the "invalid link" error state.
 */
export default function VerifyEmailRoute({ token, onVerify, onGoLogin, onGoDashboard, isLoggedIn }) {
  const [phase, setPhase] = useState("verifying"); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No verification token was found in this link. Please use the link sent to your email.");
      setPhase("error");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await onVerify(token);
        if (cancelled) return;
        setPhase("success");
      } catch (e) {
        if (cancelled) return;
        const msg = e.message || "Verification failed. The link may be invalid or expired.";
        setErrorMsg(msg);
        setPhase("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared layout shell ─────────────────────────────────────────────────────
  const Shell = ({ children }) => (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      background: "linear-gradient(135deg, #2d1260 0%, #5c22d4 55%, #7c3aed 100%)",
      position: "relative",
      overflow: "hidden",
      margin: 0,
      padding: 0,
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(252,211,77,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <div className="auth-wrapper" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: 1, padding: "40px 20px", position: "relative", zIndex: 1,
      }}>
        <div className="auth-card" style={{
          background: "#fff",
          borderRadius: 24,
          padding: "44px 40px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 80px rgba(14,0,40,0.30)",
          animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
          textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 18, color: "#5c22d4", marginBottom: 28, letterSpacing: "-0.2px" }}>
            Campus<span style={{ color: "#fcd34d" }}>Marketplace</span>
          </div>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  // ── Phase: verifying ────────────────────────────────────────────────────────
  if (phase === "verifying") {
    return (
      <Shell>
        <div style={{
          width: 56, height: 56,
          border: "4px solid #e0d0fd",
          borderTopColor: "#5c22d4",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 24px",
        }} />
        <h1 style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: 20, fontWeight: 800,
          color: "#14141f", margin: "0 0 8px",
        }}>
          Verifying your email…
        </h1>
        <p style={{ fontSize: 14, color: "#9898a8", margin: 0 }}>
          This will only take a moment.
        </p>
      </Shell>
    );
  }

  // ── Phase: success ──────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <Shell>
        {/* Success icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, margin: "0 auto 24px",
          border: "2px solid #86efac",
          boxShadow: "0 8px 24px rgba(34,197,94,0.20)",
        }}>
          ✅
        </div>

        <h1 style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: 22, fontWeight: 800,
          color: "#14141f", margin: "0 0 10px",
          letterSpacing: "-0.3px",
        }}>
          Email Verified Successfully
        </h1>
        <p style={{ fontSize: 14, color: "#4b4b5c", margin: "0 0 28px", lineHeight: 1.6 }}>
          Your account has been verified. You can now use all features of Campus Marketplace.
        </p>

        {/* Benefits row */}
        <div style={{
          background: "#faf7ff",
          border: "1.5px solid #e0d0fd",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 28,
          textAlign: "left",
        }}>
          {[
            { icon: "🔒", text: "Your account is now fully secured" },
            { icon: "✅", text: "Verified badge visible to buyers" },
            { icon: "🔔", text: "Email notifications are active" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: "#4b4b5c", fontWeight: 500 }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        {isLoggedIn ? (
          <button
            style={{
              width: "100%", padding: "13px",
              background: "#5c22d4", color: "#fff",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 700, fontSize: 15,
              borderRadius: 12, border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(92,34,212,0.28)",
              transition: "background 180ms ease",
              marginBottom: 10,
            }}
            onClick={onGoDashboard}
            onMouseEnter={e => e.currentTarget.style.background = "#4318a0"}
            onMouseLeave={e => e.currentTarget.style.background = "#5c22d4"}
          >
            Go to Dashboard →
          </button>
        ) : (
          <>
            <button
              style={{
                width: "100%", padding: "13px",
                background: "#5c22d4", color: "#fff",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 700, fontSize: 15,
                borderRadius: 12, border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(92,34,212,0.28)",
                transition: "background 180ms ease",
                marginBottom: 10,
              }}
              onClick={onGoLogin}
              onMouseEnter={e => e.currentTarget.style.background = "#4318a0"}
              onMouseLeave={e => e.currentTarget.style.background = "#5c22d4"}
            >
              Continue to Login →
            </button>
          </>
        )}
      </Shell>
    );
  }

  // ── Phase: error ────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Error icon */}
      <div style={{
        width: 72, height: 72,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #fee2e2, #fecaca)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34, margin: "0 auto 24px",
        border: "2px solid #fca5a5",
        boxShadow: "0 8px 24px rgba(239,68,68,0.18)",
      }}>
        ⚠️
      </div>

      <h1 style={{
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: 20, fontWeight: 800,
        color: "#14141f", margin: "0 0 10px",
        letterSpacing: "-0.3px",
      }}>
        Verification link is invalid or expired
      </h1>
      <p style={{ fontSize: 13, color: "#6b6b7e", margin: "0 0 20px", lineHeight: 1.65 }}>
        {errorMsg}
      </p>

      {/* Explanation */}
      <div style={{
        background: "#fff7ed",
        border: "1.5px solid #fed7aa",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 24,
        textAlign: "left",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", margin: "0 0 8px" }}>Why does this happen?</p>
        <ul style={{ fontSize: 12, color: "#7c2d12", margin: 0, paddingLeft: 16, lineHeight: 1.7 }}>
          <li>The link expires after 24 hours</li>
          <li>The link was already used</li>
          <li>The link was copied incorrectly from the email</li>
        </ul>
      </div>

      <p style={{ fontSize: 13, color: "#9898a8", margin: "0 0 20px" }}>
        Log in to your account and request a new verification email from your Dashboard.
      </p>

      <button
        style={{
          width: "100%", padding: "13px",
          background: "#5c22d4", color: "#fff",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 700, fontSize: 15,
          borderRadius: 12, border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(92,34,212,0.28)",
          transition: "background 180ms ease",
        }}
        onClick={onGoLogin}
        onMouseEnter={e => e.currentTarget.style.background = "#4318a0"}
        onMouseLeave={e => e.currentTarget.style.background = "#5c22d4"}
      >
        {isLoggedIn ? "Go to Dashboard →" : "← Back to Login"}
      </button>
    </Shell>
  );
}
