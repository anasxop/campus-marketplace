import { useEffect, useState, useCallback } from "react";
import { STATUS_CONFIG, LISTING_STATUSES, normalizeStatus } from "../lib/listingStatus";
import { fetchDashboard as apiFetchDashboard } from "../lib/authApi";

const t = {
  purple600: "#5c22d4", purple700: "#4318a0", purple800: "#2d1260",
  purple100: "#f3ecfe", purple200: "#e0d0fd", purple50: "#faf7ff",
  yellow400: "#fcd34d", yellow500: "#fbbf24",
  white: "#ffffff", gray50: "#f9f9fb", gray100: "#f2f2f6",
  gray200: "#e5e5ec", gray300: "#d0d0db", gray400: "#9898a8",
  gray500: "#6b6b7e", gray600: "#4b4b5c", gray700: "#3c3c4e", gray900: "#14141f",
  red500: "#ef4444", red100: "#fee2e2",
  green500: "#22c55e", green100: "#dcfce7", green700: "#15803d",
  blue500: "#3b82f6", blue100: "#dbeafe",
  pink500: "#db2777", pink100: "#fce7f3",
};

const shadow = {
  xs: "0 1px 2px rgba(14,0,40,0.05)",
  sm: "0 2px 8px rgba(14,0,40,0.07)",
  md: "0 4px 20px rgba(14,0,40,0.10)",
  lg: "0 8px 40px rgba(14,0,40,0.13)",
  purple: "0 8px 32px rgba(92,34,212,0.22)",
};

// ── Badge definitions with progress thresholds ────────────────────────────────
const BADGE_DEFS = [
  {
    id: "first_seller",
    icon: "🏅",
    label: "First Seller",
    desc: "Create your first listing",
    metric: (d) => d.overview.totalListings,
    target: 1,
    unit: "listing",
  },
  {
    id: "trusted_member",
    icon: "⭐",
    label: "Trusted Member",
    desc: "Get 10 profile views",
    metric: (d) => d.overview.profileViews,
    target: 10,
    unit: "profile view",
  },
  {
    id: "popular_seller",
    icon: "🔥",
    label: "Popular Seller",
    desc: "Get 50 wishlist saves",
    metric: (d) => d.overview.wishlistSaves,
    target: 50,
    unit: "save",
  },
  {
    id: "campus_star",
    icon: "🎯",
    label: "Campus Star",
    desc: "Receive 10 reviews",
    metric: (d) => d.seller.totalReviews,
    target: 10,
    unit: "review",
  },
  {
    id: "quick_responder",
    icon: "⚡",
    label: "Quick Responder",
    desc: "Reach 80% response rate",
    metric: (d) => d.seller.responseRate,
    target: 80,
    unit: "%",
    isRate: true,
  },
  {
    id: "deal_maker",
    icon: "🤝",
    label: "Deal Maker",
    desc: "Complete 5 transactions",
    metric: (d) => d.seller.successfulTransactions,
    target: 5,
    unit: "transaction",
  },
  {
    id: "power_lister",
    icon: "📦",
    label: "Power Lister",
    desc: "Have 10 active listings",
    metric: (d) => d.overview.activeListings,
    target: 10,
    unit: "active listing",
  },
];

// ── Profile completion goals ───────────────────────────────────────────────────
const getGoals = (user, data) => [
  {
    id: "photo",
    label: "Add a profile picture",
    done: !!user?.photoURL,
    cta: "Upload photo",
  },
  {
    id: "listing",
    label: "Create your first listing",
    done: data.overview.totalListings > 0,
    cta: "Start selling",
  },
  {
    id: "review",
    label: "Receive your first review",
    done: data.seller.totalReviews > 0,
    cta: "Complete a sale",
  },
  // Email verification goal is intentionally excluded while EMAIL_VERIFICATION_ENABLED = false
  // To restore: add back { id: "verify", label: "Verify your university email", done: !!user?.emailVerified, cta: "Verify now" }
  {
    id: "badge",
    label: "Earn your first badge",
    done: data.badges.length > 0,
    cta: "See achievements",
  },
];

