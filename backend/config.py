from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM (OpenAI-compatible proxy)
    api_base: str = ""
    api_key: str = ""
    model: str = ""
    temperature: float = 0.7

    # Embedding — API mode (OpenAI-compatible, e.g. SiliconFlow) or local HuggingFace
    embedding_api_base: str = ""   # set to enable API mode, e.g. https://api.siliconflow.cn/v1
    embedding_api_key: str = ""
    embedding_model: str = "BAAI/bge-m3"

    # Paths
    base_dir: Path = Path(__file__).resolve().parent.parent
    resume_path: Path = Path(__file__).resolve().parent.parent / "data" / "resume"
    knowledge_path: Path = Path(__file__).resolve().parent.parent / "data" / "knowledge"
    high_freq_path: Path = Path(__file__).resolve().parent.parent / "data" / "high_freq"
    db_path: Path = Path(__file__).resolve().parent.parent / "data" / "interviews.db"

    # Interview settings
    max_questions_per_phase: int = 5
    max_drill_questions: int = 15

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
