import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { getReview } from "../api/interview";

const styles = {
  page: {
    flex: 1,
    padding: "40px 24px",
    maxWidth: 800,
    margin: "0 auto",
    width: "100%",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-dim)",
  },
  // Drill review styles
  overallCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "28px 32px",
    marginBottom: 24,
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
  },
  overallScore: {
    display: "inline-block",
    fontSize: 32,
    fontWeight: 700,
    marginRight: 8,
  },
  overallMax: {
    fontSize: 16,
    color: "var(--text-dim)",
  },
  overallSummary: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 1.8,
    color: "var(--text)",
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap",
  },
  statBadge: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    background: "var(--bg-hover)",
    color: "var(--text-dim)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    marginTop: 8,
    color: "var(--text)",
  },
  questionScoreCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 16,
    animation: "fadeIn 0.3s ease",
  },
  qHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  qLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent-light)",
    background: "rgba(108,92,231,0.12)",
    padding: "3px 10px",
    borderRadius: 6,
  },
  qFocus: {
    fontSize: 12,
    color: "var(--text-dim)",
    background: "var(--bg-hover)",
    padding: "3px 8px",
    borderRadius: 4,
  },
  scoreBadge: {
    fontSize: 14,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 8,
  },
  qQuestion: {
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.6,
    marginBottom: 12,
  },
  qAnswerSection: {
    background: "var(--bg-hover)",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 12,
  },
  qAnswerLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-dim)",
    marginBottom: 6,
    opacity: 0.7,
  },
  qAnswerText: {
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  qAssessment: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "var(--text)",
    marginBottom: 8,
  },
  qMissing: {
    fontSize: 13,
    color: "var(--red)",
    lineHeight: 1.5,
  },
  qUnderstanding: {
    fontSize: 13,
    color: "var(--text-dim)",
    fontStyle: "italic",
    marginTop: 4,
  },
  weakPointsList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
  },
  weakPoint: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(225,112,85,0.08)",
    border: "1px solid rgba(225,112,85,0.2)",
    fontSize: 13,
    color: "var(--text)",
  },
  strongPoint: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(0,184,148,0.08)",
    border: "1px solid rgba(0,184,148,0.2)",
    fontSize: 13,
    color: "var(--text)",
  },
  // Resume review (plain markdown)
  reviewContent: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "32px",
    lineHeight: 1.8,
    fontSize: 15,
  },
  backBtn: {
    display: "inline-block",
    marginTop: 24,
    padding: "10px 24px",
    borderRadius: "var(--radius)",
    background: "var(--bg-hover)",
    color: "var(--text)",
    fontSize: 14,
    border: "1px solid var(--border)",
    cursor: "pointer",
  },
  transcriptToggle: {
    marginTop: 24,
    marginLeft: 12,
    padding: "10px 20px",
    borderRadius: "var(--radius)",
    background: "transparent",
    color: "var(--accent-light)",
    fontSize: 14,
    border: "1px solid var(--border)",
    cursor: "pointer",
  },
  transcript: {
    marginTop: 16,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "24px",
    maxHeight: 500,
    overflowY: "auto",
  },
  msgLine: {
    padding: "8px 0",
    borderBottom: "1px solid var(--border)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  loading: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-dim)",
  },
};

function getScoreColor(score) {
  if (score >= 8) return { bg: "rgba(0,184,148,0.15)", color: "var(--green)" };
  if (score >= 6) return { bg: "rgba(108,92,231,0.15)", color: "var(--accent-light)" };
  if (score >= 4) return { bg: "rgba(253,203,110,0.2)", color: "#e2b93b" };
  return { bg: "rgba(225,112,85,0.15)", color: "var(--red)" };
}

