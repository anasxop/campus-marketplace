/* global process */
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";

const readEnvFile = () => {
  try {
    const envText = fs.readFileSync(".env", "utf8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch { /* .env is optional */ }
};

readEnvFile();

// ─── Feature flag: set to true to re-enable email verification enforcement
const EMAIL_VERIFICATION_ENABLED = false;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleOAuthClient = new OAuth2Client(googleClientId);

// ─── Email: Resend only ──────────────────────────────────────────────────────

const sendMail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Campus Marketplace <onboarding@resend.dev>";
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    const msg = typeof error === "object" ? (error.message || JSON.stringify(error)) : String(error);
    console.error(`[Mail] Resend error:`, JSON.stringify(error));
    throw new Error("Email service is temporarily unavailable. Please try again later.");
  }
  console.log(`[Mail] ✅ Resend sent to ${to} (id: ${data?.id})`);
};

const emailVerificationHtml = (name, link) => `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e5ec;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1e0757,#5c22d4);padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Campus Marketplace</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#14141f;margin:0 0 12px;font-size:18px;">Verify your email address</h2>
    <p style="color:#4b4b5c;font-size:14px;line-height:1.6;">Hi ${name}, click the button below to verify your email. The link expires in 24 hours.</p>
    <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#5c22d4;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Verify Email →</a>
    <p style="color:#9898a8;font-size:12px;">If you didn't sign up, you can safely ignore this email.</p>
  </div>
</div>`;

const passwordResetHtml = (name, link) => `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e5ec;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1e0757,#5c22d4);padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Campus Marketplace</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#14141f;margin:0 0 12px;font-size:18px;">Reset your password</h2>
    <p style="color:#4b4b5c;font-size:14px;line-height:1.6;">Hi ${name}, click the button below to set a new password. The link expires in 1 hour.</p>
    <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#5c22d4;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Reset Password →</a>
    <p style="color:#9898a8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>`;

const app = express();
const httpServer = http.createServer(app);
const port = Number(process.env.PORT || 5001);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campus-place";
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const allowedOrigins = [
  "http://localhost:5173", "http://127.0.0.1:5173",
  "http://localhost:5174", "http://127.0.0.1:5174",
  // Production: set CLIENT_URL env var to your Vercel domain e.g. https://campus-marketplace.vercel.app
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins },
  // Render may drop WebSocket upgrades on first connect; polling fallback ensures reliability.
  transports: ["polling", "websocket"],
});

app.use(cors({ origin: allowedOrigins }));app.use(express.json());

// ─── Schemas ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, default: null },
  name: { type: String, required: true, trim: true },
  username: { type: String, default: null, trim: true, lowercase: true },
  bio: { type: String, default: "", trim: true },
  college: { type: String, required: true, trim: true, default: "Galgotias University" },
  savedItemIds: { type: [String], default: [] },
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  photoURL: { type: String, default: null },
  googleId: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

const listingSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  category: { type: String, required: true, trim: true },
  college: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  condition: { type: String, required: false, trim: true, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "/favicon.svg" },
  images: { type: [String], default: [] },
  status: { type: String, enum: ["available", "reserved", "sold"], default: "available", index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Category-specific fields (stored as flexible extra data)
  subcategory:         { type: String, default: "" },
  subject:             { type: String, default: "" },
  semester:            { type: String, default: "" },
  university:          { type: String, default: "" },
  resourceType:        { type: String, default: "" },
  format:              { type: String, default: "" },
  serviceCategory:     { type: String, default: "" },
  experienceLevel:     { type: String, default: "" },
  deliveryTime:        { type: String, default: "" },
  pricingType:         { type: String, default: "" },
  availability:        { type: String, default: "" },
  portfolioLink:       { type: String, default: "" },
  brand:               { type: String, default: "" },
  model:               { type: String, default: "" },
  warrantyStatus:      { type: String, default: "" },
  accessoriesIncluded: { type: String, default: "" },
  powerRequirements:   { type: String, default: "" },
  material:            { type: String, default: "" },
  dimensions:          { type: String, default: "" },
  pickupAvailable:     { type: String, default: "" },
  deliveryAvailable:   { type: String, default: "" },
  itemType:            { type: String, default: "" },
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: "", trim: true },
  listingId: { type: String, default: "" },
}, { timestamps: true });
ratingSchema.index({ seller: 1, rater: 1 }, { unique: true });

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

const conversationSchema = new mongoose.Schema({
  itemId: { type: String, required: true, index: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  lastMessageText: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  unreadCounts: { type: Map, of: Number, default: {} },
}, { timestamps: true });
conversationSchema.index({ itemId: 1, buyer: 1, seller: 1 }, { unique: true });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  itemId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", sessionSchema);
const Listing = mongoose.model("Listing", listingSchema);
const Rating = mongoose.model("Rating", ratingSchema);
const Follow = mongoose.model("Follow", followSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);

const notificationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:         { type: String, required: true },
  message:      { type: String, required: true },
  reference_id: { type: String, default: null },
  is_read:      { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now },
});
notificationSchema.index({ user_id: 1, created_at: -1 });
const Notification = mongoose.model("Notification", notificationSchema);

// ─── Reports (listing + user moderation) ───────────────────────────────────────

const REPORT_LISTING_REASONS = ["Spam", "Fake Product", "Scam", "Inappropriate Content", "Duplicate Listing", "Other"];
const REPORT_USER_REASONS = ["Spam", "Harassment", "Fake Account", "Scam", "Inappropriate Behavior", "Other"];

