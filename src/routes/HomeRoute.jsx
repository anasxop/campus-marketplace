import { useState } from "react";
import { IconHeart } from "../App";
import { CATEGORY_TREE } from "../data/marketplace";
import StatusBadge from "../components/StatusBadge";
import { normalizeStatus } from "../lib/listingStatus";

const getImageSrc = (image) => {
  if (typeof image !== "string" || !image.trim()) return "/favicon.svg";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/") || image.startsWith("data:image/")) return image;
  return "/favicon.svg";
};

// Main 4 categories — highlighted on homepage
const MAIN_CAT_KEYS = ["Academic", "Services", "Furniture", "Electronics"];
const CATEGORY_META = {
  Academic:  { shimmer: "rgba(200,160,255,0.15)", accent: "rgba(168,85,247,0.2)" },
  Services:  { shimmer: "rgba(255,200,130,0.15)", accent: "rgba(239,68,68,0.2)"  },
  Furniture: { shimmer: "rgba(167,243,208,0.15)", accent: "rgba(52,211,153,0.2)" },
  Electronics: { shimmer: "rgba(147,197,253,0.15)", accent: "rgba(99,102,241,0.2)" },
};
const CATEGORIES = MAIN_CAT_KEYS.map(key => ({
  label: key,
  emoji: CATEGORY_TREE[key].emoji,
  cat: key,
  count_cat: [key, ...(CATEGORY_TREE[key].subcategories || [])],
  gradient: CATEGORY_TREE[key].gradient,
  glowColor: CATEGORY_TREE[key].glowColor,
  shimmer: CATEGORY_META[key]?.shimmer || "rgba(200,160,255,0.15)",
  accent: CATEGORY_META[key]?.accent || "rgba(168,85,247,0.2)",
  desc: CATEGORY_TREE[key].desc,
}));

const FEATURES = [
  { icon: "⚡", title: "Instant Listing", desc: "Post your item in under 2 minutes. No fees, no waiting." },
  { icon: "🎓", title: "Students Only", desc: "Verified college community. Buy with confidence." },
  { icon: "💬", title: "In-App Chat", desc: "Negotiate and connect directly — no middlemen." },
  { icon: "🔒", title: "Safe Deals", desc: "Meet on campus. Exchange in person. Stay safe." },
];

