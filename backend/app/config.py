from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_MODEL: str = "openai/gpt-4o"
    MOCK_AI: bool = True
    ZENDESK_SUBDOMAIN: str = ""
    ZENDESK_EMAIL: str = ""
    ZENDESK_API_TOKEN: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    LOG_LEVEL: str = "INFO"
    MOCK_REDSHIFT: bool = False

    # Redshift (READ-ONLY)
    REDSHIFT_HOST: str = ""
    REDSHIFT_PORT: int = 5439
    REDSHIFT_DATABASE: str = ""
    REDSHIFT_USER: str = ""
    REDSHIFT_PASSWORD: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