const reportSchema = new mongoose.Schema({
  reporter:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetType:   { type: String, enum: ["listing", "user"], required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  listingId:    { type: String, default: null }, // itemId of the listing, if a listing report
  reason:       { type: String, required: true, trim: true },
  description:  { type: String, default: "", trim: true },
  status:       { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending", index: true },
}, { timestamps: true });
// Prevent the same reporter from filing duplicate reports against the same target
reportSchema.index({ reporter: 1, targetType: 1, listingId: 1 }, { unique: true, partialFilterExpression: { targetType: "listing" } });
reportSchema.index({ reporter: 1, targetType: 1, reportedUser: 1 }, { unique: true, partialFilterExpression: { targetType: "user" } });
const Report = mongoose.model("Report", reportSchema);

const serializeReport = (r) => ({
  id: String(r._id),
  reporterId: String(r.reporter?._id || r.reporter),
  reporterName: r.reporter?.name || null,
  targetType: r.targetType,
  reportedUserId: r.reportedUser ? String(r.reportedUser?._id || r.reportedUser) : null,
  reportedUserName: r.reportedUser?.name || null,
  listingId: r.listingId || null,
  reason: r.reason,
  description: r.description || "",
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getBearerToken = (header = "") =>
  header.startsWith("Bearer ") ? header.slice(7).trim() : null;

const serializeUser = (user) => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  username: user.username || null,
  bio: user.bio || "",
  college: user.college,
  savedItemIds: user.savedItemIds || [],
  createdAt: user.createdAt,
  authProvider: user.authProvider || "email",
  photoURL: user.photoURL || null,
  googleId: user.googleId || null,
  isAdmin: !!user.isAdmin,
  // When EMAIL_VERIFICATION_ENABLED is false, all users are treated as verified
  emailVerified: EMAIL_VERIFICATION_ENABLED ? (user.emailVerified || false) : true,
  hasPassword: !!user.passwordHash,
});

const getSellerRatingStats = async (sellerId) => {
  const ratings = await Rating.find({ seller: sellerId });
  if (!ratings.length) return { avg: 0, count: 0 };
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  return { avg: Math.round(avg * 10) / 10, count: ratings.length };
};

const serializeListing = (doc) => ({
  id: doc.itemId,
  title: doc.title,
  price: doc.price,
  originalPrice: doc.originalPrice,
  category: doc.category,
  college: doc.college,
  type: doc.type,
  condition: doc.condition,
  description: doc.description || "",
  image: doc.image,
  images: doc.images || [],
  status: doc.status || "available",
  seller: doc.owner?.name || "User",
  ownerId: doc.owner ? String(doc.owner._id) : null,
  ownerCollege: doc.owner?.college || doc.college,
  ownerCreatedAt: doc.owner?.createdAt || null,
  ownerPhotoURL: doc.owner?.photoURL || null,
  createdAt: doc.createdAt,
  // Category-specific fields
  subcategory:         doc.subcategory         || "",
  subject:             doc.subject             || "",
  semester:            doc.semester            || "",
  university:          doc.university          || "",
  resourceType:        doc.resourceType        || "",
  format:              doc.format              || "",
  serviceCategory:     doc.serviceCategory     || "",
  experienceLevel:     doc.experienceLevel     || "",
  deliveryTime:        doc.deliveryTime        || "",
  pricingType:         doc.pricingType         || "",
  availability:        doc.availability        || "",
  portfolioLink:       doc.portfolioLink       || "",
  brand:               doc.brand               || "",
  model:               doc.model               || "",
  warrantyStatus:      doc.warrantyStatus      || "",
  accessoriesIncluded: doc.accessoriesIncluded || "",
  powerRequirements:   doc.powerRequirements   || "",
  material:            doc.material            || "",
  dimensions:          doc.dimensions          || "",
  pickupAvailable:     doc.pickupAvailable     || "",
  deliveryAvailable:   doc.deliveryAvailable   || "",
  itemType:            doc.itemType            || "",
});

const getUnreadCountForUser = (convo, userId) =>
  Number(convo.unreadCounts?.get?.(String(userId)) || convo.unreadCounts?.[String(userId)] || 0);

const buildConversationSummary = (convo, currentUserId, listing) => {
  const isBuyer = String(convo.buyer?._id || convo.buyer) === String(currentUserId);
  const counterpart = isBuyer ? convo.seller : convo.buyer;
  return {
    id: String(convo._id),
    itemId: convo.itemId,
    buyerId: String(convo.buyer?._id || convo.buyer),
    sellerId: String(convo.seller?._id || convo.seller),
    otherUser: counterpart ? { id: String(counterpart._id), name: counterpart.name, college: counterpart.college, photoURL: counterpart.photoURL || null } : null,
    product: listing ? { id: listing.itemId, title: listing.title, image: listing.image, price: listing.price } : null,
    lastMessageText: convo.lastMessageText || "",
    lastMessageAt: convo.lastMessageAt || convo.updatedAt,
    unreadCount: getUnreadCountForUser(convo, currentUserId),
  };
};

const buildMessagePayload = (msg) => ({
  id: String(msg._id),
  conversationId: String(msg.conversation?._id || msg.conversation),
  itemId: msg.itemId,
  senderId: String(msg.sender?._id || msg.sender),
  senderName: msg.sender?.name,
  senderPhotoURL: msg.sender?.photoURL || null,
  receiverId: String(msg.receiver?._id || msg.receiver),
  text: msg.text,
  readAt: msg.readAt,
  createdAt: msg.createdAt,
});

const requireUser = async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ message: "Missing session token." });
  const session = await Session.findOne({ token }).populate("user");
  if (!session?.user) return res.status(401).json({ message: "Session not found." });
  if (session.expiresAt.getTime() <= Date.now()) {
    await Session.deleteOne({ _id: session._id });
    return res.status(401).json({ message: "Session expired." });
  }
  return { session, user: session.user };
};

const requireAdmin = async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return null;
  if (!result.user.isAdmin) {
    res.status(403).json({ message: "Admin access required." });
    return null;
  }
  return result;
};

const requireSocketUser = async (socket, next) => {
  try {
    const rawToken = socket.handshake.auth?.token ||
      getBearerToken(socket.handshake.auth?.authorization || "") ||
      getBearerToken(socket.handshake.headers?.authorization || "");
    if (!rawToken) return next(new Error("Missing session token."));
    const session = await Session.findOne({ token: rawToken }).populate("user");
    if (!session?.user) return next(new Error("Session not found."));
    if (session.expiresAt.getTime() <= Date.now()) {
      await Session.deleteOne({ _id: session._id });
      return next(new Error("Session expired."));
    }
    socket.data.userId = String(session.user._id);
    socket.data.userName = session.user.name;
    return next();
  } catch (error) { return next(error); }
};

const emitConversationSummary = async (conversationId) => {
  const convo = await Conversation.findById(conversationId)
    .populate("buyer", "name college photoURL").populate("seller", "name college photoURL");
  if (!convo) return;
  const listing = await Listing.findOne({ itemId: convo.itemId });
  const buyerId = String(convo.buyer._id), sellerId = String(convo.seller._id);
  io.to(`user:${buyerId}`).emit("conversation:updated", buildConversationSummary(convo, buyerId, listing));
  io.to(`user:${sellerId}`).emit("conversation:updated", buildConversationSummary(convo, sellerId, listing));
};

