import { useEffect, useState } from "react";
import { checkReportStatus, submitReport } from "../lib/authApi";
import { LISTING_REPORT_REASONS, USER_REPORT_REASONS } from "../lib/listingStatus";

// ─── ReportModal ──────────────────────────────────────────────────────────────
// Generic report dialog used for both "Report Listing" and "Report User" flows.
//
// Props:
//   open            — whether the modal is shown
//   onClose         — called to dismiss the modal
//   targetType      — "listing" | "user"
//   targetId        — itemId (listing) or userId (user) being reported
//   targetLabel     — human-readable name shown in the modal copy
//   sessionToken    — auth token, required to submit
//   onSubmitted     — called with the report payload after a successful submit
export default function ReportModal({
  open, onClose, targetType, targetId, targetLabel, sessionToken, onSubmitted,
}) {
  const reasons = targetType === "listing" ? LISTING_REPORT_REASONS : USER_REPORT_REASONS;

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);

  // Reset state whenever the modal is (re)opened for a new target
  useEffect(() => {
    if (!open) return;
    setReason(""); setDescription(""); setError(""); setDone(false);
    setSubmitting(false); setChecking(true); setAlreadyReported(false);

    if (!sessionToken || !targetId) { setChecking(false); return; }
    const query = targetType === "listing" ? { listingId: targetId } : { userId: targetId };
    checkReportStatus(sessionToken, query)
      .then(data => setAlreadyReported(!!data?.alreadyReported))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [open, targetType, targetId, sessionToken]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason || !sessionToken) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = targetType === "listing"
        ? { targetType: "listing", listingId: String(targetId), reason, description }
        : { targetType: "user", reportedUserId: String(targetId), reason, description };
      const data = await submitReport(sessionToken, payload);
      setDone(true);
      onSubmitted?.(data?.report);
    } catch (e) {
      if (String(e.message || "").toLowerCase().includes("already reported")) {
        setAlreadyReported(true);
      } else {
        setError(e.message || "Failed to submit report.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title = targetType === "listing" ? "Report this listing" : "Report this user";
  const subtitle = targetType === "listing"
    ? `Tell us what's wrong with "${targetLabel}".`
    : `Select a reason to report ${targetLabel || "this user"}.`;

  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(14,0,40,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", maxWidth: 420, width: "100%", boxShadow: "0 24px 80px rgba(14,0,40,0.22)", animation: "fadeUp 0.25s ease both" }}
        onClick={e => e.stopPropagation()}
      >
        {done || alreadyReported ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>{done ? "✅" : "ℹ️"}</div>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", margin: "0 0 8px" }}>
              {done ? "Report submitted successfully" : "You have already reported this"}
            </h2>
            <p style={{ color: "#9898a8", fontSize: 14, margin: "0 0 20px" }}>
              {done
                ? "Our moderation team will review this report."
                : `You've already submitted a report for this ${targetType}. We'll review it soon.`}
            </p>
            <button
              style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#5c22d4,#7c3aed)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 24px rgba(92,34,212,0.28)" }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", margin: "0 0 6px" }}>{title}</h2>
            <p style={{ color: "#9898a8", fontSize: 13, marginBottom: 18, lineHeight: 1.55 }}>{subtitle}</p>

            {checking ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ width: 28, height: 28, border: "3px solid #e0d0fd", borderTopColor: "#5c22d4", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#4b4b5c", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {reasons.map(r => {
                    const active = reason === r;
                    return (
                      <button
                        key={r}
                        style={{
                          padding: "11px 16px", borderRadius: 10,
                          border: `1.5px solid ${active ? "#5c22d4" : "#e5e5ec"}`,
                          background: active ? "linear-gradient(135deg,#f3ecfe,#ece0fd)" : "#f9f9fb",
                          textAlign: "left", fontFamily: "'DM Sans', system-ui, sans-serif",
                          fontSize: 13, fontWeight: active ? 700 : 500,
                          color: active ? "#5c22d4" : "#14141f",
                          cursor: "pointer", transition: "all 140ms ease",
                        }}
                        onClick={() => setReason(r)}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#c4a8f8"; e.currentTarget.style.background = "#faf7ff"; } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e5ec"; e.currentTarget.style.background = "#f9f9fb"; } }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: "#4b4b5c", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Description <span style={{ textTransform: "none", fontWeight: 500, color: "#9898a8" }}>(optional)</span>
                </p>
                <textarea
                  style={{ width: "100%", padding: "11px 14px", background: "#faf7ff", color: "#14141f", fontSize: 13, border: "1.5px solid #e5e5ec", borderRadius: 12, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", resize: "vertical", minHeight: 70, boxSizing: "border-box", marginBottom: 14, transition: "border-color 180ms ease" }}
                  placeholder="Add any extra details that will help our team review this..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={1000}
                  onFocus={e => e.target.style.borderColor = "#5c22d4"}
                  onBlur={e => e.target.style.borderColor = "#e5e5ec"}
                />

                {error && (
                  <div style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)", color: "#dc2626", borderRadius: 10, padding: "9px 13px", fontSize: 12, fontWeight: 600, marginBottom: 14, border: "1px solid #fca5a5" }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    style={{ flex: 1, padding: "12px", background: "#f9f9fb", color: "#6b6b7e", border: "1.5px solid #e5e5ec", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 2, padding: "12px",
                      background: reason ? "#dc2626" : "#d0d0db",
                      color: "#fff", border: "none", borderRadius: 12,
                      fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14,
                      cursor: reason && !submitting ? "pointer" : "not-allowed",
                      boxShadow: reason ? "0 6px 24px rgba(220,38,38,0.28)" : "none",
                      transition: "all 160ms ease",
                    }}
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
