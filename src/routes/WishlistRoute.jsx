import { useState } from "react";
import { ProductCard } from "./HomeRoute";

export default function WishlistRoute({ discount, openItem, toggleWishlist, wishlistItems }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  if (wishlistItems.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", padding: "60px 32px", textAlign: "center",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: "linear-gradient(135deg, #f3ecfe, #ece0fd)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, marginBottom: 24,
          boxShadow: "0 8px 32px rgba(92,34,212,0.15)",
        }}>
          🔖
        </div>
        <h2 style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: 24, fontWeight: 800, color: "#14141f",
          marginBottom: 10, letterSpacing: "-0.3px",
        }}>
          Nothing saved yet
        </h2>
        <p style={{ fontSize: 15, color: "#9898a8", lineHeight: 1.7, maxWidth: 320, margin: 0 }}>
          Tap the ♥ on any listing to save it here for later. Your wishlist syncs across sessions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 60, background: "#f9f9fb", minHeight: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 100%)",
        padding: "36px 32px 44px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(252,211,77,0.06)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px", margin: "0 0 6px" }}>
            Saved items
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", margin: 0 }}>
            {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""} in your wishlist
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {wishlistItems.map((item, idx) => (
            <ProductCard
              key={item.id} item={item} discount={discount}
              isWished={true} onToggleWishlist={toggleWishlist}
              onClick={() => openItem(item.id)}
              hovered={hoveredCard === item.id}
              onHover={() => setHoveredCard(item.id)}
              onLeave={() => setHoveredCard(null)}
              animDelay={idx * 40}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