io.use(requireSocketUser);
io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);
  socket.on("conversation:join", async ({ conversationId }) => {
    if (!conversationId) return;
    const convo = await Conversation.findOne({ _id: conversationId, participants: socket.data.userId });
    if (!convo) return;
    socket.join(`conversation:${conversationId}`);
  });
  socket.on("conversation:leave", ({ conversationId }) => {
    if (conversationId) socket.leave(`conversation:${conversationId}`);
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Real-time stats for homepage
app.get("/api/stats", async (_req, res) => {
  try {
    const totalItems = await Listing.countDocuments();
    const listings = await Listing.find({}, "price originalPrice college");
    let avgDiscount = 0;
    if (listings.length) {
      const discounts = listings.filter(l => l.originalPrice > l.price)
        .map(l => Math.round(((l.originalPrice - l.price) / l.originalPrice) * 100));
      if (discounts.length) avgDiscount = Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length);
    }
    const uniqueColleges = await Listing.distinct("college");
    return res.json({ totalItems, avgDiscount, totalColleges: uniqueColleges.length, colleges: uniqueColleges });
  } catch { return res.status(500).json({ message: "Failed to fetch stats." }); }
});

// Public user profile
app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });

    const listings = await Listing.find({ owner: userId }).populate("owner").sort({ createdAt: -1 });
    const ratingStats = await getSellerRatingStats(userId);

    const followerCount = await Follow.countDocuments({ following: userId });
    const followingCount = await Follow.countDocuments({ follower: userId });

    const sellerConversations = await Conversation.find({ seller: userId });
    let responseRate = null;
    let avgResponseTimeMinutes = null;
    if (sellerConversations.length > 0) {
      const convIds = sellerConversations.map(c => c._id);
      const inbound = await Message.find({ conversation: { $in: convIds }, receiver: userId }).sort({ createdAt: 1 });
      let replied = 0, totalMs = 0, count = 0;
      for (const msg of inbound) {
        const reply = await Message.findOne({
          conversation: msg.conversation, sender: userId,
          createdAt: { $gt: msg.createdAt },
        }).sort({ createdAt: 1 });
        if (reply) { replied++; totalMs += reply.createdAt - msg.createdAt; count++; }
      }
      if (inbound.length > 0) responseRate = Math.round((replied / inbound.length) * 100);
      if (count > 0) avgResponseTimeMinutes = Math.round(totalMs / count / 60000);
    }

    const profileVisitCount = await ProfileVisit.countDocuments({ profileId: userId });

    return res.json({
      user: serializeUser(user),
      listings: listings.map(serializeListing),
      ratingStats,
      followerCount,
      followingCount,
      responseRate,
      avgResponseTimeMinutes,
      profileVisitCount,
    });
  } catch { return res.status(404).json({ message: "User not found." }); }
});

// Get ratings
app.get("/api/ratings/:sellerId", async (req, res) => {
  try {
    const stats = await getSellerRatingStats(req.params.sellerId);
    const reviews = await Rating.find({ seller: req.params.sellerId })
      .populate("rater", "name college photoURL").sort({ createdAt: -1 }).limit(10);
    return res.json({
      stats,
      reviews: reviews.map(r => ({
        id: String(r._id), rating: r.rating, review: r.review,
        raterName: r.rater?.name || "Student", raterCollege: r.rater?.college || "",
        raterPhotoURL: r.rater?.photoURL || null, createdAt: r.createdAt,
      })),
    });
  } catch { return res.status(500).json({ message: "Failed to fetch ratings." }); }
});

// Post a rating
app.post("/api/ratings", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const { sellerId, rating, review, listingId } = req.body;
  if (!sellerId || !rating) return res.status(400).json({ message: "sellerId and rating are required." });
  if (String(result.user._id) === String(sellerId)) return res.status(400).json({ message: "Cannot rate yourself." });
  if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5." });
  try {
    await Rating.findOneAndUpdate(
      { seller: sellerId, rater: result.user._id },
      { rating, review: review || "", listingId: listingId || "" },
      { upsert: true, new: true },
    );
    // Notify seller of new review
    try {
      await Notification.create({
        user_id: sellerId,
        type: "new_review",
        message: `${result.user.name} left you a ${rating}-star review`,
        reference_id: listingId || null,
      });
    } catch (_) {}
    const stats = await getSellerRatingStats(sellerId);
    return res.status(201).json({ stats });
  } catch { return res.status(500).json({ message: "Failed to save rating." }); }
});

// ─── Follow system ────────────────────────────────────────────────────────────

// Check if current user follows a profile
app.get("/api/users/:userId/follow", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const isFollowing = await Follow.exists({ follower: result.user._id, following: req.params.userId });
  return res.json({ isFollowing: !!isFollowing });
});

// Follow a user
app.post("/api/users/:userId/follow", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  if (String(result.user._id) === String(req.params.userId))
    return res.status(400).json({ message: "Cannot follow yourself." });
  try {
    await Follow.findOneAndUpdate(
      { follower: result.user._id, following: req.params.userId },
      {},
      { upsert: true, new: true },
    );
    // Notify the user being followed
    try {
      await Notification.create({
        user_id: req.params.userId,
        type: "new_follower",
        message: `${result.user.name} started following you`,
        reference_id: String(result.user._id),
      });
    } catch (_) {}
    const followerCount = await Follow.countDocuments({ following: req.params.userId });
    return res.json({ isFollowing: true, followerCount });
  } catch { return res.status(500).json({ message: "Failed to follow." }); }
});

// Unfollow a user
app.delete("/api/users/:userId/follow", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  await Follow.deleteOne({ follower: result.user._id, following: req.params.userId });
  const followerCount = await Follow.countDocuments({ following: req.params.userId });
  return res.json({ isFollowing: false, followerCount });
});

// ─── Reporting system ───────────────────────────────────────────────────────────

// Check whether the current user has already reported a given listing/user.
// Used by the client to disable the report button and show "already reported".
app.get("/api/reports/check", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const { listingId, userId } = req.query;
  try {
    let existing = null;
    if (listingId) {
      existing = await Report.findOne({ reporter: result.user._id, targetType: "listing", listingId: String(listingId) });
    } else if (userId) {
      existing = await Report.findOne({ reporter: result.user._id, targetType: "user", reportedUser: userId });
    } else {
      return res.status(400).json({ message: "listingId or userId is required." });
    }
    return res.json({ alreadyReported: !!existing, report: existing ? serializeReport(existing) : null });
  } catch { return res.status(500).json({ message: "Failed to check report status." }); }
});

// Submit a report against a listing or a user.
app.post("/api/reports", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const targetType = String(req.body?.targetType || "").trim().toLowerCase();
  const reason = String(req.body?.reason || "").trim();
  const description = String(req.body?.description || "").trim();
  const listingId = req.body?.listingId ? String(req.body.listingId) : null;
  const reportedUserId = req.body?.reportedUserId ? String(req.body.reportedUserId) : null;

  if (!["listing", "user"].includes(targetType))
    return res.status(400).json({ message: "targetType must be 'listing' or 'user'." });

  if (targetType === "listing") {
    if (!listingId) return res.status(400).json({ message: "listingId is required for listing reports." });
    if (!REPORT_LISTING_REASONS.includes(reason))
      return res.status(400).json({ message: `reason must be one of: ${REPORT_LISTING_REASONS.join(", ")}.` });
    const listing = await Listing.findOne({ itemId: listingId });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
  } else {
    if (!reportedUserId) return res.status(400).json({ message: "reportedUserId is required for user reports." });
    if (!REPORT_USER_REASONS.includes(reason))
      return res.status(400).json({ message: `reason must be one of: ${REPORT_USER_REASONS.join(", ")}.` });
    if (String(reportedUserId) === String(result.user._id))
      return res.status(400).json({ message: "You cannot report yourself." });
    const targetUser = await User.findById(reportedUserId);
    if (!targetUser) return res.status(404).json({ message: "User not found." });
  }

  try {
    const report = await Report.create({
      reporter: result.user._id,
      targetType,
      listingId: targetType === "listing" ? listingId : null,
      reportedUser: targetType === "user" ? reportedUserId : null,
      reason,
      description,
    });
    return res.status(201).json({ report: serializeReport(report) });
  } catch (err) {
    // Duplicate key error = the unique index on (reporter, targetType, target) was hit
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You have already reported this." });
    }
    console.error("Report submission error:", err);
    return res.status(500).json({ message: "Failed to submit report." });
  }
});

