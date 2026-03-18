const styles = {
  card: {
    padding: "16px 20px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 24,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "var(--bg-hover)",
  },
  name: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--text)",
  },
  key: {
    fontSize: 12,
    color: "var(--text-dim)",
    marginTop: 2,
  },
};

export default function TopicCard({ topicKey, name, icon, onClick, selected }) {
  const borderColor = selected ? "var(--accent)" : "var(--border)";
  const bg = selected ? "var(--bg-hover)" : "var(--bg-card)";

  return (
    <div
      style={{ ...styles.card, borderColor, background: bg }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={styles.icon}>{icon || "📝"}</div>
      <div>
        <div style={styles.name}>{name}</div>
        <div style={styles.key}>{topicKey}</div>
      </div>
    </div>
  );
}