export function ProductCard({ item, discount, isWished, onToggleWishlist, onClick, hovered, onHover, onLeave, animDelay = 0 }) {
  const disc = discount(item.originalPrice, item.price);
  const status = normalizeStatus(item.status);
  const isSold = status === "sold";
  return (
    <div
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.6)", overflow: "hidden", position: "relative", cursor: "pointer", display: "flex", flexDirection: "column", transition: "transform 240ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 240ms ease", transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)", boxShadow: hovered ? "0 24px 60px rgba(92,34,212,0.20), 0 8px 24px rgba(14,0,40,0.10), inset 0 1px 0 rgba(255,255,255,0.8)" : "0 2px 16px rgba(14,0,40,0.08), inset 0 1px 0 rgba(255,255,255,0.6)", animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms both` }}
      onClick={onClick} onMouseEnter={onHover} onMouseLeave={onLeave}
    >
      <button style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 10, background: isWished ? "rgba(254,226,226,0.95)" : "rgba(255,255,255,0.90)", border: `1.5px solid ${isWished ? "#fca5a5" : "rgba(0,0,0,0.09)"}`, color: isWished ? "#ef4444" : "#9898a8", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2, boxShadow: "0 2px 8px rgba(14,0,40,0.12)", transition: "all 180ms ease", padding: 0, backdropFilter: "blur(12px)" }} onClick={e => { e.stopPropagation(); onToggleWishlist(item.id); }}>
        <IconHeart filled={isWished} />
      </button>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
        <StatusBadge status={status} size="sm" />
        {disc > 0 && <div style={{ background: "linear-gradient(135deg, #fcd34d, #fbbf24)", color: "#78350f", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7, letterSpacing: "0.02em", boxShadow: "0 2px 8px rgba(251,191,36,0.40)" }}>{disc}% OFF</div>}
      </div>
      <div style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #f2f2f6, #ece0fd20)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <img src={getImageSrc(item.image)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 380ms ease, filter 240ms ease", transform: hovered ? "scale(1.09)" : "scale(1)", filter: isSold ? "grayscale(0.55) brightness(0.92)" : "none" }} loading="lazy" />
        {isSold && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,0,40,0.10)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ background: "rgba(20,20,31,0.78)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "5px 16px", borderRadius: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Sold</span>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 5, opacity: isSold ? 0.7 : 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#14141f", lineHeight: 1.35, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 18, fontWeight: 800, color: "#14141f" }}>₹{item.price.toLocaleString()}</span>
          {disc > 0 && <span style={{ fontSize: 12, color: "#9898a8", textDecoration: "line-through" }}>₹{item.originalPrice.toLocaleString()}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2, gap: 6 }}>
          <p style={{ fontSize: 12, color: "#9898a8", fontWeight: 500, margin: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {item.college}</p>
          {item.seller && <p style={{ fontSize: 11, color: "#b0b0c0", margin: 0, fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap" }}>by {item.seller}</p>}
        </div>
      </div>
    </div>
  );
}

export default function HomeRoute({ discount, listings, navigateTo, openItem, styles: s, toggleWishlist, wishlist, stats, browseByCategory, selectedCampus }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [hoveredFeat, setHoveredFeat] = useState(null);

  const realAvgDiscount = stats?.avgDiscount || 0;
  const realTotal = stats?.totalItems || listings.length;
  const realColleges = stats?.totalColleges || 1;

  const filteredListings = selectedCampus && selectedCampus !== "All Campuses"
    ? listings.filter(l => l.college === selectedCampus)
    : listings;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Hero */}
      <div className="home-hero" style={{ ...s.heroBox, position: "relative", overflow: "hidden", padding: "80px 32px 100px", background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 70%, #7c3aed 100%)" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,211,77,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
          <span style={{ display: "inline-block", background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.35)", color: "#fde68a", fontSize: 12, fontWeight: 700, padding: "5px 18px", borderRadius: 999, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 24, backdropFilter: "blur(8px)" }}>🎓 Campus-to-Campus Resale Platform</span>
          <h1 className="home-hero-title" style={{ ...s.heroTitle, marginBottom: 20, fontSize: 46, lineHeight: 1.15 }}>Buy & sell student<br /><span style={{ color: "#fcd34d", textShadow: "0 0 40px rgba(252,211,77,0.4)" }}>essentials</span> — easily.</h1>
          <p style={{ ...s.heroSub, fontSize: 17, marginBottom: 44, maxWidth: 500, margin: "0 auto 44px" }}>Moving out? Don't leave your stuff behind.<br />Sell it to the next student in minutes.</p>
          <div className="home-hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={s.heroCta} onClick={() => navigateTo("/browse")} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(251,191,36,0.60)"; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(251,191,36,0.35)"; }}>Browse listings →</button>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.28)", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 15, padding: "14px 30px", borderRadius: 12, cursor: "pointer", transition: "all 200ms ease", backdropFilter: "blur(12px)" }} onClick={() => navigateTo("/sell")} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.transform = ""; }}>+ List an item</button>
          </div>
          <div className="home-hero-stats" style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[["🛍️", realTotal > 0 ? `${realTotal}` : "0", "Items Listed"], ["💸", realAvgDiscount > 0 ? `${realAvgDiscount}%` : "—", "Avg. Discount"], ["🏫", realColleges > 0 ? `${realColleges}` : "—", "Campuses"], ["⚡", "Live", "Real-time Chat"]].map(([icon, val, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{icon} {val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 5, fontWeight: 500 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories - main 4 highlighted */}
      <div className="home-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 0", boxSizing: "border-box" }}>
        <div className="home-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 23, fontWeight: 800, color: "#14141f", letterSpacing: "-0.3px", margin: 0 }}>Browse by category</h2>
            <p style={{ fontSize: 14, color: "#9898a8", margin: "5px 0 0" }}>Jump straight into what you need</p>
          </div>
          <button style={{ fontSize: 13, fontWeight: 600, color: "#5c22d4", background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", border: "1.5px solid #e0d0fd", cursor: "pointer", padding: "8px 16px", borderRadius: 10, transition: "all 180ms ease", fontFamily: "'DM Sans', system-ui, sans-serif" }} onClick={() => navigateTo("/browse")} onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#ece0fd,#ddd0fb)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#f3ecfe,#ece0fd)"; e.currentTarget.style.transform = ""; }}>View All Categories →</button>
        </div>
        <div className="home-category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {CATEGORIES.map((cat, i) => {
            const count = listings.filter(l => cat.count_cat.some(c => l.category?.toLowerCase() === c.toLowerCase())).length;
            const isHov = hoveredCat === i;
            return (
              <div key={cat.label} style={{ background: cat.gradient, borderRadius: 24, padding: "28px 24px 24px", cursor: "pointer", position: "relative", overflow: "hidden", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "transform 260ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 260ms ease", transform: isHov ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)", boxShadow: isHov ? `0 32px 80px ${cat.glowColor}, 0 8px 32px rgba(14,0,40,0.18), inset 0 1px 0 rgba(255,255,255,0.25)` : `0 8px 32px ${cat.glowColor.replace("0.45","0.25")}, inset 0 1px 0 rgba(255,255,255,0.20)`, animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` }} onClick={() => browseByCategory(cat.cat)} onMouseEnter={() => setHoveredCat(i)} onMouseLeave={() => setHoveredCat(null)}>
                {/* Apple glass shine */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)", borderRadius: "24px 24px 60% 60%", pointerEvents: "none", zIndex: 1 }} />
                <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${cat.shimmer} 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${cat.accent} 0%, transparent 65%)`, pointerEvents: "none", zIndex: 0 }} />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", borderRadius: 24 }} />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ fontSize: 36, lineHeight: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", transition: "transform 260ms ease", transform: isHov ? "scale(1.15) rotate(-5deg)" : "scale(1) rotate(0)", display: "inline-block" }}>{cat.emoji}</div>
                </div>
                <div style={{ position: "relative", zIndex: 2 }}>
                  <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.3px", textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>{cat.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: "0 0 12px", fontWeight: 500 }}>{cat.desc}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.02em", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>{count} listing{count !== 1 ? "s" : ""} →</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Recent Listings filtered by campus */}
      <div className="home-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 0", boxSizing: "border-box" }}>
        <div className="home-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 23, fontWeight: 800, color: "#14141f", letterSpacing: "-0.3px", margin: 0 }}>
              Recent listings
              {selectedCampus && selectedCampus !== "All Campuses" && (
                <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: "#5c22d4", background: "linear-gradient(135deg, #f3ecfe, #ece0fd)", padding: "3px 12px", borderRadius: 999, border: "1px solid #e0d0fd", verticalAlign: "middle" }}>📍 {selectedCampus}</span>
              )}
            </h2>
            <p style={{ fontSize: 14, color: "#9898a8", margin: "5px 0 0" }}>{selectedCampus && selectedCampus !== "All Campuses" ? `Showing items from ${selectedCampus}` : "Fresh items from students near you"}</p>
          </div>
          <button style={{ fontSize: 13, fontWeight: 600, color: "#5c22d4", background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", border: "1.5px solid #e0d0fd", cursor: "pointer", padding: "8px 16px", borderRadius: 10, transition: "all 180ms ease", fontFamily: "'DM Sans', system-ui, sans-serif" }} onClick={() => navigateTo("/browse")} onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#ece0fd,#ddd0fb)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#f3ecfe,#ece0fd)"; e.currentTarget.style.transform = ""; }}>View All Listings →</button>
        </div>
        {filteredListings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 32px", background: "linear-gradient(135deg, #faf7ff, #f3ecfe)", borderRadius: 24, border: "1.5px dashed #e0d0fd" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{selectedCampus && selectedCampus !== "All Campuses" ? "🏫" : "📭"}</div>
            <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", fontSize: 18, marginBottom: 8 }}>{selectedCampus && selectedCampus !== "All Campuses" ? `No listings from ${selectedCampus} yet` : "No listings yet"}</p>
            <p style={{ color: "#9898a8", fontSize: 14, marginBottom: 24 }}>{selectedCampus && selectedCampus !== "All Campuses" ? "Be the first to sell something from your campus!" : "Be the first to sell something on Campus Marketplace!"}</p>
            <button style={{ background: "#5c22d4", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 24px rgba(92,34,212,0.28)" }} onClick={() => navigateTo("/sell")}>+ Post your first listing</button>
          </div>
        ) : (
          <div className="home-listing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {filteredListings.slice(0, 8).map((item, idx) => (
              <ProductCard key={item.id} item={item} discount={discount} isWished={wishlist.includes(item.id)} onToggleWishlist={toggleWishlist} onClick={() => openItem(item.id)} hovered={hoveredCard === item.id} onHover={() => setHoveredCard(item.id)} onLeave={() => setHoveredCard(null)} animDelay={idx * 50} />
            ))}
          </div>
        )}
      </div>

      {/* Why section */}
      <div className="home-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 0", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 27, fontWeight: 800, color: "#14141f", margin: "0 0 10px", letterSpacing: "-0.4px" }}>Why Campus Marketplace?</h2>
          <p style={{ fontSize: 15, color: "#9898a8", maxWidth: 460, margin: "0 auto" }}>Built by students, for students. Everything you need for campus-focused resale.</p>
        </div>
        <div className="home-feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{ background: hoveredFeat === i ? "rgba(243,236,254,0.95)" : "rgba(255,255,255,0.80)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 20, border: hoveredFeat === i ? "1px solid #e0d0fd" : "1px solid rgba(229,229,236,0.70)", padding: "30px 26px", transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease, background 220ms ease", transform: hoveredFeat === i ? "translateY(-5px)" : "translateY(0)", boxShadow: hoveredFeat === i ? "0 20px 48px rgba(92,34,212,0.14), inset 0 1px 0 rgba(255,255,255,0.8)" : "0 2px 12px rgba(14,0,40,0.06), inset 0 1px 0 rgba(255,255,255,0.6)" }} onMouseEnter={() => setHoveredFeat(i)} onMouseLeave={() => setHoveredFeat(null)}>
              <div style={{ fontSize: 34, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#14141f", margin: "0 0 10px" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#9898a8", margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 1200, margin: "56px auto 0", padding: "0 32px", boxSizing: "border-box" }}>
        <div className="home-cta-box" style={{ background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 70%, #7c3aed 100%)", borderRadius: 24, padding: "52px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, borderRadius: "50%", background: "rgba(252,211,77,0.07)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>Got something to sell?</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.70)", margin: 0 }}>List your item in 2 minutes. Reach students across campuses.</p>
          </div>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fcd34d", color: "#14141f", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, padding: "14px 30px", borderRadius: 12, border: "none", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 24px rgba(252,211,77,0.45)", transition: "all 180ms ease", position: "relative", zIndex: 1 }} onClick={() => navigateTo("/sell")} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(252,211,77,0.55)"; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(252,211,77,0.45)"; }}>Start selling now →</button>
        </div>
      </div>

      {/* Credits */}
      <div style={{ maxWidth: 1200, margin: "48px auto 0", padding: "0 32px 80px", boxSizing: "border-box" }}>
        <div className="home-credits-box" style={{ background: "rgba(250,247,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 20, border: "1.5px solid #e0d0fd", padding: "28px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, boxShadow: "0 4px 20px rgba(92,34,212,0.08), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9898a8", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>Made with ❤️ by</p>
            <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 18, fontWeight: 800, color: "#14141f", margin: 0 }}>Anas, Kaif &amp; Sakshi</p>
            <p style={{ fontSize: 13, color: "#9898a8", margin: "4px 0 0" }}>Campus Marketplace — Galgotias University</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["A","K","S"].map((initial, i) => { const colors = ["#5c22d4","#0ea5e9","#059669"]; return <div key={initial} style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${colors[i]}, ${colors[i]}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#fff", fontSize: 16, boxShadow: `0 4px 16px ${colors[i]}44` }}>{initial}</div>; })}
          </div>
        </div>
      </div>
    </div>
  );
}