function DrillReview({ scores, overall, questions, answers, sessionId }) {
  const answerMap = {};
  for (const a of (answers || [])) {
    answerMap[a.question_id] = a.answer;
  }
  const scoreMap = {};
  for (const s of (scores || [])) {
    scoreMap[s.question_id] = s;
  }
  const questionMap = {};
  for (const q of (questions || [])) {
    questionMap[q.id] = q;
  }

  const avgScore = overall?.avg_score || "-";

  return (
    <>
      {/* Overall summary */}
      <div style={styles.overallCard}>
        <div style={styles.overallTitle}>整体评价</div>
        <div>
          <span style={{
            ...styles.overallScore,
            color: typeof avgScore === "number" ? getScoreColor(avgScore).color : "var(--text)",
          }}>
            {avgScore}
          </span>
          <span style={styles.overallMax}>/10</span>
        </div>
        {overall?.summary && (
          <div style={styles.overallSummary}>{overall.summary}</div>
        )}
        <div style={styles.statsRow}>
          <span style={styles.statBadge}>
            共 {questions?.length || 0} 题
          </span>
          <span style={styles.statBadge}>
            已答 {answers?.filter((a) => a.answer).length || 0} 题
          </span>
        </div>
      </div>

      {/* Weak/strong points */}
      {overall?.new_weak_points?.length > 0 && (
        <>
          <div style={styles.sectionTitle}>薄弱点</div>
          <div style={styles.weakPointsList}>
            {overall.new_weak_points.map((wp, i) => (
              <div key={i} style={styles.weakPoint}>
                {typeof wp === "string" ? wp : wp.point || JSON.stringify(wp)}
              </div>
            ))}
          </div>
        </>
      )}

      {overall?.new_strong_points?.length > 0 && (
        <>
          <div style={styles.sectionTitle}>亮点</div>
          <div style={styles.weakPointsList}>
            {overall.new_strong_points.map((sp, i) => (
              <div key={i} style={styles.strongPoint}>
                {typeof sp === "string" ? sp : sp.point || JSON.stringify(sp)}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Per-question cards */}
      <div style={styles.sectionTitle}>逐题复盘</div>
      {(questions || []).map((q) => {
        const s = scoreMap[q.id] || {};
        const answer = answerMap[q.id];
        const isSkipped = !answer;
        const score = s.score;
        const sc = typeof score === "number" ? getScoreColor(score) : { bg: "var(--bg-hover)", color: "var(--text-dim)" };

        // Unanswered: compact one-line display
        if (isSkipped) {
          return (
            <div key={q.id} style={{
              ...styles.questionScoreCard,
              padding: "12px 24px",
              opacity: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={styles.qLabel}>Q{q.id}</span>
                <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
                  {q.question.slice(0, 50)}{q.question.length > 50 ? "..." : ""}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>未作答</span>
            </div>
          );
        }

        return (
          <div key={q.id} style={styles.questionScoreCard}>
            <div style={styles.qHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={styles.qLabel}>Q{q.id}</span>
                {q.focus_area && <span style={styles.qFocus}>{q.focus_area}</span>}
              </div>
              <span style={{ ...styles.scoreBadge, background: sc.bg, color: sc.color }}>
                {score ?? "-"}/10
              </span>
            </div>

            <div style={styles.qQuestion}>{q.question}</div>

            <div style={styles.qAnswerSection}>
              <div style={styles.qAnswerLabel}>你的回答</div>
              <div style={styles.qAnswerText}>{answer}</div>
            </div>

            {s.assessment && s.assessment !== "未作答" && (
              <div style={styles.qAssessment}>
                <strong style={{ fontSize: 12, opacity: 0.6 }}>点评: </strong>
                {s.assessment}
              </div>
            )}

            {s.improvement && (
              <div style={{
                fontSize: 14, lineHeight: 1.7, color: "var(--accent-light)",
                background: "rgba(108,92,231,0.08)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 8,
              }}>
                <strong style={{ fontSize: 12, opacity: 0.7 }}>改进建议: </strong>
                {s.improvement}
              </div>
            )}

            {s.understanding && s.understanding !== "未作答" && (
              <div style={styles.qUnderstanding}>
                理解程度: {s.understanding}
              </div>
            )}

            {s.key_missing?.length > 0 && (
              <div style={styles.qMissing}>
                遗漏关键点: {s.key_missing.join("、")}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function Review() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state || {};
  const isDrill = stateData.mode === "topic_drill";

  const [review, setReview] = useState(stateData.review || null);
  const [scores, setScores] = useState(stateData.scores || null);
  const [overall, setOverall] = useState(stateData.overall || null);
  const [questions, setQuestions] = useState(stateData.questions || []);
  const [answers, setAnswers] = useState(stateData.answers || []);
  const [messages, setMessages] = useState(stateData.messages || []);
  const [mode, setMode] = useState(stateData.mode || null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(!review && !scores);

  useEffect(() => {
    if (!review && !scores) {
      setLoading(true);
      getReview(sessionId)
        .then((data) => {
          setReview(data.review);
          if (data.scores) setScores(data.scores);
          if (data.questions) setQuestions(data.questions);
          if (data.transcript) {
            setMessages(data.transcript);
            // Reconstruct answers from transcript for drill
            if (data.mode === "topic_drill" && data.questions) {
              const ans = [];
              for (let i = 0; i < data.transcript.length; i++) {
                const msg = data.transcript[i];
                if (msg.role === "user") {
                  const prevQ = data.questions.find((q) =>
                    i > 0 && data.transcript[i - 1].content === q.question
                  );
                  if (prevQ) {
                    ans.push({ question_id: prevQ.id, answer: msg.content });
                  }
                }
              }
              setAnswers(ans);
            }
          }
          if (data.mode) setMode(data.mode);
          if (data.overall && Object.keys(data.overall).length) {
            setOverall(data.overall);
          } else if (data.weak_points) {
            const wp = Array.isArray(data.weak_points) ? data.weak_points : [];
            if (wp.length) {
              setOverall((prev) => ({ ...prev, new_weak_points: wp }));
            }
          }
        })
        .catch((err) => setReview("加载失败: " + err.message))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) {
    return <div style={styles.loading}>加载复盘报告中...</div>;
  }

  const showDrill = isDrill || (mode === "topic_drill" && (scores || questions.length > 0));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>
          {showDrill ? "训练复盘" : "面试复盘"}
        </div>
        <div style={styles.subtitle}>Session: {sessionId}</div>
      </div>

      {showDrill ? (
        <DrillReview
          scores={scores}
          overall={overall}
          questions={questions}
          answers={answers}
          sessionId={sessionId}
        />
      ) : (
        <>
          <div style={styles.reviewContent}>
            <div className="md-content">
              <ReactMarkdown>{review || ""}</ReactMarkdown>
            </div>
          </div>

          {messages.length > 0 && (
            <>
              <button
                style={styles.transcriptToggle}
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? "收起面试记录" : "查看面试记录"}
              </button>
              {showTranscript && (
                <div style={styles.transcript}>
                  {messages.map((msg, i) => (
                    <div key={i} style={styles.msgLine}>
                      <strong style={{ color: msg.role === "user" ? "var(--accent-light)" : "var(--green)" }}>
                        {msg.role === "user" ? "你" : "面试官"}:
                      </strong>{" "}
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <button style={styles.backBtn} onClick={() => navigate("/")}>
        返回首页
      </button>
    </div>
  );
}