// ─── Admin moderation ─────────────────────────────────────────────────────────

// List reports — supports ?status=pending|reviewed|resolved and ?targetType=listing|user
app.get("/api/admin/reports", async (req, res) => {
  const result = await requireAdmin(req, res);
  if (!result) return;
  const { status, targetType } = req.query;
  const query = {};
  if (status && ["pending", "reviewed", "resolved"].includes(status)) query.status = status;
  if (targetType && ["listing", "user"].includes(targetType)) query.targetType = targetType;
  try {
    const reports = await Report.find(query)
      .populate("reporter", "name email college")
      .populate("reportedUser", "name email college")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ reports: reports.map(serializeReport) });
  } catch { return res.status(500).json({ message: "Failed to fetch reports." }); }
});

// Mark a report as reviewed or resolved. Does NOT delete any content —
// reports are stored and reviewed only, per moderation policy.
app.patch("/api/admin/reports/:id", async (req, res) => {
  const result = await requireAdmin(req, res);
  if (!result) return;
  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!["pending", "reviewed", "resolved"].includes(status))
    return res.status(400).json({ message: "status must be one of: pending, reviewed, resolved." });
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("reporter", "name email college")
      .populate("reportedUser", "name email college");
    if (!report) return res.status(404).json({ message: "Report not found." });
    return res.json({ report: serializeReport(report) });
  } catch { return res.status(500).json({ message: "Failed to update report." }); }
});

app.post("/api/auth/signup", async (req, res) => {
  const email = req.body?.email?.trim()?.toLowerCase();
  const password = req.body?.password?.trim();
  const name = req.body?.name?.trim();
  const college = req.body?.college?.trim();
  if (!email || !password || !name || !college)
    return res.status(400).json({ message: "Email, password, name, and college are required." });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Account already exists. Please log in." });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name, college, authProvider: "email" });
  const token = crypto.randomUUID();
  await Session.create({ token, user: user._id, expiresAt: new Date(Date.now() + sessionLifetimeMs) });
  return res.status(201).json({ token, user: serializeUser(user) });
});

// ─── Google OAuth ──────────────────────────────────────────────────────────────

const pendingGoogleSchema = new mongoose.Schema({
  pendingToken: { type: String, required: true, unique: true },
  googleId:     { type: String, required: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  name:         { type: String, required: true },
  photoURL:     { type: String, default: null },
  expiresAt:    { type: Date,   required: true, index: { expires: 0 } },
}, { timestamps: true });
const PendingGoogleUser = mongoose.models.PendingGoogleUser ||
  mongoose.model("PendingGoogleUser", pendingGoogleSchema);

// Step 1 — verify Google credential, return session (existing user) or pendingToken (new user)
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential is required." });
    if (!googleClientId) return res.status(500).json({ message: "Google OAuth not configured on server." });

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: "Invalid Google token." });

    const { sub: googleId, email: rawEmail, name, picture: photoURL } = payload;
    const email = rawEmail?.trim()?.toLowerCase();
    if (!email) return res.status(400).json({ message: "Google account has no email address." });

    // Check if user already exists (by email or googleId)
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // Returning user — patch Google fields silently then log in immediately
      let dirty = false;
      if (!user.googleId)                         { user.googleId  = googleId;        dirty = true; }
      if (photoURL && user.photoURL !== photoURL)  { user.photoURL  = photoURL;        dirty = true; }
      if (dirty) await user.save();

      const token = crypto.randomUUID();
      await Session.create({ token, user: user._id, expiresAt: new Date(Date.now() + sessionLifetimeMs) });
      return res.status(200).json({ status: "ok", token, user: serializeUser(user) });
    }

    // Brand-new user — issue a short-lived pendingToken, do NOT create the account yet
    await PendingGoogleUser.deleteMany({ email }); // clear any stale pending entries
    const pendingToken = crypto.randomUUID();
    await PendingGoogleUser.create({
      pendingToken,
      googleId,
      email,
      name:     name || email.split("@")[0],
      photoURL: photoURL || null,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min window
    });

    return res.status(200).json({
      status: "onboarding_required",
      pendingToken,
      profile: { name: name || email.split("@")[0], email, photoURL: photoURL || null },
    });
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    return res.status(401).json({ message: "Google authentication failed. Please try again." });
  }
});

// Step 2 — complete onboarding: validate university, create user, return real session
app.post("/api/auth/google/complete", async (req, res) => {
  try {
    const { pendingToken, college } = req.body;
    if (!pendingToken) return res.status(400).json({ message: "Pending token is required." });
    if (!college?.trim()) return res.status(400).json({ message: "University selection is required." });

    const pending = await PendingGoogleUser.findOne({ pendingToken });
    if (!pending) return res.status(401).json({ message: "Onboarding session expired or invalid. Please sign in with Google again." });
    if (pending.expiresAt.getTime() <= Date.now()) {
      await PendingGoogleUser.deleteOne({ _id: pending._id });
      return res.status(401).json({ message: "Onboarding session expired. Please sign in with Google again." });
    }

    const existing = await User.findOne({ $or: [{ email: pending.email }, { googleId: pending.googleId }] });
    if (existing) {
      // Account snuck in — just log them in
      await PendingGoogleUser.deleteOne({ _id: pending._id });
      const token = crypto.randomUUID();
      await Session.create({ token, user: existing._id, expiresAt: new Date(Date.now() + sessionLifetimeMs) });
      return res.status(200).json({ token, user: serializeUser(existing) });
    }

    const user = await User.create({
      email:        pending.email,
      name:         pending.name,
      college:      college.trim(),
      authProvider: "google",
      googleId:     pending.googleId,
      photoURL:     pending.photoURL || null,
      passwordHash: null,
    });

    await PendingGoogleUser.deleteOne({ _id: pending._id });

    const token = crypto.randomUUID();
    await Session.create({ token, user: user._id, expiresAt: new Date(Date.now() + sessionLifetimeMs) });
    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("Google complete error:", error.message);
    return res.status(500).json({ message: "Failed to complete sign-up. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password?.trim();
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });
    const token = crypto.randomUUID();
    await Session.create({ token, user: user._id, expiresAt: new Date(Date.now() + sessionLifetimeMs) });
    return res.status(200).json({ token, user: serializeUser(user) });
  } catch (error) { return res.status(500).json({ message: "Unable to login.", error: error.message }); }
});

