import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { categories, initialNewListing, sampleListings, CATEGORY_TREE, getTopCategory } from "./data/marketplace";
import { ALL_UNIVERSITIES } from "./components/UniversityDropdown";
import {
  createListing, deleteListing, fetchConversationMessages, fetchConversations,
  fetchListings, fetchSession, fetchStats, googleAuth, completeGoogleOnboarding, loginUser, logoutUser, markConversationRead,
  openConversation, sendConversationMessage, sessionStorageKey, signupUser,
  updateProfile, updateSavedItem, uploadToCloudinary, updateListingStatus,
  forgotPassword, resetPassword, changePassword, linkGoogle, unlinkGoogle,
} from "./lib/authApi";
import BrowseRoute from "./routes/BrowseRoute";
import ChatsRoute from "./routes/ChatsRoute";
import HomeRoute from "./routes/HomeRoute";
import ItemDetailsRoute from "./routes/ItemDetailsRoute";
import LoginRoute from "./routes/LoginRoute";
import ProfileRoute from "./routes/ProfileRoute";
import SellRoute from "./routes/SellRoute";
import SignupRoute from "./routes/SignupRoute";
import WishlistRoute from "./routes/WishlistRoute";
import GoogleOnboardingRoute from "./routes/GoogleOnboardingRoute";
import PublicProfileRoute from "./routes/PublicProfileRoute";
import DashboardRoute from "./routes/DashboardRoute";
import ResetPasswordRoute from "./routes/ResetPasswordRoute";
import { styles as s } from "./styles/appStyles";


