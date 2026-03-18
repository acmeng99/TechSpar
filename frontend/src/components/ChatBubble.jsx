import ReactMarkdown from "react-markdown";

const styles = {
  wrapper: {
    display: "flex",
    gap: 12,
    maxWidth: "85%",
    animation: "fadeIn 0.3s ease",
  },
  wrapperUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  avatarAI: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
    color: "#fff",
  },
  avatarUser: {
    background: "var(--bg-hover)",
    color: "var(--accent-light)",
    border: "1px solid var(--border)",
  },
  bubble: {
    padding: "12px 16px",
    borderRadius: "var(--radius)",
    lineHeight: 1.7,
    fontSize: 15,
  },
  bubbleAI: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    background: "var(--accent)",
    color: "#fff",
    borderTopRightRadius: 4,
    whiteSpace: "pre-wrap",
  },
};

export default function ChatBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.wrapperUser : {}) }}>
      <div style={{ ...styles.avatar, ...(isUser ? styles.avatarUser : styles.avatarAI) }}>
        {isUser ? "You" : "AI"}
      </div>
      <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAI) }}>
        {isUser ? content : <div className="md-content"><ReactMarkdown>{content}</ReactMarkdown></div>}
      </div>
    </div>
  );
}
