import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ChatBubble from "../components/ChatBubble";
import { sendMessage, endInterview } from "../api/interview";

const styles = {
  page: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 65px)",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-card)",
  },
  sessionInfo: {
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
  endBtn: {
    padding: "8px 20px",
    borderRadius: 8,
    background: "rgba(225,112,85,0.15)",
    color: "var(--red)",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  // Chat mode styles
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  inputArea: {
    padding: "16px 24px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-card)",
    display: "flex",
    gap: 12,
  },
  textarea: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text)",
    resize: "none",
    outline: "none",
    minHeight: 48,
    maxHeight: 200,
    lineHeight: 1.5,
    fontSize: 15,
  },
  sendBtn: {
    padding: "12px 24px",
    borderRadius: "var(--radius)",
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 500,
    fontSize: 15,
    alignSelf: "flex-end",
    transition: "opacity 0.2s",
  },
  thinking: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    color: "var(--text-dim)",
    fontSize: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent-light)",
    animation: "pulse 1.4s infinite",
  },
  progressBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--text-dim)",
  },
  // Drill card mode styles
  drillArea: {
    flex: 1,
    overflowY: "auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  questionCard: {
    width: "100%",
    maxWidth: 720,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "28px 32px",
    animation: "fadeIn 0.3s ease",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent-light)",
    background: "rgba(108,92,231,0.12)",
    padding: "4px 12px",
    borderRadius: 6,
  },
  difficultyLabel: {
    fontSize: 13,
    color: "var(--text-dim)",
  },
  focusArea: {
    fontSize: 12,
    color: "var(--text-dim)",
    background: "var(--bg-hover)",
    padding: "3px 8px",
    borderRadius: 4,
  },
  questionBody: {
    fontSize: 16,
    lineHeight: 1.8,
  },
  drillInputArea: {
    width: "100%",
    maxWidth: 720,
    padding: "16px 0",
    display: "flex",
    gap: 12,
  },
  drillTextarea: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text)",
    resize: "none",
    outline: "none",
    minHeight: 80,
    maxHeight: 240,
    lineHeight: 1.6,
    fontSize: 15,
  },
  drillBtnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignSelf: "flex-end",
  },
  submitBtn: {
    padding: "14px 28px",
    borderRadius: "var(--radius)",
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    transition: "opacity 0.2s",
  },
  skipBtn: {
    padding: "8px 16px",
    borderRadius: "var(--radius)",
    background: "transparent",
    color: "var(--text-dim)",
    fontSize: 13,
    border: "1px solid var(--border)",
    transition: "all 0.2s",
  },
  prevBtn: {
    padding: "6px 0",
    background: "transparent",
    color: "var(--text-dim)",
    fontSize: 13,
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  drillProgress: {
    width: "100%",
    maxWidth: 720,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: "var(--border)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: "var(--accent)",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: 13,
    color: "var(--text-dim)",
    whiteSpace: "nowrap",
  },
  // Answered list below current question
  answeredPreview: {
    width: "100%",
    maxWidth: 720,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  answeredItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "var(--bg-hover)",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--text-dim)",
  },
  answeredCheck: {
    color: "var(--green)",
    fontWeight: 600,
  },
  answeredSkip: {
    color: "var(--text-dim)",
    opacity: 0.5,
  },
  submittingOverlay: {
    width: "100%",
    maxWidth: 720,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 60,
    color: "var(--text-dim)",
    fontSize: 16,
  },
};

