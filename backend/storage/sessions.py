"""面试记录持久化 (SQLite)."""
import json
import sqlite3
from datetime import datetime
from pathlib import Path

from backend.config import settings

DB_PATH = settings.db_path


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            mode TEXT NOT NULL,
            topic TEXT,
            questions TEXT DEFAULT '[]',
            transcript TEXT DEFAULT '[]',
            scores TEXT DEFAULT '[]',
            weak_points TEXT DEFAULT '[]',
            overall TEXT DEFAULT '{}',
            review TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Migrate: add columns if missing (existing DBs)
    for col, default in [("questions", "'[]'"), ("overall", "'{}'")]:
        try:
            conn.execute(f"SELECT {col} FROM sessions LIMIT 1")
        except sqlite3.OperationalError:
            conn.execute(f"ALTER TABLE sessions ADD COLUMN {col} TEXT DEFAULT {default}")
    conn.commit()
    return conn


def create_session(session_id: str, mode: str, topic: str | None = None, questions: list | None = None):
    conn = _get_conn()
    conn.execute(
        "INSERT INTO sessions (session_id, mode, topic, questions) VALUES (?, ?, ?, ?)",
        (session_id, mode, topic, json.dumps(questions or [], ensure_ascii=False)),
    )
    conn.commit()
    conn.close()


def append_message(session_id: str, role: str, content: str):
    conn = _get_conn()
    row = conn.execute("SELECT transcript FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        return
    transcript = json.loads(row["transcript"])
    transcript.append({"role": role, "content": content, "time": datetime.now().isoformat()})
    conn.execute(
        "UPDATE sessions SET transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (json.dumps(transcript, ensure_ascii=False), session_id),
    )
    conn.commit()
    conn.close()


def save_drill_answers(session_id: str, answers: list[dict]):
    """Save drill answers into transcript as Q&A pairs."""
    conn = _get_conn()
    row = conn.execute("SELECT questions FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        return
    questions = json.loads(row["questions"])
    answer_map = {a["question_id"]: a["answer"] for a in answers}

    transcript = []
    for q in questions:
        transcript.append({"role": "assistant", "content": q["question"], "time": datetime.now().isoformat()})
        answer = answer_map.get(q["id"], "")
        if answer:
            transcript.append({"role": "user", "content": answer, "time": datetime.now().isoformat()})

    conn.execute(
        "UPDATE sessions SET transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (json.dumps(transcript, ensure_ascii=False), session_id),
    )
    conn.commit()
    conn.close()


def save_review(session_id: str, review: str, scores: list = None, weak_points: list = None, overall: dict = None):
    conn = _get_conn()
    conn.execute(
        "UPDATE sessions SET review = ?, scores = ?, weak_points = ?, overall = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (review, json.dumps(scores or [], ensure_ascii=False), json.dumps(weak_points or [], ensure_ascii=False), json.dumps(overall or {}, ensure_ascii=False), session_id),
    )
    conn.commit()
    conn.close()


def get_session(session_id: str) -> dict | None:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    conn.close()
    if not row:
        return None
    result = dict(row)
    result["transcript"] = json.loads(result["transcript"])
    result["questions"] = json.loads(result.get("questions", "[]"))
    result["scores"] = json.loads(result["scores"])
    result["weak_points"] = json.loads(result["weak_points"])
    result["overall"] = json.loads(result.get("overall", "{}") or "{}")
    return result


def list_sessions_by_topic(topic: str, limit: int = 50) -> list[dict]:
    """Get all sessions for a topic with reviews and scores."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT session_id, mode, topic, review, scores, created_at FROM sessions WHERE topic = ? AND review IS NOT NULL ORDER BY created_at ASC LIMIT ?",
        (topic, limit),
    ).fetchall()
    conn.close()
    results = []
    for r in rows:
        results.append({
            "session_id": r["session_id"],
            "review": r["review"],
            "scores": json.loads(r["scores"]) if r["scores"] else [],
            "created_at": r["created_at"],
        })
    return results


def list_sessions(limit: int = 20) -> list[dict]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT session_id, mode, topic, created_at, review IS NOT NULL as has_review FROM sessions WHERE review IS NOT NULL OR transcript != '[]' ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
