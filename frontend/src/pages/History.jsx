import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../api/interview";

const styles = {
  page: {
    flex: 1,
    padding: "40px 24px",
    maxWidth: 800,
    margin: "0 auto",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  sessionText: {
    fontSize: 14,
    color: "var(--text-dim)",
  },
  date: {
    fontSize: 13,
    color: "var(--text-dim)",
  },
  reviewBadge: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    background: "rgba(0,184,148,0.15)",
    color: "var(--green)",
  },
  empty: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-dim)",
  },
};

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={styles.empty}>加载中...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.title}>历史记录</div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>还没有面试记录，去首页开始一场面试吧</div>
      ) : (
        <div style={styles.list}>
          {sessions.map((s) => {
            const isResume = s.mode === "resume";
            const badge = isResume
              ? { text: "简历面试", bg: "rgba(108,92,231,0.15)", color: "var(--accent-light)" }
              : { text: "专项训练", bg: "rgba(0,184,148,0.15)", color: "var(--green)" };

            return (
              <div
                key={s.session_id}
                style={styles.item}
                onClick={() => navigate(`/review/${s.session_id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={styles.left}>
                  <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
                    {badge.text}
                  </span>
                  {s.topic && <span style={styles.sessionText}>{s.topic}</span>}
                  <span style={styles.sessionText}>#{s.session_id}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {s.has_review && <span style={styles.reviewBadge}>已复盘</span>}
                  <span style={styles.date}>{s.created_at?.slice(0, 16)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
