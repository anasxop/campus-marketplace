import { useEffect, useState, useMemo, useRef } from "react";
import {
  fetchUserProfile, fetchRatings, trackProfileVisit,
  checkFollowing, followUser, unfollowUser,
} from "../lib/authApi";
import { ProductCard } from "./HomeRoute";
import { CATEGORY_TREE } from "../data/marketplace";
import ReportModal from "../components/ReportModal";
import Toast from "../components/Toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatJoinDate(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d)) return "Recently";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatJoinDate(dateStr);
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ name, photoURL, size = 88 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#5c22d4","#0ea5e9","#059669","#d97706","#db2777","#ea580c","#7c3aed","#0284c7"];
  const c1 = palette[(name || "").charCodeAt(0) % palette.length];
  const c2 = palette[((name || "").charCodeAt(1) || 2) % palette.length];
  if (photoURL) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden",
        boxShadow: `0 8px 32px rgba(0,0,0,0.20), 0 0 0 4px rgba(255,255,255,0.6)`,
      }}>
        <img src={photoURL} alt={name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800,
      color: "#fff", fontSize: Math.round(size * 0.33),
      boxShadow: `0 8px 32px ${c1}55, 0 0 0 4px rgba(255,255,255,0.6)`,
    }}>
      {initials}
    </div>
  );
}

// ── Trust badge ───────────────────────────────────────────────────────────────
function TrustBadge({ label, emoji, color, bg, border }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: bg, color, border: `1.5px solid ${border}`,
    }}>
      {emoji} {label}
    </span>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ value, label, accent }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 12px", minWidth: 80 }}>
      <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: accent || "#14141f", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#9898a8", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ value, size = 15 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(value) ? "#fbbf24" : "#e5e5ec" }}>★</span>
      ))}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ children, onClick, variant = "outline", icon, disabled }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "9px 18px", borderRadius: 11,
    fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 160ms ease", whiteSpace: "nowrap",
    opacity: disabled ? 0.6 : 1,
  };
  const styles = {
    primary: { background: hov ? "linear-gradient(135deg,#4318a0,#5c22d4)" : "linear-gradient(135deg,#5c22d4,#7c3aed)", color: "#fff", border: "none", boxShadow: hov ? "0 8px 28px rgba(92,34,212,0.38)" : "0 4px 16px rgba(92,34,212,0.28)", transform: hov ? "translateY(-1px)" : "none" },
    outline: { background: hov ? "#f3ecfe" : "#fff", color: hov ? "#5c22d4" : "#6b6b7e", border: `1.5px solid ${hov ? "#c4a8f8" : "#e5e5ec"}`, transform: hov ? "translateY(-1px)" : "none" },
    danger:  { background: hov ? "#fee2e2" : "#fff", color: hov ? "#dc2626" : "#9898a8", border: `1.5px solid ${hov ? "#fca5a5" : "#e5e5ec"}`, transform: hov ? "translateY(-1px)" : "none" },
    green:   { background: hov ? "#d1fae5" : "#f0fdf4", color: "#059669", border: "1.5px solid #6ee7b7", transform: hov ? "translateY(-1px)" : "none" },
  };
  return (
    <button style={{ ...base, ...styles[variant] }} onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
}

