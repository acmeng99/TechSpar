import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopicCard from "../components/TopicCard";
import { getTopics, startInterview } from "../api/interview";

const styles = {
  page: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 24px",
  },
  hero: {
    textAlign: "center",
    marginBottom: 48,
  },
  h1: {
    fontSize: 40,
    fontWeight: 700,
    marginBottom: 12,
    background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 16,
    color: "var(--text-dim)",
    maxWidth: 500,
  },
  modeSection: {
    display: "flex",
    gap: 24,
    marginBottom: 48,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modeCard: {
    width: 320,
    padding: "28px 24px",
    background: "var(--bg-card)",
    border: "2px solid var(--border)",
    borderRadius: 16,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  modeDesc: {
    fontSize: 14,
    color: "var(--text-dim)",
    lineHeight: 1.6,
  },
  modeTag: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 12,
  },
  topicSection: {
    width: "100%",
    maxWidth: 700,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    textAlign: "left",
  },
  topicGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 32,
  },
  startBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "var(--radius)",
    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    transition: "opacity 0.2s",
  },
  startBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
    color: "var(--text-dim)",
  },
};

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // "resume" | "topic_drill"
  const [topics, setTopics] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!mode) return;
    if (mode === "topic_drill" && !selectedTopic) return;

    setLoading(true);
    try {
      const data = await startInterview(mode, selectedTopic);
      navigate(`/interview/${data.session_id}`, { state: data });
    } catch (err) {
      alert("启动失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const canStart = mode === "resume" || (mode === "topic_drill" && selectedTopic);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.h1}>AI 模拟面试</h1>
        <p style={styles.subtitle}>
          基于 LangGraph + LlamaIndex 的智能面试模拟系统，记录你的回答，面试结束后自动复盘
        </p>
      </div>

      <div style={styles.modeSection}>
        <div
          style={{
            ...styles.modeCard,
            borderColor: mode === "resume" ? "var(--accent)" : "var(--border)",
            background: mode === "resume" ? "var(--bg-hover)" : "var(--bg-card)",
          }}
          onClick={() => { setMode("resume"); setSelectedTopic(null); }}
        >
          <div style={{ ...styles.modeTag, background: "rgba(108,92,231,0.15)", color: "var(--accent-light)" }}>
            全流程模拟
          </div>
          <div style={styles.modeTitle}>简历模拟面试</div>
          <div style={styles.modeDesc}>
            AI 读取你的简历，模拟真实面试官。
            从自我介绍到项目深挖，完整走一遍面试流程。
          </div>
        </div>

        <div
          style={{
            ...styles.modeCard,
            borderColor: mode === "topic_drill" ? "var(--green)" : "var(--border)",
            background: mode === "topic_drill" ? "var(--bg-hover)" : "var(--bg-card)",
          }}
          onClick={() => setMode("topic_drill")}
        >
          <div style={{ ...styles.modeTag, background: "rgba(0,184,148,0.15)", color: "var(--green)" }}>
            针对强化
          </div>
          <div style={styles.modeTitle}>专项强化训练</div>
          <div style={styles.modeDesc}>
            选一个领域集中刷题，AI 根据你的回答动态调整难度，精准定位薄弱点。
          </div>
        </div>
      </div>

      {mode === "topic_drill" && (
        <div style={styles.topicSection}>
          <div style={styles.topicTitle}>选择训练领域</div>
          <div style={styles.topicGrid}>
            {Object.entries(topics).map(([key, info]) => (
              <TopicCard
                key={key}
                topicKey={key}
                name={info.name || key}
                icon={info.icon}
                selected={selectedTopic === key}
                onClick={() => setSelectedTopic(key)}
              />
            ))}
          </div>
        </div>
      )}

      {mode && (
        <div style={{ width: "100%", maxWidth: 700 }}>
          <button
            style={{
              ...styles.startBtn,
              ...(!canStart || loading ? styles.startBtnDisabled : {}),
            }}
            disabled={!canStart || loading}
            onClick={handleStart}
          >
            {loading ? "正在初始化面试..." : "开始面试"}
          </button>
        </div>
      )}
    </div>
  );
}
