import { STATUS_CONFIG, normalizeStatus } from "../lib/listingStatus";

// ─── StatusBadge ──────────────────────────────────────────────────────────────
// Compact pill shown on listing cards everywhere (home feed, search results,
// category pages, profiles, wishlist, related listings, dashboard, etc).
export default function StatusBadge({ status, size = "md", style }) {
  const cfg = STATUS_CONFIG[normalizeStatus(status)];
  const sizes = {
    sm: { fontSize: 10, padding: "2px 8px", gap: 3 },
    md: { fontSize: 11, padding: "3px 10px", gap: 4 },
    lg: { fontSize: 12, padding: "4px 12px", gap: 5 },
  };
  const sz = sizes[size] || sizes.md;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: sz.gap,
        fontWeight: 800, letterSpacing: "0.02em", whiteSpace: "nowrap",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        borderRadius: 999,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        boxShadow: "0 2px 8px rgba(14,0,40,0.10)",
        ...sz,
        ...style,
      }}
    >
      <span style={{ fontSize: sz.fontSize + 1, lineHeight: 1 }}>{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}
