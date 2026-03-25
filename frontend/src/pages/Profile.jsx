import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Brain,
  ChevronRight,
  Clock3,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { getProfile } from "../api/interview";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MODE_META = {
  resume: { color: "var(--ai-glow)", label: "简历面试" },
  topic_drill: { color: "var(--green)", label: "专项训练" },
  jd_prep: { color: "#60a5fa", label: "JD 备面" },
  recording: { color: "#22d3ee", label: "录音复盘" },
};

const ZONE_META = {
  focus: {
    title: "补课区",
    description: "优先补会反复拉低上限的问题",
    panelClassName: "border-primary/20 bg-primary/6 dark:bg-primary/8",
    accentClassName: "text-primary",
    pillClassName: "bg-primary/12 text-primary",
    progressClassName: "from-primary to-orange",
    empty: "目前没有明显的低分区。",
  },
  build: {
    title: "过渡区",
    description: "已经有框架，下一步补深度和稳定性",
    panelClassName: "border-info/20 bg-info/6 dark:bg-info/8",
    accentClassName: "text-info",
    pillClassName: "bg-info/12 text-info",
    progressClassName: "from-info to-teal",
    empty: "还没有进入过渡区的主题。",
  },
  strong: {
    title: "优势区",
    description: "可以继续放大，作为面试里的稳定得分点",
    panelClassName: "border-green/20 bg-green/6 dark:bg-green/8",
    accentClassName: "text-green",
    pillClassName: "bg-green/12 text-green",
    progressClassName: "from-green to-teal",
    empty: "还没有形成足够稳定的优势区。",
  },
};

const STAGE_META = [
  {
    max: 5.5,
    label: "搭框架期",
    title: "基础框架已建立，瓶颈在工程化展开",
    summary: "你已经有明确的答题直觉和部分稳定强项，但首页应该优先暴露反复出现的失分模式。",
  },
  {
    max: 7.5,
    label: "成型期",
    title: "答题框架开始稳定，重点补追问深度",
    summary: "现阶段更需要聚焦高频追问风险，而不是继续把所有观察平铺出来。",
  },
  {
    max: Infinity,
    label: "冲刺期",
    title: "主体能力已成型，接下来打磨稳定性和命中率",
    summary: "页面应该更像冲刺面板，只保留会影响最后表现的关键变量。",
  },
];

const PAGE_CLASS = "flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 md:px-7 md:py-8 xl:px-10 2xl:px-12";

function CollapsibleList({ items, limit, renderItem }) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? items : items.slice(0, limit);
  const hasMore = items.length > limit;

  return (
    <div className="flex flex-col gap-2">
      {show.map((item, index) => renderItem(item, index))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-[13px] cursor-pointer py-1 text-left hover:underline"
        >
          {expanded ? "收起" : `展开更多 (+${items.length - limit})`}
        </button>
      )}
    </div>
  );
}