app.get("/api/auth/session", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  return res.json({ token: result.session.token, user: serializeUser(result.user) });
});

app.post("/api/auth/logout", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(204).send();
  await Session.deleteOne({ token });
  return res.status(204).send();
});

app.patch("/api/users/profile", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const { name, college, bio, username, photoURL } = req.body || {};
  if (name?.trim()) result.user.name = name.trim();
  if (college?.trim()) result.user.college = college.trim();
  if (bio !== undefined) result.user.bio = bio.trim();
  if (photoURL !== undefined) result.user.photoURL = photoURL || null;
  if (username !== undefined) {
    const slug = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (slug && slug !== result.user.username) {
      const taken = await User.findOne({ username: slug, _id: { $ne: result.user._id } });
      if (taken) return res.status(409).json({ message: "Username already taken." });
      result.user.username = slug;
    }
  }
  if (!result.user.name || !result.user.college) return res.status(400).json({ message: "Name and college are required." });
  await result.user.save();
  return res.json({ user: serializeUser(result.user) });
});

// ─── Email Verification ─────────────────────────────────────────────────────

app.post("/api/auth/send-verification", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const user = result.user;
  if (user.emailVerified) return res.json({ message: "Email already verified." });
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerifyToken = token;
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const frontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "")
    || `${req.protocol}://${req.get("host")}`;
  const link = `${frontendUrl}/#/verify-email?token=${token}`;
  try {
    await sendMail({ to: user.email, subject: "Verify your Campus Marketplace email", html: emailVerificationHtml(user.name, link) });
    return res.json({ message: "Verification email sent. Check your inbox." });
  } catch (err) {
    console.error("[Auth] Verification email failed:", err.message);
    return res.status(503).json({
      message: err.message,
      debug: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ message: "Token is required." });
  const user = await User.findOne({ emailVerifyToken: token });
  if (!user) return res.status(400).json({ message: "Invalid or expired verification link." });
  if (user.emailVerifyExpires && user.emailVerifyExpires.getTime() < Date.now())
    return res.status(400).json({ message: "Verification link has expired. Please request a new one." });
  user.emailVerified = true;
  user.emailVerifyToken = null;
  user.emailVerifyExpires = null;
  await user.save();
  return res.json({ message: "Email verified successfully." });
});

// ─── Forgot / Reset Password ────────────────────────────────────────────────

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = req.body?.email?.trim()?.toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ ok: true, message: "If that email is registered, a reset link has been sent. Check your inbox (and spam folder)." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const frontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "")
    || `${req.protocol}://${req.get("host")}`;
  const link = `${frontendUrl}/#/reset-password?token=${token}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset your Campus Marketplace password",
      html: passwordResetHtml(user.name, link),
    });
    console.log(`[Auth] Password reset email sent to ${user.email}`);
    return res.json({
      ok: true,
      message: "Reset link sent! Check your inbox (and spam folder). The link expires in 1 hour.",
    });
  } catch (err) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.error(`[Auth] ❌ Password reset email failed for ${user.email}: ${err.message}`);

    return res.status(503).json({
      ok: false,
      message: err.message,
      debug: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: "Token and new password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  const user = await User.findOne({ passwordResetToken: token });
  if (!user) return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
  if (user.passwordResetExpires && user.passwordResetExpires.getTime() < Date.now())
    return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  // authProvider is intentionally NOT changed here.
  // A Google-only user who resets their password retains authProvider="google"
  // (Google login keeps working) and can also log in with their new password
  // because passwordHash is now set. The enum only allows "email" | "google".
  await user.save();
  await Session.deleteMany({ user: user._id });
  console.log(`[Auth] ✅ Password reset for ${user.email}`);
  return res.json({ message: "Password reset! You can now log in with your new password." });
});

// ─── Change Password (authenticated) ───────────────────────────────────────

app.post("/api/auth/change-password", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  const user = result.user;
  if (user.passwordHash) {
    if (!currentPassword) return res.status(400).json({ message: "Current password is required." });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect." });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: "Password changed successfully.", user: serializeUser(user) });
});

// ─── Link / Unlink Google ───────────────────────────────────────────────────

app.post("/api/auth/link-google", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ message: "Google credential is required." });
  try {
    const ticket = await googleOAuthClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    const { sub: googleId, picture: photoURL } = payload;
    const existing = await User.findOne({ googleId, _id: { $ne: result.user._id } });
    if (existing) return res.status(409).json({ message: "This Google account is already linked to another user." });
    result.user.googleId = googleId;
    if (photoURL && !result.user.photoURL) result.user.photoURL = photoURL;
    await result.user.save();
    return res.json({ user: serializeUser(result.user) });
  } catch { return res.status(401).json({ message: "Google verification failed." }); }
});

app.post("/api/auth/unlink-google", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  if (!result.user.passwordHash)
    return res.status(400).json({ message: "Set a password before unlinking Google, so you don't lose access to your account." });
  result.user.googleId = null;
  await result.user.save();
  return res.json({ user: serializeUser(result.user) });
});

app.post("/api/users/saved", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const itemId = String(req.body?.itemId || "");
  const isSaved = Boolean(req.body?.isSaved);
  if (!itemId) return res.status(400).json({ message: "itemId is required." });
  const savedSet = new Set(result.user.savedItemIds || []);
  if (isSaved) savedSet.add(itemId); else savedSet.delete(itemId);
  result.user.savedItemIds = Array.from(savedSet);
  await result.user.save();
  return res.json({ savedItemIds: result.user.savedItemIds });
});

app.get("/api/listings", async (_req, res) => {
  const docs = await Listing.find({}).populate("owner").sort({ createdAt: -1 });
  return res.json({ listings: docs.map(serializeListing) });
});

app.post("/api/listings", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const title = req.body?.title?.trim();
  const price = Number(req.body?.price);
  const originalPrice = Number(req.body?.originalPrice || req.body?.price);
  const category = req.body?.category?.trim();
  const type = req.body?.type?.trim();
  const condition = req.body?.condition?.trim() || "";
  const description = req.body?.description?.trim() || "";
  const image = req.body?.image?.trim();
  const images = req.body?.images || [];
  if (!title || !price || !category || !type)
    return res.status(400).json({ message: "Missing required listing fields." });
  const listing = await Listing.create({
    itemId: String(Date.now()), title, price, originalPrice, category,
    college: result.user.college, type, condition, description,
    image: image || (images[0] || "/favicon.svg"),
    images: images.length > 0 ? images : (image ? [image] : []),
    owner: result.user._id,
    subcategory:         req.body?.subcategory         || "",
    subject:             req.body?.subject             || "",
    semester:            req.body?.semester            || "",
    university:          req.body?.university          || "",
    resourceType:        req.body?.resourceType        || "",
    format:              req.body?.format              || "",
    serviceCategory:     req.body?.serviceCategory     || "",
    experienceLevel:     req.body?.experienceLevel     || "",
    deliveryTime:        req.body?.deliveryTime        || "",
    pricingType:         req.body?.pricingType         || "",
    availability:        req.body?.availability        || "",
    portfolioLink:       req.body?.portfolioLink       || "",
    brand:               req.body?.brand               || "",
    model:               req.body?.model               || "",
    warrantyStatus:      req.body?.warrantyStatus      || "",
    accessoriesIncluded: req.body?.accessoriesIncluded || "",
    powerRequirements:   req.body?.powerRequirements   || "",
    material:            req.body?.material            || "",
    dimensions:          req.body?.dimensions          || "",
    pickupAvailable:     req.body?.pickupAvailable     || "",
    deliveryAvailable:   req.body?.deliveryAvailable   || "",
    itemType:            req.body?.itemType            || "",
  });
  await listing.populate("owner");
  return res.status(201).json({ listing: serializeListing(listing) });
});

const LISTING_STATUS_VALUES = ["available", "reserved", "sold"];
const STATUS_CHAT_MESSAGE = {
  available: "Seller marked this item as Available.",
  reserved: "Seller marked this item as Reserved.",
  sold: "Seller marked this item as Sold.",
};

// Update a listing's status (Available / Reserved / Sold) — owner only.
// Posts a system-style chat message into every conversation tied to this
// listing so buyers see the status change in real time.
app.patch("/api/listings/:itemId/status", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const itemId = String(req.params.itemId || "");
  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!itemId) return res.status(400).json({ message: "itemId is required." });
  if (!LISTING_STATUS_VALUES.includes(status))
    return res.status(400).json({ message: `status must be one of: ${LISTING_STATUS_VALUES.join(", ")}.` });

  const listing = await Listing.findOne({ itemId }).populate("owner");
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (String(listing.owner._id) !== String(result.user._id))
    return res.status(403).json({ message: "Only the listing owner can change its status." });

  const previousStatus = listing.status || "available";
  listing.status = status;
  await listing.save();

  // Notify everyone chatting about this listing with a system-style message,
  // but only when the status actually changed.
  if (previousStatus !== status) {
    const conversations = await Conversation.find({ itemId });
    const text = STATUS_CHAT_MESSAGE[status];
    for (const convo of conversations) {
      const buyerId = String(convo.buyer);
      const sellerId = String(convo.seller);
      const message = await Message.create({
        conversation: convo._id, itemId, sender: sellerId, receiver: buyerId, text,
      });
      convo.lastMessageText = text;
      convo.lastMessageAt = message.createdAt;
      convo.lastMessageSender = sellerId;
      convo.unreadCounts = { ...Object.fromEntries(convo.unreadCounts || []), [buyerId]: getUnreadCountForUser(convo, buyerId) + 1 };
      await convo.save();
      await message.populate("sender", "name photoURL");
      await message.populate("receiver", "name");
      const payload = buildMessagePayload(message);
      io.to(`conversation:${convo._id}`).emit("conversation:message", payload);
      await emitConversationSummary(convo._id);
      try {
        await Notification.create({
          user_id: buyerId,
          type: "listing_status",
          message: `${listing.owner.name} marked "${listing.title}" as ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          reference_id: itemId,
        });
      } catch (_) {}
    }
  }

  return res.json({ listing: serializeListing(listing) });
});

