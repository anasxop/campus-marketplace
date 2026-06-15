import { useEffect } from "react";

// ─── Toast ────────────────────────────────────────────────────────────────────
// Lightweight, self-dismissing confirmation toast. Renders fixed to the
// bottom-right of the viewport. Pass `show` + `onDone` so the parent can
// clear its state once the toast finishes its lifecycle.
//
// The fade-in/fade-out is a single CSS keyframe animation timed to `duration`,
// so no internal visibility state (and no setState-in-effect) is needed.
// The effect below only schedules the `onDone` callback for cleanup.
export default function Toast({ show, message, icon = "✅", onDone, duration = 2600 }) {
  useEffect(() => {
    if (!show) return;
    const doneTimer = setTimeout(() => onDone?.(), duration + 300);
    return () => clearTimeout(doneTimer);
  }, [show, duration, onDone]);

  if (!show) return null;

  const animationDuration = duration + 300;

  return (
    <div
      className="app-toast"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 2000,
        display: "flex", alignItems: "center", gap: 10,
        background: "#14141f", color: "#fff",
        padding: "13px 20px", borderRadius: 14,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 14, fontWeight: 600,
        boxShadow: "0 12px 40px rgba(14,0,40,0.35)",
        animation: `toastLifecycle ${animationDuration}ms cubic-bezier(0.34,1.56,0.64,1) both`,
        pointerEvents: "none",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {message}
      <style>{`
        @keyframes toastLifecycle {
          0%   { opacity: 0; transform: translateY(16px); }
          8%   { opacity: 1; transform: translateY(0); }
          88%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(16px); }
        }
      `}</style>
    </div>
  );
}
