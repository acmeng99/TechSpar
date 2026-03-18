import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  getProfile,
  getTopics,
  getTopicRetrospective,
  getTopicHistory,
} from "../api/interview";

const styles = {
  page: {
    flex: 1,
    padding: "40px 24px",
    maxWidth: 800,
    margin: "0 auto",
    width: "100%",
  },
  backLink: {
    fontSize: 14,
    color: "var(--text-dim)",
    cursor: "pointer",
    marginBottom: 16,
    display: "inline-block",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  icon: {
    fontSize: 36,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-dim)",
    marginTop: 4,
  },
  masteryRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    marginBottom: 24,
  },
  levelBig: {
    fontSize: 32,
    fontWeight: 700,
    color: "var(--accent-light)",
  },
  levelMax: {
    fontSize: 16,
    color: "var(--text-dim)",
  },
  masteryBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    background: "var(--border)",
    overflow: "hidden",
  },
  masteryFill: {
    height: "100%",
    borderRadius: 4,
    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
    transition: "width 0.5s ease",
  },
  masteryNotes: {
    fontSize: 13,
    color: "var(--text-dim)",
    marginLeft: 16,
    maxWidth: 200,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "24px",
    lineHeight: 1.8,
    fontSize: 15,
  },
  refreshBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text-dim)",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyRetro: {
    textAlign: "center",
    padding: "40px 20px",
    color: "var(--text-dim)",
  },
  generateBtn: {
    marginTop: 16,
    padding: "10px 24px",
    borderRadius: 8,
    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  },
  sessionList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sessionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  sessionLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: 500,
  },
  sessionScore: {
    fontSize: 13,
    color: "var(--text-dim)",
  },
  sessionId: {
    fontSize: 12,
    color: "var(--text-dim)",
  },
  loading: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-dim)",
  },
};

function getScoreColor(score) {
  if (score >= 8) return "var(--green)";
  if (score >= 6) return "var(--accent-light)";
  if (score >= 4) return "#e2b93b";
  return "var(--red)";
}

export default function TopicDetail() {
  const { topic } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [topicInfo, setTopicInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [retrospective, setRetrospective] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfile(),
      getTopics(),
      getTopicHistory(topic),
    ])
      .then(([prof, topics, hist]) => {
        setProfile(prof);
        setTopicInfo(topics[topic] || { name: topic, icon: "" });
        setSessions(hist);
        // Load cached retrospective from profile
        const cached = prof?.topic_mastery?.[topic]?.retrospective;
        if (cached) setRetrospective(cached);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topic]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await getTopicRetrospective(topic);
      setRetrospective(res.retrospective);
    } catch (err) {
      alert("生成失败: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div style={styles.loading}>加载中...</div>;

  const mastery = profile?.topic_mastery?.[topic] || {};

  return (
    <div style={styles.page}>
      <div
        style={styles.backLink}
        onClick={() => navigate("/profile")}
      >
        &larr; 返回画像
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.icon}>{topicInfo?.icon || "📝"}</div>
        <div style={styles.titleGroup}>
          <div style={styles.title}>{topicInfo?.name || topic}</div>
          <div style={styles.subtitle}>
            {sessions.length} 次训练记录
            {mastery.last_assessed && ` | 上次评估: ${mastery.last_assessed.slice(0, 10)}`}
          </div>
        </div>
      </div>

      {/* Mastery bar */}
      {(mastery.score > 0 || mastery.level > 0) && (
        <div style={styles.masteryRow}>
          <div>
            <span style={styles.levelBig}>{mastery.score ?? (mastery.level ? mastery.level * 20 : 0)}</span>
            <span style={styles.levelMax}>/100</span>
          </div>
          <div style={styles.masteryBar}>
            <div style={{ ...styles.masteryFill, width: `${mastery.score ?? (mastery.level ? mastery.level * 20 : 0)}%` }} />
          </div>
          {mastery.notes && <div style={styles.masteryNotes}>{mastery.notes}</div>}
        </div>
      )}

      {/* Retrospective */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>领域回顾</span>
          {retrospective && (
            <button
              style={styles.refreshBtn}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "生成中..." : "刷新回顾"}
            </button>
          )}
        </div>

        {retrospective ? (
          <div style={styles.card}>
            <div className="md-content">
              <ReactMarkdown>{retrospective}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.card, ...styles.emptyRetro }}>
            <p>{sessions.length === 0 ? "该领域暂无训练记录" : "还没有生成领域回顾"}</p>
            {sessions.length > 0 && (
              <button
                style={styles.generateBtn}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? "正在分析历史记录..." : "生成领域回顾"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session history for this topic */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>训练历史</div>
        {sessions.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", color: "var(--text-dim)" }}>
            该领域暂无训练记录
          </div>
        ) : (
          <div style={styles.sessionList}>
            {[...sessions].reverse().map((s) => {
              const scores = s.scores || [];
              const validScores = scores
                .map((sc) => sc.score)
                .filter((v) => typeof v === "number");
              const avg = validScores.length
                ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                : null;

              return (
                <div
                  key={s.session_id}
                  style={styles.sessionItem}
                  onClick={() => navigate(`/review/${s.session_id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div style={styles.sessionLeft}>
                    <span style={styles.sessionDate}>
                      {s.created_at?.slice(0, 10)}
                    </span>
                    {avg && (
                      <span style={{ ...styles.sessionScore, color: getScoreColor(Number(avg)) }}>
                        {avg}/10
                      </span>
                    )}
                  </div>
                  <span style={styles.sessionId}>#{s.session_id}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