app.delete("/api/listings/:itemId", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const itemId = String(req.params.itemId || "");
  if (!itemId) return res.status(400).json({ message: "itemId is required." });
  const listing = await Listing.findOne({ itemId });
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (String(listing.owner) !== String(result.user._id))
    return res.status(403).json({ message: "You can delete only your own listing." });
  await Listing.deleteOne({ _id: listing._id });
  await Conversation.deleteMany({ itemId });
  await Message.deleteMany({ itemId });
  await User.updateMany({ savedItemIds: itemId }, { $pull: { savedItemIds: itemId } });
  return res.status(204).send();
});

app.get("/api/conversations", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const userId = String(result.user._id);
  const convos = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("buyer", "name college photoURL").populate("seller", "name college photoURL");
  const itemIds = Array.from(new Set(convos.map(c => c.itemId)));
  const listings = await Listing.find({ itemId: { $in: itemIds } });
  const listingMap = new Map(listings.map(l => [l.itemId, l]));
  return res.json({ conversations: convos.map(c => buildConversationSummary(c, userId, listingMap.get(c.itemId))) });
});

app.post("/api/conversations/open", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const itemId = String(req.body?.itemId || "");
  if (!itemId) return res.status(400).json({ message: "itemId is required." });
  const listing = await Listing.findOne({ itemId }).populate("owner", "name college");
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  const buyerId = String(result.user._id), sellerId = String(listing.owner._id);
  if (buyerId === sellerId) return res.status(400).json({ message: "You cannot chat on your own listing." });
  let convo = await Conversation.findOne({ itemId, buyer: result.user._id, seller: listing.owner._id })
    .populate("buyer", "name college photoURL").populate("seller", "name college photoURL");
  if (!convo) {
    convo = await Conversation.create({
      itemId, buyer: result.user._id, seller: listing.owner._id,
      participants: [result.user._id, listing.owner._id],
      unreadCounts: { [buyerId]: 0, [sellerId]: 0 }, lastMessageAt: new Date(),
    });
    convo = await Conversation.findById(convo._id).populate("buyer", "name college photoURL").populate("seller", "name college photoURL");
  }
  return res.status(201).json({ conversation: buildConversationSummary(convo, buyerId, listing) });
});

app.get("/api/conversations/:conversationId/messages", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const conversationId = String(req.params.conversationId || "");
  if (!conversationId) return res.status(400).json({ message: "conversationId is required." });
  const convo = await Conversation.findOne({ _id: conversationId, participants: String(result.user._id) });
  if (!convo) return res.status(404).json({ message: "Conversation not found." });
  const messages = await Message.find({ conversation: convo._id }).sort({ createdAt: 1 })
    .populate("sender", "name photoURL").populate("receiver", "name");
  return res.json({ messages: messages.map(buildMessagePayload) });
});

