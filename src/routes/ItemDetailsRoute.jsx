import { useEffect, useRef, useState } from "react";
import { IconHeart } from "../App";
import { fetchRatings, postRating, trackListingView, fetchUserProfile } from "../lib/authApi";
import { getTopCategory, CATEGORY_TREE } from "../data/marketplace";
import StatusBadge from "../components/StatusBadge";
import { STATUS_CONFIG, LISTING_STATUSES, normalizeStatus } from "../lib/listingStatus";
import ReportModal from "../components/ReportModal";
import Toast from "../components/Toast";

const getImageSrc = (image) => {
  if (typeof image !== "string" || !image.trim()) return "/favicon.svg";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/") || image.startsWith("data:image/")) return image;
  return "/favicon.svg";
};

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  Academic: {
    color: "#5c22d4",
    gradient: "linear-gradient(135deg,#5c22d4,#7c3aed)",
    lightBg: "linear-gradient(135deg,#f3ecfe,#ece0fd)",
    border: "#e0d0fd",
    softBg: "#faf7ff",
    emoji: "📚",
    featuredLabel: "ACADEMIC RESOURCE",
    featuredBg: "linear-gradient(135deg,#5c22d4,#7c3aed)",
    featuredColor: "#fff",
    overviewFields: (item) => [
      { icon: "📖", lbl: "Subject",       val: item.subject        || "—" },
      { icon: "🗓️", lbl: "Semester",      val: item.semester       || "—" },
      { icon: "🏫", lbl: "University",    val: item.university || item.college || "—" },
      { icon: "📄", lbl: "Resource Type", val: item.resourceType   || "—" },
      { icon: "💾", lbl: "Format",        val: item.format         || "—" },
      { icon: "⭐", lbl: "Condition",     val: item.condition      || "—" },
    ],
    badges: (item) => [
      { label: "Academic",                      type: "info"    },
      item.semester    && { label: item.semester,              type: "info"    },
      item.resourceType && { label: item.resourceType,         type: "warning" },
      item.format      && { label: item.format,               type: "success" },
      item.subject     && { label: item.subject,              type: "info"    },
    ].filter(Boolean),
    primaryAction: { label: "📩 Contact Seller",   isService: false },
    secondaryAction: { label: "📋 Request Resource" },
    hideAccommodationType: true,
  },
  Services: {
    color: "#f97316",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    lightBg: "linear-gradient(135deg,#fff7ed,#ffedd5)",
    border: "#fed7aa",
    softBg: "#fff7ed",
    emoji: "💼",
    featuredLabel: "SERVICE LISTING",
    featuredBg: "linear-gradient(135deg,#f59e0b,#f97316)",
    featuredColor: "#fff",
    overviewFields: (item) => [
      { icon: "🎯", lbl: "Service Type",   val: item.serviceCategory || item.subcategory || item.category || "—" },
      { icon: "🏆", lbl: "Experience",     val: item.experienceLevel  || "—" },
      { icon: "⏱️", lbl: "Delivery Time",  val: item.deliveryTime     || "—" },
      { icon: "💰", lbl: "Pricing Model",  val: item.pricingType      || "—" },
      { icon: "🗓️", lbl: "Availability",   val: item.availability     || "—" },
      item.portfolioLink && { icon: "🔗", lbl: "Portfolio", val: "View Portfolio →", link: item.portfolioLink },
    ].filter(Boolean),
    badges: (item) => [
      { label: "Service",                                  type: "warning" },
      item.serviceCategory && { label: item.serviceCategory,   type: "warning" },
      item.experienceLevel && { label: item.experienceLevel,   type: "info"    },
      item.availability    && { label: item.availability,      type: "success" },
    ].filter(Boolean),
    primaryAction:   { label: "🤝 Request Service",    isService: true  },
    secondaryAction: { label: "💬 Message Provider" },
    hidePrice: false,
    hideAccommodationType: true,
  },
  Furniture: {
    color: "#059669",
    gradient: "linear-gradient(135deg,#059669,#10b981)",
    lightBg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
    border: "#6ee7b7",
    softBg: "#f0fdf4",
    emoji: "🪑",
    featuredLabel: "FURNITURE",
    featuredBg: "linear-gradient(135deg,#059669,#10b981)",
    featuredColor: "#fff",
    overviewFields: (item) => [
      { icon: "🪵", lbl: "Material",   val: item.material          || "—" },
      { icon: "📐", lbl: "Dimensions", val: item.dimensions        || "—" },
      { icon: "⭐", lbl: "Condition",  val: item.condition         || "—" },
      { icon: "🚗", lbl: "Pickup",     val: item.pickupAvailable   || "—" },
      { icon: "🚚", lbl: "Delivery",   val: item.deliveryAvailable || "—" },
      { icon: "📍", lbl: "Location",   val: item.college           || "—" },
    ],
    badges: (item) => [
      { label: "Furniture",                                         type: "success" },
      item.material          && { label: item.material,            type: "info"    },
      item.condition         && { label: item.condition,           type: "success" },
      item.pickupAvailable === "Yes"   && { label: "Pickup Available",   type: "success" },
      item.deliveryAvailable === "Yes" && { label: "Delivery Available", type: "info"    },
    ].filter(Boolean),
    primaryAction:   { label: "💬 Message Seller", isService: false },
    secondaryAction: null,
    hideAccommodationType: true,
  },
  Electronics: {
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg,#0ea5e9,#3b82f6)",
    lightBg: "linear-gradient(135deg,#e0f2fe,#dbeafe)",
    border: "#93c5fd",
    softBg: "#f0f9ff",
    emoji: "💻",
    featuredLabel: "ELECTRONICS",
    featuredBg: "linear-gradient(135deg,#0ea5e9,#3b82f6)",
    featuredColor: "#fff",
    overviewFields: (item) => [
      { icon: "🏷️", lbl: "Brand",       val: item.brand              || "—" },
      { icon: "📱", lbl: "Model",       val: item.model              || "—" },
      { icon: "⭐", lbl: "Condition",   val: item.condition          || "—" },
      { icon: "🛡️", lbl: "Warranty",    val: item.warrantyStatus     || "—" },
      { icon: "🔌", lbl: "Accessories", val: item.accessoriesIncluded || "—" },
      { icon: "⚡", lbl: "Power",       val: item.powerRequirements  || "—" },
    ].filter(r => r.val !== "—" || ["Brand","Model","Condition","Warranty"].includes(r.lbl)),
    badges: (item) => [
      { label: "Electronics",                                          type: "info"    },
      item.brand          && { label: item.brand,                     type: "info"    },
      item.condition      && { label: item.condition,                 type: "success" },
      item.warrantyStatus && item.warrantyStatus !== "No Warranty" && item.warrantyStatus !== "Expired"
                          && { label: "Warranty Available",           type: "success" },
    ].filter(Boolean),
    primaryAction:   { label: "💬 Message Seller", isService: false },
    secondaryAction: null,
    hideAccommodationType: true,
  },
  "Lifestyle & Essentials": {
    color: "#ec4899",
    gradient: "linear-gradient(135deg,#ec4899,#f43f5e)",
    lightBg: "linear-gradient(135deg,#fce7f3,#ffe4e6)",
    border: "#f9a8d4",
    softBg: "#fdf2f8",
    emoji: "👕",
    featuredLabel: "LIFESTYLE",
    featuredBg: "linear-gradient(135deg,#ec4899,#f43f5e)",
    featuredColor: "#fff",
    overviewFields: (item) => [
      { icon: "📦", lbl: "Item Type",  val: item.itemType          || item.subcategory || "—" },
      { icon: "⭐", lbl: "Condition",  val: item.condition         || "—" },
      { icon: "🚗", lbl: "Pickup",     val: item.pickupAvailable   || "—" },
      { icon: "🚚", lbl: "Delivery",   val: item.deliveryAvailable || "—" },
      { icon: "📍", lbl: "Location",   val: item.college           || "—" },
      { icon: "📅", lbl: "Posted on",  val: null }, // handled separately
    ],
    badges: (item) => [
      { label: item.subcategory || "Lifestyle", type: "info"    },
      item.condition && { label: item.condition,                type: "success" },
      item.pickupAvailable === "Yes" && { label: "Pickup Available", type: "success" },
    ].filter(Boolean),
    primaryAction:   { label: "💬 Message Seller", isService: false },
    secondaryAction: null,
    hideAccommodationType: false,
  },
};

