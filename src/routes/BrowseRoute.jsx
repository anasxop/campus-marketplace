import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProductCard } from "./HomeRoute";
import { ALL_UNIVERSITIES } from "../components/UniversityDropdown";
import { CATEGORY_TREE } from "../data/marketplace";
import { STATUS_CONFIG, LISTING_STATUSES } from "../lib/listingStatus";

// Emoji map for top-level and subcategories
const CATEGORY_EMOJIS = {
  All: "🛍️",
  Academic: "📚", Services: "💼", Furniture: "🪑", Electronics: "💻", "Lifestyle & Essentials": "👕",
  // Academic
  Books: "📖", Notes: "📝", Assignments: "📋", "Previous Year Papers": "🗂️",
  "Study Material": "📚", Courses: "🎓", "Project Files": "💾", "Other Academic Resources": "📌",
  // Services
  "Graphic Design": "🎨", "Video Editing": "🎬", Programming: "💻", "Web Development": "🌐",
  "App Development": "📱", Tutoring: "🧑‍🏫", Freelancing: "🤝", "Content Writing": "✍️", "Other Services": "🛠️",
  // Furniture
  Chairs: "🪑", Tables: "🪵", Beds: "🛏️", Sofas: "🛋️", Cupboards: "🗄️",
  Shelves: "📚", "Study Furniture": "📐", "Other Furniture": "📦",
  // Electronics
  Phones: "📱", "Computers & Laptops": "💻", "Audio Devices": "🎧", Gaming: "🎮",
  "Home Appliances": "🏠", Accessories: "🔌", "Other Electronics": "📦",
  // Lifestyle
  Fashion: "👕", Sports: "⚽", "Room Essentials": "🖼️", "Kitchen Essentials": "🍳", Miscellaneous: "📦",
};