// ── Insight row ───────────────────────────────────────────────────────────────
function InsightRow({ icon, label, value, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #f2f2f6" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#14141f" }}>{value}</div>
        <div style={{ fontSize: 11, color: "#9898a8", marginTop: 1 }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: 12, color: "#9898a8", fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div style={{ background: "#faf7ff", border: "1.5px solid #ede8fd", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <UserAvatar name={review.raterName || "User"} photoURL={review.raterPhotoURL || null} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#14141f" }}>{review.raterName || "Student"}</div>
          <div style={{ fontSize: 11, color: "#9898a8" }}>{timeAgo(review.createdAt)}</div>
        </div>
        <Stars value={review.rating} size={13} />
      </div>
      {review.review && <p style={{ fontSize: 13, color: "#4b4b5c", margin: 0, lineHeight: 1.6 }}>{review.review}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicProfileRoute({
  userId, currentUser, listings, openItem, openConversation, navigateBack, sessionToken,
}) {
  const isOwnProfile = String(currentUser?.id) === String(userId);

  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [catFilter, setCatFilter] = useState("All");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportToast, setReportToast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Real follower state
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Real seller stats from server
  const [serverStats, setServerStats] = useState({
    responseRate: null,
    avgResponseTimeMinutes: null,
    profileVisitCount: 0,
  });

  // Track profile visit — ref guard prevents firing twice in React Strict Mode
  // and on component remounts within the same page load.
  const visitTrackedRef = useRef(false);
  useEffect(() => {
    if (visitTrackedRef.current) return;
    if (userId && currentUser && String(userId) !== String(currentUser.id)) {
      visitTrackedRef.current = true;
      trackProfileVisit(userId, sessionToken);
    }
  }, [userId, currentUser, sessionToken]);

  // Load profile, ratings, and follow state
  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchUserProfile(userId).catch(() => null),
      fetchRatings(userId).catch(() => ({ stats: { avg: 0, count: 0 }, reviews: [] })),
      (!isOwnProfile && sessionToken)
        ? checkFollowing(sessionToken, userId).catch(() => ({ isFollowing: false }))
        : Promise.resolve({ isFollowing: false }),
    ]).then(([profileData, ratingData, followData]) => {
      if (profileData) {
        setProfile(profileData.user || profileData);
        // Real follower/following counts from server
        setFollowerCount(profileData.followerCount ?? 0);
        setFollowingCount(profileData.followingCount ?? 0);
        setServerStats({
          responseRate: profileData.responseRate ?? null,
          avgResponseTimeMinutes: profileData.avgResponseTimeMinutes ?? null,
          profileVisitCount: profileData.profileVisitCount ?? 0,
        });
      }
      setRatings(ratingData || { stats: { avg: 0, count: 0 }, reviews: [] });
      setIsFollowing(followData?.isFollowing ?? false);
    }).catch(() => setError("Could not load this profile."))
      .finally(() => setLoading(false));
  }, [userId, sessionToken, isOwnProfile]);

  // User's listings from the local listings array
  const userListings = useMemo(() =>
    listings.filter(l => String(l.ownerId || "") === String(userId) || (profile && l.seller === profile.name)),
  [listings, userId, profile]);

  const activeListings = userListings.filter(l => (l.status || "available") !== "sold");
  const soldListings   = userListings.filter(l => l.status === "sold");

  const tabListings = useMemo(() => {
    const base = activeTab === "sold" ? soldListings : activeListings;
    if (catFilter === "All") return base;
    return base.filter(l => {
      const lc = l.category?.toLowerCase();
      if (lc === catFilter.toLowerCase()) return true;
      const subs = CATEGORY_TREE[catFilter]?.subcategories || [];
      return subs.some(s => s.toLowerCase() === lc);
    });
  }, [activeTab, activeListings, soldListings, catFilter]);

  const handleFollow = async () => {
    if (!sessionToken || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const data = await unfollowUser(sessionToken, userId);
        setIsFollowing(false);
        setFollowerCount(data.followerCount ?? Math.max(0, followerCount - 1));
      } else {
        const data = await followUser(sessionToken, userId);
        setIsFollowing(true);
        setFollowerCount(data.followerCount ?? followerCount + 1);
      }
    } catch {}
    finally { setFollowLoading(false); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/user/${userId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleMessage = () => {
    const target = activeListings[0];
    if (!target) {
      // No active listings to message about — navigate to chats anyway if there's an existing convo
      window.location.hash = "/chats";
      return;
    }
    openConversation(target.id);
  };

  // Real ratings data
  const avgRating   = ratings?.stats?.avg ?? null;
  const reviewCount = ratings?.stats?.count ?? 0;
  const reviewList  = ratings?.reviews ?? [];

  // Format response time honestly
  const formatResponseTime = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.round(minutes / 60);
    return `${h} hr${h !== 1 ? "s" : ""}`;
  };

  // Real badges — only awarded when criteria are actually met
  const badges = [
    // Campus Verified: user has set a college
    profile?.college && {
      label: "Campus Verified", emoji: "🎓",
      color: "#1e40af", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#bfdbfe",
    },
    // Top Seller: real avg rating >= 4.5 AND at least 3 reviews
    (avgRating !== null && avgRating >= 4.5 && reviewCount >= 3) && {
      label: "Top Seller", emoji: "🏆",
      color: "#92400e", bg: "linear-gradient(135deg,#fef9e7,#fde68a)", border: "#fcd34d",
    },
    // Trusted Member: real response rate >= 80% based on actual conversations
    (serverStats.responseRate !== null && serverStats.responseRate >= 80) && {
      label: "Trusted Member", emoji: "🛡️",
      color: "#5c22d4", bg: "linear-gradient(135deg,#f3ecfe,#ece0fd)", border: "#e0d0fd",
    },
    // Verified Seller: has at least 1 completed review
    reviewCount >= 1 && {
      label: "Verified Seller", emoji: "✅",
      color: "#065f46", bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)", border: "#6ee7b7",
    },
  ].filter(Boolean);

  const name     = profile?.name || (isOwnProfile ? currentUser?.name : "User");
  const college  = profile?.college || (isOwnProfile ? currentUser?.college : "");
  const joinDate = profile?.createdAt || (isOwnProfile ? currentUser?.createdAt : null);

  if (loading) return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9fb" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e0d0fd", borderTopColor: "#5c22d4", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#9898a8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading profile…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9fb" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: 18, color: "#14141f" }}>Profile not found</p>
        <p style={{ color: "#9898a8", marginTop: 6, marginBottom: 20 }}>{error}</p>
        <ActionBtn variant="primary" onClick={navigateBack}>← Go Back</ActionBtn>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f9f9fb", minHeight: "calc(100vh - 64px)", paddingBottom: 80 }}>

      {/* ── Hero banner ── */}
      <div style={{ background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 100%)", padding: "40px 32px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(252,211,77,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", backdropFilter: "blur(8px)", marginBottom: 20, transition: "all 160ms ease" }}
            onClick={navigateBack}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          >
            ← Back
          </button>
          {isOwnProfile && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.35)", color: "#fde68a", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 999, letterSpacing: "0.10em", textTransform: "uppercase", marginLeft: 12 }}>
              👁️ Your public profile
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "-68px auto 0", padding: "0 32px", boxSizing: "border-box", position: "relative", zIndex: 10 }}>
        <div className="pub-profile-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

          {/* ═══ LEFT SIDEBAR ═══ */}
          <div>

            {/* Profile card */}
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e5e5ec", boxShadow: "0 8px 40px rgba(14,0,40,0.12)", padding: "28px 24px", marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>

              {/* Avatar + name */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ display: "inline-block", position: "relative", marginBottom: 14 }}>
                  <UserAvatar name={name} photoURL={profile?.photoURL || (isOwnProfile ? currentUser?.photoURL : null)} size={88} />
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#22c55e", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(34,197,94,0.4)" }} />
                </div>
                <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: "#14141f", margin: "0 0 4px", letterSpacing: "-0.3px" }}>{name || "User"}</h1>
                {college && (
                  <p style={{ fontSize: 13, color: "#5c22d4", fontWeight: 600, margin: "0 0 4px" }}>🎓 {college}</p>
                )}
                <p style={{ fontSize: 12, color: "#9898a8", margin: "0 0 14px" }}>📅 Joined {formatJoinDate(joinDate)}</p>

                {/* Real trust badges only */}
                {badges.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                    {badges.map(b => <TrustBadge key={b.label} {...b} />)}
                  </div>
                )}

                {/* Seller rating — only if real reviews exist */}
                {reviewCount > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                    <Stars value={avgRating} size={16} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#14141f" }}>{avgRating.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: "#9898a8" }}>({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#9898a8", margin: "0 0 8px" }}>No ratings yet</p>
                )}
              </div>

              {/* Real stats row */}
              <div style={{ display: "flex", justifyContent: "center", gap: 0, borderTop: "1px solid #f2f2f6", borderBottom: "1px solid #f2f2f6", margin: "0 -8px 18px" }}>
                <StatPill value={activeListings.length} label="Active" accent="#5c22d4" />
                <div style={{ width: 1, background: "#f2f2f6", alignSelf: "stretch" }} />
                <StatPill value={soldListings.length} label="Sold" accent="#059669" />
                <div style={{ width: 1, background: "#f2f2f6", alignSelf: "stretch" }} />
                <StatPill value={followerCount} label="Followers" />
                <div style={{ width: 1, background: "#f2f2f6", alignSelf: "stretch" }} />
                <StatPill value={followingCount} label="Following" />
              </div>

              {/* Action buttons */}
              {isOwnProfile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <ActionBtn variant="primary" icon="✏️" onClick={() => window.location.hash = "/profile"}>
                    Edit My Profile
                  </ActionBtn>
                  <ActionBtn variant="outline" icon="🔗" onClick={handleShare}>
                    {copied ? "✅ Link copied!" : "Share Profile"}
                  </ActionBtn>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <ActionBtn
                    variant={isFollowing ? "green" : "primary"}
                    icon={isFollowing ? "✅" : "➕"}
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                  </ActionBtn>
                  <ActionBtn variant="outline" icon="💬" onClick={handleMessage}>
                    Message
                  </ActionBtn>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ActionBtn variant="outline" icon="🔗" onClick={handleShare}>
                        {copied ? "Copied!" : "Share"}
                      </ActionBtn>
                    </div>
                    <div style={{ flex: 1 }}>
                      <ActionBtn variant="danger" icon="⚑" onClick={() => setShowReport(true)}>
                        Report
                      </ActionBtn>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real seller insights */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", boxShadow: "0 4px 20px rgba(14,0,40,0.07)", padding: "22px 20px", marginBottom: 20, animation: "fadeUp 0.4s ease 80ms both" }}>
              <h3 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 14, fontWeight: 800, color: "#14141f", margin: "0 0 4px" }}>Seller Insights</h3>
              <p style={{ fontSize: 11, color: "#9898a8", margin: "0 0 16px" }}>Based on real activity & reviews</p>

              <InsightRow
                icon="⭐"
                label="Seller Rating"
                value={reviewCount > 0 ? `${avgRating.toFixed(1)} / 5.0` : "No ratings yet"}
                sub={reviewCount > 0 ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : ""}
              />
              <InsightRow
                icon="💬"
                label="Response Rate"
                value={serverStats.responseRate !== null ? `${serverStats.responseRate}%` : "Not enough data"}
              />
              <InsightRow
                icon="⚡"
                label="Avg Response Time"
                value={formatResponseTime(serverStats.avgResponseTimeMinutes) || "Not enough data"}
              />
              <InsightRow icon="📦" label="Total Listings" value={userListings.length} />

              {/* Profile visits — only shown on own profile */}
              {isOwnProfile && (
                <InsightRow
                  icon="👁️"
                  label="Profile Views"
                  value={serverStats.profileVisitCount}
                  sub="All time"
                />
              )}
            </div>

          </div>

          {/* ═══ RIGHT PANEL ═══ */}
          <div>

            {/* Tabs */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec", boxShadow: "0 4px 20px rgba(14,0,40,0.07)", padding: "16px 20px 0", marginBottom: 20, animation: "fadeUp 0.4s ease 40ms both" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  ["active",  `Active (${activeListings.length})`],
                  ["sold",    `Sold (${soldListings.length})`],
                  ["reviews", `Reviews (${reviewCount})`],
                ].map(([key, label]) => {
                  const isActive = activeTab === key;
                  return (
                    <button key={key}
                      style={{ padding: "10px 18px", borderRadius: "10px 10px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", border: "none", borderBottom: isActive ? "2.5px solid #5c22d4" : "2.5px solid transparent", background: "transparent", color: isActive ? "#5c22d4" : "#9898a8", transition: "all 160ms ease" }}
                      onClick={() => setActiveTab(key)}
                    >{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Reviews tab */}
            {activeTab === "reviews" && (
              <div style={{ animation: "fadeUp 0.3s ease both" }}>
                {reviewList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 32px", background: "#fff", borderRadius: 20, border: "1px solid #e5e5ec" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                    <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", fontSize: 16 }}>No reviews yet</p>
                    <p style={{ color: "#9898a8", fontSize: 13, marginTop: 6 }}>Reviews appear here after a sale is completed.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reviewList.map((r, i) => <ReviewCard key={i} review={r} />)}
                  </div>
                )}
              </div>
            )}

            {/* Listings tabs */}
            {activeTab !== "reviews" && (
              <>
                {/* Category filter */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {["All", ...Object.keys(CATEGORY_TREE)].map(cat => {
                    const isActive = catFilter === cat;
                    return (
                      <button key={cat}
                        style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${isActive ? "#5c22d4" : "#e5e5ec"}`, background: isActive ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : "#fff", color: isActive ? "#fff" : "#6b6b7e", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: isActive ? 700 : 500, fontSize: 12, cursor: "pointer", transition: "all 140ms ease", whiteSpace: "nowrap" }}
                        onClick={() => setCatFilter(cat)}
                      >{cat}</button>
                    );
                  })}
                </div>

                {tabListings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 32px", background: "linear-gradient(135deg,#faf7ff,#f3ecfe)", borderRadius: 20, border: "1.5px dashed #e0d0fd" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                    <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#14141f", fontSize: 16, margin: 0 }}>
                      {activeTab === "sold" ? "No sold items" : "No active listings"}
                    </p>
                    <p style={{ color: "#9898a8", fontSize: 13, marginTop: 6 }}>
                      {catFilter !== "All" ? "Try a different category filter." : (isOwnProfile && activeTab === "active" ? "Start selling — list your first item!" : "Nothing listed yet.")}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18, animation: "fadeUp 0.3s ease both" }}>
                    {tabListings.map((item, idx) => (
                      <ProductCard
                        key={item.id} item={item}
                        discount={(o, p) => Math.round(((o - p) / o) * 100)}
                        isWished={false} onToggleWishlist={() => {}}
                        onClick={() => openItem(item.id)}
                        hovered={hoveredCard === item.id}
                        onHover={() => setHoveredCard(item.id)}
                        onLeave={() => setHoveredCard(null)}
                        animDelay={idx * 30}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Report modal ── */}
      <ReportModal
        open={showReport && !isOwnProfile}
        onClose={() => setShowReport(false)}
        targetType="user"
        targetId={userId}
        targetLabel={name}
        sessionToken={sessionToken}
        onSubmitted={() => setReportToast(true)}
      />
      <Toast show={reportToast} message="Report submitted successfully." onDone={() => setReportToast(false)} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
