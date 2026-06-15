import { useState, useEffect } from "react";
import { CATEGORY_TREE, CATEGORY_FIELDS, getFieldsForCategory, getTopCategory, MAIN_CATEGORIES } from "../data/marketplace";

// ── Category-aware copy ────────────────────────────────────────────────────────
const CATEGORY_COPY = {
  Academic: {
    badge:          "List in 2 minutes",
    pageTitle:      "List Academic Resource",
    pageSubtitle:   "Share your study materials with students on your campus.",
    itemLabel:      "Resource name",
    itemPlaceholder:"e.g. Data Structures Notes, OS Book, ML Course Material",
    descHint:       "Students are more likely to contact you when subject and semester are clearly mentioned.",
    descPlaceholder:"Include subject, semester, university, condition, and resource details.",
    imageTip:       "📚 Upload clear images of books, notes, or study materials.",
    submitBtn:      "Publish Resource",
  },
  Services: {
    badge:          "Offer a service",
    pageTitle:      "Offer a Service",
    pageSubtitle:   "Reach students who need your skills right now.",
    itemLabel:      "Service title",
    itemPlaceholder:"e.g. Logo Design Service, Website Development, Mathematics Tutoring",
    descHint:       "Listings with portfolio samples receive more inquiries.",
    descPlaceholder:"Describe your skills, experience, deliverables, and turnaround time.",
    imageTip:       "🎨 Upload portfolio samples, project screenshots, certificates, or previous work.",
    submitBtn:      "Publish Service",
  },
  Furniture: {
    badge:          "List in 2 minutes",
    pageTitle:      "List Furniture",
    pageSubtitle:   "Help fellow students furnish their rooms affordably.",
    itemLabel:      "Item name",
    itemPlaceholder:"e.g. Wooden Study Table, Office Chair, Storage Cabinet",
    descHint:       "Include dimensions and condition for better visibility.",
    descPlaceholder:"Mention dimensions, material, condition, and pickup information.",
    imageTip:       "🪑 Upload multiple angles and condition photos.",
    submitBtn:      "Publish Furniture Listing",
  },
  Electronics: {
    badge:          "List in 2 minutes",
    pageTitle:      "List Electronic Item",
    pageSubtitle:   "Sell phones, laptops, appliances and more to students near you.",
    itemLabel:      "Item name",
    itemPlaceholder:"e.g. HP Printer, Samsung Refrigerator, Dell Monitor, Sony Speaker",
    descHint:       "Include important specifications in the description.",
    descPlaceholder:"Mention specifications, accessories, warranty, and condition.",
    imageTip:       "💻 Upload device photos, accessories, and any visible defects.",
    submitBtn:      "Publish Electronic Listing",
  },
  "Lifestyle & Essentials": {
    badge:          "List in 2 minutes",
    pageTitle:      "Create Listing",
    pageSubtitle:   "List your item and connect with buyers on campus.",
    itemLabel:      "Item name",
    itemPlaceholder:"e.g. Cricket Bat, Bluetooth Speaker, Dumbbell Set",
    descHint:       "Describe the item's condition, usage, and any relevant details.",
    descPlaceholder:"e.g. Used for 6 months, good condition, no damage...",
    imageTip:       "📸 Upload clear photos from multiple angles.",
    submitBtn:      "Publish Listing",
  },
};

const DEFAULT_COPY = {
  badge:          "List in 2 minutes",
  pageTitle:      "List an Item",
  pageSubtitle:   "Fill in the details and your listing will go live instantly.",
  itemLabel:      "Item name",
  itemPlaceholder:"e.g. Wooden Study Table in good condition",
  descHint:       "Describe the item's condition, usage, and any defects.",
  descPlaceholder:"e.g. Used for 1 year, no major scratches, includes charger...",
  imageTip:       "📷 Upload clear photos to attract more buyers.",
  submitBtn:      "Publish Listing",
};

const INPUT_STYLE = {
  width: "100%", padding: "12px 14px",
  background: "#faf7ff", color: "#14141f", fontSize: 14,
  border: "1.5px solid #e5e5ec", borderRadius: 12, outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
};
const SELECT_STYLE = {
  ...INPUT_STYLE, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239898a8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 38,
};
const LABEL_STYLE = { display: "block", fontSize: 13, fontWeight: 700, color: "#4b4b5c", marginBottom: 8, letterSpacing: "0.01em" };

function onFocus(e) { e.target.style.borderColor = "#5c22d4"; e.target.style.boxShadow = "0 0 0 3px rgba(92,34,212,0.12)"; }
function onBlur(e) { e.target.style.borderColor = "#e5e5ec"; e.target.style.boxShadow = "none"; }

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: "#9898a8", margin: "6px 0 0" }}>{hint}</p>}
    </div>
  );
}

