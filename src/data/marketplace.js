// ─── Full category tree ───────────────────────────────────────────────────────
export const CATEGORY_TREE = {
  Academic: {
    emoji: "📚",
    gradient: "linear-gradient(135deg,#5c22d4 0%,#7c3aed 50%,#a855f7 100%)",
    glowColor: "rgba(124,58,237,0.45)",
    desc: "Books, notes & study material",
    subcategories: ["Books","Notes","Assignments","Previous Year Papers","Study Material","Courses","Project Files","Other Academic Resources"],
  },
  Services: {
    emoji: "💼",
    gradient: "linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)",
    glowColor: "rgba(249,115,22,0.45)",
    desc: "Design, dev, tutoring & more",
    subcategories: ["Graphic Design","Video Editing","Programming","Web Development","App Development","Tutoring","Freelancing","Content Writing","Other Services"],
  },
  Furniture: {
    emoji: "🪑",
    gradient: "linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%)",
    glowColor: "rgba(16,185,129,0.45)",
    desc: "Desks, chairs & storage",
    subcategories: ["Chairs","Tables","Beds","Sofas","Cupboards","Shelves","Study Furniture","Other Furniture"],
  },
  Electronics: {
    emoji: "💻",
    gradient: "linear-gradient(135deg,#0ea5e9 0%,#3b82f6 50%,#6366f1 100%)",
    glowColor: "rgba(59,130,246,0.45)",
    desc: "Laptops, phones & gadgets",
    subcategories: ["Phones","Computers & Laptops","Audio Devices","Gaming","Home Appliances","Accessories","Other Electronics"],
  },
  "Lifestyle & Essentials": {
    emoji: "👕",
    gradient: "linear-gradient(135deg,#ec4899 0%,#f43f5e 50%,#e11d48 100%)",
    glowColor: "rgba(244,63,94,0.45)",
    desc: "Fashion, sports & daily items",
    subcategories: ["Fashion","Sports","Room Essentials","Kitchen Essentials","Miscellaneous"],
  },
};

// Flat list used by browse filters
export const categories = [
  "All",
  ...Object.keys(CATEGORY_TREE),
  ...Object.entries(CATEGORY_TREE).flatMap(([, v]) => v.subcategories),
];

// The four main categories highlighted on the homepage
export const MAIN_CATEGORIES = ["Academic","Services","Furniture","Electronics"];

export const sampleListings = [];

export const colleges = [
  "All Campuses",
  "Galgotias University",
  "NIT Durgapur",
  "IIEST Shibpur",
  "Jadavpur University",
  "Noida International University",
  "GL Bajaj University",
  "KCC Institute",
  "Other",
];

export const initialNewListing = {
  title: "",
  price: "",
  originalPrice: "",
  category: "Electronics",
  condition: "Good",
  type: "Hostel",
  description: "",
};

// ─── Category-specific field schemas ─────────────────────────────────────────
export const CATEGORY_FIELDS = {
  Academic: [
    { key: "subject",       label: "Subject",        type: "text",   placeholder: "e.g. Data Structures, Physics" },
    { key: "semester",      label: "Semester",       type: "select", options: ["1st","2nd","3rd","4th","5th","6th","7th","8th","Other"] },
    { key: "university",    label: "University",     type: "text",   placeholder: "e.g. Galgotias University" },
    { key: "resourceType",  label: "Resource Type",  type: "select", options: ["Books","Notes","Assignments","Study Material","Courses","Other"] },
    { key: "format",        label: "Format",         type: "select", options: ["Physical","PDF","Both"] },
    { key: "condition",     label: "Condition",      type: "select", options: ["New","Good","Fair","Poor"] },
  ],
  Services: [
    { key: "serviceCategory",    label: "Service Category",        type: "select", options: ["Graphic Design","Video Editing","Programming","Web Development","Tutoring","Freelancing","Other"] },
    { key: "experienceLevel",    label: "Experience Level",        type: "select", options: ["Beginner","Intermediate","Expert"] },
    { key: "portfolioLink",      label: "Portfolio / Sample Link", type: "url",    placeholder: "https://..." },
    { key: "deliveryTime",       label: "Estimated Delivery Time", type: "text",   placeholder: "e.g. 2-3 days" },
    { key: "pricingType",        label: "Pricing Model",           type: "select", options: ["Fixed","Hourly","Per Project","Negotiable"] },
    { key: "availability",       label: "Availability",            type: "select", options: ["Immediate","Within a week","Flexible","Weekends Only"] },
  ],
  Furniture: [
    { key: "material",          label: "Material",              type: "text",   placeholder: "e.g. Wood, Metal, Plastic" },
    { key: "dimensions",        label: "Dimensions (L×W×H)",   type: "text",   placeholder: "e.g. 120×60×75 cm" },
    { key: "condition",         label: "Condition",             type: "select", options: ["New","Good","Fair","Poor"] },
    { key: "pickupAvailable",   label: "Pickup Available",      type: "select", options: ["Yes","No"] },
    { key: "deliveryAvailable", label: "Delivery Available",    type: "select", options: ["Yes","No","Negotiable"] },
  ],
  Electronics: [
    { key: "brand",               label: "Brand",                   type: "text",   placeholder: "e.g. Apple, Samsung, Sony, LG" },
    { key: "model",               label: "Model (Optional)",         type: "text",   placeholder: "e.g. iPhone 14, KF157, WH-1000XM5" },
    { key: "condition",           label: "Condition",               type: "select", options: ["New","Like New","Good","Fair","Poor"] },
    { key: "warrantyStatus",      label: "Warranty Status",         type: "select", options: ["Under Warranty","Expired","No Warranty","Unknown"] },
    { key: "accessoriesIncluded", label: "Accessories Included",    type: "text",   placeholder: "e.g. Charger, Remote, Original Box" },
    { key: "powerRequirements",   label: "Power Requirements (Optional)", type: "text", placeholder: "e.g. 220V, Battery powered, USB-C" },
  ],
  "Lifestyle & Essentials": [
    { key: "itemType",          label: "Item Type",             type: "text",   placeholder: "e.g. T-Shirt, Cricket Bat, Dumbbell" },
    { key: "condition",         label: "Condition",             type: "select", options: ["New","Good","Fair","Poor"] },
    { key: "pickupAvailable",   label: "Pickup Available",      type: "select", options: ["Yes","No"] },
    { key: "deliveryAvailable", label: "Delivery Available",    type: "select", options: ["Yes","No","Negotiable"] },
  ],
};

// Helper: given a top-level category string, get its field schema
export function getFieldsForCategory(cat) {
  if (CATEGORY_FIELDS[cat]) return CATEGORY_FIELDS[cat];
  for (const [topCat, { subcategories }] of Object.entries(CATEGORY_TREE)) {
    if (subcategories.includes(cat)) return CATEGORY_FIELDS[topCat] || [];
  }
  return [];
}

// Given any category (top or sub), return the top-level parent
export function getTopCategory(cat) {
  if (CATEGORY_TREE[cat]) return cat;
  for (const [topCat, { subcategories }] of Object.entries(CATEGORY_TREE)) {
    if (subcategories.includes(cat)) return topCat;
  }
  return null;
}
