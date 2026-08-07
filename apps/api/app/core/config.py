from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "Vayu API"
    app_env: str = "development"
    debug: bool = True
    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
