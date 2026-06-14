// ─── Design tokens (mirrors index.css vars for JS use) ───────────────────────
const t = {
  purple600: "#5c22d4",
  purple700: "#4318a0",
  purple800: "#2d1260",
  purple100: "#f3ecfe",
  purple200: "#e0d0fd",
  purple50:  "#faf7ff",
  yellow400: "#fcd34d",
  yellow500: "#fbbf24",
  white:     "#ffffff",
  gray50:    "#f9f9fb",
  gray100:   "#f2f2f6",
  gray200:   "#e5e5ec",
  gray300:   "#d0d0db",
  gray400:   "#9898a8",
  gray500:   "#6b6b7e",
  gray600:   "#4b4b5c",
  gray900:   "#14141f",
  red500:    "#ef4444",
  red100:    "#fee2e2",
};

const shadow = {
  xs:     "0 1px 2px rgba(14,0,40,0.05)",
  sm:     "0 2px 8px rgba(14,0,40,0.07)",
  md:     "0 4px 20px rgba(14,0,40,0.10)",
  lg:     "0 8px 40px rgba(14,0,40,0.13)",
  purple: "0 8px 32px rgba(92,34,212,0.22)",
  yellow: "0 4px 20px rgba(251,191,36,0.35)",
};

// ─── Shared component styles ──────────────────────────────────────────────────
const card = {
  background: t.white,
  borderRadius: 16,
  border: `1px solid ${t.gray200}`,
  boxShadow: shadow.sm,
  overflow: "hidden",
  transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms ease",
  cursor: "pointer",
  position: "relative",
};

const input = {
  width: "100%",
  padding: "10px 14px",
  background: t.white,
  color: t.gray900,
  fontSize: 14,
  border: `1.5px solid ${t.gray200}`,
  borderRadius: 10,
  outline: "none",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const label = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: t.gray600,
  marginBottom: 6,
  letterSpacing: "0.01em",
};