function ScoreChart({ history }) {
  if (!history || history.length < 2) return null;

  const W = 920;
  const H = 260;
  const PAD = { top: 20, right: 22, bottom: 36, left: 38 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const points = history.map((entry, index) => ({
    x: PAD.left + (index / (history.length - 1)) * innerW,
    y: PAD.top + innerH - ((entry.avg_score || 0) / 10) * innerH,
    score: entry.avg_score,
    date: entry.date,
    topic: entry.topic || "综合",
    mode: entry.mode,
  }));

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD.top + innerH} L${points[0].x},${PAD.top + innerH} Z`;
  const yLabels = [0, 5, 10];
  const xIndices = history.length <= 6
    ? history.map((_, index) => index)
    : [0, Math.floor(history.length / 2), history.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yLabels.map((value) => {
        const y = PAD.top + innerH - (value / 10) * innerH;
        return (
          <g key={value}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize={11}>
              {value}
            </text>
          </g>
        );
      })}
      {xIndices.map((index) => (
        <text
          key={index}
          x={points[index].x}
          y={H - 8}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize={11}
        >
          {history[index].date?.slice(5)}
        </text>
      ))}
      <path d={areaPath} fill="url(#profileChartGradient)" opacity={0.26} />
      <path
        d={linePath}
        fill="none"
        stroke="var(--ai-glow)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <g key={index}>
          <circle
            cx={point.x}
            cy={point.y}
            r={4.5}
            fill={(MODE_META[point.mode] || MODE_META.topic_drill).color}
            stroke="var(--card)"
            strokeWidth={2}
          />
          <title>
            {`${point.date} ${(MODE_META[point.mode] || MODE_META.topic_drill).label}${point.topic ? ` · ${point.topic}` : ""}: ${point.score}/10`}
          </title>
        </g>
      ))}
      <defs>
        <linearGradient id="profileChartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ai-glow)" />
          <stop offset="100%" stopColor="var(--ai-glow)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SectionHeader({ icon, title, caption, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          {caption && <div className="mt-0.5 text-sm text-dim">{caption}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, hint, accentClassName = "text-primary" }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/78 p-4 backdrop-blur-sm">
      <div className="text-xs font-medium text-dim">{label}</div>
      <div className={cn("mt-3 text-[30px] font-bold tracking-tight", accentClassName)}>{value}</div>
      {hint && <div className="mt-2 text-xs leading-5 text-dim">{hint}</div>}
    </div>
  );
}

function TopicPriorityCard({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.topic)}
      className="w-full rounded-[24px] border border-primary/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.06),transparent)] p-5 text-left transition-all hover:-translate-y-px hover:border-primary/35 hover:shadow-sm dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{item.topic}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.weakCount > 0 && <Badge variant="destructive">待补 {item.weakCount}</Badge>}
            {item.strongCount > 0 && <Badge variant="success">强项 {item.strongCount}</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold text-primary">
            {item.score != null ? `${item.score}/100` : "--"}
          </div>
          <div className="mt-1 text-xs text-dim">领域掌握度</div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-orange"
          style={{ width: `${item.score != null ? item.score : 0}%` }}
        />
      </div>

      <div className="mt-4 text-sm leading-6 text-dim">
        {item.note || item.topWeakness || "该领域已有训练记录，但还没有生成明确总结。"}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-dim">
        <span>{item.lastSignal ? `最近信号 ${formatShortDate(item.lastSignal)}` : "已有历史训练记录"}</span>
        <span className="inline-flex items-center gap-1 font-medium text-primary">
          查看领域
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

function CrossBlockerList({ items }) {
  return (
    <div className="space-y-3">
      {items.length > 0 ? items.map((item, index) => (
        <div
          key={`${item.point}-${index}`}
          className="rounded-2xl border border-border/80 bg-black/[0.02] p-4 dark:bg-white/[0.02]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold leading-6">{item.point}</div>
              <div className="mt-2 text-xs leading-5 text-dim">{item.reason}</div>
            </div>
            {item.topic && <Badge variant="outline">{item.topic}</Badge>}
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-sm text-dim">
          目前没有明显的跨领域阻塞项。
        </div>
      )}
    </div>
  );
}

function DomainZoneColumn({ zone, items, onSelect }) {
  const meta = ZONE_META[zone];

  return (
    <div className={cn("rounded-[24px] border p-4", meta.panelClassName)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{meta.title}</div>
          <div className="mt-1 text-xs leading-5 text-dim">{meta.description}</div>
        </div>
        <div className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.pillClassName)}>
          {items.length}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/70 px-4 py-6 text-sm text-dim">
            {meta.empty}
          </div>
        )}

        {items.map((item) => {
          const clickable = Boolean(onSelect);
          return (
            <button
              key={item.topic}
              type="button"
              onClick={() => clickable && onSelect(item.topic)}
              className={cn(
                "w-full rounded-2xl border border-border/80 bg-card/88 p-4 text-left transition-all",
                clickable && "cursor-pointer hover:-translate-y-px hover:border-primary/30 hover:shadow-sm"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{item.topic}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.weakCount > 0 && <Badge variant="destructive">弱项 {item.weakCount}</Badge>}
                    {item.strongCount > 0 && <Badge variant="success">强项 {item.strongCount}</Badge>}
                  </div>
                </div>
                <div className={cn("shrink-0 text-sm font-semibold", meta.accentClassName)}>
                  {item.score != null ? `${item.score}/100` : "待评估"}
                </div>
              </div>

              {item.score != null ? (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", meta.progressClassName)}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              ) : (
                <div className="mt-4 text-xs text-dim">暂无掌握度评分，先按观察信号推进。</div>
              )}

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="text-xs leading-5 text-dim">
                  {item.note || `已累计 ${item.weakCount + item.strongCount} 条观察信号。`}
                </div>
                {clickable && (
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    查看
                    <ChevronRight size={14} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PatternList({ title, icon, items, accentClassName, emptyText }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="mt-3">
        {items.length > 0 ? (
          <CollapsibleList
            items={items}
            limit={4}
            renderItem={(item, index) => (
              <div
                key={`${item}-${index}`}
                className={cn("rounded-xl px-3 py-2 text-sm leading-6", accentClassName)}
              >
                {item}
              </div>
            )}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-sm text-dim">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function HabitTagList({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  if (items.length === 0) {
    return <div className="text-sm text-dim">还没有记录到稳定的表达习惯。</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {visible.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {item}
          </Badge>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-left text-[13px] text-primary hover:underline"
        >
          {expanded ? "收起" : `展开更多 (+${items.length - 5})`}
        </button>
      )}
    </div>
  );
}

function EvidenceColumn({ title, count, tone, items, renderItem, emptyText }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-base font-semibold">
        {title}
        <Badge variant={tone}>{count}</Badge>
      </div>

      {items.length > 0 ? (
        <CollapsibleList items={items} limit={4} renderItem={renderItem} />
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-dim">{emptyText}</CardContent>
        </Card>
      )}
    </div>
  );
}

function getMasteryScore(data) {
  const value = data?.score ?? (data?.level ? data.level * 20 : null);
  if (value == null || Number.isNaN(Number(value))) return null;
  return Number(Number(value).toFixed(1));
}

function toTimestamp(value) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatMinute(value) {
  if (!value) return "--";
  return value.replace("T", " ").slice(0, 16);
}

function formatShortDate(value) {
  if (!value) return "--";
  if (value.length >= 10) return value.slice(5, 10);
  return value;
}

function sortByDateDesc(list, primaryKey, fallbackKey) {
  return [...list].sort((a, b) => {
    const aTime = toTimestamp(a[primaryKey] || a[fallbackKey]);
    const bTime = toTimestamp(b[primaryKey] || b[fallbackKey]);
    return bTime - aTime;
  });
}

function buildPriorityWeaknesses(weakPoints, masteryMap) {
  return [...weakPoints]
    .map((item) => {
      const masteryScore = getMasteryScore(masteryMap[item.topic]);
      const reasons = [`重复出现 ${item.times_seen || 1} 次`];
      if (item.last_seen || item.first_seen) reasons.push(`最近暴露 ${formatShortDate(item.last_seen || item.first_seen)}`);

      return {
        ...item,
        masteryScore,
        domainNote: masteryMap[item.topic]?.notes || "",
        reason: reasons.join(" · "),
      };
    })
    .sort((a, b) => {
      const seenDiff = (b.times_seen || 1) - (a.times_seen || 1);
      if (seenDiff !== 0) return seenDiff;

      const masteryA = a.masteryScore ?? -1;
      const masteryB = b.masteryScore ?? -1;
      if (masteryA !== masteryB) return masteryA - masteryB;

      return toTimestamp(b.last_seen || b.first_seen) - toTimestamp(a.last_seen || a.first_seen);
    });
}

function getRealTopicSet(profile, history) {
  const realTopics = new Set(Object.keys(profile.topic_mastery || {}));

  (history || []).forEach((entry) => {
    if (entry?.topic) realTopics.add(entry.topic);
  });

  return realTopics;
}

function buildDomainInsights(profile, realTopics) {
  const domainMap = new Map();
  const mastery = profile.topic_mastery || {};

  [...realTopics].forEach((topic) => {
    const data = mastery[topic] || {};
    domainMap.set(topic, {
      topic,
      score: getMasteryScore(data),
      note: data.notes || "",
      weakCount: 0,
      strongCount: 0,
      lastSignal: data.last_assessed || "",
    });
  });

  (profile.weak_points || [])
    .filter((item) => !item.improved && item.topic && realTopics.has(item.topic))
    .forEach((item) => {
      const existing = domainMap.get(item.topic) || {
        topic: item.topic,
        score: null,
        note: "",
        weakCount: 0,
        strongCount: 0,
        lastSignal: "",
      };
      existing.weakCount += 1;
      existing.lastSignal = [existing.lastSignal, item.last_seen || item.first_seen].sort((a, b) => toTimestamp(b) - toTimestamp(a))[0];
      domainMap.set(item.topic, existing);
    });

  (profile.strong_points || [])
    .filter((item) => item.topic && realTopics.has(item.topic))
    .forEach((item) => {
      const existing = domainMap.get(item.topic) || {
        topic: item.topic,
        score: null,
        note: "",
        weakCount: 0,
        strongCount: 0,
        lastSignal: "",
      };
      existing.strongCount += 1;
      existing.lastSignal = [existing.lastSignal, item.first_seen].sort((a, b) => toTimestamp(b) - toTimestamp(a))[0];
      domainMap.set(item.topic, existing);
    });

  return [...domainMap.values()]
    .map((item) => {
      let zone = "build";
      if (item.score != null) {
        if (item.score < 40) zone = "focus";
        else if (item.score >= 70) zone = "strong";
      } else if (item.weakCount > 0) {
        zone = "focus";
      } else if (item.strongCount > 0) {
        zone = "strong";
      }

      return {
        ...item,
        topWeakness: "",
        zone,
      };
    })
    .sort((a, b) => {
      const zoneOrder = { focus: 0, build: 1, strong: 2 };
      if (zoneOrder[a.zone] !== zoneOrder[b.zone]) return zoneOrder[a.zone] - zoneOrder[b.zone];

      const scoreA = a.score ?? -1;
      const scoreB = b.score ?? -1;
      if (scoreA !== scoreB) return scoreA - scoreB;

      const weakDiff = b.weakCount - a.weakCount;
      if (weakDiff !== 0) return weakDiff;

      return toTimestamp(b.lastSignal) - toTimestamp(a.lastSignal);
    });
}

function getStage(avgScore) {
  return STAGE_META.find((stage) => (avgScore || 0) <= stage.max) || STAGE_META[0];
}

function buildModeCounts(stats, history) {
  const counts = history.length
    ? history.reduce((acc, entry) => {
      const mode = entry.mode || "topic_drill";
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {})
    : {
      resume: stats.resume_sessions || 0,
      topic_drill: stats.drill_sessions || 0,
      jd_prep: stats.job_prep_sessions || 0,
    };

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(MODE_META)
    .map(([mode, meta]) => ({
      mode,
      label: meta.label,
      color: meta.color,
      count: counts[mode] || 0,
      percent: ((counts[mode] || 0) / total) * 100,
    }))
    .filter((item) => item.count > 0);
}

function getTrendDelta(history) {
  if (!history || history.length < 2) return null;
  const current = history[history.length - 1]?.avg_score;
  const previous = history[history.length - 2]?.avg_score;
  if (typeof current !== "number" || typeof previous !== "number") return null;
  return Number((current - previous).toFixed(1));
}

function getLatestEntry(history) {
  return history && history.length > 0 ? history[history.length - 1] : null;
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn(PAGE_CLASS, "space-y-4")}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-[220px] w-full rounded-[28px]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <Skeleton className="h-[280px] rounded-[24px]" />
          <Skeleton className="h-[280px] rounded-[24px]" />
        </div>
        <Skeleton className="h-[260px] rounded-[24px]" />
      </div>
    );
  }

  const hasData = profile && (
    profile.stats?.total_sessions > 0 ||
    profile.stats?.total_answers > 0 ||
    (profile.weak_points || []).length > 0 ||
    (profile.strong_points || []).length > 0
  );

  if (!hasData) {
    return (
      <div className={PAGE_CLASS}>
        <div className="text-3xl font-display font-bold">个人画像</div>
        <Card className="mt-5 overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(20,184,166,0.08))] dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(8,145,178,0.12))]">
          <CardContent className="p-8 md:p-10">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/12 text-primary">还没有训练数据</Badge>
              <div className="text-2xl font-semibold leading-tight md:text-4xl">
                先积累几轮回答，再让页面开始提炼真正的重点。
              </div>
              <div className="mt-4 text-sm leading-7 text-dim md:text-base">
                开始面试后，系统会逐步把你的弱项、强项、答题模式和领域变化沉淀下来。等第一批数据形成，页面会自动切到驾驶舱视图。
              </div>
              <Button variant="gradient" size="lg" className="mt-6" onClick={() => navigate("/")}>
                开始第一场面试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = profile.stats || {};
  const scoreHistory = stats.score_history || [];
  const weakActive = (profile.weak_points || []).filter((item) => !item.improved);
  const weakImproved = sortByDateDesc(
    (profile.weak_points || []).filter((item) => item.improved),
    "improved_at",
    "last_seen"
  );
  const strongPoints = sortByDateDesc(profile.strong_points || [], "first_seen", "first_seen");
  const thinkingStrengths = profile.thinking_patterns?.strengths || [];
  const thinkingGaps = profile.thinking_patterns?.gaps || [];
  const communicationHabits = profile.communication?.habits || [];
  const communicationSuggestions = profile.communication?.suggestions || [];
  const masteryMap = profile.topic_mastery || {};
  const realTopicSet = getRealTopicSet(profile, scoreHistory);
  const stage = getStage(stats.avg_score);
  const priorityWeaknesses = buildPriorityWeaknesses(weakActive, masteryMap);
  const focusWeaknesses = priorityWeaknesses.slice(0, 3);
  const domains = buildDomainInsights(profile, realTopicSet);
  const focusDomains = domains.filter((item) => item.zone === "focus");
  const buildDomains = domains.filter((item) => item.zone === "build");
  const strongDomains = domains.filter((item) => item.zone === "strong");
  const topicPriorities = [...focusDomains, ...buildDomains, ...strongDomains]
    .map((item) => ({
      ...item,
      topWeakness: priorityWeaknesses.find((weakness) => weakness.topic === item.topic)?.point || "",
    }))
    .slice(0, 3);
  const crossBlockers = priorityWeaknesses
    .filter((item) => !(item.topic && realTopicSet.has(item.topic)))
    .slice(0, 4);
  const modeCounts = buildModeCounts(stats, scoreHistory);
  const latestEntry = getLatestEntry(scoreHistory);
  const trendDelta = getTrendDelta(scoreHistory);
  const nextTopic = (
    focusWeaknesses.find((item) => item.topic && realTopicSet.has(item.topic))?.topic ||
    focusDomains[0]?.topic ||
    buildDomains[0]?.topic ||
    strongDomains[0]?.topic ||
    null
  );
  const heroBullets = [
    focusDomains.length > 0
      ? `当前优先补课：${focusDomains.slice(0, 2).map((item) => item.topic).join(" / ")}`
      : null,
    thinkingGaps[0] ? `高频追问风险：${thinkingGaps[0]}` : null,
    profile.communication?.style ? `表达侧信号：${profile.communication.style}` : null,
  ].filter(Boolean);
  const answerPatternsSection = (
    <Card className="mt-5 animate-fade-in-up [animation-delay:0.24s]">
      <CardContent className="p-5 md:p-6">
        <SectionHeader
          icon={<Brain size={18} />}
          title="答题模式"
          caption="这里是模式层解释，不再拆成四张一级卡片和前面的诊断抢权重。"
        />

        <div className="mt-5 rounded-[24px] border border-border/80 bg-black/[0.02] p-5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={16} className="text-primary" />
            表达特征
          </div>
          <div className="mt-3 text-sm leading-7 text-dim">
            {profile.communication?.style || "暂时没有形成明确的表达侧总结。"}
          </div>
          <div className="mt-4">
            <HabitTagList items={communicationHabits} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-red/15 bg-red/6 p-5 dark:bg-red/8">
            <PatternList
              title="高频风险"
              icon={<TriangleAlert size={16} className="text-red" />}
              items={thinkingGaps}
              accentClassName="bg-card/90 border-l-[3px] border-l-red"
              emptyText="还没有记录到明确的思维短板。"
            />
          </div>
          <div className="rounded-[24px] border border-green/15 bg-green/6 p-5 dark:bg-green/8">
            <PatternList
              title="可放大优势"
              icon={<Brain size={16} className="text-green" />}
              items={thinkingStrengths}
              accentClassName="bg-card/90 border-l-[3px] border-l-green"
              emptyText="还没有记录到明显的思维优势。"
            />
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-primary/15 bg-primary/6 p-5 dark:bg-primary/8">
          <PatternList
            title="训练动作"
            icon={<Sparkles size={16} className="text-primary" />}
            items={communicationSuggestions}
            accentClassName="bg-card/90 border-l-[3px] border-l-primary"
            emptyText="暂时没有新的训练建议。"
          />
        </div>
      </CardContent>
    </Card>
  );
  const evidenceSection = (
    <Card className="mt-5 animate-fade-in-up [animation-delay:0.16s]">
      <CardContent className="p-5 md:p-6">
        <SectionHeader
          icon={<Clock3 size={18} />}
          title="证据库"
          caption="原始条目提前到摘要之后，方便你快速核对判断依据。"
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <EvidenceColumn
            title="待改进"
            count={weakActive.length}
            tone="destructive"
            items={priorityWeaknesses}
            emptyText="当前没有待改进项。"
            renderItem={(item, index) => (
              <Card key={`${item.point}-${index}`}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex-1">
                    <div className="text-sm leading-6">{item.point}</div>
                    <div className="mt-2 text-xs text-dim">{item.reason}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {item.topic && <Badge variant="outline">{item.topic}</Badge>}
                    <span className="text-xs text-dim">{item.times_seen || 1} 次</span>
                  </div>
                </CardContent>
              </Card>
            )}
          />

          <EvidenceColumn
            title="强项"
            count={strongPoints.length}
            tone="success"
            items={strongPoints}
            emptyText="还没有记录到强项。"
            renderItem={(item, index) => (
              <Card key={`${item.point}-${index}`} className="border-l-[3px] border-l-green">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="text-sm leading-6">{item.point}</div>
                  {item.topic && <Badge variant="outline">{item.topic}</Badge>}
                </CardContent>
              </Card>
            )}
          />

          <EvidenceColumn
            title="已改善"
            count={weakImproved.length}
            tone="success"
            items={weakImproved}
            emptyText="还没有闭环改善记录。"
            renderItem={(item, index) => (
              <Card key={`${item.point}-${index}`} className="opacity-75">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex-1">
                    <div className="text-sm leading-6 line-through">{item.point}</div>
                    <div className="mt-2 text-xs text-dim">
                      改善时间 {formatShortDate(item.improved_at || item.last_seen || item.first_seen)}
                    </div>
                  </div>
                  <Badge variant="success">已改善</Badge>
                </CardContent>
              </Card>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={PAGE_CLASS}>
      <div className="animate-fade-in">
        <div className="text-3xl font-display font-bold tracking-tight md:text-4xl">个人画像</div>
        <div className="mt-2 text-sm text-dim">
          {stats.total_answers || 0} 次回答分析
          {stats.total_sessions ? ` | ${stats.total_sessions} 次完整面试` : ""}
          {profile.updated_at ? ` | 上次更新 ${formatMinute(profile.updated_at)}` : ""}
        </div>
      </div>

      <Card className="mt-5 overflow-hidden border-primary/20 shadow-[0_20px_80px_-48px_rgba(245,158,11,0.5)] animate-fade-in-up bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,235,0.88))] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(39,39,42,0.92))]">
        <CardContent className="p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,0.95fr)] 2xl:grid-cols-[minmax(0,1.8fr)_minmax(460px,1fr)] xl:items-start">
            <div>
              <Badge className="mb-4 bg-primary/12 text-primary">{stage.label}</Badge>
              <div className="text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
                {stage.title}
              </div>
              <div className="mt-4 max-w-4xl text-sm leading-7 text-dim md:text-base">
                {stage.summary}
              </div>

              {heroBullets.length > 0 && (
                <div className="mt-5 space-y-2">
                  {heroBullets.map((line) => (
                    <div key={line} className="flex items-start gap-2 text-sm leading-6 text-text/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="gradient"
                  onClick={() => navigate(nextTopic ? `/profile/topic/${nextTopic}` : "/history")}
                >
                  {nextTopic ? `优先补 ${nextTopic}` : "查看训练历史"}
                  <ArrowUpRight size={16} />
                </Button>
                <Button variant="outline" onClick={() => navigate("/history")}>
                  查看全部记录
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <MetricCard
                label="总训练"
                value={stats.total_sessions || 0}
                hint={`${domains.length} 个真实训练主题已进入画像`}
              />
              <MetricCard
                label="综合均分"
                value={stats.avg_score ?? "-"}
                hint={`${scoreHistory.length || 0} 次评分历史`}
                accentClassName="text-green"
              />
              <MetricCard
                label="活跃问题"
                value={weakActive.length}
                hint="当前仍在反复出现的薄弱点"
                accentClassName="text-red"
              />
              <MetricCard
                label="已改善"
                value={weakImproved.length}
                hint="已经出现闭环改善的历史问题"
                accentClassName="text-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_minmax(360px,0.82fr)] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(400px,0.86fr)]">
        <Card className="animate-fade-in-up [animation-delay:0.08s]">
          <CardContent className="p-5 md:p-6">
            <SectionHeader
              icon={<Target size={18} />}
              title="当前重点"
              caption="把真实训练领域和跨领域阻塞拆开，避免继续混成同一类卡片。"
            />

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="text-sm font-semibold">优先补的领域</div>
                  <Badge variant="secondary">{topicPriorities.length}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                  {topicPriorities.length > 0 ? topicPriorities.map((item) => (
                    <TopicPriorityCard
                      key={item.topic}
                      item={item}
                      onSelect={(topic) => navigate(`/profile/topic/${topic}`)}
                    />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-sm text-dim md:col-span-2">
                      目前没有可继续追踪的真实训练领域。
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="text-sm font-semibold">跨领域阻塞</div>
                  <Badge variant="destructive">{crossBlockers.length}</Badge>
                </div>
                <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
                  <div className="mb-4 text-sm leading-6 text-dim">
                    这些问题会跨多个场景反复出现，但不属于单一训练领域，所以不再伪装成可点击的 topic。
                  </div>
                  <CrossBlockerList items={crossBlockers} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 animate-fade-in-up [animation-delay:0.12s]">
          <Card>
            <CardContent className="p-5">
              <SectionHeader
                icon={<Sparkles size={18} />}
                title="最近信号"
                caption="把进步、稳定得分点和最新表现放在同一侧栏里。"
              />

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-green/8 p-4">
                  <div className="text-sm font-semibold text-green">最近改善</div>
                  <div className="mt-3 space-y-2">
                    {weakImproved.slice(0, 2).map((item) => (
                      <div key={item.point} className="rounded-xl bg-card/90 px-3 py-2 text-sm leading-6">
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.point}</span>
                          <Badge variant="success">已改善</Badge>
                        </div>
                      </div>
                    ))}
                    {weakImproved.length === 0 && (
                      <div className="rounded-xl bg-card/90 px-3 py-2 text-sm text-dim">
                        还没有形成明确的改善闭环。
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-primary/8 p-4">
                  <div className="text-sm font-semibold text-primary">稳定得分点</div>
                  <div className="mt-3 space-y-2">
                    {strongPoints.slice(0, 3).map((item) => (
                      <div key={item.point} className="rounded-xl bg-card/90 px-3 py-2 text-sm leading-6">
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.point}</span>
                          {item.topic && <Badge variant="outline">{item.topic}</Badge>}
                        </div>
                      </div>
                    ))}
                    {strongPoints.length === 0 && (
                      <div className="rounded-xl bg-card/90 px-3 py-2 text-sm text-dim">
                        还没有记录到稳定的优势信号。
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
                    <div className="text-xs font-medium text-dim">最近一次评分</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {latestEntry?.avg_score != null ? `${latestEntry.avg_score}/10` : "--"}
                    </div>
                    <div className="mt-2 text-xs text-dim">
                      {latestEntry ? `${(MODE_META[latestEntry.mode] || MODE_META.topic_drill).label} · ${formatShortDate(latestEntry.date)}` : "暂无评分记录"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
                    <div className="text-xs font-medium text-dim">趋势变化</div>
                    <div className={cn(
                      "mt-2 text-2xl font-semibold",
                      trendDelta == null ? "text-text" : trendDelta >= 0 ? "text-green" : "text-red"
                    )}>
                      {trendDelta == null ? "--" : trendDelta > 0 ? `+${trendDelta}` : trendDelta}
                    </div>
                    <div className="mt-2 text-xs text-dim">
                      相比上一条评分记录
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <SectionHeader
                icon={<Activity size={18} />}
                title="训练结构"
                caption="训练类型分布决定了画像的信号来源。"
              />

              <div className="mt-5 space-y-3">
                {modeCounts.length > 0 ? modeCounts.map((item) => (
                  <div key={item.mode}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <span className="text-dim">{item.count} 次</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-sm text-dim">
                    暂无训练分布数据。
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/4 px-4 py-3 dark:bg-white/[0.04]">
                  <div className="text-xs text-dim">回答分析</div>
                  <div className="mt-1 text-xl font-semibold">{stats.total_answers || 0}</div>
                </div>
                <div className="rounded-2xl bg-black/4 px-4 py-3 dark:bg-white/[0.04]">
                  <div className="text-xs text-dim">覆盖主题</div>
                  <div className="mt-1 text-xl font-semibold">{domains.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {evidenceSection}

      <Card className="mt-5 animate-fade-in-up [animation-delay:0.2s]">
        <CardContent className="p-5 md:p-6">
          <SectionHeader
            icon={<Target size={18} />}
            title="能力地图"
            caption="这里只显示真实训练主题，不再把画像标签误当成领域。"
          />

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <DomainZoneColumn zone="focus" items={focusDomains} onSelect={(topic) => navigate(`/profile/topic/${topic}`)} />
            <DomainZoneColumn zone="build" items={buildDomains} onSelect={(topic) => navigate(`/profile/topic/${topic}`)} />
            <DomainZoneColumn zone="strong" items={strongDomains} onSelect={(topic) => navigate(`/profile/topic/${topic}`)} />
          </div>
        </CardContent>
      </Card>

      {answerPatternsSection}

      {scoreHistory.length >= 2 && (
        <Card className="mt-5 animate-fade-in-up [animation-delay:0.28s]">
          <CardContent className="p-5 md:p-6">
            <SectionHeader
              icon={<TrendingUp size={18} />}
              title="成长趋势"
              caption="趋势保留在后面，作为历史参考，而不是首页主判断。"
            />
            <div className="mt-5 rounded-[24px] border border-border/70 bg-black/[0.02] p-3 dark:bg-white/[0.02] md:p-4">
              <ScoreChart history={scoreHistory} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
