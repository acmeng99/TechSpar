"""模式1: 简历模拟面试 LangGraph."""
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from backend.models import ResumeInterviewState, InterviewPhase
from backend.config import settings
from backend.llm_provider import get_langchain_llm
from backend.indexer import query_resume
from backend.memory import get_profile_summary
from backend.prompts.interviewer import RESUME_INTERVIEWER_SYSTEM

PHASE_ORDER = [
    InterviewPhase.GREETING.value,
    InterviewPhase.SELF_INTRO.value,
    InterviewPhase.TECHNICAL.value,
    InterviewPhase.PROJECT_DEEP_DIVE.value,
    InterviewPhase.REVERSE_QA.value,
]


def init_interview(state: ResumeInterviewState) -> dict:
    """Load resume context and prepare the opening."""
    resume_ctx = query_resume("列出候选人的所有项目经历、技能和教育背景")

    system_prompt = RESUME_INTERVIEWER_SYSTEM.format(
        resume_context=resume_ctx,
        phase=InterviewPhase.GREETING.value,
        asked_questions="无",
        user_profile=get_profile_summary(),
    )

    llm = get_langchain_llm()
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content="面试开始，请开场并让候选人做自我介绍。"),
    ])

    return {
        "messages": [response],
        "resume_context": resume_ctx,
        "phase": InterviewPhase.GREETING.value,
        "questions_asked": [],
        "phase_question_count": 0,
        "is_finished": False,
    }


def interviewer_ask(state: ResumeInterviewState) -> dict:
    """Generate next question based on current phase and conversation."""
    asked = state.get("questions_asked", [])
    asked_str = "\n".join(f"- {q}" for q in asked) if asked else "无"

    system_prompt = RESUME_INTERVIEWER_SYSTEM.format(
        resume_context=state.get("resume_context", ""),
        phase=state.get("phase", "technical"),
        asked_questions=asked_str,
        user_profile=get_profile_summary(),
    )

    llm = get_langchain_llm()
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    question_text = response.content[:100]
    count = state.get("phase_question_count", 0)

    return {
        "messages": [response],
        "questions_asked": asked + [question_text],
        "phase_question_count": count + 1,
    }


def route_after_answer(state: ResumeInterviewState) -> str:
    """After user answers: keep asking, advance phase, or end."""
    if state.get("is_finished"):
        return "end"

    phase = state.get("phase", "greeting")
    count = state.get("phase_question_count", 0)
    max_q = settings.max_questions_per_phase

    should_advance = False
    if phase == "greeting" and count >= 1:
        should_advance = True
    elif phase == "self_intro" and count >= 2:
        should_advance = True
    elif phase == "technical" and count >= max_q:
        should_advance = True
    elif phase == "project_deep_dive" and count >= max_q:
        should_advance = True
    elif phase == "reverse_qa" and count >= 2:
        return "end"

    if should_advance:
        return "advance"

    return "ask"


def advance_phase(state: ResumeInterviewState) -> dict:
    """Move to the next interview phase."""
    current_phase = state.get("phase", "greeting")

    try:
        idx = PHASE_ORDER.index(current_phase)
    except ValueError:
        return {"is_finished": True}

    if idx >= len(PHASE_ORDER) - 1:
        return {"is_finished": True}

    return {
        "phase": PHASE_ORDER[idx + 1],
        "phase_question_count": 0,
    }


def wait_for_answer(state: ResumeInterviewState) -> dict:
    """Graph pauses here for user input."""
    return {}


def compile_resume_interview():
    """Build and compile the resume interview graph."""
    graph = StateGraph(ResumeInterviewState)

    graph.add_node("init", init_interview)
    graph.add_node("ask", interviewer_ask)
    graph.add_node("advance", advance_phase)
    graph.add_node("wait", wait_for_answer)

    graph.add_edge(START, "init")
    graph.add_edge("init", "wait")
    graph.add_edge("ask", "wait")
    graph.add_edge("advance", "ask")

    graph.add_conditional_edges("wait", route_after_answer, {
        "ask": "ask",
        "advance": "advance",
        "end": END,
    })

    return graph.compile(
        checkpointer=MemorySaver(),
        interrupt_before=["wait"],
    )