const DEFAULT_CONFIG = CATEGORY_CONFIG["Lifestyle & Essentials"];

function getCategoryConfig(item) {
  const top = getTopCategory(item?.category) || item?.category;
  return CATEGORY_CONFIG[top] || DEFAULT_CONFIG;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function BadgeChip({ label, type, color }) {
  const styles = {
    info:    { background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", color: "#5c22d4", border: "1px solid #e0d0fd" },
    success: { background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", color: "#065f46", border: "1px solid #6ee7b7" },
    warning: { background: "linear-gradient(135deg,#fef9e7,#fde68a)", color: "#92400e", border: "1px solid #fcd34d" },
    accent:  { background: "linear-gradient(135deg,#e0f2fe,#dbeafe)", color: "#0369a1", border: "1px solid #93c5fd" },
    pink:    { background: "linear-gradient(135deg,#fce7f3,#ffe4e6)", color: "#9d174d", border: "1px solid #f9a8d4" },
  };
  const resolvedStyle = color
    ? { background: `${color}18`, color, border: `1px solid ${color}44` }
    : (styles[type] || styles.info);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, ...resolvedStyle }}>
      {label}
    </span>
  );
}

function SellerAvatar({ name, photoURL, size = 52 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#5c22d4", "#0ea5e9", "#059669", "#d97706", "#db2777", "#ea580c"];
  const color  = colors[(name || "").charCodeAt(0) % colors.length];
  const color2 = colors[((name || "").charCodeAt(1) || 0) % colors.length];
  if (photoURL) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden",
        boxShadow: `0 4px 16px rgba(0,0,0,0.18)`,
        border: "2px solid rgba(255,255,255,0.8)",
      }}>
        <img src={photoURL} alt={name || "Seller"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#fff",
      fontSize: size * 0.35, flexShrink: 0,
      boxShadow: `0 4px 16px ${color}44`,
    }}>
      {initials}
    </div>
  );
}

