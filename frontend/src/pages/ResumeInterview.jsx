import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronRight, CalendarDays } from "lucide-react";
import { getResumeStatus, uploadResume, startInterview, getHistory } from "../api/interview";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskStatus } from "../contexts/TaskStatusContext";

const INTERVIEW_STEPS = [
  { title: "自我介绍", desc: "根据简历准备 1-2 分钟的自我介绍" },
  { title: "项目深挖", desc: "面试官针对简历中的项目经历追问细节" },
  { title: "技术追问", desc: "基于项目涉及的技术栈深入考察" },
  { title: "总结反馈", desc: "AI 给出综合评分和改进建议" },
];

function ScorePill({ score }) {
  if (score == null) {
    return (
      <Badge variant="secondary" className="min-w-[60px] justify-center rounded-full px-2.5 py-0.5 text-[12px]">
        未评分
      </Badge>
    );
  }
  let bg, color;
  if (score >= 8) { bg = "rgba(34,197,94,0.15)"; color = "var(--success)"; }
  else if (score >= 6) { bg = "rgba(245,158,11,0.15)"; color = "var(--ai-glow)"; }
  else if (score >= 4) { bg = "rgba(253,203,110,0.2)"; color = "#e2b93b"; }
  else { bg = "rgba(239,68,68,0.15)"; color = "var(--destructive)"; }
  return (
    <Badge
      variant="outline"
      className="min-w-[60px] justify-center rounded-full px-2.5 py-0.5 font-semibold text-[12px] shadow-sm"
      style={{ background: bg, borderColor: "transparent", color }}
    >
      {score}/10
    </Badge>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ResumeInterview() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { creatingSessionMode, setCreatingSessionMode } = useTaskStatus();
  const loading = creatingSessionMode === "resume";

  useEffect(() => {
    getResumeStatus()
      .then((s) => {
        if (s.has_resume) setResumeFile({ filename: s.filename, size: s.size });
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));

    getHistory(3, 0, "resume")
      .then((data) => setHistory(data.items || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadResume(file);
      setResumeFile({ filename: data.filename, size: data.size });
    } catch (err) {
      alert("上传失败: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleStart = async () => {
    if (!resumeFile) return;
    setCreatingSessionMode("resume");
    try {
      const data = await startInterview("resume");
      navigate(`/interview/${data.session_id}`, { state: data });
    } catch (err) {
      alert("启动失败: " + err.message);
    } finally {
      setCreatingSessionMode(null);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[700px] mx-auto px-4 py-6 md:px-7 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-primary" />
          <div className="text-2xl md:text-[28px] font-display font-bold">简历模拟面试</div>
        </div>
        <div className="text-sm text-dim">
          AI 读取你的简历，模拟真实面试官。从自我介绍到项目深挖，完整走一遍面试流程
        </div>
      </div>

      {pageLoading ? (
        <Skeleton className="h-[80px] rounded-xl mb-8" />
      ) : resumeFile ? (
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-text">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText size={18} className="text-primary" />
              </div>
              <div>
                <div className="font-medium">{resumeFile.filename}</div>
                <div className="text-xs text-dim">{(resumeFile.size / 1024).toFixed(0)} KB</div>
              </div>
            </div>
            <label className={cn("cursor-pointer", uploading && "opacity-50 pointer-events-none")}>
              <Button variant="outline" size="sm" asChild>
                <span>{uploading ? "上传中..." : "重新上传"}</span>
              </Button>
              <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </CardContent>
        </Card>
      ) : (
        <label className={cn(
          "flex flex-col items-center gap-3 px-5 py-8 bg-card border-2 border-dashed border-border rounded-xl cursor-pointer transition-all text-sm text-dim hover:border-primary/50 hover:bg-card/80 mb-8",
          uploading && "opacity-50 pointer-events-none"
        )}>
          <div className="w-12 h-12 rounded-xl bg-hover flex items-center justify-center">
            <FileText size={24} className="text-dim" />
          </div>
          <div>
            <span className="font-medium text-text">{uploading ? "正在上传..." : "点击上传简历（PDF）"}</span>
          </div>
          <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}

      {loading ? (
        <div className="w-full rounded-2xl bg-card border border-primary/20 p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 animate-pulse pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot" />
            </div>
            <div className="text-[14px] font-medium text-primary tracking-wide">
              正在读取简历，构建专属面试方案...
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[320px] mt-2 relative z-10 opacity-70">
            <Skeleton className="w-full h-2.5 rounded-full bg-primary/20" />
            <Skeleton className="w-[85%] h-2.5 rounded-full bg-primary/20" />
            <Skeleton className="w-[60%] h-2.5 rounded-full bg-primary/20" />
          </div>
        </div>
      ) : (
        <Button
          variant="gradient"
          size="lg"
          className="w-full py-6 text-[15px] tracking-wide"
          disabled={!resumeFile}
          onClick={handleStart}
        >
          开始模拟面试
        </Button>
      )}

      {/* 面试流程预览 */}
      <div className="mt-10">
        <div className="text-[15px] font-semibold text-text mb-4">面试流程</div>
        <div className="relative pl-8">
          {INTERVIEW_STEPS.map((step, i) => (
            <div key={i} className="relative pb-6 last:pb-0">
              {i < INTERVIEW_STEPS.length - 1 && (
                <div className="absolute left-[-20.5px] top-7 bottom-0 w-px bg-border" />
              )}
              <div className="absolute left-[-26px] top-0.5 w-[11px] h-[11px] rounded-full border-2 border-primary bg-card" />
              <div className="text-[14px] font-medium text-text">{step.title}</div>
              <div className="text-[13px] text-dim mt-0.5">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 历史面试记录 */}
      <div className="mt-10 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-semibold text-text">最近面试</div>
          {history.length > 0 && (
            <button
              onClick={() => navigate("/history")}
              className="text-[13px] text-dim hover:text-primary transition-colors flex items-center gap-0.5"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          )}
        </div>

        {historyLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-[56px] rounded-xl" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-dim">
            还没有面试记录，上传简历开始第一次模拟吧
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {history.map((s) => (
              <Card
                key={s.session_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/review/${s.session_id}`)}
              >
                <CardContent className="p-3.5 md:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1.5 text-[12px] text-dim tabular-nums shrink-0">
                      <CalendarDays size={13} />
                      {formatDate(s.created_at)}
                    </div>
                    <ScorePill score={s.avg_score} />
                  </div>
                  <ChevronRight size={16} className="text-dim shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
