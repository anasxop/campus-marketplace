const SESSION_STORAGE_KEY = "campusPlaceSessionToken";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

const readJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
};

export const sessionStorageKey = SESSION_STORAGE_KEY;

export const googleAuth = async (credential) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  return readJson(response);
};

export const completeGoogleOnboarding = async ({ pendingToken, college }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pendingToken, college }),
  });
  return readJson(response);
};

export const signupUser = async ({ email, password, name, college }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, college }),
  });
  return readJson(response);
};

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return readJson(response);
};

export const fetchSession = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const logoutUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Logout failed.");
};

export const fetchListings = async () => {
  const response = await fetch(`${API_BASE_URL}/api/listings`);
  return readJson(response);
};

export const fetchStats = async () => {
  const response = await fetch(`${API_BASE_URL}/api/stats`);
  return readJson(response);
};

export const fetchUserProfile = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  return readJson(response);
};

export const fetchRatings = async (sellerId) => {
  const response = await fetch(`${API_BASE_URL}/api/ratings/${sellerId}`);
  return readJson(response);
};

export const postRating = async (token, { sellerId, rating, review, listingId }) => {
  const response = await fetch(`${API_BASE_URL}/api/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sellerId, rating, review, listingId }),
  });
  return readJson(response);
};

export const createListing = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return readJson(response);
};

export const updateSavedItem = async (token, itemId, isSaved) => {
  const response = await fetch(`${API_BASE_URL}/api/users/saved`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itemId, isSaved }),
  });
  return readJson(response);
};

export const updateProfile = async (token, { name, college, bio, username, photoURL }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, college, bio, username, photoURL }),
  });
  return readJson(response);
};

export const fetchConversations = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const openConversation = async (token, itemId) => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itemId }),
  });
  return readJson(response);
};

export const fetchConversationMessages = async (token, conversationId) => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const sendConversationMessage = async (token, conversationId, text) => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
  return readJson(response);
};

export const markConversationRead = async (token, conversationId) => {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Unable to mark messages as read.");
};

export const fetchDashboard = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const trackProfileVisit = async (userId, token) => {
  try {
    await fetch(`${API_BASE_URL}/api/users/${userId}/visit`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {}
};

export const trackListingView = async (itemId, token) => {
  try {
    await fetch(`${API_BASE_URL}/api/listings/${itemId}/view`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {}
};

export const checkFollowing = async (token, userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const followUser = async (token, userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const unfollowUser = async (token, userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const deleteListing = async (token, itemId) => {
  const response = await fetch(`${API_BASE_URL}/api/listings/${itemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Unable to delete listing.");
  }
};

export const updateListingStatus = async (token, itemId, status) => {
  const response = await fetch(`${API_BASE_URL}/api/listings/${itemId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  return readJson(response);
};

// ─── Reporting ──────────────────────────────────────────────────────────────

export const checkReportStatus = async (token, { listingId, userId }) => {
  const params = new URLSearchParams();
  if (listingId) params.set("listingId", listingId);
  if (userId) params.set("userId", userId);
  const response = await fetch(`${API_BASE_URL}/api/reports/check?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const submitReport = async (token, { targetType, listingId, reportedUserId, reason, description }) => {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ targetType, listingId, reportedUserId, reason, description }),
  });
  return readJson(response);
};

export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    // Image upload is not configured — return null so callers can skip gracefully
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Image upload failed.");
  return data.secure_url;
};

export const sendVerificationEmail = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return readJson(response);
};

export const verifyEmail = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return readJson(response);
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  // Surface both HTTP errors AND explicit { ok: false } business errors
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "Failed to send reset email. Please try again.");
  }
  return data;
};

export const resetPassword = async (token, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return readJson(response);
};

export const changePassword = async (sessionToken, { currentPassword, newPassword }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return readJson(response);
};

export const linkGoogle = async (sessionToken, credential) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/link-google`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify({ credential }),
  });
  return readJson(response);
};

export const unlinkGoogle = async (sessionToken) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/unlink-google`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return readJson(response);
};
