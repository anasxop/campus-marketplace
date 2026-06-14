// ─── Shared listing-status & reporting constants ─────────────────────────────
// Pure data/utilities only (no React components), so this module is safe to
// import from anywhere without affecting Fast Refresh boundaries.

export const LISTING_STATUSES = ["available", "reserved", "sold"];

export const STATUS_CONFIG = {
  available: {
    label: "Available",
    emoji: "🟢",
    color: "#059669",
    bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
    border: "#6ee7b7",
  },
  reserved: {
    label: "Reserved",
    emoji: "🟡",
    color: "#92400e",
    bg: "linear-gradient(135deg,#fef9e7,#fde68a)",
    border: "#fcd34d",
  },
  sold: {
    label: "Sold",
    emoji: "🔴",
    color: "#dc2626",
    bg: "linear-gradient(135deg,#fee2e2,#fecaca)",
    border: "#fca5a5",
  },
};

export function normalizeStatus(status) {
  const s = String(status || "available").toLowerCase();
  return LISTING_STATUSES.includes(s) ? s : "available";
}

// ─── Reporting reasons ────────────────────────────────────────────────────────

export const LISTING_REPORT_REASONS = ["Spam", "Fake Product", "Scam", "Inappropriate Content", "Duplicate Listing", "Other"];
export const USER_REPORT_REASONS = ["Spam", "Harassment", "Fake Account", "Scam", "Inappropriate Behavior", "Other"];
