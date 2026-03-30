import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, CheckCircle2, ChevronRight, Loader2, Mic, MicOff,
  AlertTriangle, Send, Eye, Radio, ArrowRight, Shield, Target,
  Sparkles, FileText, User, ShieldAlert,
} from "lucide-react";
import {
  startCopilotPrep,
  getCopilotPrepStatus,
} from "../api/copilot";
import { getResumeStatus, getProfile } from "../api/interview";
import useCopilotStream from "../hooks/useCopilotStream";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PAGE_CLASS = "flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 md:px-7 md:py-8 xl:px-10 2xl:px-12";

function formatFileSize(size) {
  if (!size) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// ══════════════════════════════════════════════════════════════
// Prep Phase
// ══════════════════════════════════════════════════════════════

function PrepPhase({ onPrepDone }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [prepId, setPrepId] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const charCount = jdText.trim().length;
  const resumeReady = !!resumeFile;
  const canSubmit = charCount >= 50 && !submitting;
  const isRunning = status?.status === "running";
  const isDone = status?.status === "done";

  const weakPointCount = profile?.weak_points?.length || 0;
  const topicCount = Object.keys(profile?.topic_mastery || {}).length;

  // Load resume + profile on mount
  useEffect(() => {
    getResumeStatus()
      .then((data) => { if (data.has_resume) setResumeFile({ filename: data.filename, size: data.size }); })
      .catch(() => {})
      .finally(() => setLoadingResume(false));

    getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      const { prep_id } = await startCopilotPrep({ jdText, company, position });
      setPrepId(prep_id);
      setStatus({ status: "running", progress: "初始化中..." });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Poll prep status
  useEffect(() => {
    if (!prepId) return;
    const poll = async () => {
      try {
        const data = await getCopilotPrepStatus(prepId);
        setStatus(data);
        if (data.status === "done") clearInterval(pollRef.current);
        else if (data.status === "error") {
          clearInterval(pollRef.current);
          setError(data.error || "Prep failed");
        }
      } catch (e) {
        setError(e.message);
        clearInterval(pollRef.current);
      }
    };
    pollRef.current = setInterval(poll, 1500);
    poll();
    return () => clearInterval(pollRef.current);
  }, [prepId]);

  return (
    <div className={PAGE_CLASS}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_380px] 2xl:grid-cols-[minmax(0,1.65fr)_400px]">
        {/* ── Left: Input Area ── */}
        <div className="space-y-5">
          <Card className="overflow-hidden border-border/80 bg-card/76">
            <CardContent className="p-5 md:p-6 xl:p-7">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="border-b border-border/70 pb-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">面试辅助工作区</div>
                  <div className="mt-2 text-2xl font-display font-bold tracking-tight md:text-3xl">Interview Copilot</div>
                  <div className="mt-1.5 max-w-2xl text-sm leading-6 text-dim">
                    多 Agent 预处理你的简历、画像和 JD，生成 HR 提问策略树。面试中实时预测追问方向，给出回答建议。
                  </div>
                </div>

                {/* Company + Position */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">目标公司</Label>
                    <Input
                      className="h-12 rounded-2xl bg-card/90"
                      placeholder="例：字节跳动"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      disabled={!!prepId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">目标岗位</Label>
                    <Input
                      className="h-12 rounded-2xl bg-card/90"
                      placeholder="例：AI 后台开发实习生"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      disabled={!!prepId}
                    />
                  </div>
                </div>

                {/* JD Textarea */}
                <div className="rounded-[28px] border border-border/80 bg-background/65 p-4 md:p-5">
                  <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">岗位 JD</div>
                      <div className="mt-1 text-sm text-dim">
                        直接贴完整职责、要求、加分项。越完整，策略树越精准。
                      </div>
                    </div>
                    <div className="rounded-full border border-border/80 bg-card/92 px-3 py-1 text-sm tabular-nums text-dim">
                      {charCount} 字
                    </div>
                  </div>

                  <Textarea
                    className="mt-4 min-h-[280px] rounded-[24px] border-border/70 bg-background/80 px-4 py-4 text-[15px] leading-7 resize-y md:min-h-[360px]"
                    placeholder="粘贴完整 JD。优先保留职责、任职要求、加分项、业务背景和技术栈。"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    disabled={!!prepId}
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <HintChip title="至少 50 字" description="低于这个长度分析价值有限。" />
                    <HintChip title="保留原始措辞" description="岗位关键词会影响策略树生成。" />
                    <HintChip title="加分项很重要" description="追问方向往往从加分项展开。" />
                  </div>
                </div>

                {/* Resume card */}
                <Card className="border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,247,255,0.92))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(30,41,59,0.72))]">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <FileText size={20} className={cn("mt-0.5 shrink-0", resumeReady ? "text-blue-400" : "text-dim")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold">简历联动</div>
                          <Badge variant={resumeReady ? "blue" : "secondary"}>
                            {loadingResume ? "检查中" : resumeReady ? "已可用" : "未上传简历"}
                          </Badge>
                          {resumeFile?.size && (
                            <Badge variant="outline">{formatFileSize(resumeFile.size)}</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-[13px] leading-6 text-dim">
                          {resumeReady
                            ? `已检测到简历：${resumeFile.filename}。Copilot 会对照你的项目经历和岗位要求来生成策略树。`
                            : "当前没有可用简历。不影响核心功能，但会缺少简历-JD 匹配分析。可在首页上传。"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile card */}
                <Card className="border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(250,245,255,0.92))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(41,30,59,0.72))]">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <User size={20} className={cn("mt-0.5 shrink-0", topicCount > 0 ? "text-purple-400" : "text-dim")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold">画像联动</div>
                          <Badge variant={topicCount > 0 ? "purple" : "secondary"}>
                            {loadingProfile ? "加载中" : topicCount > 0 ? `${topicCount} 个领域` : "暂无画像"}
                          </Badge>
                          {weakPointCount > 0 && (
                            <Badge variant="outline">{weakPointCount} 个弱点</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-[13px] leading-6 text-dim">
                          {topicCount > 0
                            ? `已有 ${topicCount} 个领域的掌握度数据和 ${weakPointCount} 个弱点标记。Copilot 会据此标注策略树上的高危路径。`
                            : "暂无画像数据。多做几次模拟面试后会自动积累。不影响使用，但策略树的风险标注会更粗略。"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-2xl border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
              {error}
            </div>
          )}
        </div>

        {/* ── Right: Decision Panel ── */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {/* Decision panel */}
          <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(30,41,59,0.84))]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">决策面板</div>
                  <div className="mt-1 text-lg font-semibold">准备面试辅助</div>
                </div>
                <div className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  isDone ? "border-green/20 bg-green/8 text-green"
                    : isRunning ? "border-blue-500/20 bg-blue-500/8 text-blue-300"
                    : "border-border/80 bg-card/82 text-text"
                )}>
                  {isDone ? "已就绪" : isRunning ? "分析中" : "待开始"}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <StepRow
                  index="01"
                  title="填写岗位信息"
                  description={charCount >= 50 ? "JD 内容已够用。" : "将 JD 补到至少 50 字。"}
                  done={charCount >= 50}
                />
                <StepRow
                  index="02"
                  title="多 Agent 预处理"
                  description={
                    isDone ? "公司搜索、JD 分析、匹配度评估均已完成。"
                    : isRunning ? status.progress
                    : "并行分析公司信息、JD 要求和简历匹配度。"
                  }
                  done={isDone}
                  active={isRunning}
                />
                <StepRow
                  index="03"
                  title="生成策略树"
                  description={isDone ? "HR 提问策略树和风险路径已生成。" : "基于分析结果模拟 HR 提问路径。"}
                  done={isDone}
                  active={isRunning && (status.progress?.includes("策略树") || status.progress?.includes("风险"))}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <MiniMetric label="JD 长度" value={charCount} />
                <MiniMetric label="简历" value={resumeReady ? "On" : "Off"} />
                <MiniMetric label="画像领域" value={topicCount} />
                <MiniMetric label="弱点" value={weakPointCount} />
              </div>

              <div className="mt-5 space-y-3">
                {!prepId && (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin" /> 初始化中...</>
                    ) : (
                      <><Sparkles size={18} /> 开始准备</>
                    )}
                  </Button>
                )}

                {isDone && (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={() => onPrepDone(prepId, status)}
                  >
                    <Radio size={18} /> 进入面试辅助
                  </Button>
                )}

                {isRunning && (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary py-2">
                    <Loader2 size={16} className="animate-spin" />
                    {status.progress}
                  </div>
                )}

                <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current input summary */}
          <Card className="border-border/80">
            <CardContent className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80">当前输入</div>
              <div className="mt-3 space-y-3 text-sm">
                <InfoRow label="公司" value={company.trim() || "未填写"} />
                <InfoRow label="岗位" value={position.trim() || "未填写"} />
                <InfoRow label="简历" value={resumeReady ? resumeFile.filename : "未检测到"} />
                <InfoRow label="画像" value={topicCount > 0 ? `${topicCount} 领域 / ${weakPointCount} 弱点` : "暂无"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Prep Results (shown below after completion) ── */}
      {isDone && status ? (
        <div className="mt-6 space-y-5">
          <PrepResultCards status={status} />
        </div>
      ) : !prepId && (
        <Card className="mt-6 border-dashed border-border/80 bg-card/55">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Brain size={20} />
            </div>
            <div className="mt-4 text-lg font-semibold">分析结果会在这里展开</div>
            <div className="mt-2 text-sm leading-6 text-dim">
              包括公司面试风格、岗位匹配度、HR 提问策略树和高危路径标注。
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function PrepResultCards({ status }) {
  const fitReport = status.fit_report || {};
  const riskMap = status.risk_map || [];
  const jdAnalysis = status.jd_analysis || {};
  const companyReport = (() => { try { return JSON.parse(status.company_report || "{}"); } catch { return {}; } })();

  const highlights = fitReport.highlights || [];
  const gaps = fitReport.gaps || [];
  const skills = jdAnalysis.required_skills || [];
  const dimensions = jdAnalysis.likely_question_dimensions || [];

  return (
    <>
      {/* Company + JD overview */}
      <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,246,255,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(30,41,59,0.84))]">
        <CardContent className="p-5 md:p-6 xl:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Brain size={18} className="text-blue-400" />
                <div className="text-xl font-semibold">
                  {companyReport.company_name || jdAnalysis.role_title || "面试准备完成"}
                </div>
                <Badge variant="blue">{jdAnalysis.role_title || "技术岗位"}</Badge>
              </div>
              {companyReport.interview_style && (
                <div className="mt-3 max-w-4xl text-sm leading-7 text-dim">
                  {companyReport.interview_style}
                </div>
              )}
            </div>

            <div className="grid min-w-[240px] gap-2 sm:grid-cols-3 xl:grid-cols-1">
              <ResultTag label="技术栈" value={skills.length} />
              <ResultTag label="考察维度" value={dimensions.length} />
              <ResultTag label="高危路径" value={riskMap.length} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Fit: highlights + gaps */}
        <Card className="border-border/80">
          <CardContent className="p-5 md:p-6">
            <SectionTitle icon={<Target size={17} className="text-primary" />} title="岗位匹配度" />
            <div className="mt-2 mb-4">
              <Badge variant={fitReport.overall_fit >= 0.7 ? "green" : fitReport.overall_fit >= 0.5 ? "blue" : "destructive"}>
                匹配度 {Math.round((fitReport.overall_fit || 0) * 100)}%
              </Badge>
            </div>
            {highlights.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-[13px] font-semibold text-green">亮点</div>
                {highlights.map((h, i) => (
                  <div key={i} className="rounded-2xl border border-green/15 bg-green/8 px-4 py-3 text-sm leading-7">
                    {typeof h === "string" ? h : h.point}
                  </div>
                ))}
              </div>
            )}
            {gaps.length > 0 && (
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-amber-400">差距</div>
                {gaps.map((g, i) => (
                  <div key={i} className="rounded-2xl border border-amber-500/15 bg-amber-500/8 px-4 py-3 text-sm leading-7">
                    <div>{typeof g === "string" ? g : g.point}</div>
                    {g.mitigation && <div className="mt-1 text-[13px] text-dim">{g.mitigation}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk paths */}
        <Card className="border-border/80">
          <CardContent className="p-5 md:p-6">
            <SectionTitle icon={<ShieldAlert size={17} className="text-red" />} title="高危路径" />
            <div className="mt-4 space-y-3">
              {riskMap.length > 0 ? riskMap.map((r, i) => (
                <div key={i} className="rounded-2xl border border-red/15 bg-red/8 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={r.risk_level === "danger" ? "destructive" : "secondary"} className="text-xs">
                      {r.risk_level}
                    </Badge>
                    <span className="text-sm font-semibold">{r.node_id}</span>
                  </div>
                  <div className="text-[13px] leading-6 text-dim">{r.reason}</div>
                  {r.avoidance_strategy && (
                    <div className="mt-2 text-[13px] leading-6 text-amber-300/80">{r.avoidance_strategy}</div>
                  )}
                </div>
              )) : (
                <div className="rounded-2xl border border-green/15 bg-green/8 px-4 py-3 text-sm text-green">
                  未发现高危路径，你的准备状态良好。
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* JD skills breakdown */}
      {skills.length > 0 && (
        <Card className="border-border/80">
          <CardContent className="p-5 md:p-6">
            <SectionTitle icon={<Sparkles size={17} className="text-primary" />} title="JD 技术栈权重" />
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {skills.map((s, i) => (
                <div key={i} className="rounded-2xl border border-border/75 bg-card/75 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{s.skill}</div>
                    <Badge variant={s.weight === "core" ? "blue" : s.weight === "preferred" ? "secondary" : "outline"}>
                      {s.weight}
                    </Badge>
                  </div>
                  {s.jd_evidence && <div className="mt-1 text-[13px] leading-6 text-dim">{s.jd_evidence}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// Realtime Phase
// ══════════════════════════════════════════════════════════════

function RealtimePhase({ prepId, prepData }) {
  const [sessionId] = useState(() => crypto.randomUUID().slice(0, 12));
  const [conversation, setConversation] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [currentUpdate, setCurrentUpdate] = useState(null);
  const [riskAlert, setRiskAlert] = useState(null);
  const [progressMsg, setProgressMsg] = useState("连接中...");
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef(null);

  const handleUpdate = useCallback((msg) => {
    switch (msg.type) {
      case "copilot_update":
        setCurrentUpdate(msg);
        break;
      case "risk_alert":
        setRiskAlert(msg);
        break;
      case "progress":
        setProgressMsg(msg.message);
        break;
      case "started":
        setStarted(true);
        setProgressMsg("");
        break;
      case "error":
        setProgressMsg(`Error: ${msg.message}`);
        break;
    }
  }, []);

  const {
    connected, listening, asrText, lastFinal,
    connect, startListening, stopListening, sendManualText, disconnect,
  } = useCopilotStream({ prepId, onUpdate: handleUpdate });

  useEffect(() => { connect(sessionId); }, [connect, sessionId]);

  useEffect(() => {
    if (lastFinal) setConversation((prev) => [...prev, { role: "hr", text: lastFinal }]);
  }, [lastFinal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, currentUpdate]);

  const handleManualSend = () => {
    const text = manualInput.trim();
    if (!text) return;
    setConversation((prev) => [...prev, { role: "hr", text }]);
    sendManualText(text);
    setManualInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleManualSend(); }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-card/50">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-primary" />
          <span className="font-semibold text-sm">Interview Copilot</span>
          <Badge variant={connected ? "green" : "destructive"} className="text-xs">
            {connected ? "已连接" : "未连接"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={listening ? "destructive" : "outline"}
            className="rounded-2xl"
            onClick={listening ? stopListening : startListening}
            disabled={!connected || !started}
          >
            {listening ? <MicOff size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
            {listening ? "停止录音" : "开始录音"}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-2xl" onClick={disconnect}>
            结束面试
          </Button>
        </div>
      </div>

      {progressMsg && (
        <div className="px-5 py-2 bg-primary/5 text-sm text-primary flex items-center gap-2 shrink-0">
          <Loader2 size={14} className="animate-spin" /> {progressMsg}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversation */}
        <div className="flex-1 flex flex-col border-r border-border">
          {asrText && (
            <div className="px-5 py-2.5 bg-card/50 border-b border-border/50 text-sm text-dim shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-red animate-pulse mr-2 align-middle" />
              HR: {asrText}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {conversation.length === 0 && started && (
              <div className="flex flex-col items-center justify-center h-full text-dim text-sm">
                <Mic size={28} className="mb-3 text-dim/30" />
                <p>开始录音或手动输入 HR 的问题</p>
              </div>
            )}
            {conversation.map((msg, i) => (
              <div key={i} className={cn(
                "text-sm rounded-2xl px-4 py-3 max-w-[85%]",
                msg.role === "hr"
                  ? "bg-card border border-border/50"
                  : "bg-primary/10 ml-auto"
              )}>
                <span className="text-[11px] uppercase tracking-[0.12em] text-dim/80 font-semibold block mb-1">
                  {msg.role === "hr" ? "HR" : "You"}
                </span>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-border shrink-0 flex gap-2">
            <Input
              className="h-11 rounded-2xl"
              placeholder="手动输入 HR 的问题..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!connected || !started}
            />
            <Button size="icon" className="rounded-2xl h-11 w-11 shrink-0" onClick={handleManualSend} disabled={!manualInput.trim() || !started}>
              <Send size={16} />
            </Button>
          </div>
        </div>

        {/* Right: Copilot panel */}
        <div className="w-[340px] xl:w-[400px] shrink-0 overflow-y-auto bg-card/30">
          {currentUpdate ? (
            <CopilotPanel update={currentUpdate} riskAlert={riskAlert} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-dim text-sm px-6 text-center">
              <Brain size={32} className="mb-3 text-dim/30" />
              <p className="font-medium">等待 HR 提问...</p>
              <p className="text-xs mt-1.5 text-dim/60">Copilot 会实时分析并给出建议</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopilotPanel({ update, riskAlert }) {
  const predictions = update?.predictions || [];
  const hints = update?.answer_hints || [];

  return (
    <div className="p-4 space-y-5">
      {/* Current intent */}
      <div className="rounded-2xl border border-border/75 bg-card/75 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80 mb-2">当前考察</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="blue">{update?.intent || "unknown"}</Badge>
          {update?.topic && <span className="text-sm font-medium">{update.topic}</span>}
          {update?.confidence > 0 && (
            <span className="text-xs text-dim ml-auto tabular-nums">{Math.round(update.confidence * 100)}%</span>
          )}
        </div>
      </div>

      {/* Predictions */}
      {predictions.length > 0 && (
        <div className="rounded-2xl border border-border/75 bg-card/75 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim/80 mb-3">追问预测</div>
          <div className="space-y-2">
            {predictions.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm rounded-xl bg-background/60 px-3 py-2">
                <ArrowRight size={12} className="text-primary shrink-0" />
                <span className="flex-1">{p.direction}</span>
                <span className={cn(
                  "text-xs font-mono tabular-nums",
                  p.probability >= 0.7 ? "text-amber-400" : "text-dim"
                )}>
                  {Math.round((p.probability || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer hints */}
      {hints.length > 0 && (
        <div className="rounded-2xl border border-green/20 bg-green/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green/80 mb-3">回答建议</div>
          <ul className="space-y-2">
            {hints.map((h, i) => (
              <li key={i} className="text-sm leading-6 flex items-start gap-2">
                <span className="text-green mt-1 shrink-0">•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk alert */}
      {riskAlert && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400">注意</span>
          </div>
          <p className="text-sm leading-6 text-amber-200/90">{riskAlert.message}</p>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// Shared UI Components
// ══════════════════════════════════════════════════════════════

function HintChip({ title, description }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/72 px-3.5 py-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-[13px] leading-6 text-dim">{description}</div>
    </div>
  );
}

function StepRow({ index, title, description, done = false, active = false }) {
  return (
    <div className={cn("rounded-2xl border px-3.5 py-3", done ? "border-green/20 bg-green/8" : active ? "border-primary/25 bg-primary/6" : "border-border/75 bg-card/72")}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold", done ? "bg-green/15 text-green" : active ? "bg-primary/12 text-primary" : "bg-hover text-dim")}>
          {done ? <CheckCircle2 size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : index}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-[13px] leading-6 text-dim">{description}</div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/75 bg-card/75 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-dim/80">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/72 px-3.5 py-3">
      <div className="shrink-0 text-dim">{label}</div>
      <div className="min-w-0 text-right font-medium">{value}</div>
    </div>
  );
}

function ResultTag({ label, value }) {
  return (
    <div className="rounded-2xl border border-border/75 bg-card/78 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-dim/80">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="font-semibold">{title}</div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// Main Export
// ══════════════════════════════════════════════════════════════

export default function Copilot() {
  const [phase, setPhase] = useState("prep");
  const [prepId, setPrepId] = useState(null);
  const [prepData, setPrepData] = useState(null);

  const handlePrepDone = useCallback((id, data) => {
    setPrepId(id);
    setPrepData(data);
    setPhase("realtime");
  }, []);

  if (phase === "realtime" && prepId) {
    return <RealtimePhase prepId={prepId} prepData={prepData} />;
  }

  return <PrepPhase onPrepDone={handlePrepDone} />;
}
