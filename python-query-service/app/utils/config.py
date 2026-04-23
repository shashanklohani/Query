from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Python Query Service"
    app_env: str = "development"
    app_port: int = 8001
    allowed_origins: list[str] = ["http://localhost:3001", "http://localhost:3000"]
    shared_uploads_root: str = "/app/uploads"
    vector_store_dir: str = "chroma_db"
    vector_store_collection: str = "documents"
    embedding_model: str = "text-embedding-ada-002"
    chunk_size: int = 500
    chunk_overlap: int = 50
    openai_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENAI_API_KEY", "API_KEY"),
    )
    openai_api_base: str = Field(
        default="",
        validation_alias=AliasChoices("OPENAI_API_BASE", "OPENAI_BASE_URL"),
    )
    openai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
