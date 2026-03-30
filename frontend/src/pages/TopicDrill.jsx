import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Zap } from "lucide-react";
import TopicCard from "../components/TopicCard";
import { getTopics, startInterview } from "../api/interview";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskStatus } from "../contexts/TaskStatusContext";

export default function TopicDrill() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { creatingSessionMode, setCreatingSessionMode } = useTaskStatus();
  const loading = creatingSessionMode === "topic_drill";

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setTopics({}))
      .finally(() => setPageLoading(false));
  }, []);

  const handleStart = async () => {
    if (!selectedTopic) return;
    setCreatingSessionMode("topic_drill");
    try {
      const data = await startInterview("topic_drill", selectedTopic);
      navigate(`/interview/${data.session_id}`, { state: data });
    } catch (err) {
      alert("启动失败: " + err.message);
    } finally {
      setCreatingSessionMode(null);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto px-4 py-6 md:px-7 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Target size={20} className="text-green" />
          <div className="text-2xl md:text-[28px] font-display font-bold">专项强化训练</div>
        </div>
        <div className="text-sm text-dim">
          选一个领域集中刷题，AI 根据你的回答动态调整难度，精准定位薄弱点
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-green" />
        <span className="text-lg font-semibold">选择训练领域</span>
      </div>

      {pageLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 mb-8 stagger-children">
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
      )}

      {loading ? (
        <div className="w-full rounded-2xl bg-card border border-primary/20 p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 animate-pulse pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot" />
            </div>
            <div className="text-[14px] font-medium text-primary tracking-wide">
              正在智能生成专项题库...
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
          disabled={!selectedTopic}
          onClick={handleStart}
        >
          开始专项训练
        </Button>
      )}
    </div>
  );
}
