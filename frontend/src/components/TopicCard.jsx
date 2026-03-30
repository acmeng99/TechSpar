import { getTopicIcon } from "../utils/topicIcons";
import { cn } from "@/lib/utils";

export default function TopicCard({ topicKey, name, icon, onClick, selected }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-left border",
        selected
          ? "border-primary bg-primary/5 shadow-[0_0_16px_rgba(245,158,11,0.1)]"
          : "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-hover text-dim shrink-0">
        {getTopicIcon(icon, 20)}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-text truncate">{name}</div>
        <div className="text-xs text-dim mt-0.5 truncate">{topicKey}</div>
      </div>
    </div>
  );
}