app.post("/api/conversations/:conversationId/messages", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const conversationId = String(req.params.conversationId || "");
  const text = req.body?.text?.trim();
  if (!conversationId || !text) return res.status(400).json({ message: "conversationId and text are required." });
  const convo = await Conversation.findOne({ _id: conversationId, participants: String(result.user._id) });
  if (!convo) return res.status(404).json({ message: "Conversation not found." });
  const senderId = String(result.user._id);
  const buyerId = String(convo.buyer), sellerId = String(convo.seller);
  const receiverId = senderId === buyerId ? sellerId : buyerId;
  const message = await Message.create({ conversation: convo._id, itemId: convo.itemId, sender: result.user._id, receiver: receiverId, text });
  convo.lastMessageText = text; convo.lastMessageAt = message.createdAt; convo.lastMessageSender = result.user._id;
  convo.unreadCounts = { ...Object.fromEntries(convo.unreadCounts || []), [senderId]: 0, [receiverId]: getUnreadCountForUser(convo, receiverId) + 1 };
  await convo.save();
  await message.populate("sender", "name photoURL"); await message.populate("receiver", "name");
  try {
    await Notification.create({
      user_id: receiverId,
      type: "new_message",
      message: `${message.sender.name} sent you a message`,
      reference_id: String(convo._id),
    });
  } catch (_) {}
  const payload = buildMessagePayload(message);
  io.to(`conversation:${conversationId}`).emit("conversation:message", payload);
  await emitConversationSummary(convo._id);
  return res.status(201).json({ message: payload });
});

app.post("/api/conversations/:conversationId/read", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const conversationId = String(req.params.conversationId || "");
  if (!conversationId) return res.status(400).json({ message: "conversationId is required." });
  const convo = await Conversation.findOne({ _id: conversationId, participants: String(result.user._id) });
  if (!convo) return res.status(404).json({ message: "Conversation not found." });
  await Message.updateMany({ conversation: convo._id, receiver: result.user._id, readAt: null }, { $set: { readAt: new Date() } });
  convo.unreadCounts = { ...Object.fromEntries(convo.unreadCounts || []), [String(result.user._id)]: 0 };
  await convo.save();
  await emitConversationSummary(convo._id);
  return res.status(204).send();
});

// ─── Profile Visit Tracking ────────────────────────────────────────────────────

const profileVisitSchema = new mongoose.Schema({
  profileId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  visitorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  visitorIp:  { type: String, default: null }, // used for anonymous duplicate protection
  createdAt:  { type: Date, default: Date.now, index: true },
});
profileVisitSchema.index({ profileId: 1, createdAt: -1 });
profileVisitSchema.index({ profileId: 1, visitorId: 1, createdAt: -1 }); // fast dup-check for auth'd visitors
profileVisitSchema.index({ profileId: 1, visitorIp: 1, createdAt: -1 }); // fast dup-check for anonymous
const ProfileVisit = mongoose.model("ProfileVisit", profileVisitSchema);

// ─── Listing View Tracking ────────────────────────────────────────────────────

const listingViewSchema = new mongoose.Schema({
  itemId:    { type: String, required: true, index: true },
  viewerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  viewerIp:  { type: String, default: null }, // used for anonymous duplicate protection
  createdAt: { type: Date, default: Date.now, index: true },
});
listingViewSchema.index({ itemId: 1, createdAt: -1 });
listingViewSchema.index({ itemId: 1, viewerId: 1, createdAt: -1 }); // fast dup-check for auth users
listingViewSchema.index({ itemId: 1, viewerIp: 1, createdAt: -1 }); // fast dup-check for anonymous
const ListingView = mongoose.model("ListingView", listingViewSchema);

// ─── Track Profile Visit ──────────────────────────────────────────────────────
app.post("/api/users/:userId/visit", async (req, res) => {
  try {
    const profileId = req.params.userId;
    const token = getBearerToken(req.headers.authorization);

    // Resolve visitor identity
    let visitorId  = null;
    let visitorIp  = null;
    if (token) {
      const session = await Session.findOne({ token }).populate("user");
      if (session?.user && String(session.user._id) !== profileId) {
        visitorId = session.user._id;
      }
    }
    if (!visitorId) {
      // Use IP as a short-lived identifier for anonymous visitors.
      // x-forwarded-for covers reverse-proxy setups; fall back to socket address.
      visitorIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
        .split(",")[0].trim();
    }

    // ── Duplicate protection: one visit per (profile, visitor) per 30 minutes ──
    const windowStart = new Date(Date.now() - 30 * 60 * 1000);
    const dupQuery = visitorId
      ? { profileId, visitorId,  createdAt: { $gte: windowStart } }
      : { profileId, visitorIp,  createdAt: { $gte: windowStart } };

    const alreadyRecorded = await ProfileVisit.exists(dupQuery);
    if (alreadyRecorded) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    await ProfileVisit.create({ profileId, visitorId, visitorIp });
    return res.status(201).json({ ok: true });
  } catch { return res.status(201).json({ ok: true }); }
});

// ─── Track Listing View ───────────────────────────────────────────────────────
app.post("/api/listings/:itemId/view", async (req, res) => {
  try {
    const { itemId } = req.params;
    const token = getBearerToken(req.headers.authorization);

    // ── Resolve visitor identity ──────────────────────────────────────────────
    let viewerId  = null;
    let viewerIp  = null;

    if (token) {
      const session = await Session.findOne({ token }).populate("user");
      if (session?.user) {
        // Owner-visit guard: never count the listing owner's own views
        const listing = await Listing.findOne({ itemId });
        if (listing && String(session.user._id) === String(listing.owner)) {
          return res.status(200).json({ ok: true, duplicate: true, reason: "owner" });
        }
        viewerId = session.user._id;
      }
    }

    if (!viewerId) {
      // Anonymous visitor: use IP as a short-lived deduplication key
      viewerIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
        .split(",")[0].trim();
    }

    // ── Duplicate protection: one view per (listing, visitor) per 30 minutes ──
    const windowStart = new Date(Date.now() - 30 * 60 * 1000);
    const dupQuery = viewerId
      ? { itemId, viewerId,  createdAt: { $gte: windowStart } }
      : { itemId, viewerIp,  createdAt: { $gte: windowStart } };

    const alreadyRecorded = await ListingView.exists(dupQuery);
    if (alreadyRecorded) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    await ListingView.create({ itemId, viewerId, viewerIp });
    return res.status(201).json({ ok: true });
  } catch { return res.status(201).json({ ok: true }); }
});

