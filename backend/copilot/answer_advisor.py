"""Answer Advisor — 结合策略树预计算 + LLM 生成回答建议。"""
import json
import asyncio
import logging

from langchain_core.messages import SystemMessage, HumanMessage

from backend.llm_provider import get_copilot_llm
from backend.copilot.strategy_tree import StrategyTreeNavigator

logger = logging.getLogger("uvicorn")

_ADVISE_PROMPT = """你是一个面试教练。HR 刚问了候选人一个问题，请给出简洁的回答要点提示。

HR 的问题: {utterance}
候选人背景亮点: {highlights}
候选人弱点提醒: {weak_points}

要求：
- 给出 3-5 条简洁的回答要点，每条不超过 20 字
- 如果涉及弱点领域，额外给出一条引导建议
输出严格 JSON 数组: ["要点1", "要点2", ...]
只输出 JSON，不要其他内容。"""


async def advise_answer(
    utterance: str,
    node_id: str | None,
    navigator: StrategyTreeNavigator,
    prep_state: dict,
    timeout: float = 2.0,
) -> dict:
    """生成回答建议。优先用预计算结果，不足时 LLM 补充。

    Returns: {"hints": list[str], "risk_alert": str | None}
    """
    hints = []
    risk_alert = None

    # 优先使用策略树预计算的 recommended_points
    if node_id:
        node = navigator.get_node(node_id)
        if node:
            hints = list(node.get("recommended_points", []))
            # 检查是否命中高危节点
            risk_level = node.get("risk_level", "safe")
            if risk_level == "danger":
                risk_hint = _find_risk_hint(node_id, prep_state.get("prep_hints", []))
                if risk_hint:
                    hints.extend(risk_hint.get("safe_talking_points", []))
                    risk_alert = risk_hint.get("redirect_suggestion", "")
                else:
                    risk_alert = f"注意：'{node.get('topic', '')}' 是你的薄弱领域，建议简述核心概念后引导到实际项目经验"
            elif risk_level == "caution":
                risk_alert = f"提示：'{node.get('topic', '')}' 需要注意，确保回答有条理"

    # 预计算结果足够则直接返回
    if len(hints) >= 3:
        return {"hints": hints[:5], "risk_alert": risk_alert}

    # 不足，LLM 补充
    fit_report = prep_state.get("fit_report", {})
    highlights = fit_report.get("highlights", []) if isinstance(fit_report, dict) else []
    highlight_text = "; ".join(
        h.get("point", str(h)) if isinstance(h, dict) else str(h)
        for h in highlights[:3]
    ) or "无"

    profile = prep_state.get("profile", {})
    weak_points = profile.get("weak_points", [])
    weak_text = "; ".join(
        wp.get("point", str(wp)) if isinstance(wp, dict) else str(wp)
        for wp in weak_points[:5]
    ) or "无"

    prompt = _ADVISE_PROMPT.format(
        utterance=utterance, highlights=highlight_text, weak_points=weak_text,
    )
    llm = get_copilot_llm()
    try:
        resp = await asyncio.wait_for(
            llm.ainvoke([SystemMessage(content="只输出 JSON"), HumanMessage(content=prompt)]),
            timeout=timeout,
        )
        llm_hints = _parse_hints(resp.content)
        # 合并：预计算在前，LLM 补充在后
        seen = set(hints)
        for h in llm_hints:
            if h not in seen:
                hints.append(h)
                seen.add(h)
    except asyncio.TimeoutError:
        logger.warning("Answer advisor timed out")
    except Exception as e:
        logger.error(f"Answer advisor failed: {e}")

    if not hints:
        hints = ["组织好回答结构", "举具体例子说明", "展示思考过程"]

    return {"hints": hints[:5], "risk_alert": risk_alert}


def _find_risk_hint(node_id: str, prep_hints: list[dict]) -> dict | None:
    for hint in prep_hints:
        if hint.get("node_id") == node_id:
            return hint
    return None


def _parse_hints(raw: str) -> list[str]:
    try:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        result = json.loads(text)
        if isinstance(result, list):
            return [str(h) for h in result]
    except (json.JSONDecodeError, TypeError):
        logger.warning(f"Failed to parse answer hints: {raw[:200]}")
    return []