// ── CollegeFilterDropdown (portal-based, unchanged) ──────────────────────────
function CollegeFilterDropdown({ value, onChange }) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [focused, setFocused] = useState(false);
  const [rect, setRect]       = useState(null);
  const triggerRef = useRef(null);
  const portalRef  = useRef(null);
  const allOptions = ["All Campuses", ...ALL_UNIVERSITIES];
  const filtered   = allOptions.filter(n => query.trim() === "" || n.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const update = () => { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open]);

  useEffect(() => { setQuery(""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !portalRef.current?.contains(e.target)) {
        setOpen(false); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); setOpen(true); };
  const handleSelect = (name) => { onChange(name); setQuery(""); setOpen(false); };
  const placeholder = value === "All Campuses" ? "🌐 All Campuses" : `🎓 ${value}`;

  const dropdownPortal = open && rect && createPortal(
    <div ref={portalRef} style={{ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width, background: "#fff", borderRadius: 14, border: "1.5px solid #e0d0fd", boxShadow: "0 16px 48px rgba(92,34,212,0.22)", zIndex: 99999, maxHeight: 280, overflowY: "auto", overflowX: "hidden" }}>
      {filtered.length === 0
        ? <div style={{ padding: "16px 14px", textAlign: "center", fontSize: 13, color: "#9898a8" }}>No campuses found</div>
        : filtered.map(name => {
          const isSel = value === name;
          return (
            <button key={name}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 14px", background: isSel ? "#f3ecfe" : "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: isSel ? 700 : 500, color: isSel ? "#5c22d4" : "#14141f", fontFamily: "'DM Sans', system-ui, sans-serif", borderLeft: isSel ? "3px solid #5c22d4" : "3px solid transparent", transition: "background 100ms ease", boxSizing: "border-box" }}
              onMouseDown={e => { e.preventDefault(); handleSelect(name); }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#faf7ff"; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ flexShrink: 0 }}>{name === "All Campuses" ? "🌐" : "🎓"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </button>
          );
        })
      }
    </div>,
    document.body
  );

  return (
    <>
      <div ref={triggerRef} style={{ position: "relative", minWidth: 220 }}>
        <input type="text"
          style={{ width: "100%", padding: "12px 36px 12px 14px", background: "rgba(255,255,255,0.97)", color: "#14141f", fontSize: 14, border: focused ? "1.5px solid #5c22d4" : "1.5px solid transparent", borderRadius: 12, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box", boxShadow: focused ? "0 0 0 3px rgba(92,34,212,0.20)" : "0 4px 16px rgba(14,0,40,0.16)", transition: "border-color 180ms ease, box-shadow 180ms ease", cursor: "text" }}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!open) handleOpen(); }}
          onFocus={() => { setFocused(true); handleOpen(); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`, transition: "transform 200ms ease", pointerEvents: "none", opacity: 0.5 }}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="#9898a8" strokeWidth="1.5"><path d="M1 1l5 5 5-5" strokeLinecap="round" /></svg>
        </div>
      </div>
      {dropdownPortal}
    </>
  );
}

// ── Main BrowseRoute ──────────────────────────────────────────────────────────
export default function BrowseRoute({
  catFilter, collegeFilter, discount, filtered, openItem,
  search, setCatFilter, setCollegeFilter, setSearch, styles: s,
  toggleWishlist, wishlist, categories, statusFilter, setStatusFilter,
}) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCat,  setHoveredCat]  = useState(null);
  const [activeCat,   setActiveCat]   = useState(null); // persistently shown top cat
  const catBarRef = useRef(null);

  const topCatKeys = Object.keys(CATEGORY_TREE);

  // On mount: if arriving with a pre-set filter, auto-open that cat's subcategories
  useEffect(() => {
    if (catFilter && catFilter !== "All") {
      if (CATEGORY_TREE[catFilter]) {
        setActiveCat(catFilter);
      } else {
        const parent = topCatKeys.find(k => CATEGORY_TREE[k].subcategories.includes(catFilter));
        if (parent) setActiveCat(parent);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle clicking a top-level category pill
  const handleTopCatClick = (cat) => {
    if (cat === "All") {
      setCatFilter("All");
      setActiveCat(null);
      return;
    }
    // Clicking a top cat always shows its subs — never collapses on re-click
    setCatFilter(cat);
    setActiveCat(cat);
  };

  // Handle clicking a subcategory pill — keep the bar visible
  const handleSubCatClick = (sub) => {
    setCatFilter(sub);
    // activeCat stays the same so the bar remains visible
  };

  const activeSubs = activeCat ? (CATEGORY_TREE[activeCat]?.subcategories ?? []) : [];

  return (
    <div style={{ paddingBottom: 72, minHeight: "calc(100vh - 64px)", background: "#f9f9fb" }}>

      {/* ── Page header ── */}
      <div style={{ background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 100%)", padding: "36px 32px 44px", position: "relative" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: "40%", width: 160, height: 160, borderRadius: "50%", background: "rgba(252,211,77,0.07)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box", position: "relative" }}>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px", margin: "0 0 6px" }}>Browse listings</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", margin: "0 0 24px" }}>Find textbooks, electronics, furniture and more from students near you.</p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, position: "relative", minWidth: 240 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#9898a8", pointerEvents: "none" }}>🔍</span>
              <input
                style={{ width: "100%", padding: "12px 14px 12px 42px", background: "rgba(255,255,255,0.97)", color: "#14141f", fontSize: 14, border: "1.5px solid transparent", borderRadius: 12, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box", boxShadow: "0 4px 16px rgba(14,0,40,0.16)", transition: "border-color 180ms ease, box-shadow 180ms ease" }}
                placeholder="Search items, textbooks, gadgets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => { e.target.style.borderColor = "#5c22d4"; e.target.style.boxShadow = "0 0 0 3px rgba(92,34,212,0.20)"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.boxShadow = "0 4px 16px rgba(14,0,40,0.16)"; }}
              />
            </div>
            <CollegeFilterDropdown value={collegeFilter} onChange={setCollegeFilter} />
          </div>
        </div>
      </div>

      {/* ── Category bar ── */}
      <div ref={catBarRef} style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid #e5e5ec", boxShadow: "0 4px 16px rgba(14,0,40,0.05)", position: "sticky", top: 64, zIndex: 90 }}>

        {/* Top-level pills row */}
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 8, padding: "12px 32px 12px", overflowX: "auto", scrollbarWidth: "none", alignItems: "center" }}>
          {["All", ...topCatKeys].map(cat => {
            const isTopActive = catFilter === cat || activeCat === cat;
            const isSubActive = catFilter !== cat && CATEGORY_TREE[cat]?.subcategories?.includes(catFilter);
            const active = isTopActive || isSubActive;
            const hov = hoveredCat === cat;
            const emoji = CATEGORY_EMOJIS[cat] || "•";
            return (
              <button key={cat}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 16px", borderRadius: 10,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer",
                  border: `1.5px solid ${active ? "#5c22d4" : "#e5e5ec"}`,
                  background: active ? "linear-gradient(135deg, #5c22d4, #7c3aed)" : hov ? "#f3ecfe" : "#f9f9fb",
                  color: active ? "#fff" : hov ? "#5c22d4" : "#6b6b7e",
                  transition: "all 160ms ease",
                  boxShadow: active ? "0 4px 16px rgba(92,34,212,0.28)" : hov ? "0 2px 8px rgba(92,34,212,0.08)" : "none",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transform: hov && !active ? "translateY(-1px)" : "none",
                }}
                onClick={() => handleTopCatClick(cat)}
                onMouseEnter={() => setHoveredCat(cat)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                {emoji} {cat}
              </button>
            );
          })}
        </div>

        {/* Persistent subcategory row — stays visible after subcategory selection */}
        {activeCat && activeSubs.length > 0 && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 12px", borderTop: "1px solid #f0f0f6" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 10 }}>
              {activeSubs.map(sub => {
                const active = catFilter === sub;
                const hov = hoveredCat === sub;
                return (
                  <button key={sub}
                    style={{
                      padding: "5px 13px", borderRadius: 8,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer",
                      border: `1.5px solid ${active ? "#5c22d4" : "#e5e5ec"}`,
                      background: active ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : hov ? "#f3ecfe" : "#f9f9fb",
                      color: active ? "#fff" : hov ? "#5c22d4" : "#6b6b7e",
                      transition: "all 140ms ease", whiteSpace: "nowrap",
                    }}
                    onClick={() => handleSubCatClick(sub)}
                    onMouseEnter={() => setHoveredCat(sub)}
                    onMouseLeave={() => setHoveredCat(null)}
                  >
                    {CATEGORY_EMOJIS[sub] || "•"} {sub}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px 6px", boxSizing: "border-box" }}>
        <p style={{ fontSize: 13, color: "#9898a8", margin: 0 }}>
          <strong style={{ color: "#14141f" }}>{filtered.length}</strong> listing{filtered.length !== 1 ? "s" : ""} found
          {catFilter !== "All" && <> in <strong style={{ color: "#5c22d4" }}>{catFilter}</strong></>}
          {search && <> for &ldquo;<strong style={{ color: "#5c22d4" }}>{search}</strong>&rdquo;</>}
          {collegeFilter !== "All Campuses" && <> · <strong style={{ color: "#14141f" }}>{collegeFilter}</strong></>}
          {statusFilter !== "All" && <> · <strong style={{ color: "#14141f" }}>{STATUS_CONFIG[statusFilter]?.label}</strong></>}
        </p>
      </div>

      {/* ── Status filter pills ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 6px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["All", ...LISTING_STATUSES].map(opt => {
            const active = statusFilter === opt;
            const cfg = STATUS_CONFIG[opt];
            return (
              <button
                key={opt}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 999,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer",
                  border: `1.5px solid ${active ? "#5c22d4" : "#e5e5ec"}`,
                  background: active ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : "#f9f9fb",
                  color: active ? "#fff" : "#6b6b7e",
                  transition: "all 140ms ease", whiteSpace: "nowrap",
                }}
                onClick={() => setStatusFilter(opt)}
              >
                {cfg ? <>{cfg.emoji} {cfg.label}</> : "All Status"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 32px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", fontSize: 20, margin: "0 0 10px" }}>No listings found</p>
          <p style={{ color: "#9898a8", fontSize: 14, margin: "0 0 24px" }}>Try adjusting your filters or search terms.</p>
          <button
            style={{ background: "#5c22d4", color: "#fff", border: "none", borderRadius: 12, padding: "11px 24px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            onClick={() => { setSearch(""); setCatFilter("All"); setCollegeFilter("All Campuses"); setActiveCat(null); }}
          >Clear all filters</button>
        </div>
      ) : (
        <div className="browse-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20, padding: "16px 32px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
          {filtered.map((item, idx) => (
            <ProductCard
              key={item.id} item={item} discount={discount}
              isWished={wishlist.includes(item.id)} onToggleWishlist={toggleWishlist}
              onClick={() => openItem(item.id)}
              hovered={hoveredCard === item.id}
              onHover={() => setHoveredCard(item.id)}
              onLeave={() => setHoveredCard(null)}
              animDelay={Math.min(idx * 25, 300)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
