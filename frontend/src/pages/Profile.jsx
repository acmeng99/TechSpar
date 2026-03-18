import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-dim)",
    marginBottom: 32,
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
    gap: 8,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
  },
  statItem: {
    background: "var(--bg-hover)",
    borderRadius: 8,
    padding: "16px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--accent-light)",
  },
  statLabel: {
    fontSize: 12,
    color: "var(--text-dim)",
    marginTop: 4,
  },
  weakList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  weakItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 8,
    background: "var(--bg-hover)",
    fontSize: 14,
  },
  weakText: {
    flex: 1,
  },
  weakMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--text-dim)",
    flexShrink: 0,
  },
  badge: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
  },
  improvedBadge: {
    background: "rgba(0,184,148,0.15)",
    color: "var(--green)",
  },
  activeBadge: {
    background: "rgba(225,112,85,0.15)",
    color: "var(--red)",
  },
  topicBadge: {
    background: "rgba(108,92,231,0.15)",
    color: "var(--accent-light)",
  },
  masteryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 10,
  },
  masteryItem: {
    padding: "12px 16px",
    borderRadius: 8,
    background: "var(--bg-hover)",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  masteryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  masteryName: {
    fontSize: 14,
    fontWeight: 500,
  },
  masteryBar: {
    height: 6,
    borderRadius: 3,
    background: "var(--border)",
    overflow: "hidden",
  },
  masteryFill: {
    height: "100%",
    borderRadius: 3,
    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
    transition: "width 0.5s ease",
  },
  commSection: {
    padding: "16px",
    background: "var(--bg-hover)",
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.8,
  },
  thinkingItem: {
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 6,
  },
  thinkingStrength: {
    background: "rgba(0,184,148,0.08)",
    borderLeft: "3px solid var(--green)",
  },
  thinkingGap: {
    background: "rgba(225,112,85,0.08)",
    borderLeft: "3px solid var(--red)",
  },
  empty: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-dim)",
  },
  loading: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-dim)",
  },
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/profile`)
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>加载中...</div>;

  const hasData = profile && (
    profile.stats?.total_sessions > 0 ||
    profile.stats?.total_answers > 0 ||
    (profile.weak_points || []).length > 0 ||
    (profile.strong_points || []).length > 0
  );

  if (!hasData) {
    return (
      <div style={styles.page}>
        <div style={styles.title}>个人画像</div>
        <div style={styles.empty}>
          <p>还没有面试数据</p>
          <p style={{ marginTop: 12, fontSize: 14 }}>
            开始面试后，系统会实时分析你的每个回答，自动构建你的能力画像
          </p>
          <button
            style={{
              marginTop: 20,
              padding: "10px 24px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
            }}
            onClick={() => navigate("/")}
          >
            开始第一场面试
          </button>
        </div>
      </div>
    );
  }

  const stats = profile.stats || {};
  const weakActive = (profile.weak_points || []).filter((w) => !w.improved);
  const weakImproved = (profile.weak_points || []).filter((w) => w.improved);

  return (
    <div style={styles.page}>
      <div style={styles.title}>个人画像</div>
      <div style={styles.subtitle}>
        {stats.total_answers || 0} 次回答分析{stats.total_sessions ? ` | ${stats.total_sessions} 次完整面试` : ""} | 上次更新: {profile.updated_at?.slice(0, 16)}
      </div>

      {/* Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>面试统计</div>
        <div style={styles.statGrid}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.total_sessions}</div>
            <div style={styles.statLabel}>总面试次数</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.resume_sessions || 0}</div>
            <div style={styles.statLabel}>简历面试</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{stats.drill_sessions || 0}</div>
            <div style={styles.statLabel}>专项训练</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: "var(--green)" }}>
              {stats.avg_score || "-"}
            </div>
            <div style={styles.statLabel}>平均分</div>
          </div>
        </div>
      </div>

      {/* Topic Mastery */}
      {Object.keys(profile.topic_mastery || {}).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>领域掌握度</div>
          <div style={styles.masteryGrid}>
            {Object.entries(profile.topic_mastery).map(([topic, data]) => (
              <div
                key={topic}
                style={styles.masteryItem}
                onClick={() => navigate(`/profile/topic/${topic}`)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
              >
                <div style={styles.masteryHeader}>
                  <span style={styles.masteryName}>{topic}</span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {data.score ?? (data.level ? data.level * 20 : 0)}/100 &rsaquo;
                  </span>
                </div>
                <div style={styles.masteryBar}>
                  <div
                    style={{ ...styles.masteryFill, width: `${data.score ?? (data.level ? data.level * 20 : 0)}%` }}
                  />
                </div>
                {data.notes && (
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
                    {data.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Weak Points */}
      {weakActive.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            待改进 <span style={{ ...styles.badge, ...styles.activeBadge }}>{weakActive.length}</span>
          </div>
          <div style={styles.weakList}>
            {weakActive.map((w, i) => (
              <div key={i} style={styles.weakItem}>
                <span style={styles.weakText}>{w.point}</span>
                <div style={styles.weakMeta}>
                  {w.topic && <span style={{ ...styles.badge, ...styles.topicBadge }}>{w.topic}</span>}
                  <span>出现 {w.times_seen} 次</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved Points */}
      {weakImproved.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            已改善 <span style={{ ...styles.badge, ...styles.improvedBadge }}>{weakImproved.length}</span>
          </div>
          <div style={styles.weakList}>
            {weakImproved.map((w, i) => (
              <div key={i} style={{ ...styles.weakItem, opacity: 0.7 }}>
                <span style={{ ...styles.weakText, textDecoration: "line-through" }}>{w.point}</span>
                <span style={{ ...styles.badge, ...styles.improvedBadge }}>已改善</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Points */}
      {(profile.strong_points || []).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>强项</div>
          <div style={styles.weakList}>
            {profile.strong_points.map((s, i) => (
              <div key={i} style={{ ...styles.weakItem, borderLeft: "3px solid var(--green)" }}>
                <span>{s.point}</span>
                {s.topic && <span style={{ ...styles.badge, ...styles.topicBadge }}>{s.topic}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thinking Patterns */}
      {((profile.thinking_patterns?.strengths || []).length > 0 ||
        (profile.thinking_patterns?.gaps || []).length > 0) && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>思维模式</div>
          {(profile.thinking_patterns.strengths || []).map((s, i) => (
            <div key={`s-${i}`} style={{ ...styles.thinkingItem, ...styles.thinkingStrength }}>
              {s}
            </div>
          ))}
          {(profile.thinking_patterns.gaps || []).map((g, i) => (
            <div key={`g-${i}`} style={{ ...styles.thinkingItem, ...styles.thinkingGap }}>
              {g}
            </div>
          ))}
        </div>
      )}

      {/* Communication */}
      {profile.communication?.style && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>沟通风格分析</div>
          <div style={styles.commSection}>
            <div>{profile.communication.style}</div>
            {(profile.communication.habits || []).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>习惯: </strong>
                {profile.communication.habits.join(" | ")}
              </div>
            )}
            {(profile.communication.suggestions || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong>建议: </strong>
                {profile.communication.suggestions.join(" | ")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
