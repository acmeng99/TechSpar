"""Per-user LLM and embedding providers.

Each provider resolves config in this order: explicit user_id arg → current-user
ContextVar → global .env defaults. Per-user overrides live in provider.json;
empty fields inherit the global default per-field, and a wholly-unset user
inherits the global config entirely.

LLM clients are cheap to construct, so they are built per call. Embedding
backends (esp. local HuggingFace models) are expensive, so they are cached per
(user, config-signature) and rebuilt only when the signature changes.
"""

from langchain_openai import ChatOpenAI
from llama_index.llms.openai_like import OpenAILike

from backend.config import (
    embedding_api_model_of,
    embedding_local_model_of,
    embedding_local_path_of,
    embedding_mode_of,
    embedding_target_of,
    settings,
)
from backend.storage.user_settings import load_user_provider
from backend.user_context import get_current_user_id

# user_key ("__global__" or user_id) → (signature, embed_instance)
_embedding_cache: dict[str, tuple[str, object]] = {}


def _effective_uid(user_id: str | None) -> str | None:
    return user_id if user_id is not None else get_current_user_id()


# ── Config resolution ──

def resolve_llm_config(user_id: str | None = None) -> dict:
    uid = _effective_uid(user_id)
    override = load_user_provider(uid)[0] if uid else None
    if override is None:
        return {
            "api_base": settings.api_base,
            "api_key": settings.api_key,
            "model": settings.model,
            "temperature": settings.temperature,
        }
    return {
        "api_base": override.api_base or settings.api_base,
        "api_key": override.api_key or settings.api_key,
        "model": override.model or settings.model,
        "temperature": override.temperature,
    }


def resolve_embedding_config(user_id: str | None = None) -> dict:
    uid = _effective_uid(user_id)
    override = load_user_provider(uid)[1] if uid else None
    if override is None:
        return {
            "backend": settings.embedding_backend,
            "api_base": settings.embedding_api_base,
            "api_key": settings.embedding_api_key,
            "api_model": settings.embedding_api_model,
            "local_model": settings.local_embedding_model,
            "local_path": settings.local_embedding_path,
        }
    return {
        "backend": override.backend or settings.embedding_backend,
        "api_base": override.api_base or settings.embedding_api_base,
        "api_key": override.api_key or settings.embedding_api_key,
        "api_model": override.api_model or settings.embedding_api_model,
        "local_model": override.local_model or settings.local_embedding_model,
        "local_path": override.local_path or settings.local_embedding_path,
    }


def embedding_signature(user_id: str | None = None) -> str:
    """Vector-compatibility identity (model/dimensions). On-disk indexes and
    memory_vectors rows are valid only for this exact value — when it changes they
    must be wiped and rebuilt. Excludes api_key/api_base, which don't affect vectors."""
    c = resolve_embedding_config(user_id)
    return embedding_target_of(
        c["backend"], c["api_base"], c["api_key"], c["api_model"],
        c["local_model"], c["local_path"], settings.base_dir, settings.embedding_model,
    )


def _embedding_cache_sig(c: dict) -> str:
    """Full-config cache key — any field change (incl. api_key/api_base) must
    rebuild the embedding client, even when the model identity is unchanged."""
    return "|".join(
        (c["backend"], c["api_base"], c["api_key"], c["api_model"], c["local_model"], c["local_path"])
    )


# ── LLM ──

def get_langchain_llm(user_id: str | None = None):
    """LangChain ChatModel for LangGraph nodes (via OpenAI-compatible proxy)."""
    c = resolve_llm_config(user_id)
    return ChatOpenAI(
        model=c["model"],
        api_key=c["api_key"],
        base_url=c["api_base"],
        temperature=c["temperature"],
        streaming=True,
    )


def get_copilot_llm(user_id: str | None = None, streaming: bool = False):
    """Copilot LLM — global COPILOT_* overrides win, else falls back to the user's main LLM."""
    c = resolve_llm_config(user_id)
    return ChatOpenAI(
        model=settings.copilot_model or c["model"],
        api_key=settings.copilot_api_key or c["api_key"],
        base_url=settings.copilot_api_base or c["api_base"],
        temperature=settings.copilot_temperature,
        streaming=streaming,
    )


def get_llama_llm(user_id: str | None = None):
    """LlamaIndex LLM (per call — construction is cheap)."""
    c = resolve_llm_config(user_id)
    return OpenAILike(
        model=c["model"],
        api_key=c["api_key"],
        api_base=c["api_base"],
        temperature=c["temperature"],
        is_chat_model=True,
    )


# ── Embedding ──

def _build_embedding(c: dict):
    deprecated = settings.embedding_model
    if embedding_mode_of(c["backend"], c["api_base"], c["api_key"]) == "api":
        from llama_index.embeddings.openai import OpenAIEmbedding

        model_name = embedding_api_model_of(c["api_model"], deprecated)
        if not model_name:
            raise RuntimeError("EMBEDDING_API_MODEL is required when EMBEDDING_BACKEND=api")
        kwargs = {"model_name": model_name, "api_key": c["api_key"]}
        if c["api_base"]:
            kwargs["api_base"] = c["api_base"]
        return OpenAIEmbedding(**kwargs)

    try:
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    except ImportError as exc:
        raise RuntimeError(
            "Local embeddings require optional dependencies. "
            "Install `pip install -r requirements.local-embedding.txt` "
            "and a torch build that matches your environment."
        ) from exc

    model_path = embedding_local_path_of(c["local_path"], c["local_model"], settings.base_dir, deprecated)
    if model_path is not None:
        return HuggingFaceEmbedding(model_name=str(model_path))
    model_name = embedding_local_model_of(c["local_model"], deprecated)
    if model_name:
        return HuggingFaceEmbedding(model_name=model_name)
    raise RuntimeError(
        "LOCAL_EMBEDDING_MODEL or LOCAL_EMBEDDING_PATH is required when EMBEDDING_BACKEND=local"
    )


def get_embedding(user_id: str | None = None):
    """Embedding model, cached per (user, full-config signature)."""
    c = resolve_embedding_config(user_id)
    sig = _embedding_cache_sig(c)
    key = _effective_uid(user_id) or "__global__"
    cached = _embedding_cache.get(key)
    if cached and cached[0] == sig:
        return cached[1]
    inst = _build_embedding(c)
    _embedding_cache[key] = (sig, inst)
    return inst


def reset_embedding_cache(user_id: str | None = None):
    """Drop cached embedding(s) so the next call rebuilds. None clears all users."""
    if user_id is None:
        _embedding_cache.clear()
    else:
        _embedding_cache.pop(user_id, None)