function StarRating({ value, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{
            fontSize: interactive ? 24 : 16,
            cursor: interactive ? "pointer" : "default",
            color: star <= display ? "#fbbf24" : "#e5e5ec",
            transition: "color 120ms ease, transform 120ms ease",
            transform: interactive && star <= display ? "scale(1.15)" : "scale(1)",
            display: "inline-block",
          }}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(star)}
        >★</span>
      ))}
    </div>
  );
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d)) return "Unknown";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatListingDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Category-aware Overview Section ────────────────────────────────────────
function OverviewSection({ item, config }) {
  const rows = config.overviewFields(item);
  // Always append Posted On & Location if not already included
  const hasPosted   = rows.some(r => r.lbl === "Posted on");
  const hasLocation = rows.some(r => r.lbl === "Location");
  const extra = [];
  if (!hasPosted)   extra.push({ icon: "📅", lbl: "Posted on", val: formatListingDate(item.createdAt) });
  if (!hasLocation) extra.push({ icon: "📍", lbl: "Location",  val: item.college || "—" });
  const allRows = [...rows.filter(r => r.lbl !== "Posted on"), ...extra];

  // Replace null val for "Posted on" rows
  const finalRows = allRows.map(r => r.lbl === "Posted on" && !r.val ? { ...r, val: formatListingDate(item.createdAt) } : r);

  return (
    <div style={{ borderTop: "1px solid #f2f2f6", paddingTop: 22, marginBottom: 22 }}>
      <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: "#14141f", margin: "0 0 18px" }}>
        Overview
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {finalRows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: config.lightBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
              border: `1px solid ${config.border}`,
            }}>{r.icon}</div>
            <div>
              <p style={{ fontSize: 12, color: "#9898a8", margin: "0 0 3px", fontWeight: 500 }}>{r.lbl}</p>
              {r.link
                ? <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: config.color, margin: 0, textDecoration: "none" }}>{r.val}</a>
                : <p style={{ fontSize: 14, fontWeight: 700, color: "#14141f", margin: 0 }}>{r.val}</p>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Service-specific extended section ──────────────────────────────────────
