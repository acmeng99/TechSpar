"""LlamaIndex indexing for resume and interview knowledge base."""
import json
from pathlib import Path

from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    Settings as LlamaSettings,
)

from backend.config import settings
from backend.llm_provider import get_llama_llm, get_embedding

PERSIST_DIR = settings.base_dir / "data" / ".index_cache"

# In-memory index cache — avoid reloading from disk on every request
_index_cache: dict[str, "VectorStoreIndex"] = {}

TOPICS_JSON = settings.base_dir / "data" / "topics.json"


def load_topics() -> dict:
    """Load topics from data/topics.json. Returns {key: {name, icon, dir}}."""
    if TOPICS_JSON.exists():
        return json.loads(TOPICS_JSON.read_text(encoding="utf-8"))
    return {}


def save_topics(topics: dict):
    """Write topics back to data/topics.json."""
    TOPICS_JSON.parent.mkdir(parents=True, exist_ok=True)
    TOPICS_JSON.write_text(
        json.dumps(topics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def get_topic_map() -> dict[str, str]:
    """Returns {key: dir_name} for backward compat."""
    return {k: v["dir"] for k, v in load_topics().items()}


# Module-level alias so existing `from backend.indexer import TOPIC_MAP` still works
class _TopicMapProxy(dict):
    """Lazy dict that reads from topics.json on every access."""
    def __getitem__(self, key):    return get_topic_map()[key]
    def __contains__(self, key):   return key in get_topic_map()
    def __iter__(self):            return iter(get_topic_map())
    def keys(self):                return get_topic_map().keys()
    def values(self):              return get_topic_map().values()
    def items(self):               return get_topic_map().items()
    def __len__(self):             return len(get_topic_map())
    def get(self, key, default=None): return get_topic_map().get(key, default)

TOPIC_MAP = _TopicMapProxy()


def _init_llama_settings():
    LlamaSettings.llm = get_llama_llm()
    LlamaSettings.embed_model = get_embedding()


def build_resume_index(force_rebuild: bool = False) -> VectorStoreIndex:
    """Build or load the resume index."""
    if "resume" in _index_cache and not force_rebuild:
        return _index_cache["resume"]

    _init_llama_settings()
    cache_dir = PERSIST_DIR / "resume"

    if cache_dir.exists() and not force_rebuild:
        storage_context = StorageContext.from_defaults(persist_dir=str(cache_dir))
        index = load_index_from_storage(storage_context)
    else:
        docs = SimpleDirectoryReader(
            input_dir=str(settings.resume_path),
            recursive=True,
        ).load_data()
        index = VectorStoreIndex.from_documents(docs)
        cache_dir.mkdir(parents=True, exist_ok=True)
        index.storage_context.persist(persist_dir=str(cache_dir))

    _index_cache["resume"] = index
    return index


def build_topic_index(topic: str, force_rebuild: bool = False) -> VectorStoreIndex:
    """Build or load index for a specific knowledge topic."""
    if topic in _index_cache and not force_rebuild:
        return _index_cache[topic]

    _init_llama_settings()

    if topic not in TOPIC_MAP:
        raise ValueError(f"Unknown topic: {topic}. Available: {list(TOPIC_MAP.keys())}")

    dir_name = TOPIC_MAP[topic]
    topic_dir = settings.knowledge_path / dir_name
    cache_dir = PERSIST_DIR / topic

    if cache_dir.exists() and not force_rebuild:
        storage_context = StorageContext.from_defaults(persist_dir=str(cache_dir))
        index = load_index_from_storage(storage_context)
    else:
        if not topic_dir.exists():
            raise FileNotFoundError(f"Knowledge directory not found: {topic_dir}")

        docs = SimpleDirectoryReader(
            input_dir=str(topic_dir),
            recursive=True,
            required_exts=[".md", ".txt", ".py"],
        ).load_data()

        if not docs:
            raise ValueError(f"No documents found in {topic_dir}")

        index = VectorStoreIndex.from_documents(docs)
        cache_dir.mkdir(parents=True, exist_ok=True)
        index.storage_context.persist(persist_dir=str(cache_dir))

    _index_cache[topic] = index
    return index


def query_resume(question: str, top_k: int = 3) -> str:
    """Query the resume index."""
    index = build_resume_index()
    engine = index.as_query_engine(similarity_top_k=top_k)
    response = engine.query(question)
    return str(response)


def query_topic(topic: str, question: str, top_k: int = 5) -> str:
    """Query a topic knowledge base."""
    index = build_topic_index(topic)
    engine = index.as_query_engine(similarity_top_k=top_k)
    response = engine.query(question)
    return str(response)


def retrieve_topic_context(topic: str, question: str, top_k: int = 5) -> list[str]:
    """Retrieve raw text chunks from topic index (for answer evaluation)."""
    index = build_topic_index(topic)
    retriever = index.as_retriever(similarity_top_k=top_k)
    nodes = retriever.retrieve(question)
    return [node.get_content() for node in nodes]
