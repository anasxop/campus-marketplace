import { useEffect, useRef, useState } from "react";
import ReportModal from "../components/ReportModal";
import Toast from "../components/Toast";

const getImageSrc = (image) =>
  typeof image === "string" && (image.startsWith("http") || image.startsWith("/"))
    ? image : "/favicon.svg";

const SMART_PROMPTS = [
  "Is this item still available?",
  "Can we negotiate the price?",
  "Can you share your phone number?",
  "What's the lowest price you'll accept?",
  "Can I inspect the item before buying?",
  "Where can we meet on campus?",
];

function ConvoAvatar({ name, photoURL }) {
  const initials = (name||"?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#5c22d4","#0ea5e9","#059669","#d97706","#db2777","#ea580c"];
  const color = colors[(name||"").charCodeAt(0) % colors.length];
  if (photoURL) {
    return (
      <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.8)" }}>
        <img src={photoURL} alt={name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, color: "#fff", fontSize: 13, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ChatsRoute({
  chatInput, chatsLoading, conversations, currentConversation,
  currentUser, messages, onOpenItem, onSelectConversation,
  onSendMessage, setChatInput, sessionToken, navigateToProfile,
}) {
  const messagesEndRef = useRef(null);
  const [showReportUser, setShowReportUser] = useState(false);
  const [reportToast, setReportToast] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePrompt = (prompt) => {
    setChatInput(prompt);
  };

  return (
    <div className="chat-layout" style={{
      display: "grid", gridTemplateColumns: "310px 1fr",
      height: "calc(100vh - 64px)", overflow: "hidden",
      background: "#f9f9fb",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        background: "#fff", borderRight: "1px solid #e5e5ec",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "2px 0 16px rgba(14,0,40,0.04)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 18px 16px",
          background: "linear-gradient(135deg, #faf7ff, #f3ecfe)",
          borderBottom: "1px solid #e5e5ec",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#5c22d4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>
              Inbox
            </p>
            <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 18, fontWeight: 800, color: "#14141f", margin: 0 }}>
              My Chats
            </h2>
          </div>
          <span style={{
            background: "linear-gradient(135deg, #5c22d4, #7c3aed)", color: "#fff",
            fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 20,
            boxShadow: "0 4px 12px rgba(92,34,212,0.30)",
          }}>
            {conversations.length}
          </span>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {conversations.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#14141f", marginBottom: 6 }}>No conversations</p>
              <p style={{ fontSize: 12, color: "#9898a8", lineHeight: 1.6 }}>
                Open a listing and tap "Chat with Seller" to start.
              </p>
            </div>
          )}

          {conversations.map(convo => {
            const active = currentConversation?.id === convo.id;
            const timeAgo = convo.lastMessageAt ? (() => {
              const diff = Date.now() - new Date(convo.lastMessageAt).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return "just now";
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              return `${Math.floor(hrs / 24)}d ago`;
            })() : "";

            return (
              <button
                key={convo.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  width: "100%", padding: "10px 10px", borderRadius: 14,
                  background: active ? "linear-gradient(135deg, #faf7ff, #f3ecfe)" : "transparent",
                  border: "none",
                  boxShadow: active ? "inset 0 0 0 1.5px #e0d0fd" : "none",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 160ms ease",
                  marginBottom: 2, outline: "none",
                }}
                onClick={() => onSelectConversation(convo.id)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9f9fb"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Product thumbnail or avatar */}
                <div style={{ position: "relative" }}>
                  <img
                    src={getImageSrc(convo.product?.image)}
                    alt={convo.product?.title}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#f2f2f6", border: "1px solid #e5e5ec" }}
                    loading="lazy"
                  />
                  {convo.unreadCount > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#5c22d4", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 5px", minWidth: 16, textAlign: "center", boxShadow: "0 2px 6px rgba(92,34,212,0.35)" }}>
                      {convo.unreadCount}
                    </span>
                  )}
                </div>

                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13, fontWeight: 700, color: "#14141f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {convo.otherUser?.name || "Conversation"}
                    </strong>
                    <span style={{ fontSize: 10, color: "#b0b0c0", flexShrink: 0, marginLeft: 6 }}>{timeAgo}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#5c22d4", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {convo.product?.title || "Item"}
                  </span>
                  <span style={{ fontSize: 11, color: convo.unreadCount > 0 ? "#14141f" : "#9898a8", fontWeight: convo.unreadCount > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {convo.lastMessageText || "Start the conversation"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Chat panel ── */}
      <section style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#f9f9fb" }}>
        {!currentConversation ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, textAlign: "center", padding: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #f3ecfe, #ece0fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 8, boxShadow: "0 8px 32px rgba(92,34,212,0.12)" }}>💬</div>
            <h3 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: "#14141f", margin: 0 }}>
              Select a conversation
            </h3>
            <p style={{ fontSize: 14, color: "#9898a8", maxWidth: 280, lineHeight: 1.65, margin: 0 }}>
              Your chats will appear here with real-time updates as messages arrive.
            </p>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div style={{
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid #e5e5ec", padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 2px 12px rgba(14,0,40,0.05)",
            }}>
              <img
                src={getImageSrc(currentConversation.product?.image)}
                alt={currentConversation.product?.title}
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", border: "1.5px solid #e5e5ec", background: "#f2f2f6" }}
                loading="lazy"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 15, fontWeight: 800, color: "#14141f", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: currentConversation.otherUser?.id && navigateToProfile ? "pointer" : "default" }}
                  onClick={() => currentConversation.otherUser?.id && navigateToProfile?.(currentConversation.otherUser.id)}
                >
                  {currentConversation.otherUser?.name || "Conversation"}
                </p>
                <button
                  style={{ fontSize: 12, color: "#5c22d4", background: "linear-gradient(135deg,#f3ecfe,#ece0fd)", border: "none", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif", transition: "background 150ms ease" }}
                  onClick={() => onOpenItem(Number(currentConversation.itemId))}
                  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#ece0fd,#e0d0fd)"}
                  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#f3ecfe,#ece0fd)"}
                >
                  {currentConversation.product?.title ? `₹${currentConversation.product.price?.toLocaleString()} · View item →` : "View product →"}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3ecfe", padding: "5px 12px", borderRadius: 20, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#5c22d4" }}>
                  {currentConversation.product?.title ? "💬 Chat" : "💬 Chat"}
                </span>
              </div>
              {currentConversation.otherUser?.id && (
                <button
                  title="Report user"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "#fff", border: "1.5px solid #e5e5ec", color: "#b0b0c0", fontSize: 14, cursor: "pointer", flexShrink: 0, transition: "all 140ms ease" }}
                  onClick={() => setShowReportUser(true)}
                  onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.background = "#fee2e2"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#b0b0c0"; e.currentTarget.style.borderColor = "#e5e5ec"; e.currentTarget.style.background = "#fff"; }}
                >
                  🚩
                </button>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {chatsLoading && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ display: "inline-block", width: 24, height: 24, border: "3px solid #e0d0fd", borderTopColor: "#5c22d4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "#9898a8", fontSize: 13, marginTop: 8 }}>Loading messages...</p>
                </div>
              )}

              {!chatsLoading && messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#14141f", marginBottom: 6 }}>Say hello!</p>
                  <p style={{ fontSize: 13, color: "#9898a8" }}>Start the conversation with a quick message below.</p>
                </div>
              )}

              {messages.map((message, idx) => {
                const mine = String(message.senderId) === String(currentUser?.id);
                const prevMsg = messages[idx - 1];
                const showName = !mine && (!prevMsg || String(prevMsg.senderId) !== String(message.senderId));
                const timeStr = new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                const isStatusUpdate = /^Seller marked this item as (Available|Reserved|Sold)\.$/.test(message.text || "");

                if (isStatusUpdate) {
                  return (
                    <div key={message.id} style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: "#6b6b7e",
                        background: "#f3ecfe", border: "1px solid #e0d0fd",
                        borderRadius: 999, padding: "6px 16px",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        🔔 {message.text}
                        <span style={{ fontWeight: 500, color: "#b0b0c0" }}>· {timeStr}</span>
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                    {!mine && showName && <ConvoAvatar name={currentConversation.otherUser?.name} photoURL={currentConversation.otherUser?.photoURL} />}
                    {!mine && !showName && <div style={{ width: 38 }} />}
                    <div style={{ maxWidth: "68%" }}>
                      {showName && !mine && (
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9898a8", marginBottom: 4, marginLeft: 4 }}>
                          {message.senderName || currentConversation.otherUser?.name}
                        </p>
                      )}
                      <div style={{
                        background: mine
                          ? "linear-gradient(135deg, #5c22d4, #7c3aed)"
                          : "#fff",
                        color: mine ? "#fff" : "#14141f",
                        borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "11px 16px",
                        boxShadow: mine
                          ? "0 4px 20px rgba(92,34,212,0.30)"
                          : "0 2px 10px rgba(14,0,40,0.08)",
                        border: mine ? "none" : "1px solid #e5e5ec",
                        transition: "transform 120ms ease",
                      }}>
                        <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{message.text}</p>
                      </div>
                      <p style={{ fontSize: 10, color: "#b0b0c0", margin: "4px 4px 0", textAlign: mine ? "right" : "left" }}>{timeStr}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart prompts + Composer */}
            <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid #e5e5ec", padding: "10px 16px 14px" }}>
              {/* Smart prompts */}
              <div style={{ display: "flex", gap: 7, marginBottom: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
                {SMART_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    style={{
                      padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
                      background: chatInput === prompt ? "linear-gradient(135deg,#5c22d4,#7c3aed)" : "#f3ecfe",
                      color: chatInput === prompt ? "#fff" : "#5c22d4",
                      border: `1.5px solid ${chatInput === prompt ? "transparent" : "#e0d0fd"}`,
                      fontSize: 12, fontWeight: 600,
                      cursor: "pointer", flexShrink: 0,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      transition: "all 160ms ease",
                      boxShadow: chatInput === prompt ? "0 4px 12px rgba(92,34,212,0.30)" : "none",
                    }}
                    onClick={() => handlePrompt(prompt)}
                    onMouseEnter={e => { if (chatInput !== prompt) { e.currentTarget.style.background = "#ece0fd"; e.currentTarget.style.borderColor = "#c4a8f8"; } }}
                    onMouseLeave={e => { if (chatInput !== prompt) { e.currentTarget.style.background = "#f3ecfe"; e.currentTarget.style.borderColor = "#e0d0fd"; } }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <input
                  style={{
                    flex: 1, padding: "12px 16px",
                    background: "#f9f9fb", color: "#14141f", fontSize: 14,
                    border: "1.5px solid #e5e5ec", borderRadius: 14, outline: "none",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: "border-color 180ms ease, box-shadow 180ms ease",
                    boxShadow: "inset 0 1px 3px rgba(14,0,40,0.04)",
                  }}
                  placeholder={`Message ${currentConversation.otherUser?.name || "seller"}...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSendMessage()}
                  onFocus={e => { e.target.style.borderColor = "#5c22d4"; e.target.style.boxShadow = "0 0 0 3px rgba(92,34,212,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#e5e5ec"; e.target.style.boxShadow = "inset 0 1px 3px rgba(14,0,40,0.04)"; }}
                />
                <button
                  style={{
                    background: chatInput.trim() ? "linear-gradient(135deg, #5c22d4, #7c3aed)" : "#e5e5ec",
                    color: chatInput.trim() ? "#fff" : "#9898a8",
                    border: "none", borderRadius: 14, padding: "12px 22px",
                    fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 14,
                    cursor: chatInput.trim() ? "pointer" : "not-allowed", flexShrink: 0,
                    boxShadow: chatInput.trim() ? "0 6px 24px rgba(92,34,212,0.30)" : "none",
                    transition: "all 180ms ease",
                  }}
                  onClick={onSendMessage}
                  onMouseEnter={e => { if (chatInput.trim()) { e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                >
                  Send ↗
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ReportModal
        open={showReportUser}
        onClose={() => setShowReportUser(false)}
        targetType="user"
        targetId={currentConversation?.otherUser?.id}
        targetLabel={currentConversation?.otherUser?.name}
        sessionToken={sessionToken}
        onSubmitted={() => setReportToast(true)}
      />
      <Toast show={reportToast} message="Report submitted successfully." onDone={() => setReportToast(false)} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