function ServiceDetailsSection({ item }) {
  if (!item.portfolioLink && !item.deliveryTime && !item.pricingType) return null;
  return (
    <div style={{ borderTop: "1px solid #f2f2f6", paddingTop: 22, marginBottom: 22 }}>
      <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: "#14141f", margin: "0 0 14px" }}>
        Service Details
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {item.deliveryTime && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa" }}>
            <span style={{ fontSize: 18 }}>⏱️</span>
            <div>
              <p style={{ fontSize: 11, color: "#9898a8", margin: 0, fontWeight: 600 }}>ESTIMATED DELIVERY</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#14141f", margin: 0 }}>{item.deliveryTime}</p>
            </div>
          </div>
        )}
        {item.pricingType && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa" }}>
            <span style={{ fontSize: 18 }}>💰</span>
            <div>
              <p style={{ fontSize: 11, color: "#9898a8", margin: 0, fontWeight: 600 }}>PRICING MODEL</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#14141f", margin: 0 }}>{item.pricingType}</p>
            </div>
          </div>
        )}
        {item.portfolioLink && (
          <a
            href={item.portfolioLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "linear-gradient(135deg,#fff7ed,#ffedd5)", borderRadius: 10, border: "1px solid #fed7aa", textDecoration: "none" }}
          >
            <span style={{ fontSize: 18 }}>🔗</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#9898a8", margin: 0, fontWeight: 600 }}>PORTFOLIO / SAMPLES</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f97316", margin: 0 }}>View Portfolio →</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Action buttons based on category ───────────────────────────────────────
function ActionButtons({ config, item, isOwnListing, saved, toggleWishlist, openConversation, canRate, ratingDone, setShowRatingModal, sessionToken, status, onStatusChange, statusUpdating, statusError }) {
  const isService = getTopCategory(item?.category) === "Services";

  if (isOwnListing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: `${config.softBg}`, border: `1.5px solid ${config.border}`, borderRadius: 12, padding: "14px 16px", fontSize: 14, color: config.color, fontWeight: 500 }}>
          ✨ This is your listing. Buyers can message you when interested.
        </div>

        {/* ── Seller status controls ── */}
        <div style={{ background: "#f9f9fb", border: "1.5px solid #e5e5ec", borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#4b4b5c", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Listing Status
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LISTING_STATUSES.map(opt => {
              const cfg = STATUS_CONFIG[opt];
              const active = status === opt;
              return (
                <button
                  key={opt}
                  disabled={statusUpdating}
                  style={{
                    flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${active ? cfg.border : "#e5e5ec"}`,
                    background: active ? cfg.bg : "#fff",
                    color: active ? cfg.color : "#6b6b7e",
                    fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: active ? 800 : 600, fontSize: 13,
                    cursor: statusUpdating ? "wait" : "pointer", whiteSpace: "nowrap",
                    transition: "all 160ms ease", opacity: statusUpdating && !active ? 0.6 : 1,
                  }}
                  onClick={() => onStatusChange(opt)}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#c4a8f8"; e.currentTarget.style.background = "#faf7ff"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e5ec"; e.currentTarget.style.background = "#fff"; } }}
                >
                  {cfg.emoji} Mark {cfg.label}
                </button>
              );
            })}
          </div>
          {statusError && (
            <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, margin: "10px 0 0" }}>⚠️ {statusError}</p>
          )}
        </div>
      </div>
    );
  }

  const isSold = status === "sold";
  const isReserved = status === "reserved";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* ── Status notice for buyers ── */}
      {isSold && (
        <div style={{ background: STATUS_CONFIG.sold.bg, border: `1.5px solid ${STATUS_CONFIG.sold.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: STATUS_CONFIG.sold.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          {STATUS_CONFIG.sold.emoji} This item has been sold.
        </div>
      )}
      {isReserved && (
        <div style={{ background: STATUS_CONFIG.reserved.bg, border: `1.5px solid ${STATUS_CONFIG.reserved.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 14, color: STATUS_CONFIG.reserved.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          {STATUS_CONFIG.reserved.emoji} This item is currently reserved.
        </div>
      )}

      {/* Primary action */}
      <button
        style={{
          width: "100%", padding: "14px",
          background: isSold ? "#e5e5ec" : config.gradient,
          color: isSold ? "#9898a8" : "#fff",
          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15,
          borderRadius: 12, border: "none", cursor: isSold ? "not-allowed" : "pointer",
          boxShadow: isSold ? "none" : `0 8px 32px ${config.color}44`,
          transition: "all 180ms ease",
        }}
        disabled={isSold}
        onClick={() => !isSold && openConversation(item.id)}
        onMouseEnter={e => { if (!isSold) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${config.color}55`; } }}
        onMouseLeave={e => { if (!isSold) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 32px ${config.color}44`; } }}
      >
        {isSold ? "Item Sold" : config.primaryAction.label}
      </button>

      {/* Service: extra "Message Provider" button */}
      {isService && !isSold && (
        <button
          style={{
            width: "100%", padding: "13px",
            background: "#fff7ed",
            color: "#f97316",
            fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14,
            borderRadius: 12, border: "1.5px solid #fed7aa", cursor: "pointer",
            transition: "all 180ms ease",
          }}
          onClick={() => openConversation(item.id)}
          onMouseEnter={e => { e.currentTarget.style.background = "#ffedd5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff7ed"; }}
        >
          💬 Message Provider
        </button>
      )}

      {/* Wishlist */}
      <button
        style={{
          width: "100%", padding: "13px", background: "#f9f9fb",
          color: "#4b4b5c", fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 600, fontSize: 14, borderRadius: 12,
          border: "1.5px solid #e5e5ec", cursor: "pointer",
          transition: "all 180ms ease",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}
        onClick={() => toggleWishlist(item.id)}
        onMouseEnter={e => { e.currentTarget.style.background = saved ? "#fee2e2" : "#f3ecfe"; e.currentTarget.style.borderColor = saved ? "#fca5a5" : "#e0d0fd"; e.currentTarget.style.color = saved ? "#ef4444" : "#5c22d4"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f9f9fb"; e.currentTarget.style.borderColor = "#e5e5ec"; e.currentTarget.style.color = "#4b4b5c"; }}
      >
        <IconHeart filled={saved} /> {saved ? "Saved to Wishlist" : "Save to Wishlist"}
      </button>

      {/* Rate seller */}
      {canRate && (
        <button
          style={{
            width: "100%", padding: "12px",
            background: ratingDone ? "#d1fae5" : "#faf7ff",
            color: ratingDone ? "#065f46" : "#5c22d4",
            fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14,
            borderRadius: 12, border: `1.5px solid ${ratingDone ? "#6ee7b7" : "#e0d0fd"}`,
            cursor: "pointer", transition: "all 180ms ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
          onClick={() => !ratingDone && setShowRatingModal(true)}
          onMouseEnter={e => { if (!ratingDone) { e.currentTarget.style.background = "#f3ecfe"; e.currentTarget.style.borderColor = "#c4a8f8"; } }}
          onMouseLeave={e => { if (!ratingDone) { e.currentTarget.style.background = "#faf7ff"; e.currentTarget.style.borderColor = "#e0d0fd"; } }}
        >
          {ratingDone ? "✅ Rating submitted!" : "⭐ Rate this seller"}
        </button>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ItemDetailsRoute({
  discount, isOwnListing, item, navigateBack, openConversation,
  styles: s, toggleWishlist, wishlist, sessionToken, currentUser, navigateToProfile,
  onStatusChange,
}) {
  const disc  = discount(item.originalPrice, item.price);
  const saved = wishlist.includes(item.id);
  const [activeImg, setActiveImg]             = useState(0);
  const [ratingStats, setRatingStats]         = useState({ avg: 0, count: 0 });
  const [ratingReviews, setRatingReviews]     = useState([]);
  const [sellerListingsCount, setSellerListingsCount] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [myRating, setMyRating]               = useState(0);
  const [myReview, setMyReview]               = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]           = useState(false);

  // ── Listing status (Available / Reserved / Sold) ──────────────────────────
  const [status, setStatus]                   = useState(normalizeStatus(item.status));
  const [statusUpdating, setStatusUpdating]   = useState(false);
  const [statusError, setStatusError]         = useState("");
  useEffect(() => { setStatus(normalizeStatus(item.status)); }, [item.id, item.status]);

  // ── Reporting ──────────────────────────────────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportToast, setShowReportToast] = useState(false);

  const handleStatusChange = async (next) => {
    if (next === status || statusUpdating) return;
    setStatusUpdating(true);
    setStatusError("");
    try {
      const updated = await onStatusChange(item.id, next);
      setStatus(normalizeStatus(updated?.status || next));
    } catch (e) {
      setStatusError(e.message || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const config  = getCategoryConfig(item);
  const topCat  = getTopCategory(item?.category) || item?.category;
  const isService = topCat === "Services";

  const images     = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image].filter(Boolean);
  const hasMultiple = images.length > 1;

  // ── View tracking ─────────────────────────────────────────────────────────
  // useRef guard ensures exactly one POST per mount, even under React StrictMode
  // which intentionally double-invokes effects in development.
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (!item?.id || isOwnListing) return; // never count owner visits
    if (viewTrackedRef.current) return;    // already fired this mount
    viewTrackedRef.current = true;
    trackListingView(String(item.id), sessionToken);
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRatings(item.ownerId).then(data => {
      setRatingStats(data.stats   || { avg: 0, count: 0 });
      setRatingReviews(data.reviews || []);
    }).catch(() => {});
    fetchUserProfile(item.ownerId)
      .then(data => setSellerListingsCount(data.listings?.length ?? null))
      .catch(() => {});
  }, [item.ownerId]);

  const submitRating = async () => {
    if (!myRating || !sessionToken) return;
    setRatingSubmitting(true);
    try {
      const data = await postRating(sessionToken, {
        sellerId: item.ownerId, rating: myRating, review: myReview, listingId: String(item.id),
      });
      setRatingStats(data.stats);
      setRatingDone(true);
      setShowRatingModal(false);
      fetchRatings(item.ownerId).then(d => {
        setRatingStats(d.stats   || { avg: 0, count: 0 });
        setRatingReviews(d.reviews || []);
      }).catch(() => {});
    } catch {
      setShowRatingModal(false);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const canRate = !isOwnListing && sessionToken && item.ownerId;

  // Category badges — use config + fallback
  const categoryBadges = config.badges(item);

  return (
    <div style={{ background: "#f9f9fb", minHeight: "calc(100vh - 64px)", paddingBottom: 80 }}>

      {/* ── Category accent banner ── */}
      <div style={{
        background: config.gradient,
        height: 4,
        width: "100%",
      }} />

      {/* ── Rating Modal ── */}
      {showRatingModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(14,0,40,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", animation: "fadeUp 150ms ease both" }}
          onClick={() => setShowRatingModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 24, padding: "36px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(14,0,40,0.25)", animation: "fadeUp 200ms ease both" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: "#14141f", margin: "0 0 6px" }}>Rate {item.seller}</h3>
            <p style={{ fontSize: 14, color: "#9898a8", margin: "0 0 24px" }}>How was your experience with this seller?</p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <StarRating value={myRating} interactive onRate={setMyRating} />
            </div>
            <textarea
              style={{ width: "100%", padding: "12px 14px", background: "#faf7ff", color: "#14141f", fontSize: 14, border: "1.5px solid #e5e5ec", borderRadius: 12, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", resize: "vertical", minHeight: 80, boxSizing: "border-box", marginBottom: 20, transition: "border-color 180ms ease" }}
              placeholder="Write a short review (optional)..."
              value={myReview}
              onChange={e => setMyReview(e.target.value)}
              onFocus={e => e.target.style.borderColor = "#5c22d4"}
              onBlur={e => e.target.style.borderColor = "#e5e5ec"}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: "12px", background: "#f9f9fb", color: "#6b6b7e", border: "1.5px solid #e5e5ec", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }} onClick={() => setShowRatingModal(false)}>Cancel</button>
              <button style={{ flex: 2, padding: "12px", background: myRating ? "#5c22d4" : "#d0d0db", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, cursor: myRating ? "pointer" : "not-allowed", boxShadow: myRating ? "0 6px 24px rgba(92,34,212,0.28)" : "none", transition: "all 160ms ease" }} onClick={submitRating} disabled={!myRating || ratingSubmitting}>
                {ratingSubmitting ? "Submitting..." : "Submit Rating ★"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Back button ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 0", boxSizing: "border-box" }}>
        <button
          style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, color: "#9898a8", background: "none", border: "none", cursor: "pointer", padding: "6px 0", transition: "color 160ms ease" }}
          onClick={navigateBack}
          onMouseEnter={e => e.currentTarget.style.color = config.color}
          onMouseLeave={e => e.currentTarget.style.color = "#9898a8"}
        >
          ← Back to listings
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="item-detail-grid" style={{ maxWidth: 1100, margin: "16px auto 0", padding: "0 32px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>

        {/* ════════ LEFT ════════ */}
        <div>
          {/* Main image */}
          <div style={{ background: "#111", borderRadius: 20, overflow: "hidden", aspectRatio: "16/9", position: "relative", boxShadow: "0 12px 48px rgba(14,0,40,0.20)", marginBottom: 12 }}>
            <img
              src={getImageSrc(images[activeImg])}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "contain", transition: "opacity 200ms ease" }}
            />
            {hasMultiple && (
              <>
                <button style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.18)", backdropFilter: "blur(8px)" }} onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}>‹</button>
                <button style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.18)", backdropFilter: "blur(8px)" }} onClick={() => setActiveImg(i => (i + 1) % images.length)}>›</button>
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                  {images.map((_, i) => (
                    <div key={i} style={{ width: i === activeImg ? 22 : 7, height: 7, borderRadius: 999, background: i === activeImg ? "#fcd34d" : "rgba(255,255,255,0.55)", transition: "all 200ms ease", cursor: "pointer" }} onClick={() => setActiveImg(i)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {hasMultiple && (
            <div style={{ display: "flex", gap: 10, marginBottom: 28, overflowX: "auto" }}>
              {images.map((img, i) => (
                <div key={i} style={{ width: 80, height: 60, borderRadius: 12, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: `2.5px solid ${i === activeImg ? config.color : "transparent"}`, transition: "border-color 160ms ease, transform 160ms ease", background: "#111", transform: i === activeImg ? "scale(1.04)" : "scale(1)" }} onClick={() => setActiveImg(i)}>
                  <img src={getImageSrc(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Item info card ── */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", padding: "28px", boxShadow: "0 4px 20px rgba(14,0,40,0.07)", marginBottom: 20 }}>

            {/* Category featured label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "inline-block", background: config.featuredBg, color: config.featuredColor, fontWeight: 800, fontSize: 11, padding: "4px 12px", borderRadius: 7, letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: `0 2px 8px ${config.color}33` }}>
                  {config.emoji} {config.featuredLabel}
                </div>
                <StatusBadge status={status} />
              </div>
              {!isOwnListing && sessionToken && (
                <button
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: "#b0b0c0", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 6px", borderRadius: 8, transition: "color 140ms ease, background 140ms ease", whiteSpace: "nowrap" }}
                  onClick={() => setShowReportModal(true)}
                  onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fee2e2"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#b0b0c0"; e.currentTarget.style.background = "transparent"; }}
                >
                  🚩 Report
                </button>
              )}
            </div>

            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color: "#14141f", letterSpacing: "-0.4px", lineHeight: 1.2, margin: "0 0 14px" }}>
              {item.title}
            </h1>

            {/* ── Dynamic category badges ── */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {categoryBadges.map((badge, i) => (
                <BadgeChip key={i} label={badge.label} type={badge.type} />
              ))}
              {/* Accommodation type badge: only for non-service, non-academic, non-furniture categories */}
              {item.type && !config.hideAccommodationType && (
                <BadgeChip label={item.type} type="warning" />
              )}
            </div>

            {/* ── Dynamic overview section ── */}
            <OverviewSection item={item} config={config} />

            {/* ── Service-specific details ── */}
            {isService && <ServiceDetailsSection item={item} />}

            {/* ── Description ── */}
            <div style={{ borderTop: "1px solid #f2f2f6", paddingTop: 22 }}>
              <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: "#14141f", margin: "0 0 12px" }}>
                {isService ? "About this Service" : "Description"}
              </h2>
              <p style={{ fontSize: 14, color: "#6b6b7e", lineHeight: 1.75, margin: 0 }}>
                {item.description || `Good condition ${item.category?.toLowerCase() || "item"} available. Contact the seller for more details.`}
              </p>
            </div>
          </div>

          {/* ── Seller reviews ── */}
          {ratingReviews.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", padding: "24px 28px", boxShadow: "0 4px 20px rgba(14,0,40,0.07)" }}>
              <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: "#14141f", margin: "0 0 18px" }}>
                {isService ? "Client Reviews" : "Seller Reviews"} ({ratingStats.count})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {ratingReviews.slice(0, 4).map(rev => (
                  <div key={rev.id} style={{ padding: "14px 16px", background: config.softBg, borderRadius: 14, border: `1px solid ${config.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                      {rev.raterPhotoURL
                        ? <img src={rev.raterPhotoURL} alt={rev.raterName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: config.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, fontFamily: "'Syne', system-ui, sans-serif" }}>{rev.raterName?.[0]?.toUpperCase() || "?"}</div>
                      }
                    </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#14141f", margin: 0 }}>{rev.raterName}</p>
                        <p style={{ fontSize: 11, color: "#9898a8", margin: 0 }}>{rev.raterCollege}</p>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <StarRating value={rev.rating} />
                      </div>
                    </div>
                    {rev.review && <p style={{ fontSize: 13, color: "#6b6b7e", margin: 0, lineHeight: 1.55 }}>{rev.review}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════════ RIGHT SIDEBAR ════════ */}
        <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Price / action card ── */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", padding: "24px", boxShadow: "0 8px 32px rgba(14,0,40,0.10)" }}>

            {/* Price */}
            {!isService ? (
              <>
                <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 38, fontWeight: 800, color: "#14141f", marginBottom: 4 }}>
                  ₹{Number(item.price).toLocaleString()}
                </div>
                {disc > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 15, color: "#9898a8", textDecoration: "line-through" }}>₹{Number(item.originalPrice).toLocaleString()}</span>
                    <span style={{ background: "linear-gradient(135deg,#fef9e7,#fde68a)", color: "#92400e", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 7, boxShadow: "0 2px 6px rgba(251,191,36,0.30)" }}>{disc}% off</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#9898a8", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {item.pricingType === "Hourly" ? "Starting from (per hour)" : item.pricingType === "Per Project" ? "Per project" : "Service price"}
                </p>
                <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 38, fontWeight: 800, color: "#14141f" }}>
                  ₹{Number(item.price).toLocaleString()}
                </div>
                {item.availability && (
                  <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", color: "#065f46", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    {item.availability}
                  </div>
                )}
              </div>
            )}

            <ActionButtons
              config={config}
              item={item}
              isOwnListing={isOwnListing}
              saved={saved}
              toggleWishlist={toggleWishlist}
              openConversation={openConversation}
              canRate={canRate}
              ratingDone={ratingDone}
              setShowRatingModal={setShowRatingModal}
              sessionToken={sessionToken}
              status={status}
              onStatusChange={handleStatusChange}
              statusUpdating={statusUpdating}
              statusError={statusError}
            />
          </div>

          {/* ── Seller / provider card ── */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", padding: "22px 24px", boxShadow: "0 4px 16px rgba(14,0,40,0.07)" }}>
            <p style={{ fontSize: 12, color: "#9898a8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              {isService ? "Provider info" : "Seller info"}
            </p>
            <div
              style={{ display: "flex", alignItems: "center", gap: 14, cursor: item.ownerId && navigateToProfile ? "pointer" : "default", borderRadius: 12, padding: "6px", margin: "-6px", transition: "background 160ms ease" }}
              onClick={() => item.ownerId && navigateToProfile && navigateToProfile(item.ownerId)}
              onMouseEnter={e => { if (item.ownerId && navigateToProfile) e.currentTarget.style.background = config.softBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <SellerAvatar name={item.seller} photoURL={item.ownerPhotoURL} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 15, color: config.color, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}>
                  {item.seller || "Seller"}
                  {item.ownerId && navigateToProfile && <span style={{ fontSize: 11, color: "#9898a8", fontWeight: 500 }}>View profile →</span>}
                </p>
                <p style={{ fontSize: 12, color: "#9898a8", margin: "0 0 2px" }}>Joined {formatJoinDate(item.ownerCreatedAt)}</p>
                <p style={{ fontSize: 12, color: "#9898a8", margin: 0 }}>📍 {item.ownerCollege || item.college}</p>
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #f2f2f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: config.softBg, borderRadius: 12, padding: "12px", textAlign: "center", border: `1px solid ${config.border}` }}>
                <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: "#14141f", margin: 0 }}>
                  {sellerListingsCount !== null ? sellerListingsCount : "—"}
                </p>
                <p style={{ fontSize: 11, color: "#9898a8", margin: 0, fontWeight: 500 }}>{isService ? "Services" : "Listings"}</p>
              </div>
              <div style={{ background: config.softBg, borderRadius: 12, padding: "12px", textAlign: "center", border: `1px solid ${config.border}` }}>
                <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: "#14141f", margin: 0 }}>
                  {ratingStats.count > 0 ? <span style={{ color: "#fbbf24" }}>★ {ratingStats.avg}</span> : "—"}
                </p>
                <p style={{ fontSize: 11, color: "#9898a8", margin: 0, fontWeight: 500 }}>
                  {ratingStats.count > 0 ? `${ratingStats.count} review${ratingStats.count !== 1 ? "s" : ""}` : "No reviews yet"}
                </p>
              </div>
            </div>

            {item.ownerId && navigateToProfile && (
              <button
                style={{ width: "100%", marginTop: 14, padding: "10px", background: config.lightBg, color: config.color, border: `1.5px solid ${config.border}`, borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 160ms ease" }}
                onClick={() => navigateToProfile(item.ownerId)}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              >
                View Full Profile →
              </button>
            )}
          </div>

          {/* ── Safety tip ── */}
          <div style={{ background: "linear-gradient(135deg, #fef9e7, #fde68a20)", borderRadius: 16, border: "1px solid #fcd34d", padding: "16px 18px", boxShadow: "0 2px 12px rgba(251,191,36,0.15)" }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e", margin: "0 0 6px" }}>🛡️ Safety tip</p>
            <p style={{ fontSize: 12, color: "#78350f", margin: 0, lineHeight: 1.65 }}>
              {isService
                ? "Always review the portfolio before placing an order. Agree on deliverables and timelines upfront."
                : "Always meet in a safe, public place on campus. Never transfer money in advance."}
            </p>
          </div>
        </div>
      </div>

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="listing"
        targetId={item.id}
        targetLabel={item.title}
        sessionToken={sessionToken}
        onSubmitted={() => setShowReportToast(true)}
      />
      <Toast show={showReportToast} message="Report submitted successfully." onDone={() => setShowReportToast(false)} />
    </div>
  );
}