export const styles = {
  // ── Page shell ──────────────────────────────────────────────────────────────
  page: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: t.gray50,
    minHeight: "100vh",
    color: t.gray900,
  },

  // ── Navbar ──────────────────────────────────────────────────────────────────
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 64,
    background: "rgba(255,255,255,0.80)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid rgba(229,229,236,0.7)`,
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 0 rgba(14,0,40,0.04)",
  },

  logo: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: t.purple600,
    letterSpacing: "-0.3px",
    userSelect: "none",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  navBtn: (active) => ({
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: active ? t.purple100 : "transparent",
    border: active ? `1.5px solid ${t.purple200}` : "1.5px solid transparent",
    borderRadius: 10,
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? t.purple600 : t.gray600,
    transition: "all 180ms ease",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
  }),

  // ── Hero ─────────────────────────────────────────────────────────────────────
  heroBox: {
    background: `linear-gradient(135deg, ${t.purple800} 0%, ${t.purple600} 50%, #7c3aed 100%)`,
    padding: "72px 32px 80px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },

  heroTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: "clamp(32px, 5vw, 56px)",
    fontWeight: 800,
    color: t.white,
    margin: "0 0 16px",
    letterSpacing: "-1px",
    lineHeight: 1.1,
  },

  heroSub: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    margin: "0 0 32px",
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.6,
  },

  heroCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: t.yellow400,
    color: t.gray900,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    boxShadow: shadow.yellow,
    transition: "transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms ease, background 180ms ease",
    letterSpacing: "-0.1px",
  },

  // ── Stats cards ──────────────────────────────────────────────────────────────
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    padding: "32px 32px 0",
    maxWidth: 960,
    margin: "0 auto",
    width: "100%",
  },

  statCard: {
    background: t.white,
    borderRadius: 16,
    border: `1px solid ${t.gray200}`,
    boxShadow: shadow.sm,
    padding: "24px 20px",
    textAlign: "center",
    transition: "transform 200ms ease, box-shadow 200ms ease",
  },

  statValue: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 32,
    fontWeight: 800,
    color: t.purple600,
    lineHeight: 1,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color: t.gray500,
    fontWeight: 500,
  },

  statIcon: {
    fontSize: 22,
    marginBottom: 10,
    display: "block",
  },

  // ── Section headers ──────────────────────────────────────────────────────────
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "36px 32px 16px",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
  },

  sectionTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: t.gray900,
    letterSpacing: "-0.3px",
  },

  sectionLink: {
    fontSize: 13,
    fontWeight: 600,
    color: t.purple600,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: 8,
    transition: "background 180ms ease",
  },

  // ── Grid ─────────────────────────────────────────────────────────────────────
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 20,
    padding: "0 32px 40px",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
  },

  // ── Product card ─────────────────────────────────────────────────────────────
  card: {
    ...card,
    display: "flex",
    flexDirection: "column",
  },

  imageBox: {
    display: "block",
    aspectRatio: "4/3",
    background: t.gray100,
    overflow: "hidden",
    flexShrink: 0,
  },

  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 300ms ease",
  },

  cardBody: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 4,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: t.gray900,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    margin: "14px 16px 4px",
  },

  origPrice: {
    fontSize: 12,
    color: t.gray400,
    textDecoration: "line-through",
    margin: "0 16px",
  },

  price: {
    fontSize: 16,
    fontWeight: 700,
    color: t.gray900,
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "0 16px 4px",
    fontFamily: "'Syne', system-ui, sans-serif",
  },

  college: {
    fontSize: 12,
    color: t.gray400,
    fontWeight: 500,
    margin: "0 16px 14px",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    background: t.yellow100 || "#fef9e7",
    color: "#92400e",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 6,
    letterSpacing: "0.01em",
  },

  heartBtn: (active) => ({
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    background: active ? "#fee2e2" : "rgba(255,255,255,0.9)",
    border: `1.5px solid ${active ? "#fca5a5" : "rgba(0,0,0,0.08)"}`,
    color: active ? t.red500 : t.gray400,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
    boxShadow: shadow.xs,
    transition: "all 180ms ease",
    padding: 0,
  }),

  // ── Buttons ──────────────────────────────────────────────────────────────────
  btn: (variant = "secondary") => ({
    flex: 1,
    padding: "10px 20px",
    borderRadius: 10,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 180ms ease",
    border: "none",
    ...(variant === "primary"
      ? {
          background: t.purple600,
          color: t.white,
          boxShadow: shadow.purple,
        }
      : variant === "cta"
      ? {
          background: t.yellow400,
          color: t.gray900,
          boxShadow: shadow.yellow,
        }
      : {
          background: t.gray100,
          color: t.gray700 || t.gray600,
          border: `1.5px solid ${t.gray200}`,
        }),
  }),

  // ── Forms ────────────────────────────────────────────────────────────────────
  label,
  fullInput: { ...input, marginBottom: 0 },

  formGroup: {
    marginBottom: 16,
  },

  postForm: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "32px 32px 60px",
  },

  formCard: {
    background: t.white,
    borderRadius: 20,
    border: `1px solid ${t.gray200}`,
    boxShadow: shadow.md,
    padding: "32px",
  },

  successBanner: {
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    color: t.red500,
    background: t.red100,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 16,
  },

  // ── Login / Signup ────────────────────────────────────────────────────────────
  loginBox: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    background: `linear-gradient(135deg, ${t.purple800} 0%, ${t.purple600} 100%)`,
  },

  loginCard: {
    background: t.white,
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: shadow.xl,
    textAlign: "left",
  },

  loginTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 24,
    fontWeight: 800,
    color: t.gray900,
    marginBottom: 6,
    letterSpacing: "-0.3px",
  },

  loginSub: {
    fontSize: 14,
    color: t.gray500,
    marginBottom: 24,
  },

  // ── Search & filters ─────────────────────────────────────────────────────────
  searchRow: {
    display: "flex",
    gap: 12,
    padding: "24px 32px 0",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
    alignItems: "center",
  },

  input: { ...input },

  select: {
    ...input,
    flex: "0 0 auto",
    width: "auto",
    minWidth: 160,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239898a8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
    cursor: "pointer",
  },

  catRow: {
    display: "flex",
    gap: 8,
    padding: "16px 32px",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
    flexWrap: "wrap",
  },

  catBtn: (active, hovered) => ({
    padding: "7px 16px",
    borderRadius: 10,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    border: `1.5px solid ${active ? t.purple600 : t.gray200}`,
    background: active ? t.purple600 : hovered ? t.gray100 : t.white,
    color: active ? t.white : t.gray600,
    transition: "all 160ms ease",
    boxShadow: active ? shadow.purple : shadow.xs,
  }),

  // ── Item Detail ──────────────────────────────────────────────────────────────
  detail: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "24px 32px 60px",
  },

  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: t.gray500,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 0",
    marginBottom: 20,
    transition: "color 160ms ease",
  },

  detailImageWrap: {
    display: "block",
    width: "100%",
    aspectRatio: "16/9",
    background: t.gray100,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    boxShadow: shadow.md,
  },

  detailImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  detailTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: t.gray900,
    marginBottom: 12,
    letterSpacing: "-0.4px",
  },

  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  metaBadge: (type) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    ...(type === "info"
      ? { background: t.purple100, color: t.purple600 }
      : type === "success"
      ? { background: "#d1fae5", color: "#065f46" }
      : { background: "#fef9e7", color: "#92400e" }),
  }),

  priceBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "16px 0 24px",
    background: t.gray50,
    borderRadius: 14,
    padding: "16px 20px",
    border: `1px solid ${t.gray200}`,
  },

  bigPrice: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 30,
    fontWeight: 800,
    color: t.purple600,
  },

  actionRow: {
    display: "flex",
    gap: 12,
  },

  // ── Wishlist ──────────────────────────────────────────────────────────────────
  wishlistEmpty: {
    textAlign: "center",
    padding: "80px 32px",
    color: t.gray400,
    fontSize: 16,
    lineHeight: 2,
  },

  // ── Chats ────────────────────────────────────────────────────────────────────
  chatLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    height: "calc(100vh - 64px)",
    overflow: "hidden",
    background: t.gray50,
  },

  chatSidebar: {
    background: t.white,
    borderRight: `1px solid ${t.gray200}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  chatSidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 16px",
    borderBottom: `1px solid ${t.gray100}`,
  },

  chatEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: t.purple600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 2,
  },

  chatSidebarTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: t.gray900,
  },

  chatSidebarCount: {
    background: t.purple100,
    color: t.purple600,
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 20,
  },

  chatList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },

  chatListItem: (active) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: active ? t.purple50 : "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 160ms ease",
    marginBottom: 2,
    outline: "none",
    boxShadow: active ? `inset 0 0 0 1.5px ${t.purple200}` : "none",
  }),

  chatThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: "cover",
    flexShrink: 0,
    background: t.gray100,
    border: `1px solid ${t.gray200}`,
  },

  chatListItemContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  chatListTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chatPartnerName: {
    fontSize: 14,
    fontWeight: 600,
    color: t.gray900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  chatUnreadBadge: {
    background: t.purple600,
    color: t.white,
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: "1px 6px",
    flexShrink: 0,
  },

  chatProductName: {
    fontSize: 12,
    color: t.purple600,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  chatPreview: {
    fontSize: 12,
    color: t.gray400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  chatPanel: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: t.gray50,
  },

  chatPanelEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 8,
    padding: 40,
    textAlign: "center",
  },

  chatEmptyCard: {
    padding: "24px 16px",
    textAlign: "center",
  },

  chatEmptyTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: t.gray900,
    marginBottom: 4,
  },

  chatEmptyText: {
    fontSize: 13,
    color: t.gray400,
    lineHeight: 1.5,
  },

  chatPanelHeader: {
    background: t.white,
    borderBottom: `1px solid ${t.gray200}`,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chatPanelHeaderInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  chatPanelThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    objectFit: "cover",
    border: `1px solid ${t.gray200}`,
  },

  chatPanelTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: t.gray900,
    marginBottom: 2,
    fontFamily: "'Syne', system-ui, sans-serif",
  },

  chatPanelMetaBtn: {
    fontSize: 12,
    color: t.purple600,
    background: t.purple100,
    border: "none",
    borderRadius: 6,
    padding: "2px 8px",
    cursor: "pointer",
    fontWeight: 500,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  chatMessagesPane: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  chatBubbleWrap: (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
  }),

  chatBubble: (mine) => ({
    maxWidth: "72%",
    background: mine ? t.purple600 : t.white,
    color: mine ? t.white : t.gray900,
    borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    padding: "10px 14px",
    boxShadow: shadow.sm,
    border: mine ? "none" : `1px solid ${t.gray200}`,
  }),

  chatBubbleName: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.65,
    marginBottom: 4,
    letterSpacing: "0.02em",
  },

  chatBubbleText: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
  },

  chatComposer: {
    display: "flex",
    gap: 10,
    padding: "12px 16px",
    background: t.white,
    borderTop: `1px solid ${t.gray200}`,
    alignItems: "center",
  },

  chatComposerInput: {
    ...input,
    flex: 1,
    background: t.gray50,
    border: `1.5px solid ${t.gray200}`,
    borderRadius: 12,
  },

  chatComposerBtn: {
    background: t.purple600,
    color: t.white,
    border: "none",
    borderRadius: 12,
    padding: "10px 20px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 180ms ease, transform 120ms ease",
    boxShadow: shadow.purple,
  },
};
