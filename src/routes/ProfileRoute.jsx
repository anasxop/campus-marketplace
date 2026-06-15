import { useState, useRef, useEffect } from "react";
import { ProductCard } from "./HomeRoute";
import UniversityDropdown from "../components/UniversityDropdown";
import { STATUS_CONFIG, LISTING_STATUSES, normalizeStatus } from "../lib/listingStatus";

function formatJoinDate(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d)) return "Recently";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const c = {
  purple: "#5c22d4", purpleLight: "#7c3aed", purpleBg: "#f3ecfe",
  purpleBorder: "#e0d0fd", purpleMuted: "#9f67f5",
  green: "#22c55e", greenBg: "#d1fae5", greenText: "#065f46",
  red: "#dc2626", redBg: "#fee2e2", redBorder: "#fca5a5",
  text: "#14141f", muted: "#9898a8", subtle: "#6b6b7e",
  border: "#e5e5ec", bg: "#f9f9fb", white: "#fff",
  inputBg: "#faf7ff",
};

const inp = {
  width: "100%", padding: "11px 14px", background: c.inputBg, color: c.text,
  fontSize: 14, border: `1.5px solid ${c.border}`, borderRadius: 12, outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
};
const focusH = {
  onFocus: e => Object.assign(e.target.style, { borderColor: c.purple, boxShadow: "0 0 0 3px rgba(92,34,212,0.12)" }),
  onBlur:  e => Object.assign(e.target.style, { borderColor: c.border, boxShadow: "none" }),
};

function Label({ children }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b4b5c", marginBottom: 7, letterSpacing: "0.03em", textTransform: "uppercase" }}>{children}</label>;
}

function SuccessBanner({ msg }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", color: c.greenText, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16, border: "1px solid #6ee7b7", display: "flex", alignItems: "center", gap: 8 }}>
      ✅ {msg}
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#fee2e2,#fecaca)", color: c.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16, border: `1px solid ${c.redBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
      ⚠️ {msg}
    </div>
  );
}