// ── CSS ────────────────────────────────────────────────────────────────────────
const DASHBOARD_CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes progressFill { from { width: 0%; } to { width: var(--target-w); } }

  .db-page {
    background: #f9f9fb;
    min-height: calc(100vh - 64px);
    padding-bottom: 80px;
    overflow-x: hidden;
  }
  .db-hero {
    background: linear-gradient(135deg, #1e0757 0%, #2d1260 35%, #5c22d4 100%);
    padding: 36px 32px 52px;
    position: relative;
    overflow: hidden;
  }
  .db-hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .db-content {
    max-width: 1200px;
    margin: -28px auto 0;
    padding: 0 24px;
    box-sizing: border-box;
    position: relative;
    z-index: 2;
  }
  .db-grid-main {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }
  .db-left-col {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }
  .db-right-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 80px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    padding-right: 4px;
  }
  .db-right-col::-webkit-scrollbar { width: 4px; }
  .db-right-col::-webkit-scrollbar-thumb { background: #e0d0fd; border-radius: 99px; }
  .db-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
    animation: fadeUp 300ms ease both;
  }
  .db-charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .db-chart-full { grid-column: 1 / -1; }
  .db-insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  /* Activity Feed */
  .db-feed-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f2f2f6;
    animation: fadeUp 300ms ease both;
  }
  .db-feed-item:last-child { border-bottom: none; }

  /* Badge progress bar */
  .db-badge-bar-track {
    background: #f2f2f6;
    border-radius: 99px;
    height: 6px;
    overflow: hidden;
    margin-top: 6px;
  }
  .db-badge-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #5c22d4, #7c3aed);
    animation: progressFill 700ms ease both;
  }

  /* Goals checklist */
  .db-goal-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    transition: background 140ms ease;
    cursor: default;
  }
  .db-goal-item:hover { background: #faf7ff; }
  .db-goal-item.done { opacity: 0.55; }

  @media (max-width: 900px) {
    .db-grid-main { grid-template-columns: 1fr; }
    .db-right-col { position: static; max-height: none; overflow-y: visible; }
    .db-stat-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 700px) {
    .db-hero { padding: 28px 20px 44px; }
    .db-content { padding: 0 16px; }
    .db-charts-grid { grid-template-columns: 1fr; }
    .db-insights-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .db-hero { padding: 24px 16px 40px; }
    .db-content { padding: 0 12px; margin-top: -20px; }
    .db-stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
function MiniBarChart({ data, color = t.purple600, height = 60 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height, width: "100%" }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${d.count}`} style={{
          flex: 1,
          height: `${Math.max(4, (d.count / max) * 100)}%`,
          background: color,
          borderRadius: "3px 3px 0 0",
          opacity: 0.7 + (i / data.length) * 0.3,
          transition: "opacity 200ms ease",
        }} />
      ))}
    </div>
  );
}

// ── Section Title ──────────────────────────────────────────────────────────────
function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 17, fontWeight: 800, color: t.gray900, letterSpacing: "-0.3px", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  if (rating === null || rating === undefined)
    return <span style={{ fontSize: 12, color: t.gray400 }}>No ratings yet</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? t.yellow500 : t.gray200}
          stroke={i <= Math.round(rating) ? t.yellow400 : t.gray300}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 700, color: t.gray600, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Stat Card (4 hero cards only) ─────────────────────────────────────────────
function StatCard({ icon, label, value, color = t.purple600, bg = t.purple100, accent }) {
  return (
    <div style={{
      background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`,
      boxShadow: shadow.sm, padding: "20px 18px",
      display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
      animation: "fadeUp 300ms ease both",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: t.gray500, fontWeight: 500, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ data }) {
  // Generate synthetic but realistic feed from actual data
  const items = [];
  const { overview, seller, profileAnalytics } = data;

  if (profileAnalytics.weeklyVisits > 0) {
    items.push({ icon: "👁️", bg: t.purple100, text: `Your profile was viewed ${profileAnalytics.weeklyVisits} time${profileAnalytics.weeklyVisits !== 1 ? "s" : ""} this week`, time: "This week", color: t.purple600 });
  }
  if (overview.messagesReceived > 0) {
    items.push({ icon: "💬", bg: t.blue100, text: `You have ${overview.messagesReceived} message${overview.messagesReceived !== 1 ? "s" : ""} from buyers`, time: "Recent", color: t.blue500 });
  }
  if (overview.wishlistSaves > 0) {
    items.push({ icon: "❤️", bg: t.pink100, text: `${overview.wishlistSaves} buyer${overview.wishlistSaves !== 1 ? "s have" : " has"} saved your listings`, time: "All time", color: t.pink500 });
  }
  if (seller.totalReviews > 0) {
    items.push({ icon: "⭐", bg: "#fef9c3", text: `You have ${seller.totalReviews} seller review${seller.totalReviews !== 1 ? "s" : ""} with a ${seller.avgRating?.toFixed(1)} rating`, time: "All time", color: t.yellow500 });
  }
  if (overview.soldListings > 0) {
    items.push({ icon: "✅", bg: t.green100, text: `${overview.soldListings} listing${overview.soldListings !== 1 ? "s" : ""} sold successfully`, time: "All time", color: t.green700 });
  }
  if (overview.activeListings > 0) {
    items.push({ icon: "📦", bg: t.purple100, text: `${overview.activeListings} active listing${overview.activeListings !== 1 ? "s" : ""} visible to buyers`, time: "Now", color: t.purple600 });
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.gray600, marginBottom: 4 }}>Nothing here yet</p>
        <p style={{ fontSize: 13, color: t.gray400 }}>Create a listing to get started — activity will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="db-feed-item">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: t.gray700, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
            <span style={{ fontSize: 11, color: t.gray400 }}>{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Badge with progress ────────────────────────────────────────────────────────
function BadgeProgress({ def, data, earned }) {
  const current = Math.min(def.metric(data), def.target);
  const pct = Math.round((current / def.target) * 100);
  const fillWidth = `${pct}%`;

  return (
    <div style={{
      padding: "14px",
      borderRadius: 14,
      border: earned ? `1.5px solid ${t.purple200}` : `1.5px solid ${t.gray200}`,
      background: earned ? `linear-gradient(135deg, ${t.purple50}, ${t.purple100})` : t.white,
      transition: "transform 200ms ease, box-shadow 200ms ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = earned ? shadow.purple : shadow.sm; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: earned ? 24 : 20, filter: earned ? "none" : "grayscale(1) opacity(0.5)" }}>{def.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: earned ? t.purple700 : t.gray600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.label}</div>
          {earned ? (
            <div style={{ fontSize: 10, color: t.green700, fontWeight: 600 }}>Earned ✓</div>
          ) : (
            <div style={{ fontSize: 10, color: t.gray400 }}>
              {def.isRate ? `${current}${def.unit} / ${def.target}${def.unit}` : `${current} / ${def.target} ${current === 1 ? def.unit : def.unit + "s"}`}
            </div>
          )}
        </div>
      </div>
      {!earned && (
        <div className="db-badge-bar-track">
          <div
            className="db-badge-bar-fill"
            style={{ "--target-w": fillWidth, width: fillWidth }}
          />
        </div>
      )}
    </div>
  );
}

// ── Goals checklist ───────────────────────────────────────────────────────────
function GoalsList({ goals }) {
  const done = goals.filter(g => g.done).length;
  const pct = Math.round((done / goals.length) * 100);

  return (
    <div>
      {/* Progress summary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: t.gray500, fontWeight: 500 }}>Profile completeness</span>
        <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 14, fontWeight: 800, color: t.purple600 }}>{pct}%</span>
      </div>
      <div className="db-badge-bar-track" style={{ marginBottom: 16, height: 8 }}>
        <div className="db-badge-bar-fill" style={{ "--target-w": `${pct}%`, width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${t.green500}, ${t.green700})` : `linear-gradient(90deg, #5c22d4, #7c3aed)` }} />
      </div>

      {goals.map((g) => (
        <div key={g.id} className={`db-goal-item${g.done ? " done" : ""}`}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: g.done ? t.green100 : t.gray100,
            border: `1.5px solid ${g.done ? t.green500 : t.gray300}`,
          }}>
            {g.done && <span style={{ fontSize: 10, color: t.green700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: g.done ? t.gray400 : t.gray700, fontWeight: g.done ? 400 : 500, textDecoration: g.done ? "line-through" : "none", flex: 1 }}>
            {g.label}
          </span>
          {!g.done && (
            <span style={{ fontSize: 11, color: t.purple600, fontWeight: 600, background: t.purple100, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
              {g.cta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Seller Perf item ──────────────────────────────────────────────────────────
function SellerStat({ icon, label, value, sub, accent = t.purple600 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: t.gray50, borderRadius: 10, gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.gray600 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: t.gray400 }}>{sub}</div>}
        </div>
      </div>
      <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 18, fontWeight: 800, color: accent, flexShrink: 0 }}>{value}</span>
    </div>
  );
}

// ── Chart Block ───────────────────────────────────────────────────────────────
function ChartBlock({ title, icon, data, color }) {
  const [period, setPeriod] = useState("monthly");
  const getSliced = () => {
    if (!data) return [];
    if (period === "daily") return data.slice(-7);
    if (period === "weekly") return data.slice(-14);
    return data;
  };
  const sliced = getSliced();
  const total = sliced.reduce((s, d) => s + d.count, 0);

  // If no data at all, show an empty state instead of an empty chart
  const hasData = data && data.some(d => d.count > 0);
  if (!hasData) {
    return (
      <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px", minWidth: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div>
          <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: t.gray300 }}>0</div>
          <div style={{ fontSize: 12, color: t.gray400 }}>{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
          <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: t.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {["daily", "weekly", "monthly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer",
              background: period === p ? t.purple600 : t.gray100,
              color: period === p ? t.white : t.gray500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 140ms ease",
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', system-ui, sans-serif", color, marginBottom: 12 }}>{total}</div>
      <MiniBarChart data={sliced} color={color} height={56} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: t.gray400 }}>{sliced[0]?.date}</span>
        <span style={{ fontSize: 10, color: t.gray400 }}>{sliced[sliced.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ── Top Listings Table ─────────────────────────────────────────────────────────
function MetricCell({ value, accent = t.purple600 }) {
  return (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne', system-ui, sans-serif", color: value > 0 ? accent : t.gray300 }}>
        {value}
      </span>
    </div>
  );
}

function InsightCard({ title, icon, items, metricKey, metricLabel, color }) {
  const filtered = items.filter(i => i[metricKey] > 0).slice(0, 3);
  return (
    <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "16px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <span>{icon}</span>
        <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: t.gray900 }}>{title}</span>
      </div>
      {filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: t.gray400, textAlign: "center", padding: "16px 0" }}>No data yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: t.gray100, overflow: "hidden", flexShrink: 0, border: `1px solid ${t.gray200}` }}>
                {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                <div style={{ fontSize: 11, color, fontWeight: 700 }}>{item[metricKey]} {metricLabel}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color, fontFamily: "'Syne', system-ui, sans-serif", background: `${color}18`, borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>#{i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardRoute({ user, sessionToken, onStatusChange, openItem }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState({}); // id -> status

  const fetchDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const json = await apiFetchDashboard(sessionToken);
      setData(json);
    } catch (e) {
      setError(e.message || "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleDashboardStatusChange = async (itemId, nextStatus) => {
    setStatusUpdating(itemId);
    try {
      await onStatusChange(itemId, nextStatus);
      setLocalStatusOverrides(prev => ({ ...prev, [itemId]: nextStatus }));
      setStatusMenuOpen(null);
    } catch (statusChangeError) {
      console.error("Failed to update listing status:", statusChangeError);
    } finally {
      setStatusUpdating(null);
    }
  };

  const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#5c22d4", "#0ea5e9", "#059669", "#d97706", "#db2777"];
  const avatarColor = avatarColors[(user?.name || "").charCodeAt(0) % avatarColors.length];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", flexDirection: "column", gap: 16, background: t.gray50 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${t.purple200}`, borderTopColor: t.purple600, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: t.gray500, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14 }}>Loading your dashboard…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: t.gray900, marginBottom: 8 }}>Dashboard unavailable</p>
      <p style={{ color: t.gray400, fontSize: 14 }}>{error}</p>
      <button onClick={fetchDashboard} style={{ marginTop: 20, padding: "10px 24px", background: t.purple600, color: t.white, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14 }}>
        Try again
      </button>
    </div>
  );

  const { overview, seller, profileAnalytics, listingAnalytics, topListings, charts, badges } = data;

  // Compute earned badge IDs
  const earnedIds = new Set(badges.map(b => b.id));

  // Profile greeting
  const firstName = (user?.name || "").split(" ")[0];
  const activeCount = overview.activeListings;
  const msgCount = overview.messagesReceived;
  const greetingSub = (() => {
    const parts = [];
    if (activeCount > 0) parts.push(`${activeCount} active listing${activeCount !== 1 ? "s" : ""}`);
    if (msgCount > 0) parts.push(`${msgCount} unread message${msgCount !== 1 ? "s" : ""}`);
    if (parts.length === 0) return "Welcome! Create a listing to get started.";
    return `You have ${parts.join(" and ")}.`;
  })();

  // Goals
  const goals = getGoals(user, data);

  // Charts have data?
  const hasAnyChartData = charts && (
    charts.listingViews?.some(d => d.count > 0) ||
    charts.profileViews?.some(d => d.count > 0) ||
    charts.messages?.some(d => d.count > 0)
  );

  return (
    <div className="db-page">
      <style>{DASHBOARD_CSS}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div className="db-hero">
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(252,211,77,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "40%", width: 200, height: 200, borderRadius: "50%", background: "rgba(124,58,237,0.15)", pointerEvents: "none" }} />

        <div className="db-hero-inner">
          {/* Avatar + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {user?.photoURL ? (
              <div style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, overflow: "hidden", boxShadow: "0 6px 24px rgba(0,0,0,0.25)", border: "3px solid rgba(255,255,255,0.35)" }}>
                <img src={user.photoURL} alt={user?.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${avatarColor}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: t.white, fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, boxShadow: `0 6px 24px ${avatarColor}44`, border: "3px solid rgba(255,255,255,0.2)" }}>
                {initials}
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 24, fontWeight: 800, color: t.white, margin: 0, letterSpacing: "-0.4px" }}>
                Welcome back, {firstName} 👋
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 5, margin: "5px 0 0" }}>
                {greetingSub}
              </p>
            </div>
          </div>

          {/* University badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <span style={{ fontSize: 16 }}>🎓</span>
            <span>{user?.college || "Campus Marketplace"}</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────────── */}
      <div className="db-content">

        {/* 1 ── 4 Key Stats only ─────────────────────────────────────────────── */}
        <div className="db-stat-grid">
          <StatCard icon="🟢" label="Active Listings"  value={overview.activeListings}   color={t.purple600} bg={t.purple100} />
          <StatCard icon="💬" label="Messages"         value={overview.messagesReceived} color={t.blue500}   bg={t.blue100} />
          <StatCard icon="👁️" label="Profile Views"    value={overview.profileViews}     color="#0ea5e9"     bg="#e0f2fe" />
          <StatCard icon="❤️" label="Wishlist Saves"   value={overview.wishlistSaves}    color={t.pink500}   bg={t.pink100} />
        </div>

        {/* 2 ── Two-column main grid ─────────────────────────────────────────── */}
        <div className="db-grid-main">

          {/* LEFT COLUMN */}
          <div className="db-left-col">

            {/* Activity Feed */}
            <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px" }}>
              <SectionTitle icon="📡">Recent Activity</SectionTitle>
              <ActivityFeed data={data} />
            </div>

            {/* Analytics — only if there's real data */}
            {hasAnyChartData && (
              <div>
                <SectionTitle icon="📈">Performance</SectionTitle>
                <div className="db-charts-grid">
                  <ChartBlock title="Listing Views"  icon="👁️" data={charts.listingViews}  color={t.purple600} />
                  <ChartBlock title="Profile Views"  icon="👤" data={charts.profileViews}  color="#0ea5e9" />
                  <div className="db-chart-full">
                    <ChartBlock title="Messages" icon="💬" data={charts.messages} color="#059669" />
                  </div>
                </div>
              </div>
            )}

            {/* Top listings — only if they exist */}
            {topListings.length > 0 && (
              <div>
                <SectionTitle icon="🏆">Top Listings</SectionTitle>
                <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 64px 64px 64px 64px", padding: "10px 16px", borderBottom: `1px solid ${t.gray100}`, fontSize: 11, fontWeight: 700, color: t.gray400, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>Listing</span>
                    <span style={{ textAlign: "center" }}>Status</span>
                    <span style={{ textAlign: "center" }}>Views</span>
                    <span style={{ textAlign: "center" }}>Unique</span>
                    <span style={{ textAlign: "center" }}>Saves</span>
                    <span style={{ textAlign: "center" }}>Msgs</span>
                  </div>
                  {topListings.map((l, i) => {
                    const liveStatus = normalizeStatus(localStatusOverrides[l.id] || l.status);
                    const cfg = STATUS_CONFIG[liveStatus];
                    return (
                    <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 64px 64px 64px 64px", padding: "14px 16px", alignItems: "center", borderBottom: i < topListings.length - 1 ? `1px solid ${t.gray100}` : "none", transition: "background 140ms ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = t.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, cursor: openItem ? "pointer" : "default" }}
                        onClick={() => openItem?.(Number(l.id))}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: t.gray100, overflow: "hidden", flexShrink: 0, border: `1px solid ${t.gray200}` }}>
                          {l.image && <img src={l.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: 11, color: t.purple600, fontWeight: 700, marginTop: 2 }}>₹{l.price.toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                        <button
                          disabled={statusUpdating === l.id}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999,
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            cursor: statusUpdating === l.id ? "wait" : "pointer", whiteSpace: "nowrap",
                          }}
                          onClick={() => setStatusMenuOpen(statusMenuOpen === l.id ? null : l.id)}
                        >
                          {statusUpdating === l.id ? "…" : <>{cfg.emoji} {cfg.label} <span style={{ fontSize: 9 }}>▾</span></>}
                        </button>
                        {statusMenuOpen === l.id && (
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: t.white, borderRadius: 10, border: `1px solid ${t.gray200}`, boxShadow: shadow.md || "0 12px 32px rgba(14,0,40,0.18)", zIndex: 20, overflow: "hidden", minWidth: 130 }}>
                            {LISTING_STATUSES.map(opt => {
                              const ocfg = STATUS_CONFIG[opt];
                              const active = liveStatus === opt;
                              return (
                                <button
                                  key={opt}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "none", background: active ? ocfg.bg : t.white, color: active ? ocfg.color : t.gray900, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer", textAlign: "left" }}
                                  onClick={(e) => { e.stopPropagation(); handleDashboardStatusChange(l.id, opt); }}
                                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.gray50; }}
                                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = t.white; }}
                                >
                                  {ocfg.emoji} {ocfg.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <MetricCell value={l.views} />
                      <MetricCell value={l.uniqueViews} />
                      <MetricCell value={l.saves}    accent="#db2777" />
                      <MetricCell value={l.messages} accent={t.blue500} />
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visitor Insights — only if data */}
            {listingAnalytics.some(l => l.views > 0 || l.saves > 0) && (
              <div>
                <SectionTitle icon="🔍">Visitor Insights</SectionTitle>
                <div className="db-insights-grid">
                  <InsightCard title="Most Viewed" icon="🔥" items={[...listingAnalytics].sort((a, b) => b.views - a.views).slice(0, 3)} metricKey="views" metricLabel="views" color={t.purple600} />
                  <InsightCard title="Most Saved"  icon="❤️" items={[...listingAnalytics].sort((a, b) => b.saves - a.saves).slice(0, 3)} metricKey="saves" metricLabel="saves" color="#db2777" />
                </div>
              </div>
            )}

          </div>{/* end left col */}

          {/* RIGHT SIDEBAR */}
          <div className="db-right-col">

            {/* Seller Performance — compact */}
            <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px" }}>
              <SectionTitle icon="🏪">Seller Performance</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SellerStat
                  icon="📨" label="Response Rate"
                  value={seller.responseRate > 0 ? `${seller.responseRate}%` : "0%"}
                  sub={seller.responseRate >= 80 ? "Excellent" : seller.responseRate >= 50 ? "Good" : "Needs work"}
                  accent={seller.responseRate >= 80 ? t.green700 : seller.responseRate >= 50 ? "#d97706" : t.red500}
                />
                <SellerStat
                  icon="⏱️" label="Response Time"
                  value={seller.avgResponseTimeMinutes !== null
                    ? (seller.avgResponseTimeMinutes < 60 ? `${seller.avgResponseTimeMinutes}m` : `${Math.round(seller.avgResponseTimeMinutes / 60)}h`)
                    : "N/A"}
                  sub="Avg. per message" accent={t.purple600}
                />
                <div style={{ padding: "10px 12px", background: t.gray50, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.gray600, marginBottom: 6 }}>Seller Rating</div>
                  <Stars rating={seller.avgRating} size={15} />
                  <div style={{ fontSize: 11, color: t.gray400, marginTop: 4 }}>
                    {seller.totalReviews === 0 ? "No reviews yet — complete a transaction." : `${seller.totalReviews} review${seller.totalReviews !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <SellerStat icon="🤝" label="Transactions" value={seller.successfulTransactions} sub="Completed" accent={t.green700} />
              </div>
            </div>

            {/* Goals / Next actions */}
            <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px" }}>
              <SectionTitle icon="🎯">Next Steps</SectionTitle>
              <GoalsList goals={goals} />
            </div>

            {/* Achievements with progress */}
            <div style={{ background: t.white, borderRadius: 16, border: `1px solid ${t.gray200}`, boxShadow: shadow.sm, padding: "20px" }}>
              <SectionTitle icon="🏅">Achievements</SectionTitle>
              {badges.length === 0 && (
                <p style={{ fontSize: 12, color: t.gray400, marginBottom: 14, lineHeight: 1.6 }}>
                  You're one step away from your first badge — keep going!
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {BADGE_DEFS.map(def => (
                  <BadgeProgress key={def.id} def={def} data={data} earned={earnedIds.has(def.id)} />
                ))}
              </div>
            </div>

          </div>{/* end right col */}

        </div>{/* end db-grid-main */}
      </div>{/* end db-content */}
    </div>
  );
}