// Step 1: Pick top-level category
function CategoryPicker({ selected, onSelect }) {
  const [hoveredCat, setHoveredCat] = useState(null);
  const topCats = Object.keys(CATEGORY_TREE);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#5c22d4,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', system-ui, sans-serif" }}>1</div>
        <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#14141f", margin: 0 }}>Choose a category</h2>
      </div>
      <div className="sell-category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {topCats.map(cat => {
          const info = CATEGORY_TREE[cat];
          const isActive = selected === cat;
          const isHov = hoveredCat === cat;
          return (
            <button
              key={cat}
              style={{
                padding: "18px 14px", borderRadius: 16, border: `2px solid ${isActive ? "#5c22d4" : "#e5e5ec"}`,
                background: isActive ? "linear-gradient(135deg,#f3ecfe,#ece0fd)" : isHov ? "#faf7ff" : "#fff",
                cursor: "pointer", textAlign: "center", transition: "all 180ms ease",
                boxShadow: isActive ? "0 4px 20px rgba(92,34,212,0.18)" : isHov ? "0 4px 12px rgba(92,34,212,0.08)" : "0 2px 8px rgba(14,0,40,0.06)",
                transform: isHov && !isActive ? "translateY(-2px)" : "none",
              }}
              onClick={() => onSelect(cat)}
              onMouseEnter={() => setHoveredCat(cat)}
              onMouseLeave={() => setHoveredCat(null)}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{info.emoji}</div>
              <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? "#5c22d4" : "#14141f", margin: "0 0 4px" }}>{cat}</p>
              <p style={{ fontSize: 11, color: "#9898a8", margin: 0, lineHeight: 1.4 }}>{info.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 2: Pick subcategory (optional)
function SubcategoryPicker({ topCategory, selected, onSelect }) {
  const subs = CATEGORY_TREE[topCategory]?.subcategories || [];
  const [hov, setHov] = useState(null);
  if (!subs.length) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <label style={LABEL_STYLE}>Subcategory <span style={{ fontSize: 11, fontWeight: 500, color: "#9898a8" }}>(optional)</span></label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {subs.map(sub => {
          const isActive = selected === sub;
          return (
            <button
              key={sub}
              style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${isActive ? "#5c22d4" : "#e5e5ec"}`, background: isActive ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : hov === sub ? "#f3ecfe" : "#f9f9fb", color: isActive ? "#fff" : hov === sub ? "#5c22d4" : "#6b6b7e", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 160ms ease" }}
              onClick={() => onSelect(isActive ? "" : sub)}
              onMouseEnter={() => setHov(sub)}
              onMouseLeave={() => setHov(null)}
            >{sub}</button>
          );
        })}
      </div>
    </div>
  );
}

// Renders dynamic category-specific fields
function CategoryFields({ topCategory, extraFields, setExtraFields }) {
  const fields = CATEGORY_FIELDS[topCategory] || [];
  if (!fields.length) return null;

  const info = CATEGORY_TREE[topCategory];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e5e5ec, transparent)", margin: "0 0 28px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: info?.gradient || "linear-gradient(135deg,#5c22d4,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{info?.emoji || "📦"}</div>
        <div>
          <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 15, fontWeight: 800, color: "#14141f", margin: 0 }}>{topCategory} details</h2>
          <p style={{ fontSize: 12, color: "#9898a8", margin: 0 }}>Fields specific to {topCategory.toLowerCase()} listings</p>
        </div>
      </div>
      <div className="sell-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {fields.map(field => (
          <div key={field.key} style={{ gridColumn: field.type === "url" || field.key === "accessoriesIncluded" ? "1 / -1" : "auto" }}>
            <Field label={field.label}>
              {field.type === "select" ? (
                <select
                  style={SELECT_STYLE}
                  value={extraFields[field.key] || ""}
                  onChange={e => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  style={INPUT_STYLE}
                  type={field.type || "text"}
                  placeholder={field.placeholder || ""}
                  value={extraFields[field.key] || ""}
                  onChange={e => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  onFocus={onFocus} onBlur={onBlur}
                />
              )}
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellRoute({ categories, handlePost, newListing, posted, setNewListing, imageFiles, setImageFiles, imageUploading }) {
  const [dragOver, setDragOver] = useState(false);
  const [extraFields, setExtraFields] = useState({});
  const [subcategory, setSubcategory] = useState("");
  const MAX_IMAGES = 5;

  const topCategory = getTopCategory(newListing.category) || newListing.category || "Electronics";
  const copy = CATEGORY_COPY[topCategory] || DEFAULT_COPY;
  const isService = topCategory === "Services";

  // When top category changes, reset extra fields & subcategory
  useEffect(() => {
    setExtraFields({});
    setSubcategory("");
  }, [topCategory]);

  // Sync subcategory into listing
  useEffect(() => {
    if (subcategory) setNewListing(c => ({ ...c, subcategory }));
  }, [subcategory]);

  // Sync extraFields into listing
  useEffect(() => {
    setNewListing(c => ({ ...c, ...extraFields }));
  }, [extraFields]);

  const addFiles = (files) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    setImageFiles(prev => [...prev, ...newFiles].slice(0, MAX_IMAGES));
  };

  const removeImage = (idx) => setImageFiles(prev => prev.filter((_, i) => i !== idx));
  const previewURL = (file) => { try { return URL.createObjectURL(file); } catch { return null; } };

  const estimatedSavings = newListing.originalPrice && newListing.price
    ? Math.max(0, parseInt(newListing.originalPrice, 10) - parseInt(newListing.price, 10))
    : 0;


  return (
    <div style={{ background: "#f9f9fb", minHeight: "calc(100vh - 64px)", paddingBottom: 80 }}>
      {/* Hero header */}
      <div className="sell-hero" style={{ background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 100%)", padding: "36px 32px 44px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(252,211,77,0.07)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.35)", color: "#fde68a", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 999, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 16 }}>
            {copy.badge}
          </span>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px", margin: "0 0 8px" }}>
            {copy.pageTitle}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
            {copy.pageSubtitle}
          </p>
        </div>
      </div>

      <div className="sell-content" style={{ maxWidth: 700, margin: "-24px auto 0", padding: "0 24px", boxSizing: "border-box", position: "relative", zIndex: 10 }}>
        {posted && (
          <div style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", color: "#065f46", borderRadius: 14, padding: "16px 20px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, marginBottom: 20, border: "1px solid #6ee7b7", boxShadow: "0 4px 20px rgba(16,185,129,0.20)" }}>
            ✅ Listing posted successfully! Redirecting to browse...
          </div>
        )}

        <div className="sell-form-card" style={{ background: "#fff", borderRadius: 24, border: "1px solid #e5e5ec", boxShadow: "0 8px 40px rgba(14,0,40,0.10)", padding: "36px", boxSizing: "border-box" }}>

          {/* ── Step 1: Category picker ── */}
          <div style={{ marginBottom: 28 }}>
            <CategoryPicker
              selected={topCategory}
              onSelect={cat => setNewListing(c => ({ ...c, category: cat }))}
            />
            <SubcategoryPicker
              topCategory={topCategory}
              selected={subcategory}
              onSelect={setSubcategory}
            />
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e5e5ec, transparent)", margin: "0 0 28px" }} />

          {/* ── Step 2: Item / service core details ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#5c22d4,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', system-ui, sans-serif" }}>2</div>
              <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#14141f", margin: 0 }}>
                {isService ? "Service details" : "Item details"}
              </h2>
            </div>

            <Field label={copy.itemLabel}>
              <input
                style={INPUT_STYLE}
                placeholder={copy.itemPlaceholder}
                value={newListing.title}
                onChange={e => setNewListing(c => ({ ...c, title: e.target.value }))}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            <Field label="Description" hint={copy.descHint}>
              <textarea
                style={{ ...INPUT_STYLE, resize: "vertical", minHeight: 90, lineHeight: 1.6 }}
                placeholder={copy.descPlaceholder}
                value={newListing.description || ""}
                onChange={e => setNewListing(c => ({ ...c, description: e.target.value }))}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            {!isService && (
              <div>
                <label style={LABEL_STYLE}>Accommodation type</label>
                <select style={SELECT_STYLE} value={newListing.type || "Hostel"} onChange={e => setNewListing(c => ({ ...c, type: e.target.value }))} onFocus={onFocus} onBlur={onBlur}>
                  <option>Hostel</option><option>Rented Room</option><option>Day Scholar</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Category-specific fields ── */}
          <CategoryFields topCategory={topCategory} extraFields={extraFields} setExtraFields={setExtraFields} />

          {/* ── Pricing section ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e5e5ec, transparent)", margin: "0 0 28px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#5c22d4,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', system-ui, sans-serif" }}>3</div>
              <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#14141f", margin: 0 }}>Pricing</h2>
            </div>

            <div className="sell-pricing-grid" style={{ display: "grid", gridTemplateColumns: isService ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>{isService ? "Service price (₹)" : "Your selling price (₹)"}</label>
                <input style={INPUT_STYLE} type="number" placeholder={isService ? "500" : "1200"} value={newListing.price} onChange={e => setNewListing(c => ({ ...c, price: e.target.value }))} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {!isService && (
                <div>
                  <label style={LABEL_STYLE}>Original / MRP price (₹)</label>
                  <input style={INPUT_STYLE} type="number" placeholder="3500" value={newListing.originalPrice} onChange={e => setNewListing(c => ({ ...c, originalPrice: e.target.value }))} onFocus={onFocus} onBlur={onBlur} />
                </div>
              )}
            </div>

            {!isService && estimatedSavings > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", borderRadius: 10, border: "1px solid #6ee7b7", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>💸</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#065f46", margin: 0 }}>
                  Buyer saves ₹{estimatedSavings.toLocaleString()} ({Math.round((estimatedSavings / parseInt(newListing.originalPrice)) * 100)}% discount)
                </p>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e5e5ec, transparent)", margin: "0 0 28px" }} />

          {/* ── Photos section ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#5c22d4,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', system-ui, sans-serif" }}>4</div>
              <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#14141f", margin: 0 }}>Photos</h2>
              <span style={{ fontSize: 12, color: "#9898a8", marginLeft: 2 }}>({imageFiles.length}/{MAX_IMAGES} uploaded)</span>
            </div>

            <label
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `2px dashed ${dragOver ? "#5c22d4" : imageFiles.length > 0 ? "#c4a8f8" : "#d0d0db"}`, borderRadius: 16, padding: "32px", cursor: "pointer", background: dragOver ? "linear-gradient(135deg,#f3ecfe,#ece0fd)" : imageFiles.length > 0 ? "#faf7ff" : "#f9f9fb", transition: "all 200ms ease", textAlign: "center", opacity: imageFiles.length >= MAX_IMAGES ? 0.5 : 1 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📷</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#5c22d4", margin: "0 0 4px" }}>
                  {imageFiles.length >= MAX_IMAGES ? "Maximum photos uploaded" : "Click or drag photos here"}
                </p>
                <p style={{ fontSize: 12, color: "#9898a8", margin: 0 }}>
                  Up to {MAX_IMAGES} photos · PNG, JPG up to 10MB each · First photo is the cover
                </p>
                <p style={{ fontSize: 12, color: "#7c5cbf", margin: "4px 0 0", fontStyle: "italic" }}>
                  {copy.imageTip}
                </p>
              </div>
              <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={imageFiles.length >= MAX_IMAGES} onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>

            {imageFiles.length > 0 && (
              <div className="sell-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 16 }}>
                {imageFiles.map((file, idx) => {
                  const url = previewURL(file);
                  return (
                    <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: 14, overflow: "hidden", border: idx === 0 ? "2.5px solid #5c22d4" : "1.5px solid #e5e5ec", background: "#f2f2f6", boxShadow: idx === 0 ? "0 4px 16px rgba(92,34,212,0.20)" : "none" }}>
                      {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      {idx === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(92,34,212,0.9), transparent)", fontSize: 10, fontWeight: 800, color: "#fff", textAlign: "center", padding: "12px 0 4px", letterSpacing: "0.06em" }}>COVER</div>}
                      <button style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1, backdropFilter: "blur(4px)" }} onClick={e => { e.preventDefault(); removeImage(idx); }}>×</button>
                    </div>
                  );
                })}
                {imageFiles.length < MAX_IMAGES && (
                  <label style={{ aspectRatio: "1", borderRadius: 14, border: "2px dashed #d0d0db", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f9f9fb", transition: "all 180ms ease", fontSize: 24, color: "#9898a8" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#5c22d4"; e.currentTarget.style.background = "#faf7ff"; e.currentTarget.style.color = "#5c22d4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0d0db"; e.currentTarget.style.background = "#f9f9fb"; e.currentTarget.style.color = "#9898a8"; }}>
                    +
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ marginTop: 32 }}>
            <button
              style={{ width: "100%", padding: "16px", background: imageUploading ? "#9f67f5" : "linear-gradient(135deg, #5c22d4, #7c3aed)", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 16, borderRadius: 14, border: "none", cursor: imageUploading ? "wait" : "pointer", boxShadow: "0 8px 32px rgba(92,34,212,0.32)", transition: "all 180ms ease", letterSpacing: "0.02em" }}
              onClick={handlePost}
              disabled={imageUploading}
              onMouseEnter={e => { if (!imageUploading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(92,34,212,0.40)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(92,34,212,0.32)"; }}
            >
              {imageUploading ? "⏳ Uploading images..." : `🚀 ${copy.submitBtn} →`}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9898a8", marginTop: 12 }}>
              Your listing will be visible to students across all connected campuses instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
