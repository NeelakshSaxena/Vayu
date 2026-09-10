from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
