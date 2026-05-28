"""Settings routes."""

from fastapi import APIRouter, Depends

from backend.auth import get_current_user, is_admin_user
from backend.config import settings
from backend.models import EmbeddingSettings, LLMSettings, SettingsResponse, SystemSettings
from backend.storage.user_settings import load_user_settings, save_user_settings

router = APIRouter(prefix="/api")


@router.get("/settings")
def get_user_settings(user_id: str = Depends(get_current_user)):
    """Get combined LLM (global) and training (per-user) settings."""
    llm = LLMSettings(
        api_base=settings.api_base,
        api_key=settings.api_key,
        model=settings.model,
        temperature=settings.temperature,
    )
    embedding = EmbeddingSettings(
        backend=settings.embedding_backend,
        api_base=settings.embedding_api_base,
        api_key=settings.embedding_api_key,
        api_model=settings.embedding_api_model,
        local_model=settings.local_embedding_model,
        local_path=settings.local_embedding_path,
    )
    system = SystemSettings(allow_registration=settings.allow_registration)
    training = load_user_settings(user_id)
    return SettingsResponse(
        llm=llm,
        embedding=embedding,
        system=system,
        training=training,
        is_admin=is_admin_user(user_id),
    )


@router.put("/settings")
def put_user_settings(payload: SettingsResponse, user_id: str = Depends(get_current_user)):
    """Update LLM/Embedding (global, hot-reload) and training (per-user) settings."""
    from backend.llm_provider import _reset_embedding_singleton, _reset_llama_singleton

    llm = payload.llm
    settings.api_base = llm.api_base
    settings.api_key = llm.api_key
    settings.model = llm.model
    settings.temperature = llm.temperature
    _reset_llama_singleton()

    emb = payload.embedding
    settings.embedding_backend = emb.backend
    settings.embedding_api_base = emb.api_base
    settings.embedding_api_key = emb.api_key
    settings.embedding_api_model = emb.api_model
    settings.local_embedding_model = emb.local_model
    settings.local_embedding_path = emb.local_path
    _reset_embedding_singleton()

    # 仅 admin 能改全局账户开关；非 admin 的请求即便带了 system 字段也直接忽略，
    # 避免前端老缓存把当前值回写后非 admin 触发 403。
    if is_admin_user(user_id):
        settings.allow_registration = payload.system.allow_registration

    save_user_settings(payload.training, user_id)
    return {"ok": True}
