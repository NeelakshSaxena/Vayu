from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from pathlib import Path

# Find the project root by going up two directories from apps/api
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

class Settings(BaseSettings):
    app_name: str = "Vayu API"
    app_env: str = "development"
    debug: bool = True
    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openrouter/free", env="OPENROUTER_MODEL")
    
    runpod_api_key: str = Field(default="", env="RUNPOD_API_KEY")
    runpod_serverless_endpoint: str = Field(default="", env="RUNPOD_SERVERLESS_ENDPOINT")
    model_name: str = Field(default="Qwen/Qwen3-14B", env="MODEL_NAME")
    
    default_provider: str = Field(default="openrouter", env="LLM_PROVIDER")
    
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # We also need openai for episodic memory extraction
    openai_api_key: str = Field(default="", env="OPENROUTER_API_KEY") # reusing for openrouter
    openai_base_url: str = Field(default="https://openrouter.ai/api/v1", env="OPENAI_BASE_URL")

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")

settings = Settings()
