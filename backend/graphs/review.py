"""复盘系统：面试结束后生成复盘报告。"""
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from backend.llm_provider import get_langchain_llm
from backend.prompts.reviewer import REVIEW_SYSTEM
from backend.models import InterviewMode


def generate_review(
    mode: InterviewMode,
    messages: list,
    scores: list[dict] | None = None,
    weak_points: list[str] | None = None,
    topic: str | None = None,
) -> str:
    """Generate a structured review report from interview transcript."""

    # Build transcript from messages
    transcript_lines = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            transcript_lines.append(f"**候选人**: {msg.content}")
        elif isinstance(msg, AIMessage):
            transcript_lines.append(f"**面试官**: {msg.content}")
    transcript = "\n\n".join(transcript_lines)

    # Build extra context for topic drill mode
    extra = ""
    if mode == InterviewMode.TOPIC_DRILL:
        if scores:
            score_summary = "\n".join(
                f"- Q: {s.get('question', '?')} → {s.get('score', '?')}/10 ({s.get('assessment', '')})"
                for s in scores
            )
            extra += f"\n## 各题评分记录\n{score_summary}\n"
        if weak_points:
            extra += f"\n## 已识别的薄弱点\n{', '.join(weak_points)}\n"
        if topic:
            extra += f"\n## 训练领域: {topic}\n"

    prompt = REVIEW_SYSTEM.format(
        mode=mode.value,
        transcript=transcript,
        extra_context=extra,
    )

    llm = get_langchain_llm()
    response = llm.invoke([
        SystemMessage(content=prompt),
        HumanMessage(content="请生成复盘报告。"),
    ])

    return response.content