// ─── Dashboard Analytics API ──────────────────────────────────────────────────
app.get("/api/dashboard", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result?.user) return;
  const userId = result.user._id;
  const userIdStr = String(userId);

  try {
    const allListings = await Listing.find({ owner: userId }).sort({ createdAt: -1 });
    const totalListings = allListings.length;
    const activeListings = allListings.filter(l => (l.status || "available") !== "sold");
    const soldListings = allListings.filter(l => l.status === "sold").length;
    const draftListings = 0;

    const myItemIds = allListings.map(l => l.itemId);
    const usersWhoSaved = await User.find({ savedItemIds: { $in: myItemIds } });
    const wishlistSaveMap = {};
    for (const u of usersWhoSaved) {
      for (const id of u.savedItemIds) {
        if (myItemIds.includes(id)) {
          wishlistSaveMap[id] = (wishlistSaveMap[id] || 0) + 1;
        }
      }
    }
    const totalWishlistSaves = Object.values(wishlistSaveMap).reduce((s, v) => s + v, 0);

    const allConversations = await Conversation.find({ participants: userId });
    const sellerConversations = allConversations.filter(c => String(c.seller) === userIdStr);
    const messagesReceived = await Message.countDocuments({ receiver: userId });

    let responseRate = 0;
    let avgResponseTimeMinutes = null;
    if (sellerConversations.length > 0) {
      const convIds = sellerConversations.map(c => c._id);
      const inboundMessages = await Message.find({ conversation: { $in: convIds }, receiver: userId }).sort({ createdAt: 1 });
      let replied = 0, totalResponseMs = 0, responseCount = 0;
      for (const msg of inboundMessages) {
        const reply = await Message.findOne({
          conversation: msg.conversation,
          sender: userId,
          createdAt: { $gt: msg.createdAt },
        }).sort({ createdAt: 1 });
        if (reply) {
          replied++;
          totalResponseMs += reply.createdAt - msg.createdAt;
          responseCount++;
        }
      }
      responseRate = inboundMessages.length > 0 ? Math.round((replied / inboundMessages.length) * 100) : 0;
      avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 60000) : null;
    }

    const ratings = await Rating.find({ seller: userId });
    const totalReviews = ratings.length;
    const avgRating = totalReviews > 0 ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10 : null;

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const allProfileVisits = await ProfileVisit.find({ profileId: userId }).sort({ createdAt: -1 });
    const totalProfileVisits = allProfileVisits.length;
    const uniqueProfileVisitors = new Set(allProfileVisits.filter(v => v.visitorId).map(v => String(v.visitorId))).size;
    const weeklyProfileVisits = allProfileVisits.filter(v => v.createdAt >= weekAgo).length;
    const monthlyProfileVisits = allProfileVisits.filter(v => v.createdAt >= monthAgo).length;

    const visitorCounts = {};
    for (const v of allProfileVisits.filter(v => v.visitorId)) {
      const vid = String(v.visitorId);
      visitorCounts[vid] = (visitorCounts[vid] || 0) + 1;
    }
    const returningVisitors = Object.values(visitorCounts).filter(c => c > 1).length;

    const listingViews = await ListingView.find({ itemId: { $in: myItemIds } });
    const listingViewMap = {};
    const listingUniqueViewMap = {};
    for (const v of listingViews) {
      listingViewMap[v.itemId] = (listingViewMap[v.itemId] || 0) + 1;
      if (!listingUniqueViewMap[v.itemId]) listingUniqueViewMap[v.itemId] = new Set();
      if (v.viewerId) listingUniqueViewMap[v.itemId].add(String(v.viewerId));
    }

    const allMyMessages = await Message.find({ itemId: { $in: myItemIds }, receiver: userId });
    const listingMsgMap = {};
    for (const m of allMyMessages) {
      listingMsgMap[m.itemId] = (listingMsgMap[m.itemId] || 0) + 1;
    }

    const listingAnalytics = allListings.map(l => ({
      id: l.itemId,
      title: l.title,
      image: l.image,
      price: l.price,
      status: l.status || "available",
      views: listingViewMap[l.itemId] || 0,
      uniqueViews: listingUniqueViewMap[l.itemId]?.size || 0,
      saves: wishlistSaveMap[l.itemId] || 0,
      messages: listingMsgMap[l.itemId] || 0,
      createdAt: l.createdAt,
    }));

    const topListings = [...listingAnalytics].sort((a, b) => b.views - a.views).slice(0, 5);

    const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const recentViews = listingViews.filter(v => v.createdAt >= days30Ago);
    const recentProfileVisits = allProfileVisits.filter(v => v.createdAt >= days30Ago);
    const recentMessages = await Message.find({ receiver: userId, createdAt: { $gte: days30Ago } });

    const buildDailyChart = (events, dateField = "createdAt") => {
      const map = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        map[key] = 0;
      }
      for (const e of events) {
        const key = new Date(e[dateField]).toISOString().slice(0, 10);
        if (key in map) map[key]++;
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }));
    };

    const charts = {
      listingViews: buildDailyChart(recentViews),
      profileViews: buildDailyChart(recentProfileVisits),
      messages: buildDailyChart(recentMessages),
    };

    const badges = [];
    if (totalListings >= 1) badges.push({ id: "first_listing", label: "First Listing", icon: "📦", desc: "Posted your first item" });
    if (totalReviews >= 1) badges.push({ id: "first_review", label: "First Review", icon: "⭐", desc: "Received your first review" });
    if (totalListings >= 5) badges.push({ id: "active_seller", label: "Active Seller", icon: "🏪", desc: "Listed 5+ items" });
    if (avgRating >= 4.5 && totalReviews >= 3) badges.push({ id: "top_seller", label: "Top Seller", icon: "🏆", desc: "4.5+ rating with 3+ reviews" });
    if (totalProfileVisits >= 50) badges.push({ id: "popular", label: "Campus Star", icon: "🌟", desc: "50+ profile visits" });
    if (responseRate >= 80 && sellerConversations.length >= 3) badges.push({ id: "trusted", label: "Trusted Member", icon: "🛡️", desc: "80%+ response rate" });
    if (result.user.college && result.user.college.length > 0) badges.push({ id: "campus_verified", label: "Campus Verified", icon: "🎓", desc: "University profile set" });

    return res.json({
      overview: {
        totalListings,
        activeListings: activeListings.length,
        soldListings,
        draftListings,
        wishlistSaves: totalWishlistSaves,
        messagesReceived,
        profileViews: totalProfileVisits,
      },
      seller: {
        responseRate,
        avgResponseTimeMinutes,
        totalReviews,
        avgRating,
        successfulTransactions: soldListings,
      },
      profileAnalytics: {
        totalVisits: totalProfileVisits,
        uniqueVisitors: uniqueProfileVisitors,
        weeklyVisits: weeklyProfileVisits,
        monthlyVisits: monthlyProfileVisits,
        returningVisitors,
      },
      listingAnalytics,
      topListings,
      charts,
      badges,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard." });
  }
});

// ─── Notification Routes ────────────────────────────────────────────────────

app.get("/api/notifications", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result) return;
  const { user } = result;
  try {
    const notifications = await Notification.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Notifications fetch error:", err);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result) return;
  const { user } = result;
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: user._id },
      { is_read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    return res.json({ notification: notif });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update notification." });
  }
});

app.patch("/api/notifications/read-all", async (req, res) => {
  const result = await requireUser(req, res);
  if (!result) return;
  const { user } = result;
  try {
    await Notification.updateMany({ user_id: user._id, is_read: false }, { is_read: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark all as read." });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    httpServer.listen(port, () => console.log(`Campus Marketplace API listening on http://localhost:${port}`));
  } catch (error) { console.error("Failed to start Campus Marketplace API", error); process.exit(1); }
};

startServer();
