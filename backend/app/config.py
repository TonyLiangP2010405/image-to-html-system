from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Image to HTML System"
    debug: bool = False
    
    # Ollama
    ollama_host: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    
    # Models
    florence_model: str = "microsoft/Florence-2-base"
    
    # Paths
    upload_dir: str = "/app/ai/outputs"
    models_dir: str = "/app/ai/models"
    
    # API
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: set = {"png", "jpg", "jpeg", "webp", "bmp"}
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