const parseHashRoute = () => {
  const hash = window.location.hash.replace(/^#/, "") || "/home";
  const [pathname, queryStr] = hash.split("?");
  const parts = pathname.split("/").filter(Boolean);
  // Parse query params
  const params = {};
  if (queryStr) {
    queryStr.split("&").forEach(p => {
      const [k, v] = p.split("=");
      if (k) params[k] = decodeURIComponent(v || "");
    });
  }
  if (parts[0] === "item" && parts[1]) return { page: "item", itemId: Number(parts[1]) };
  if (parts[0] === "user" && parts[1]) return { page: "user", userId: parts[1] };
  if (parts[0] === "reset-password") return { page: "reset-password", token: params.token || "" };
  if (parts[0] === "verify-email") return { page: "verify-email", token: params.token || "" };
  if (["home","browse","sell","wishlist","profile","chats","login","signup","dashboard"].includes(parts[0]))
    return { page: parts[0], itemId: null };
  return { page: "home", itemId: null };
};
const navigateTo = (path) => { window.location.hash = path; };

// ─── Feature flag: set to true to re-enable email verification UI & enforcement
const EMAIL_VERIFICATION_ENABLED = false;

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:5001")
    .replace(/\/+$/, "");
const socket = io(API_BASE_URL, { autoConnect: false, transports: ["polling", "websocket"] });
const sortConversations = (items) =>
  [...items].sort((a, b) => new Date(b.lastMessageAt||0) - new Date(a.lastMessageAt||0));

export function IconHome() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
export function IconGrid() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
export function IconChat() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
export function IconHeart({ filled }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
export function IconUser() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
export function IconPin() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconLogout() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconChevDown() {
  return <svg width="10" height="10" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 1l5 5 5-5"/></svg>;
}

export default function App() {
  const [route, setRoute] = useState(() => parseHashRoute());
  const [listings, setListings] = useState(sampleListings);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [collegeFilter, setCollegeFilter] = useState("All Campuses");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCampus, setSelectedCampus] = useState("All Campuses");
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, avgDiscount: 0, totalColleges: 0 });
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversationMessages, setConversationMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [newListing, setNewListing] = useState(initialNewListing);
  const [wishlist, setWishlist] = useState([]);
  const [posted, setPosted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [signupPending, setSignupPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleOnboarding, setGoogleOnboarding] = useState(null); // { pendingToken, profile } | null
  const [signupForm, setSignupForm] = useState({ email:"", password:"", name:"", college:"Galgotias University" });
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [campusSearch, setCampusSearch] = useState("");
  const [navHovered, setNavHovered] = useState(null);
  // Notification panel state
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    const syncRoute = () => setRoute(parseHashRoute());
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) navigateTo("/home"); else syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  // Close notification panel on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setNotifPanelOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetch real stats for homepage
  useEffect(() => {
    fetchStats().then(data => setStats(data)).catch(() => {});
  }, [listings]);

  useEffect(() => {
    if (!loggedIn) return;
    fetchListings().then(data => {
      const api = (data.listings||[]).map(i => ({ ...i, id: Number(i.id) }));
      setListings(api);
    }).catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    const restore = async () => {
      const tok = localStorage.getItem(sessionStorageKey);
      if (!tok) { setAuthLoading(false); return; }
      try {
        const s2 = await fetchSession(tok);
        setSessionToken(s2.token); setLoginEmail(s2.user.email); setLoggedIn(true);
        setAuthError(""); setCurrentUser(s2.user);
        setWishlist((s2.user.savedItemIds||[]).map(id => Number(id)));
      } catch {
        localStorage.removeItem(sessionStorageKey); setSessionToken(""); setLoggedIn(false);
        setAuthError("Your saved session expired. Please sign in again.");
      } finally { setAuthLoading(false); }
    };
    restore();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const publicPages = ["login", "signup", "reset-password", "verify-email"];
    if (!loggedIn && !publicPages.includes(route.page)) navigateTo("/login");
    if (loggedIn && ["login", "signup"].includes(route.page)) navigateTo("/home");
    // When verification is disabled, redirect away from the verify-email page
    if (!EMAIL_VERIFICATION_ENABLED && route.page === "verify-email") navigateTo("/home");
  }, [authLoading, loggedIn, route.page]);

  const fetchNotifications = async (tok) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setNotifUnread(data.unreadCount || 0);
    } catch (_) {}
  };

  useEffect(() => {
    if (!loggedIn || !sessionToken) return;
    fetchNotifications(sessionToken);
    const interval = setInterval(() => fetchNotifications(sessionToken), 30000);
    return () => clearInterval(interval);
  }, [loggedIn, sessionToken]);

  // Close campus dropdown on outside click
  useEffect(() => {
    if (!campusDropdownOpen) { setCampusSearch(""); return; }
    const handler = () => { setCampusDropdownOpen(false); setCampusSearch(""); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [campusDropdownOpen]);

  const filtered = useMemo(() =>
    listings.filter(l => {
      const ms = l.title.toLowerCase().includes(search.toLowerCase());
      let mc;
      if (catFilter === "All") {
        mc = true;
      } else {
        const lCat = l.category?.trim().toLowerCase();
        const filterLow = catFilter.trim().toLowerCase();
        // Direct match
        if (lCat === filterLow) {
          mc = true;
        } else if (CATEGORY_TREE[catFilter]) {
          // Top-level category selected: match all its subcategories too
          const subs = CATEGORY_TREE[catFilter].subcategories.map(s => s.toLowerCase());
          mc = subs.includes(lCat);
        } else {
          mc = false;
        }
      }
      const ml = collegeFilter === "All Campuses" || l.college === collegeFilter;
      const msSt = statusFilter === "All" || (l.status || "available") === statusFilter;
      return ms && mc && ml && msSt;
    }), [catFilter, collegeFilter, listings, search, statusFilter]);

  const wishlistItems = useMemo(() => listings.filter(l => wishlist.includes(l.id)), [listings, wishlist]);
  const currentConversation = useMemo(() => conversations.find(c => c.id === selectedConversationId)||null, [conversations, selectedConversationId]);
  const currentConversationMessages = currentConversation ? conversationMessages[currentConversation.id]||[] : [];
  const unreadCount = useMemo(() => conversations.reduce((t,c) => t + Number(c.unreadCount||0), 0), [conversations]);
  const discount = (o, p) => Math.round(((o-p)/o)*100);

  const upsertConversation = (conv) => {
    if (!conv?.id) return;
    setConversations(cur => sortConversations([conv, ...cur.filter(e => e.id !== conv.id)]));
  };

  const toggleWishlist = async (id) => {
    const save = !wishlist.includes(id);
    setWishlist(c => save ? [...c, id] : c.filter(i => i !== id));
    if (!sessionToken) return;
    try {
      const data = await updateSavedItem(sessionToken, String(id), save);
      setWishlist((data.savedItemIds||[]).map(e => Number(e)));
      setCurrentUser(u => u ? { ...u, savedItemIds: data.savedItemIds||[] } : u);
    } catch { setWishlist(c => save ? c.filter(i => i !== id) : [...c, id]); }
  };

  const openItem = (id) => navigateTo(`/item/${id}`);

  // Navigate to browse with a specific category pre-selected
  const browseByCategory = (cat) => {
    setCatFilter(cat);
    navigateTo("/browse");
  };

  const handleOpenConversation = async (itemId) => {
    const tok = sessionToken || localStorage.getItem(sessionStorageKey);
    if (!tok) { setAuthError("Session expired."); navigateTo("/login"); return; }
    try {
      const data = await openConversation(tok, String(itemId));
      upsertConversation(data.conversation);
      setSelectedConversationId(data.conversation.id);
      navigateTo("/chats");
    } catch (e) { setAuthError(e.message||"Unable to open chat."); }
  };

  const sendChat = async () => {
    const tok = sessionToken || localStorage.getItem(sessionStorageKey);
    if (!chatInput.trim() || !tok || !selectedConversationId) return;
    const text = chatInput.trim(); setChatInput("");
    try {
      const data = await sendConversationMessage(tok, selectedConversationId, text);
      setConversationMessages(cur => {
        const ex = cur[selectedConversationId]||[];
        if (ex.some(m => m.id === data.message.id)) return cur;
        return { ...cur, [selectedConversationId]: [...ex, data.message] };
      });
    } catch (e) { setAuthError(e.message||"Unable to send."); }
  };

  const handlePost = async () => {
    if (!newListing.title || !newListing.price) return;
    const tok = sessionToken || localStorage.getItem(sessionStorageKey);
    if (!tok) { setAuthError("Session expired."); navigateTo("/login"); return; }
    setImageUploading(true);
    try {
      const uploadedImages = [];
      for (const file of imageFiles.slice(0, 5)) {
        try {
          const url = await uploadToCloudinary(file);
          if (url) uploadedImages.push(url);
        } catch {}
      }
      const result = await createListing(tok, {
        title: newListing.title.trim(),
        price: parseInt(newListing.price, 10),
        originalPrice: parseInt(newListing.originalPrice, 10) || parseInt(newListing.price, 10) * 2,
        category: newListing.category,
        condition: newListing.condition || "",
        type: newListing.type || "Hostel",
        description: newListing.description || "",
        image: uploadedImages[0] || "",
        images: uploadedImages,
        // Category-specific extra fields
        subcategory: newListing.subcategory || "",
        subject: newListing.subject || "",
        semester: newListing.semester || "",
        university: newListing.university || "",
        resourceType: newListing.resourceType || "",
        format: newListing.format || "",
        serviceCategory: newListing.serviceCategory || "",
        experienceLevel: newListing.experienceLevel || "",
        deliveryTime: newListing.deliveryTime || "",
        pricingType: newListing.pricingType || "",
        availability: newListing.availability || "",
        portfolioLink: newListing.portfolioLink || "",
        brand: newListing.brand || "",
        model: newListing.model || "",
        warrantyStatus: newListing.warrantyStatus || "",
        accessoriesIncluded: newListing.accessoriesIncluded || "",
        powerRequirements: newListing.powerRequirements || "",
        material: newListing.material || "",
        dimensions: newListing.dimensions || "",
        pickupAvailable: newListing.pickupAvailable || "",
        deliveryAvailable: newListing.deliveryAvailable || "",
      });
      const listing = {
        ...result.listing, id: Number(result.listing.id),
        category: result.listing.category?.trim() || newListing.category,
        ownerId: result.listing.ownerId || currentUser?.id || null,
        seller: result.listing.seller || currentUser?.name || "You",
      };
      setListings(c => [listing, ...c]); setSessionToken(tok); setImageFiles([]); setPosted(true);
      setTimeout(() => { setPosted(false); setNewListing(initialNewListing); navigateTo("/browse"); }, 1500);
    } catch (e) { setAuthError(e.message||"Unable to post."); }
    finally { setImageUploading(false); }
  };

  const handleDeleteListing = async (itemId) => {
    try {
      await deleteListing(sessionToken, String(itemId));
      setListings(c => c.filter(i => String(i.id) !== String(itemId)));
      setWishlist(c => c.filter(i => String(i) !== String(itemId)));
      setConversations(c => c.filter(cv => cv.itemId !== String(itemId)));
    } catch (e) { setAuthError(e.message||"Unable to delete."); }
  };

  const handleStatusChange = async (itemId, status) => {
    const data = await updateListingStatus(sessionToken, String(itemId), status);
    setListings(c => c.map(i => String(i.id) === String(itemId) ? { ...i, status: data.listing.status } : i));
    return data.listing;
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) { setAuthError("Email and password are required."); return; }
    setLoginPending(true);
    try {
      const ss = await loginUser({ email: loginEmail.trim(), password: loginPassword });
      localStorage.setItem(sessionStorageKey, ss.token);
      setSessionToken(ss.token); setCurrentUser(ss.user);
      setWishlist((ss.user.savedItemIds||[]).map(id => Number(id)));
      setLoggedIn(true); setAuthError(""); navigateTo("/home");
    } catch (e) { setAuthError(e.message); }
    finally { setLoginPending(false); }
  };

  const handleSignup = async () => {
    if (!signupForm.email.trim()||!signupForm.password.trim()||!signupForm.name.trim()||!signupForm.college.trim()) {
      setAuthError("All fields are required."); return;
    }
    setSignupPending(true);
    try {
      const ss = await signupUser({ email: signupForm.email.trim(), password: signupForm.password, name: signupForm.name.trim(), college: signupForm.college.trim() });
      localStorage.setItem(sessionStorageKey, ss.token);
      setSessionToken(ss.token); setCurrentUser(ss.user);
      setWishlist((ss.user.savedItemIds||[]).map(id => Number(id)));
      setLoggedIn(true); setAuthError(""); navigateTo("/home");
    } catch (e) { setAuthError(e.message); }
    finally { setSignupPending(false); }
  };

  const handleGoogleAuth = async (credential) => {
    setGooglePending(true);
    setAuthError("");
    try {
      const result = await googleAuth(credential);
      if (result.status === "onboarding_required") {
        // New user — show university selection screen
        setGoogleOnboarding({ pendingToken: result.pendingToken, profile: result.profile });
      } else {
        // Existing user — log in directly
        localStorage.setItem(sessionStorageKey, result.token);
        setSessionToken(result.token); setCurrentUser(result.user);
        setWishlist((result.user.savedItemIds || []).map(id => Number(id)));
        setLoggedIn(true); setAuthError(""); setGoogleOnboarding(null); navigateTo("/home");
      }
    } catch (e) { setAuthError(e.message || "Google sign-in failed. Please try again."); }
    finally { setGooglePending(false); }
  };

  const handleCompleteOnboarding = async ({ pendingToken, college }) => {
    setAuthError("");
    try {
      const ss = await completeGoogleOnboarding({ pendingToken, college });
      localStorage.setItem(sessionStorageKey, ss.token);
      setSessionToken(ss.token); setCurrentUser(ss.user);
      setWishlist((ss.user.savedItemIds || []).map(id => Number(id)));
      setLoggedIn(true); setAuthError(""); setGoogleOnboarding(null); navigateTo("/home");
    } catch (e) { setAuthError(e.message || "Failed to complete sign-up. Please try again."); }
  };

  const handleProfileSave = async ({ name, college, bio, username, photoURL }) => {
    const result = await updateProfile(sessionToken, { name, college, bio, username, photoURL });
    setCurrentUser(result.user);
    // Propagate name/photo changes to all of the user's listings in local state
    if (result.user) {
      const uid = String(result.user.id);
      setListings(prev => prev.map(l =>
        String(l.ownerId) === uid
          ? { ...l,
              seller: result.user.name || l.seller,
              ownerPhotoURL: result.user.photoURL || l.ownerPhotoURL,
            }
          : l
      ));
    }
  };

  const handleForgotPassword = async (email) => {
    await forgotPassword(email);
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    const result = await changePassword(sessionToken, { currentPassword, newPassword });
    if (result?.user) setCurrentUser(result.user);
  };

  const handleLinkGoogle = async (credential) => {
    const result = await linkGoogle(sessionToken, credential);
    setCurrentUser(result.user);
  };

  const handleUnlinkGoogle = async () => {
    const result = await unlinkGoogle(sessionToken);
    setCurrentUser(result.user);
  };

  const handleUploadPhoto = async (file) => {
    const url = await uploadToCloudinary(file);
    return url;
  };

  const currentItem = route.page === "item" ? listings.find(i => String(i.id) === String(route.itemId)) : null;
  const isOwnListing = currentItem ? String(currentItem.ownerId||"") === String(currentUser?.id||"") : false;
  const navigateToProfile = (uid) => navigateTo(`/user/${uid}`);

  useEffect(() => {
    if (!sessionToken || !currentUser) return;
    socket.auth = { token: sessionToken }; socket.connect();
    const hcv = (cv) => upsertConversation(cv);
    const hm = (msg) => {
      setConversationMessages(cur => {
        const key = String(msg.conversationId), ex = cur[key]||[];
        if (ex.some(e => e.id === msg.id)) return cur;
        return { ...cur, [key]: [...ex, msg] };
      });
    };
    socket.on("conversation:updated", hcv); socket.on("conversation:message", hm);
    return () => { socket.off("conversation:updated", hcv); socket.off("conversation:message", hm); socket.disconnect(); };
  }, [currentUser, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !currentUser) return;
    fetchConversations(sessionToken).then(data => {
      const next = sortConversations(data.conversations||[]);
      setConversations(next);
      setSelectedConversationId(c => c || next[0]?.id || null);
    }).catch(() => {});
  }, [currentUser, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !selectedConversationId || route.page !== "chats") return;
    setChatsLoading(true);
    fetchConversationMessages(sessionToken, selectedConversationId)
      .then(data => { setConversationMessages(c => ({ ...c, [selectedConversationId]: data.messages||[] })); return markConversationRead(sessionToken, selectedConversationId); })
      .then(() => { setConversations(c => c.map(cv => cv.id === selectedConversationId ? { ...cv, unreadCount: 0 } : cv)); })
      .catch(() => {}).finally(() => setChatsLoading(false));
    socket.emit("conversation:join", { conversationId: selectedConversationId });
    return () => { socket.emit("conversation:leave", { conversationId: selectedConversationId }); };
  }, [route.page, selectedConversationId, sessionToken]);

  if (!loggedIn) {
    if (route.page === "reset-password") return (
      <ResetPasswordRoute
        token={route.token}
        onReset={resetPassword}
        onGoLogin={() => navigateTo("/login")}
      />
    );
    if (googleOnboarding) return (
      <GoogleOnboardingRoute
        pendingToken={googleOnboarding.pendingToken}
        profile={googleOnboarding.profile}
        onComplete={handleCompleteOnboarding}
        onCancel={() => { setGoogleOnboarding(null); setAuthError(""); }}
        authError={authError}
      />
    );
    if (route.page === "signup") return <SignupRoute authError={authError} authLoading={authLoading} signupPending={signupPending} signupForm={signupForm} setSignupForm={setSignupForm} handleSignup={handleSignup} goToLogin={() => navigateTo("/login")} styles={s} handleGoogleAuth={handleGoogleAuth} googlePending={googlePending} />;
    return <LoginRoute authError={authError} authLoading={authLoading} loginPending={loginPending} loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} handleLogin={handleLogin} goToSignup={() => navigateTo("/signup")} styles={s} handleGoogleAuth={handleGoogleAuth} googlePending={googlePending} onForgotPassword={handleForgotPassword} />;
  }

  const handleLogout = async () => {
    try { await logoutUser(sessionToken); } catch {}
    finally {
      localStorage.removeItem(sessionStorageKey);
      setSessionToken(""); setLoggedIn(false); setLoginEmail(""); setLoginPassword(""); setAuthError("");
      setCurrentUser(null); setWishlist([]); setConversations([]); setSelectedConversationId(null);
      setConversationMessages({}); socket.disconnect(); navigateTo("/login");
    }
  };

  const campusOptions = ["All Campuses", ...ALL_UNIVERSITIES];

  const navItems = [
    { key: "sell", label: "SELL", icon: null, path: "/sell", cta: true },
    { key: "home", label: "Home", icon: <IconHome />, path: "/home" },
    { key: "browse", label: "Browse", icon: <IconGrid />, path: "/browse", matchPages: ["browse","item"] },
    { key: "chats", label: `Chats${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: <IconChat />, path: "/chats" },
    { key: "wishlist", label: "Wishlist", icon: <IconHeart />, path: "/wishlist" },
    { key: "dashboard", label: "Dashboard", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, path: "/dashboard" },
    { key: "profile", label: "Profile", icon: <IconUser />, path: "/profile", isProfile: true },
  ];

  return (
    <div style={s.page}>
      <nav style={{
        ...s.nav,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.88)",
        borderBottom: "1px solid rgba(92,34,212,0.10)",
        boxShadow: "0 2px 24px rgba(92,34,212,0.08)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="nav-logo" style={{ ...s.logo, cursor: "pointer" }} onClick={() => { navigateTo("/home"); window.scrollTo({ top: 0, behavior: "instant" }); }}>
            Campus<span style={{ color: "#fcd34d" }}>Marketplace</span>
          </span>

          <div className="nav-campus-selector" style={{ position: "relative" }}>
            <div
              className="nav-campus-trigger"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "linear-gradient(135deg, #f3ecfe, #faf7ff)",
                borderRadius: 10, padding: "6px 12px",
                fontSize: 12, color: "#5c22d4", fontWeight: 600,
                border: "1.5px solid #e0d0fd", cursor: "pointer", userSelect: "none",
                transition: "all 160ms ease",
                boxShadow: "0 2px 8px rgba(92,34,212,0.08)",
              }}
              onClick={(e) => { e.stopPropagation(); setCampusDropdownOpen(o => !o); }}
              onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #ece0fd, #f3ecfe)"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #f3ecfe, #faf7ff)"}
            >
              <IconPin />
              <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedCampus}
              </span>
              <div style={{ transform: campusDropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms ease" }}>
                <IconChevDown />
              </div>
            </div>

            {campusDropdownOpen && (
              <div className="nav-campus-menu" style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0,
                background: "#fff", borderRadius: 14,
                border: "1.5px solid #e0d0fd",
                boxShadow: "0 16px 48px rgba(92,34,212,0.18)",
                minWidth: 260, zIndex: 200,
                overflow: "hidden",
                animation: "fadeDown 150ms ease both",
              }}
              onClick={e => e.stopPropagation()}
              >
                {/* Search input */}
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0ebfc" }}>
                  <input
                    type="text"
                    placeholder="Search campus..."
                    value={campusSearch}
                    onChange={e => setCampusSearch(e.target.value)}
                    style={{ width: "100%", padding: "7px 12px", fontSize: 13, border: "1.5px solid #e0d0fd", borderRadius: 8, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#14141f", background: "#faf7ff", boxSizing: "border-box" }}
                    autoFocus
                    onFocus={e => Object.assign(e.target.style, { borderColor: "#5c22d4", boxShadow: "0 0 0 2px rgba(92,34,212,0.10)" })}
                    onBlur={e => Object.assign(e.target.style, { borderColor: "#e0d0fd", boxShadow: "none" })}
                  />
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {campusOptions
                    .filter(c => campusSearch.trim() === "" || c.toLowerCase().includes(campusSearch.toLowerCase()))
                    .map(campus => (
                    <button
                      key={campus}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "9px 16px", background: selectedCampus === campus ? "#f3ecfe" : "transparent",
                        border: "none", cursor: "pointer", fontSize: 13, fontWeight: selectedCampus === campus ? 700 : 500,
                        color: selectedCampus === campus ? "#5c22d4" : "#14141f",
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        transition: "background 120ms ease",
                        borderLeft: selectedCampus === campus ? "3px solid #5c22d4" : "3px solid transparent",
                      }}
                      onClick={() => {
                        setSelectedCampus(campus);
                        setCollegeFilter(campus);
                        setCampusDropdownOpen(false);
                        setCampusSearch("");
                      }}
                      onMouseEnter={e => { if (selectedCampus !== campus) e.currentTarget.style.background = "#faf7ff"; }}
                      onMouseLeave={e => { if (selectedCampus !== campus) e.currentTarget.style.background = "transparent"; }}
                    >
                      {campus === "All Campuses" ? "🌐 " : "🎓 "}{campus}
                    </button>
                  ))}
                  {campusSearch.trim() !== "" && campusOptions.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#9898a8" }}>No campus found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={s.navLinks} className="nav-links-wrap">
          {navItems.map(item => {
            const isActive = item.matchPages ? item.matchPages.includes(route.page) : route.page === item.key;
            const isHov = navHovered === item.key;
            if (item.cta) return (
              <button key={item.key}
                className="nav-cta-label"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: isHov
                    ? "linear-gradient(135deg, #4318a0, #5c22d4)"
                    : "linear-gradient(135deg, #5c22d4, #7c3aed)",
                  color: "#fff", border: "2px solid #fcd34d",
                  borderRadius: 12, padding: "7px 18px",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(92,34,212,0.35)",
                  transition: "all 160ms ease",
                  transform: isHov ? "translateY(-2px) scale(1.03)" : "none",
                }}
                onClick={() => navigateTo(item.path)}
                onMouseEnter={() => setNavHovered(item.key)}
                onMouseLeave={() => setNavHovered(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span className="nav-cta-text">{item.label}</span>
              </button>
            );
            // Profile nav item: show mini avatar + name/username
            if (item.isProfile) {
              const pName = currentUser?.name || "";
              const pInitials = pName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";
              const pPalette = ["#5c22d4","#0ea5e9","#059669","#d97706","#db2777"];
              const pColor = pPalette[pName.charCodeAt(0) % pPalette.length];
              const pLabel = currentUser?.username ? `@${currentUser.username}` : (pName.split(" ")[0] || "Profile");
              return (
                <button key={item.key}
                  style={{
                    ...s.navBtn(isActive),
                    background: isActive ? "linear-gradient(135deg, #f3ecfe, #ece0fd)" : isHov ? "#f9f9fb" : "transparent",
                    boxShadow: isActive ? "0 2px 10px rgba(92,34,212,0.10)" : "none",
                    transform: isHov && !isActive ? "translateY(-1px)" : "none",
                    transition: "all 160ms ease",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                  onClick={() => navigateTo(item.path)}
                  onMouseEnter={() => setNavHovered(item.key)}
                  onMouseLeave={() => setNavHovered(null)}>
                  {currentUser?.photoURL
                    ? <img src={currentUser.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #e0d0fd", flexShrink: 0 }} />
                    : <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg,${pColor},#7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{pInitials}</div>
                  }
                  <span className="nav-profile-label">{pLabel}</span>
                </button>
              );
            }
            return (
              <button key={item.key}
                style={{
                  ...s.navBtn(isActive),
                  background: isActive ? "linear-gradient(135deg, #f3ecfe, #ece0fd)" : isHov ? "#f9f9fb" : "transparent",
                  boxShadow: isActive ? "0 2px 10px rgba(92,34,212,0.10)" : "none",
                  transform: isHov && !isActive ? "translateY(-1px)" : "none",
                  transition: "all 160ms ease",
                }}
                onClick={() => navigateTo(item.path)}
                onMouseEnter={() => setNavHovered(item.key)}
                onMouseLeave={() => setNavHovered(null)}>
                {item.icon} <span className="nav-label-text">{item.label}</span>
              </button>
            );
          })}
          {/* Notification Bell */}
          <button
            className="nav-bell"
            style={{
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
              background: notifPanelOpen ? "linear-gradient(135deg, #f3ecfe, #ece0fd)" : "transparent",
              color: notifPanelOpen ? "#5c22d4" : "#9898a8",
              transition: "all 160ms ease",
              flexShrink: 0,
            }}
            onClick={() => {
              setNotifPanelOpen(o => !o);
              if (!notifPanelOpen) fetchNotifications(sessionToken);
            }}
            onMouseEnter={e => { if (!notifPanelOpen) { e.currentTarget.style.background = "#f9f9fb"; e.currentTarget.style.color = "#5c22d4"; } }}
            onMouseLeave={e => { if (!notifPanelOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9898a8"; } }}
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifUnread > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                background: "#5c22d4", color: "#fff",
                borderRadius: 99, fontSize: 9, fontWeight: 800,
                minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", lineHeight: 1,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                border: "2px solid #fff",
              }}>
                {notifUnread > 99 ? "99+" : notifUnread}
              </span>
            )}
          </button>
          <button
            className="nav-logout"
            style={{ ...s.navBtn(false), color: "#9898a8", transition: "color 160ms ease" }}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "#9898a8"}>
            <IconLogout /> <span className="nav-logout-label">Logout</span>
          </button>
        </div>
      </nav>

      {notifPanelOpen && (
        <div
          onClick={() => setNotifPanelOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 199,
            background: "rgba(14,0,40,0.35)",
          }}
        />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: notifPanelOpen ? "min(420px, 100vw)" : 0,
        zIndex: 200,
        background: "#fff",
        boxShadow: notifPanelOpen ? "-8px 0 40px rgba(14,0,40,0.18)" : "none",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width 250ms ease",
        borderLeft: "1px solid #e5e5ec",
      }}>
        {notifPanelOpen && (
          <>
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 20px 16px",
              borderBottom: "1px solid #f2f2f6",
              background: "linear-gradient(135deg, #1e0757, #5c22d4)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                    Notifications {notifUnread > 0 ? `(${notifUnread})` : ""}
                  </h2>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                    {notifUnread > 0 ? `${notifUnread} unread` : "All caught up"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {notifUnread > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
                          method: "PATCH", headers: { Authorization: `Bearer ${sessionToken}` },
                        });
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        setNotifUnread(0);
                      } catch (_) {}
                    }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: "5px 12px",
                      background: "rgba(255,255,255,0.15)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, cursor: "pointer",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      transition: "all 140ms ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setNotifPanelOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                    background: "rgba(255,255,255,0.15)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 140ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 32px" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
                  <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#3c3c4e", marginBottom: 8 }}>
                    All caught up!
                  </p>
                  <p style={{ fontSize: 13, color: "#9898a8", lineHeight: 1.6 }}>
                    New activity from your listings and interactions will appear here.
                  </p>
                </div>
              ) : notifications.map((n) => {
                const typeIcons = {
                  new_message:    { icon: "💬", bg: "#dbeafe", accent: "#3b82f6" },
                  new_follower:   { icon: "👤", bg: "#e0d0fd", accent: "#5c22d4" },
                  new_review:     { icon: "⭐", bg: "#fef9e7", accent: "#d97706" },
                  listing_status: { icon: "🔖", bg: "#dcfce7", accent: "#15803d" },
                };
                const meta = typeIcons[n.type] || { icon: "🔔", bg: "#f2f2f6", accent: "#5c22d4" };

                // Navigation targets per notification type
                const notifNavTarget = (() => {
                  if (n.type === "new_message" && n.reference_id) return `/chats`;
                  if (n.type === "new_follower" && n.reference_id) return `/user/${n.reference_id}`;
                  if (n.type === "new_review" && n.reference_id) return `/item/${n.reference_id}`;
                  if (n.type === "listing_status" && n.reference_id) return `/item/${n.reference_id}`;
                  return null;
                })();

                const markReadAndNavigate = async () => {
                  // Mark as read first (fire-and-forget, update UI instantly)
                  if (!n.is_read) {
                    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, is_read: true } : x));
                    setNotifUnread(prev => Math.max(0, prev - 1));
                    fetch(`${API_BASE_URL}/api/notifications/${n._id}/read`, {
                      method: "PATCH", headers: { Authorization: `Bearer ${sessionToken}` },
                    }).catch(() => {});
                  }
                  if (notifNavTarget) {
                    setNotifPanelOpen(false);
                    navigateTo(notifNavTarget);
                  }
                };

                // Rich timestamp: just now / 2m ago / 1h ago / Yesterday / 3d ago
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(n.created_at).getTime();
                  const m = Math.floor(diff / 60000);
                  if (m < 1) return "just now";
                  if (m < 60) return `${m}m ago`;
                  const h = Math.floor(m / 60);
                  if (h < 24) return `${h}h ago`;
                  if (h < 48) return "Yesterday";
                  const d = Math.floor(h / 24);
                  if (d < 7) return `${d}d ago`;
                  return new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                })();

                return (
                  <div
                    key={n._id}
                    onClick={markReadAndNavigate}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 20px",
                      borderBottom: "1px solid #f2f2f6",
                      background: n.is_read ? "#fff" : "#faf7ff",
                      transition: "background 140ms ease",
                      cursor: notifNavTarget ? "pointer" : "default",
                      position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = n.is_read ? "#f9f9fb" : "#f3ecfe"}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : "#faf7ff"}
                  >
                          {!n.is_read && (
                      <div style={{
                        position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#5c22d4", flexShrink: 0,
                      }} />
                    )}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: n.is_read ? "#f5f5f8" : meta.bg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                      opacity: n.is_read ? 0.65 : 1,
                      transition: "all 140ms ease",
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: n.is_read ? 400 : 700,
                        color: n.is_read ? "#9898a8" : "#14141f",
                        margin: 0, lineHeight: 1.45,
                        transition: "color 140ms ease",
                      }}>
                        {n.message}
                      </p>
                      <p style={{
                        fontSize: 11,
                        color: n.is_read ? "#c0c0cc" : "#9898a8",
                        margin: 0, marginTop: 3,
                        transition: "color 140ms ease",
                      }}>
                        {timeAgo}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, is_read: true } : x));
                          setNotifUnread(prev => Math.max(0, prev - 1));
                          fetch(`${API_BASE_URL}/api/notifications/${n._id}/read`, {
                            method: "PATCH", headers: { Authorization: `Bearer ${sessionToken}` },
                          }).catch(() => {});
                        }}
                        style={{
                          flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "4px 10px",
                          background: "#f3ecfe", color: "#5c22d4",
                          border: "1px solid #e0d0fd", borderRadius: 7, cursor: "pointer",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                          transition: "all 140ms ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#e0d0fd"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f3ecfe"; }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {route.page === "home" && (
        <HomeRoute
          discount={discount} listings={listings} navigateTo={navigateTo}
          openItem={openItem} styles={s} toggleWishlist={toggleWishlist} wishlist={wishlist}
          stats={stats} browseByCategory={browseByCategory} selectedCampus={selectedCampus}
        />
      )}
      {route.page === "browse" && (
        <BrowseRoute
          categories={categories} collegeFilter={collegeFilter}
          discount={discount} filtered={filtered} openItem={openItem} search={search}
          setCatFilter={setCatFilter} setCollegeFilter={setCollegeFilter} setSearch={setSearch}
          styles={s} toggleWishlist={toggleWishlist} wishlist={wishlist} catFilter={catFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        />
      )}
      {route.page === "sell" && (
        <SellRoute categories={categories} handlePost={handlePost} newListing={newListing}
          posted={posted} setNewListing={setNewListing} styles={s} imageFiles={imageFiles}
          setImageFiles={setImageFiles} imageUploading={imageUploading}
        />
      )}
      {route.page === "wishlist" && (
        <WishlistRoute discount={discount} openItem={openItem} styles={s} toggleWishlist={toggleWishlist} wishlistItems={wishlistItems} />
      )}
      {route.page === "item" && currentItem && (
        <ItemDetailsRoute
          discount={discount} isOwnListing={isOwnListing} item={currentItem}
          navigateBack={() => navigateTo("/browse")} openConversation={handleOpenConversation}
          styles={s} toggleWishlist={toggleWishlist} wishlist={wishlist}
          sessionToken={sessionToken} currentUser={currentUser}
          navigateToProfile={navigateToProfile} onStatusChange={handleStatusChange}
        />
      )}
      {route.page === "user" && route.userId && (
        <PublicProfileRoute
          userId={route.userId}
          currentUser={currentUser}
          listings={listings}
          openItem={openItem}
          openConversation={handleOpenConversation}
          navigateBack={() => window.history.back()}
          sessionToken={sessionToken}
        />
      )}
      {route.page === "chats" && (
        <ChatsRoute chatInput={chatInput} chatsLoading={chatsLoading} conversations={conversations}
          currentConversation={currentConversation} currentUser={currentUser}
          messages={currentConversationMessages} onOpenItem={openItem}
          onSelectConversation={setSelectedConversationId} onSendMessage={sendChat}
          setChatInput={setChatInput} styles={s} sessionToken={sessionToken}
          navigateToProfile={navigateToProfile}
        />
      )}
      {route.page === "dashboard" && (
        <DashboardRoute user={currentUser} sessionToken={sessionToken} onStatusChange={handleStatusChange} openItem={openItem} />
      )}
      {route.page === "profile" && (
        <ProfileRoute
          user={currentUser}
          listedItems={listings.filter(i => String(i.ownerId||"") === String(currentUser?.id||"") || i.seller === currentUser?.name)}
          onSaveProfile={handleProfileSave} onDeleteListing={handleDeleteListing}
          styles={s} openItem={openItem} sessionToken={sessionToken}
          onChangePassword={handleChangePassword}
          onLinkGoogle={handleLinkGoogle}
          onUnlinkGoogle={handleUnlinkGoogle}
          onUploadPhoto={handleUploadPhoto}
          onStatusChange={handleStatusChange}
        />
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f9f9fb; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d0d0db; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #9898a8; }

        /* ══════════════════════════════════════════════════════════════════
           Responsive: Tablet (≤900px)
           ══════════════════════════════════════════════════════════════════ */
        @media (max-width: 900px) {
          /* Item detail: stack columns */
          .item-detail-grid {
            grid-template-columns: 1fr !important;
          }
          /* Public profile: stack sidebar */
          .pub-profile-grid {
            grid-template-columns: 1fr !important;
          }
          /* Browse grid */
          .browse-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          }
          /* Home: category + feature grids */
          .home-category-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .home-feature-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
          /* Listing grids */
          .profile-listing-grid,
          .wishlist-grid,
          .pubprofile-listing-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          }
          /* Sell form 2-col fields */
          .sell-fields-grid,
          .profile-basic-grid,
          .profile-account-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        /* ══════════════════════════════════════════════════════════════════
           Responsive: Mobile (≤640px)
           ══════════════════════════════════════════════════════════════════ */
        @media (max-width: 640px) {
          html, body { overflow-x: hidden; }

          /* ── Navbar ─────────────────────────────────────────────────── */
          nav { padding: 0 12px !important; gap: 6px !important; }
          .nav-left { gap: 8px !important; flex: 1 1 auto; min-width: 0; }
          .nav-logo { font-size: 16px !important; white-space: nowrap; }
          .nav-campus-selector { flex-shrink: 0; }
          .nav-campus-trigger span { max-width: 80px !important; }
          .nav-campus-menu { left: auto !important; right: 0 !important; width: 88vw !important; max-width: 320px !important; min-width: 0 !important; }
          .nav-campus-label { display: none !important; }
          .nav-links-wrap {
            gap: 2px !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            flex-shrink: 0;
            max-width: 56vw;
          }
          .nav-links-wrap::-webkit-scrollbar { display: none; }
          .nav-label-text { display: none !important; }
          .nav-profile-label { display: none !important; }
          .nav-cta-text { display: none !important; }
          .nav-cta-label { padding: 7px 10px !important; gap: 0 !important; min-width: 36px !important; justify-content: center !important; }
          .nav-logout-label { display: none !important; }
          .nav-logout { padding: 7px !important; min-width: 36px; justify-content: center; }
          .nav-bell { width: 34px !important; height: 34px !important; }

          /* ── Chats: full-width single-pane on mobile ───────────────── */
          .chat-layout {
            grid-template-columns: 1fr !important;
            height: calc(100vh - 56px) !important;
          }
          .chat-layout[data-mobile-view="list"] section { display: none !important; }
          .chat-layout[data-mobile-view="chat"] aside { display: none !important; }
          .chat-back-btn { display: inline-flex !important; }
          .chat-bubble-wrap { max-width: 82% !important; }
          .chat-messages-pane { padding: 14px !important; }
          .chat-composer-pane { padding: 8px 12px 12px !important; }

          /* ── Item detail layout ─────────────────────────────────────── */
          .item-detail-grid {
            grid-template-columns: 1fr !important;
            padding: 0 16px !important;
            gap: 16px !important;
          }
          .item-back-row { padding: 16px 16px 0 !important; }
          .item-info-card { padding: 18px !important; }
          .item-overview-grid { grid-template-columns: 1fr !important; }
          .item-seller-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .item-right-sidebar { position: static !important; top: auto !important; }

          /* ── Public profile ─────────────────────────────────────────── */
          .pubprofile-hero { padding: 24px 16px 80px !important; }
          .pubprofile-content { padding: 0 16px !important; margin-top: -52px !important; }
          .pub-profile-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .pubprofile-listing-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            gap: 12px !important;
          }

          /* ── Browse ──────────────────────────────────────────────────── */
          .browse-grid {
            padding: 12px 16px !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .browse-header { padding: 24px 16px 32px !important; }
          .browse-filter-row { flex-direction: column !important; align-items: stretch !important; }
          .browse-filter-row > * { min-width: 0 !important; width: 100% !important; }
          .browse-catbar-row { padding: 10px 16px !important; }
          .browse-result-row, .browse-status-row { padding-left: 16px !important; padding-right: 16px !important; }

          /* ── Home ────────────────────────────────────────────────────── */
          .home-hero { padding: 40px 16px 56px !important; }
          .home-hero-title { font-size: 32px !important; }
          .home-hero-stats { gap: 20px !important; }
          .home-section { padding: 40px 16px 0 !important; }
          .home-category-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .home-feature-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .home-section-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .home-cta-box, .home-credits-box {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 28px 20px !important;
            text-align: left !important;
          }
          .home-listing-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }

          /* ── Profile ─────────────────────────────────────────────────── */
          .profile-hero { padding: 24px 16px 64px !important; }
          .profile-content { padding: 0 16px !important; margin-top: -36px !important; }
          .profile-header-card { padding: 20px 16px !important; flex-direction: column !important; align-items: flex-start !important; text-align: left !important; }
          .profile-header-info { width: 100% !important; }
          .profile-header-card button { width: 100% !important; justify-content: center !important; }
          .profile-tabs { overflow-x: auto !important; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .profile-tabs::-webkit-scrollbar { display: none; }
          .profile-tabs button { white-space: nowrap; flex-shrink: 0; }
          .profile-basic-grid,
          .profile-account-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-listing-grid,
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .section-card-pad { padding: 16px !important; }
          .section-card-header { padding: 14px 16px 12px !important; flex-wrap: wrap; gap: 8px; }

          /* ── Sell form ───────────────────────────────────────────────── */
          .sell-hero { padding: 24px 16px 32px !important; }
          .sell-content { padding: 0 16px !important; }
          .sell-form-card { padding: 20px !important; }
          .sell-category-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important;
            gap: 8px !important;
          }
          .sell-fields-grid,
          .sell-pricing-grid {
            grid-template-columns: 1fr !important;
          }
          .sell-photo-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          /* ── Wishlist / generic page headers ─────────────────────────── */
          .page-header-band { padding: 24px 16px 32px !important; }
          .page-inner-pad { padding: 16px !important; }

          /* ── Modals: keep inside viewport ────────────────────────────── */
          .modal-card {
            max-height: 88vh !important;
            overflow-y: auto !important;
            padding: 24px 18px !important;
            border-radius: 16px !important;
          }

          /* ── Toast ───────────────────────────────────────────────────── */
          .app-toast {
            left: 16px !important;
            right: 16px !important;
            bottom: 16px !important;
            justify-content: center !important;
          }

          /* ── Auth screens (Login/Signup/etc) ─────────────────────────── */
          .auth-wrapper { padding: 24px 12px !important; }
          .auth-card { padding: 28px 20px !important; border-radius: 18px !important; }
        }

        /* ══════════════════════════════════════════════════════════════════
           Responsive: Small mobile (≤480px)
           ══════════════════════════════════════════════════════════════════ */
        @media (max-width: 480px) {
          .browse-grid,
          .home-listing-grid,
          .profile-listing-grid,
          .wishlist-grid,
          .pubprofile-listing-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .home-category-grid { grid-template-columns: 1fr 1fr !important; }
          .home-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .item-seller-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .sell-photo-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .sell-category-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .home-hero-title { font-size: 26px !important; }
          .home-hero-stats { gap: 14px !important; flex-wrap: wrap; justify-content: center; }
          .auth-card { padding: 24px 16px !important; }
        }

        /* ══════════════════════════════════════════════════════════════════
           Responsive: Extra small (≤360px)
           ══════════════════════════════════════════════════════════════════ */
        @media (max-width: 360px) {
          .nav-links-wrap { max-width: 50vw; }
          .nav-campus-trigger span { max-width: 50px !important; }
          .browse-grid,
          .home-listing-grid,
          .profile-listing-grid,
          .wishlist-grid,
          .pubprofile-listing-grid,
          .home-category-grid {
            grid-template-columns: 1fr !important;
          }
          .sell-photo-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