function SectionCard({ title, icon, children, extra }) {
  return (
    <div style={{ background: c.white, borderRadius: 20, border: `1px solid ${c.border}`, boxShadow: "0 4px 20px rgba(14,0,40,0.07)", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <h3 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 15, fontWeight: 800, color: c.text, margin: 0 }}>{title}</h3>
        </div>
        {extra}
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      style={{ padding: "10px 20px", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer", border: "none", background: active ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : c.white, color: active ? c.white : c.subtle, boxShadow: active ? "0 4px 16px rgba(92,34,212,0.28)" : "0 2px 8px rgba(14,0,40,0.06)", transition: "all 160ms ease" }}
      onClick={onClick}
    >{children}</button>
  );
}

function SaveBtn({ pending, onClick, label = "Save changes" }) {
  return (
    <button
      style={{ padding: "11px 28px", background: pending ? c.purpleMuted : "linear-gradient(135deg,#5c22d4,#7c3aed)", color: c.white, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, borderRadius: 12, border: "none", cursor: pending ? "wait" : "pointer", boxShadow: "0 4px 20px rgba(92,34,212,0.25)", transition: "all 180ms ease", whiteSpace: "nowrap" }}
      onClick={onClick} disabled={pending}
      onMouseEnter={e => { if (!pending) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(92,34,212,0.35)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(92,34,212,0.25)"; }}
    >{pending ? "Saving…" : label}</button>
  );
}

// ── Avatar with photo support ──────────────────────────────────────────────────
function AvatarEditor({ user, photoURL, uploading, onUpload }) {
  const fileRef = useRef();
  const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#5c22d4", "#0ea5e9", "#059669", "#d97706", "#db2777"];
  const ac1 = palette[(user?.name || "").charCodeAt(0) % palette.length];
  const ac2 = palette[((user?.name || "").charCodeAt(1) || 0) % palette.length];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg,${ac1},${ac2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 24px ${ac1}44`, border: "3px solid rgba(255,255,255,0.8)", flexShrink: 0 }}>
        {photoURL
          ? <img src={photoURL} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 32, fontWeight: 800, color: "#fff" }}>{initials}</span>
        }
      </div>

      {/* Upload overlay button */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "none", cursor: uploading ? "wait" : "pointer", background: "rgba(14,0,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3, opacity: uploading ? 1 : 0, transition: "opacity 180ms ease" }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = "0"; }}
        title="Change photo"
      >
        {uploading
          ? <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          : <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, letterSpacing: "0.04em" }}>EDIT</span>
            </>
        }
      </button>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />

      {/* Online dot */}
      <div style={{ position: "absolute", bottom: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: c.green, border: "2.5px solid #fff", boxShadow: "0 2px 6px rgba(34,197,94,0.4)" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ProfileRoute({
  user, listedItems, onSaveProfile, onDeleteListing, openItem, sessionToken,
  onChangePassword, onLinkGoogle, onUnlinkGoogle, onUploadPhoto, onStatusChange,
}) {
  // ── Profile fields ──────────────────────────────────────────────────────────
  const [name,     setName]     = useState(user?.name     || "");
  const [college,  setCollege]  = useState(user?.college  || "");
  const [bio,      setBio]      = useState(user?.bio      || "");
  const [username, setUsername] = useState(user?.username || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [profilePending,   setProfilePending]   = useState(false);
  const [profileError,     setProfileError]     = useState("");
  const [profileSaved,     setProfileSaved]     = useState(false);
  const [photoUploading,   setPhotoUploading]   = useState(false);
  const [activeTab,        setActiveTab]        = useState("listings");
  const [hoveredCard,      setHoveredCard]      = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(null);
  const [statusMenuOpen,   setStatusMenuOpen]   = useState(null); // itemId of open status menu
  const [statusUpdating,   setStatusUpdating]   = useState(null); // itemId currently saving
  const [statusErrors,     setStatusErrors]     = useState({});   // itemId -> error message

  // ── Password change ─────────────────────────────────────────────────────────
  const [pwOpen,      setPwOpen]      = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwPending,   setPwPending]   = useState(false);
  const [pwError,     setPwError]     = useState("");
  const [pwSuccess,   setPwSuccess]   = useState("");
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [showCurPw,   setShowCurPw]   = useState(false);

  // ── Google linking ──────────────────────────────────────────────────────────
  const [googlePending, setGooglePending] = useState(false);
  const [googleMsg,     setGoogleMsg]     = useState("");
  const [googleErr,     setGoogleErr]     = useState("");

  const hasPassword = !!user?.hasPassword;
  const hasGoogle   = !!user?.googleId;

  // ── Sync with user prop if it changes externally (e.g. after Google link/unlink) ──
  useEffect(() => {
    if (!user) return;
    setName(prev     => prev !== user.name     ? user.name     || "" : prev);
    setCollege(prev  => prev !== user.college  ? user.college  || "" : prev);
    setBio(prev      => prev !== user.bio      ? user.bio      || "" : prev);
    setUsername(prev => prev !== user.username ? user.username || "" : prev);
    // Only update photoURL if user already has one and local state is empty
    setPhotoURL(prev => !prev && user.photoURL ? user.photoURL : prev);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!name.trim() || !college.trim()) { setProfileError("Display name and college are required."); return; }
    setProfilePending(true); setProfileError("");
    try {
      await onSaveProfile({ name: name.trim(), college: college.trim(), bio: bio.trim(), username: username.trim(), photoURL: photoURL.trim() });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2800);
    } catch (e) { setProfileError(e.message || "Unable to update profile."); }
    finally { setProfilePending(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setProfileError("Please select an image file."); return; }
    setPhotoUploading(true);
    try {
      const url = await onUploadPhoto(file);
      setPhotoURL(url);
    } catch (err) { setProfileError(err.message || "Photo upload failed."); }
    finally { setPhotoUploading(false); }
  };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!newPw || newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw)         { setPwError("Passwords do not match."); return; }
    if (hasPassword && !currentPw)   { setPwError("Enter your current password to continue."); return; }
    setPwPending(true);
    try {
      await onChangePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setPwSuccess(""); setPwOpen(false); }, 2500);
    } catch (e) { setPwError(e.message || "Failed to change password."); }
    finally { setPwPending(false); }
  };

  const handleUnlinkGoogle = async () => {
    setGoogleErr(""); setGoogleMsg("");
    setGooglePending(true);
    try {
      await onUnlinkGoogle();
      setGoogleMsg("Google account unlinked.");
    } catch (e) { setGoogleErr(e.message || "Failed to unlink Google."); }
    finally { setGooglePending(false); }
  };

  // ── Listing status management ────────────────────────────────────────────────
  const handleListingStatusChange = async (itemId, next) => {
    setStatusUpdating(itemId);
    setStatusErrors(prev => ({ ...prev, [itemId]: "" }));
    try {
      await onStatusChange(itemId, next);
      setStatusMenuOpen(null);
    } catch (e) {
      setStatusErrors(prev => ({ ...prev, [itemId]: e.message || "Failed to update status." }));
    } finally {
      setStatusUpdating(null);
    }
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  const initials  = (user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette   = ["#5c22d4", "#0ea5e9", "#059669", "#d97706", "#db2777"];
  const ac1 = palette[(user?.name || "").charCodeAt(0) % palette.length];

  // ── Eye toggle button ────────────────────────────────────────────────────────
  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle}
      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 4, display: "flex", alignItems: "center" }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  return (
    <div style={{ paddingBottom: 80, background: c.bg, minHeight: "calc(100vh - 64px)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .profile-input:focus { border-color: ${c.purple} !important; box-shadow: 0 0 0 3px rgba(92,34,212,0.12) !important; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg, #1e0757 0%, #2d1260 30%, #5c22d4 100%)", padding: "36px 32px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(252,211,77,0.06)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>My Profile</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", margin: 0 }}>Manage your account, listings, and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "-48px auto 0", padding: "0 32px", boxSizing: "border-box", position: "relative", zIndex: 10 }}>

        {/* ═══ PROFILE HEADER CARD ═══ */}
        <div style={{ background: c.white, borderRadius: 24, border: `1px solid ${c.border}`, boxShadow: "0 8px 40px rgba(14,0,40,0.12)", padding: "28px 32px", marginBottom: 24, animation: "fadeUp 0.35s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <AvatarEditor user={user} photoURL={photoURL} uploading={photoUploading} onUpload={handlePhotoUpload} />

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 22, fontWeight: 800, color: c.text, letterSpacing: "-0.3px", margin: 0 }}>
                  {user?.name || "Your Name"}
                </h2>
                {user?.username && (
                  <span style={{ fontSize: 13, color: c.purple, fontWeight: 700 }}>@{user.username}</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: c.muted, margin: "3px 0 8px" }}>{user?.email}</p>
              {user?.bio && (
                <p style={{ fontSize: 13, color: c.subtle, margin: "0 0 8px", lineHeight: 1.5, maxWidth: 500 }}>{user.bio}</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {user?.college && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.purpleBg, color: c.purple, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: `1px solid ${c.purpleBorder}` }}>
                    🎓 {user.college}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f9f9fb", color: c.muted, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: `1px solid ${c.border}` }}>
                  📅 Joined {formatJoinDate(user?.createdAt)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f9f9fb", color: c.muted, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: `1px solid ${c.border}` }}>
                  🛍️ {listedItems.length} listing{listedItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <button
              title="View your public profile"
              style={{ padding: "9px 18px", background: c.purpleBg, color: c.purple, border: `1.5px solid ${c.purpleBorder}`, borderRadius: 11, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", transition: "all 160ms ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#ece0fd"; }}
              onMouseLeave={e => { e.currentTarget.style.background = c.purpleBg; }}
              onClick={() => { window.location.hash = `/user/${user?.id}`; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Public Profile
            </button>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            ["listings",  `My Listings (${listedItems.length})`],
            ["edit",      "✏️ Edit Profile"],
            ["account",   "⚙️ Account Settings"],
          ].map(([key, label]) => (
            <TabBtn key={key} active={activeTab === key} onClick={() => setActiveTab(key)}>{label}</TabBtn>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: EDIT PROFILE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "edit" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>

            {/* Profile Photo */}
            <SectionCard title="Profile Photo" icon="📸">
              <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <AvatarEditor user={user} photoURL={photoURL} uploading={photoUploading} onUpload={handlePhotoUpload} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: "0 0 4px" }}>
                    {photoUploading ? "Uploading…" : "Change your profile photo"}
                  </p>
                  <p style={{ fontSize: 12, color: c.muted, margin: "0 0 14px" }}>
                    Hover over the avatar and click to upload. PNG, JPG or WEBP accepted.
                  </p>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: c.purpleBg, color: c.purple, border: `1.5px solid ${c.purpleBorder}`, borderRadius: 11, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 160ms ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ece0fd"}
                    onMouseLeave={e => e.currentTarget.style.background = c.purpleBg}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload Photo
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                  </label>
                  {photoURL && (
                    <button onClick={() => setPhotoURL("")}
                      style={{ marginLeft: 10, padding: "9px 16px", background: "#fff", color: c.muted, border: `1.5px solid ${c.border}`, borderRadius: 11, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Basic Info */}
            <SectionCard title="Basic Information" icon="👤">
              {profileError && <ErrorBanner msg={profileError} />}
              {profileSaved && <SuccessBanner msg="Profile updated successfully!" />}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <Label>Display name *</Label>
                  <input style={inp} value={name} onChange={e => setName(e.target.value)} {...focusH} placeholder="Your full name" />
                </div>
                <div>
                  <Label>Username</Label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: c.muted, fontSize: 14, fontWeight: 600, pointerEvents: "none" }}>@</span>
                    <input style={{ ...inp, paddingLeft: 28 }} value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} {...focusH} placeholder="your_username" />
                  </div>
                  <p style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>Letters, numbers and underscores only</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <UniversityDropdown
                  value={college}
                  onChange={val => setCollege(val)}
                  disabled={profilePending}
                  label="College / University *"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <Label>Bio</Label>
                <textarea
                  style={{ ...inp, minHeight: 90, resize: "vertical", lineHeight: 1.55 }}
                  value={bio} onChange={e => setBio(e.target.value)}
                  {...focusH}
                  placeholder="Tell other students a bit about yourself — your interests, what you're selling, or what you study…"
                  maxLength={300}
                />
                <p style={{ fontSize: 11, color: bio.length > 260 ? "#d97706" : c.muted, marginTop: 4, textAlign: "right" }}>{bio.length}/300</p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <SaveBtn pending={profilePending} onClick={saveProfile} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: ACCOUNT SETTINGS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "account" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>

            {/* Change Password */}
            <SectionCard
              title="Password"
              icon="🔐"
              extra={
                <button
                  onClick={() => { setPwOpen(o => !o); setPwError(""); setPwSuccess(""); }}
                  style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", background: pwOpen ? c.purpleBg : "#f9f9fb", color: pwOpen ? c.purple : c.subtle, border: `1.5px solid ${pwOpen ? c.purpleBorder : c.border}`, borderRadius: 9, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", transition: "all 140ms ease" }}
                >
                  {pwOpen ? "Cancel" : hasPassword ? "Change Password" : "Set Password"}
                </button>
              }
            >
              {!pwOpen ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔒</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0 }}>{hasPassword ? "Password is set" : "No password set"}</p>
                    <p style={{ fontSize: 12, color: c.muted, margin: "2px 0 0" }}>{hasPassword ? "Use the button to change your password." : "Set a password to log in with email."}</p>
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 440 }}>
                  {pwError   && <ErrorBanner msg={pwError} />}
                  {pwSuccess && <SuccessBanner msg={pwSuccess} />}

                  {hasPassword && (
                    <div style={{ marginBottom: 14 }}>
                      <Label>Current password</Label>
                      <div style={{ position: "relative" }}>
                        <input type={showCurPw ? "text" : "password"} style={{ ...inp, paddingRight: 44 }} value={currentPw} onChange={e => setCurrentPw(e.target.value)} {...focusH} placeholder="Your current password" />
                        <EyeBtn show={showCurPw} onToggle={() => setShowCurPw(v => !v)} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    <Label>New password</Label>
                    <div style={{ position: "relative" }}>
                      <input type={showNewPw ? "text" : "password"} style={{ ...inp, paddingRight: 44 }} value={newPw} onChange={e => setNewPw(e.target.value)} {...focusH} placeholder="At least 6 characters" />
                      <EyeBtn show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <Label>Confirm new password</Label>
                    <input type="password" style={inp} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} {...focusH} placeholder="Repeat new password" />
                  </div>

                  <SaveBtn pending={pwPending} onClick={handleChangePassword} label={hasPassword ? "Change Password" : "Set Password"} />
                </div>
              )}
            </SectionCard>

            {/* Linked Accounts */}
            <SectionCard title="Linked Accounts" icon="🔗">
              {googleMsg && <SuccessBanner msg={googleMsg} />}
              {googleErr && <ErrorBanner msg={googleErr} />}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f9f9fb", borderRadius: 12, border: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Google SVG icon */}
                  <svg width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.4 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.2 29 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 15.5l6.6 4.8C14.4 17 18.9 14 24 14c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 8.2 29 6 24 6 16.3 6 9.7 9.9 6.3 15.5z"/><path fill="#4CAF50" d="M24 46c5 0 9.5-1.9 12.9-4.9l-6-5.2C29.2 37.6 26.7 38.5 24 38.5c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 42 16.2 46 24 46z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6 5.2C43 35.1 45 31 45 26c0-1.3-.1-2.6-.4-3.9z"/></svg>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0 }}>Google</p>
                    <p style={{ fontSize: 12, color: c.muted, margin: "2px 0 0" }}>{hasGoogle ? "Connected — sign in with Google enabled" : "Not connected"}</p>
                  </div>
                </div>

                {hasGoogle ? (
                  <button
                    onClick={handleUnlinkGoogle} disabled={googlePending}
                    style={{ padding: "7px 16px", background: "#fff", color: c.red, border: `1.5px solid ${c.redBorder}`, borderRadius: 9, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 140ms ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = c.redBg}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    {googlePending ? "…" : "Unlink"}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: c.muted, fontStyle: "italic" }}>Link via Google sign-in</span>
                )}
              </div>
            </SectionCard>

            {/* Account Info (read-only) */}
            <SectionCard title="Account Info" icon="ℹ️">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  ["Email", user?.email || "—"],
                  ["User ID", user?.id ? `#${user.id}` : "—"],
                  ["Member since", formatJoinDate(user?.createdAt)],
                  ["Auth method", user?.googleId ? "Google" : "Email / Password"],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "12px 14px", background: "#f9f9fb", borderRadius: 10, border: `1px solid ${c.border}` }}>
                    <p style={{ fontSize: 11, color: c.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0, wordBreak: "break-all" }}>{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: MY LISTINGS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "listings" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            {listedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 32px", background: "linear-gradient(135deg, #faf7ff, #f3ecfe)", borderRadius: 24, border: "1.5px dashed #e0d0fd" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
                <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: c.text, fontSize: 18, marginBottom: 8 }}>No listings yet</p>
                <p style={{ color: c.muted, fontSize: 14, marginBottom: 20 }}>You haven't listed any items. Start selling on Campus Marketplace!</p>
                <button
                  onClick={() => { window.location.hash = "/sell"; }}
                  style={{ padding: "12px 28px", background: "linear-gradient(135deg,#5c22d4,#7c3aed)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 20px rgba(92,34,212,0.30)" }}
                >
                  + List your first item
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                {listedItems.map((item, idx) => {
                  const itemStatus = normalizeStatus(item.status);
                  return (
                  <div key={item.id} style={{ position: "relative" }}>
                    <ProductCard
                      item={item}
                      discount={(orig, price) => Math.round(((orig - price) / orig) * 100)}
                      isWished={false}
                      onToggleWishlist={() => {}}
                      onClick={() => openItem(item.id)}
                      hovered={hoveredCard === item.id}
                      onHover={() => setHoveredCard(item.id)}
                      onLeave={() => setHoveredCard(null)}
                      animDelay={idx * 40}
                    />

                    {/* ── Status management ── */}
                    <div style={{ marginTop: 8, position: "relative" }}>
                      <button
                        disabled={statusUpdating === item.id}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "8px 10px", borderRadius: 10,
                          border: `1.5px solid ${STATUS_CONFIG[itemStatus].border}`,
                          background: STATUS_CONFIG[itemStatus].bg,
                          color: STATUS_CONFIG[itemStatus].color,
                          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 12,
                          cursor: statusUpdating === item.id ? "wait" : "pointer", transition: "all 160ms ease",
                        }}
                        onClick={() => setStatusMenuOpen(statusMenuOpen === item.id ? null : item.id)}
                      >
                        {statusUpdating === item.id
                          ? "Updating…"
                          : <>{STATUS_CONFIG[itemStatus].emoji} {STATUS_CONFIG[itemStatus].label} <span style={{ marginLeft: 2, fontSize: 10 }}>▾</span></>}
                      </button>

                      {statusMenuOpen === item.id && (
                        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: 12, border: `1.5px solid ${c.border}`, boxShadow: "0 12px 40px rgba(14,0,40,0.18)", zIndex: 20, overflow: "hidden" }}>
                          {LISTING_STATUSES.map(opt => {
                            const cfg = STATUS_CONFIG[opt];
                            const active = itemStatus === opt;
                            return (
                              <button
                                key={opt}
                                style={{
                                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                                  padding: "10px 14px", border: "none", background: active ? cfg.bg : "#fff",
                                  color: active ? cfg.color : c.text, fontFamily: "'DM Sans', system-ui, sans-serif",
                                  fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left",
                                  transition: "background 120ms ease",
                                }}
                                onClick={() => handleListingStatusChange(item.id, opt)}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = c.bg; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "#fff"; }}
                              >
                                {cfg.emoji} Mark as {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {statusErrors[item.id] && (
                        <p style={{ fontSize: 11, color: c.red, fontWeight: 600, margin: "6px 0 0", textAlign: "center" }}>⚠️ {statusErrors[item.id]}</p>
                      )}
                    </div>

                    {deleteConfirm === item.id ? (
                      <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "#fff", borderRadius: 12, border: `1.5px solid ${c.redBorder}`, padding: "10px 14px", boxShadow: "0 8px 32px rgba(220,38,38,0.15)", zIndex: 10 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: c.red, margin: "0 0 8px", textAlign: "center" }}>Delete this listing?</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ flex: 1, padding: "7px", background: "#f9f9fb", color: c.subtle, border: `1px solid ${c.border}`, borderRadius: 8, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                          <button style={{ flex: 1, padding: "7px", background: c.red, color: "#fff", border: "none", borderRadius: 8, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => { onDeleteListing(item.id); setDeleteConfirm(null); }}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={{ width: "100%", marginTop: 8, background: "#fff", color: c.red, border: `1.5px solid ${c.redBorder}`, borderRadius: 10, padding: "8px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 160ms ease" }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                        onMouseEnter={e => { e.currentTarget.style.background = c.redBg; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                      >
                        🗑 Delete listing
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