export default function Interview() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const initData = location.state || {};
  const isDrill = initData.mode === "topic_drill";

  // Chat mode state (resume)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [progress, setProgress] = useState(initData.progress || "");

  // Drill mode state
  const [questions] = useState(initData.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // {question_id: answer_text}
  const [drillInput, setDrillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Resume mode: initialize first AI message
  useEffect(() => {
    if (!isDrill && initData.message) {
      setMessages([{ role: "assistant", content: initData.message }]);
    }
  }, []);

  useEffect(() => {
    if (!isDrill) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending]);

  // Focus textarea when question changes
  useEffect(() => {
    if (isDrill) {
      textareaRef.current?.focus();
    }
  }, [currentIndex]);

  // ── Drill handlers ──
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleDrillSubmit = () => {
    const text = drillInput.trim();
    if (!text || !currentQ) return;

    setAnswers((prev) => ({ ...prev, [currentQ.id]: text }));
    setDrillInput("");

    if (currentIndex < totalQ - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleSkip = () => {
    if (!currentQ) return;
    setDrillInput("");
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    setDrillInput(answers[questions[currentIndex - 1]?.id] || "");
    setCurrentIndex((i) => i - 1);
  };

  const handleEndDrill = async () => {
    setSubmitting(true);
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      const data = await endInterview(sessionId, answerList);
      navigate(`/review/${sessionId}`, {
        state: {
          review: data.review,
          scores: data.scores,
          overall: data.overall,
          questions,
          answers: answerList,
          mode: "topic_drill",
        },
      });
    } catch (err) {
      alert("评估失败: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resume chat handlers ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const data = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.progress) setProgress(data.progress);
      if (data.is_finished) setFinished(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `[错误] ${err.message}` },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleEndResume = async () => {
    setReviewing(true);
    try {
      const data = await endInterview(sessionId);
      navigate(`/review/${sessionId}`, {
        state: { review: data.review, messages, mode: "resume" },
      });
    } catch (err) {
      alert("复盘生成失败: " + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (isDrill) {
        handleDrillSubmit();
      } else {
        handleSend();
      }
    }
  };

  const modeBadge = isDrill
    ? { text: "专项训练", bg: "rgba(0,184,148,0.15)", color: "var(--green)" }
    : { text: "简历面试", bg: "rgba(108,92,231,0.15)", color: "var(--accent-light)" };

  // ── Drill card mode ──
  if (isDrill) {
    return (
      <div style={styles.page}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.sessionInfo}>
            <span style={{ ...styles.badge, background: modeBadge.bg, color: modeBadge.color }}>
              {modeBadge.text}
            </span>
            {initData.topic && (
              <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
                {initData.topic}
              </span>
            )}
            <div style={styles.progressBar}>
              <span>{answeredCount}/{totalQ} 已答</span>
            </div>
          </div>
          <button
            style={{ ...styles.endBtn, opacity: submitting ? 0.4 : 1 }}
            onClick={handleEndDrill}
            disabled={submitting}
          >
            {submitting ? "评估中..." : finished ? "查看评估" : "结束训练"}
          </button>
        </div>

        <div style={styles.drillArea}>
          {submitting ? (
            <div style={styles.submittingOverlay}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...styles.dot, animationDelay: "0s" }} />
                <div style={{ ...styles.dot, animationDelay: "0.2s" }} />
                <div style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
              <span>正在批量评估你的回答...</span>
              <span style={{ fontSize: 13, color: "var(--text-dim)", opacity: 0.6 }}>
                AI 将对 {totalQ} 道题逐一点评
              </span>
            </div>
          ) : finished ? (
            // All questions answered, show summary before submitting
            <div style={{ width: "100%", maxWidth: 720 }}>
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "28px 32px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                  训练完成
                </div>
                <div style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 24, lineHeight: 1.6 }}>
                  共 {totalQ} 题，已回答 {answeredCount} 题，跳过 {totalQ - answeredCount} 题
                </div>
                <button
                  style={{ ...styles.submitBtn, padding: "14px 40px", fontSize: 16 }}
                  onClick={handleEndDrill}
                >
                  提交评估
                </button>
              </div>

              {/* Preview answered questions */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {questions.map((q, i) => (
                  <div key={q.id} style={styles.answeredItem}>
                    {answers[q.id] ? (
                      <span style={styles.answeredCheck}>✓</span>
                    ) : (
                      <span style={styles.answeredSkip}>—</span>
                    )}
                    <span>Q{q.id}: {q.question.slice(0, 60)}{q.question.length > 60 ? "..." : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentQ ? (
            <>
              {/* Progress bar */}
              <div style={styles.drillProgress}>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${((currentIndex) / totalQ) * 100}%`,
                    }}
                  />
                </div>
                <span style={styles.progressText}>{currentIndex + 1} / {totalQ}</span>
              </div>

              {/* Question card */}
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.questionLabel}>Q{currentQ.id}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentQ.focus_area && (
                      <span style={styles.focusArea}>{currentQ.focus_area}</span>
                    )}
                    {currentQ.difficulty && (
                      <span style={styles.difficultyLabel}>
                        {"★".repeat(currentQ.difficulty)}{"☆".repeat(5 - currentQ.difficulty)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={styles.questionBody}>
                  <div className="md-content">
                    <ReactMarkdown>{currentQ.question}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div style={styles.drillInputArea}>
                <textarea
                  ref={textareaRef}
                  style={styles.drillTextarea}
                  value={drillInput}
                  onChange={(e) => setDrillInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的回答... (Enter 提交, Shift+Enter 换行)"
                  rows={3}
                />
                <div style={styles.drillBtnGroup}>
                  <button
                    style={{ ...styles.submitBtn, opacity: !drillInput.trim() ? 0.4 : 1 }}
                    onClick={handleDrillSubmit}
                    disabled={!drillInput.trim()}
                  >
                    {currentIndex < totalQ - 1 ? "下一题" : "完成"}
                  </button>
                  <button style={styles.skipBtn} onClick={handleSkip}>
                    跳过
                  </button>
                </div>
              </div>
              {currentIndex > 0 && (
                <div style={{ width: "100%", maxWidth: 720 }}>
                  <button
                    style={styles.prevBtn}
                    onClick={handlePrev}
                  >
                    ← 上一题
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Chat mode (resume interview) ──
  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.sessionInfo}>
          <span style={{ ...styles.badge, background: modeBadge.bg, color: modeBadge.color }}>
            {modeBadge.text}
          </span>
          {initData.topic && (
            <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
              {initData.topic}
            </span>
          )}
          {progress && (
            <div style={styles.progressBar}>
              <span>|</span>
              <span>进度: {progress}</span>
            </div>
          )}
        </div>
        <button
          style={styles.endBtn}
          onClick={handleEndResume}
          disabled={reviewing}
        >
          {reviewing ? "生成复盘中..." : finished ? "查看复盘" : "结束面试"}
        </button>
      </div>

      <div style={styles.chatArea}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {sending && (
          <div style={styles.thinking}>
            <div style={{ ...styles.dot, animationDelay: "0s" }} />
            <div style={{ ...styles.dot, animationDelay: "0.2s" }} />
            <div style={{ ...styles.dot, animationDelay: "0.4s" }} />
            <span style={{ marginLeft: 4 }}>面试官思考中...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finished ? "面试已结束，点击右上角查看复盘" : "输入你的回答... (Enter 发送, Shift+Enter 换行)"}
          disabled={finished || sending}
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: sending || finished ? 0.4 : 1 }}
          onClick={handleSend}
          disabled={sending || finished}
        >
          发送
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
