import os
from pydantic_settings import BaseSettings
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    app_name: str = "Image to HTML System"
    debug: bool = False
    
    # Ollama
    ollama_host: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    
    # Models
    florence_model: str = "microsoft/Florence-2-base"
    
    # Paths - use project-relative path for local dev, override via env in Docker
    upload_dir: str = os.path.join(BASE_DIR, "ai", "outputs")
    models_dir: str = os.path.join(BASE_DIR, "ai", "models")
    
    # API
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: set = {"png", "jpg", "jpeg", "webp", "bmp"}
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
